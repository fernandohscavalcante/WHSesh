#!/usr/bin/env node
// Capture the public landing page of lojapayjoy.shop as an ordinary visitor sees it.
//
// Scope: loads https://lojapayjoy.shop/ once per viewport (desktop and mobile), waits for
// the page to settle, and records screenshots, the served and rendered HTML, the list of
// requests the page itself made, and the bodies of same-origin scripts, stylesheets and
// images. It never clicks, types, submits forms, follows links, or sends requests of its
// own to any API. The only additional requests are /robots.txt and /sitemap.xml.
// Bodies of API responses (fetch/XHR) are NOT stored, because they may contain third
// parties' personal data; their URL, status, size and SHA-256 are logged instead.
// A bot challenge is recorded as such and never bypassed.
//
// Usage: NODE_PATH="$(npm root -g)" node scripts/capture_lojapayjoy_web.js [evidence-root]
'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { chromium, devices } = require('playwright');

const TARGET = 'lojapayjoy.shop';
const START_URL = `https://${TARGET}/`;
const EXTRA_PATHS = ['/robots.txt', '/sitemap.xml'];
const STORED_TYPES = new Set(['document', 'script', 'stylesheet', 'image', 'font', 'manifest']);
const REDACTED_HEADERS = new Set(['set-cookie', 'cookie', 'authorization', 'apikey']);
const VIEWPORTS = {
  desktop: { viewport: { width: 1366, height: 900 } },
  mobile: devices['Pixel 7'],
};

const sha256 = (buf) => crypto.createHash('sha256').update(buf).digest('hex');

function redact(headers) {
  const out = {};
  for (const [name, value] of Object.entries(headers || {})) {
    out[name] = REDACTED_HEADERS.has(name.toLowerCase())
      ? `(redacted; sha256=${sha256(Buffer.from(value))})`
      : value;
  }
  return out;
}

function git(args) {
  try {
    return execFileSync('git', ['-C', __dirname, ...args], { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString().trim();
  } catch {
    return null;
  }
}

function assetName(url, body) {
  const base = path.basename(new URL(url).pathname) || 'index';
  return `asset-${sha256(body).slice(0, 12)}-${base.replace(/[^A-Za-z0-9._-]/g, '_')}`.slice(0, 120);
}

async function capture(browser, outDir, label, options, stored) {
  const context = await browser.newContext({ ...options, ignoreHTTPSErrors: true });
  const page = await context.newPage();
  const requests = [];
  const pending = [];

  const record = async (request) => {
    const response = await request.response();
    const entry = {
      url: request.url(),
      method: request.method(),
      resource_type: request.resourceType(),
      request_headers: redact(await request.allHeaders()),
      status: response ? response.status() : null,
      response_headers: response ? redact(await response.allHeaders()) : null,
      remote_address: response ? await response.serverAddr() : null,
    };
    if (response) {
      try {
        const body = await response.body();
        entry.body_size = body.length;
        entry.body_sha256 = sha256(body);
        const host = new URL(request.url()).hostname;
        const sameOrigin = host === TARGET || host.endsWith(`.${TARGET}`);
        if (sameOrigin && STORED_TYPES.has(request.resourceType())) {
          const name = assetName(request.url(), body);
          if (!stored.has(name)) {
            fs.writeFileSync(path.join(outDir, name), body);
            stored.add(name);
          }
          entry.stored_as = name;
        }
      } catch (err) {
        entry.body_error = String(err.message || err);
      }
    }
    requests.push(entry);
  };
  page.on('requestfinished', (request) => pending.push(record(request)));
  page.on('requestfailed', (request) => {
    requests.push({
      url: request.url(),
      method: request.method(),
      resource_type: request.resourceType(),
      failure: request.failure() ? request.failure().errorText : 'unknown',
    });
  });

  const consoleMessages = [];
  page.on('console', (msg) => consoleMessages.push({ type: msg.type(), text: msg.text() }));

  const startedAt = new Date().toISOString();
  let mainResponse = null;
  let navigationError = null;
  try {
    mainResponse = await page.goto(START_URL, { waitUntil: 'networkidle', timeout: 45000 });
  } catch (err) {
    navigationError = String(err.message || err);
  }
  await page.waitForTimeout(3000);
  await Promise.allSettled(pending);

  const title = await page.title().catch(() => null);
  const challenge = /just a moment|attention required|verify you are human/i.test(title || '');
  await page.screenshot({ path: path.join(outDir, `screenshot-${label}-fullpage.png`), fullPage: true });
  await page.screenshot({ path: path.join(outDir, `screenshot-${label}-viewport.png`) });
  fs.writeFileSync(path.join(outDir, `rendered-dom-${label}.html`), await page.content());
  if (mainResponse) {
    fs.writeFileSync(path.join(outDir, `served-html-${label}.html`), await mainResponse.body());
  }
  const visibleText = await page.evaluate(() => document.body ? document.body.innerText : '')
    .catch(() => '');
  fs.writeFileSync(path.join(outDir, `visible-text-${label}.txt`), visibleText);
  const links = await page.evaluate(() => Array.from(document.querySelectorAll('a[href]'))
    .map((a) => ({ text: a.innerText.trim().slice(0, 200), href: a.href })))
    .catch(() => []);

  const summary = {
    label,
    started_at_utc: startedAt,
    final_url: page.url(),
    main_status: mainResponse ? mainResponse.status() : null,
    main_remote_address: mainResponse ? await mainResponse.serverAddr() : null,
    navigation_error: navigationError,
    title,
    bot_challenge_detected: challenge,
    user_agent: await page.evaluate(() => navigator.userAgent),
    viewport: page.viewportSize(),
    links,
    console: consoleMessages,
    requests,
  };
  fs.writeFileSync(path.join(outDir, `network-${label}.json`), JSON.stringify(summary, null, 2));
  await context.close();
  return summary;
}

async function main() {
  const root = process.argv[2] || path.join('evidence', `${TARGET}-web`);
  const startedAt = new Date().toISOString().replace(/\.\d+Z$/, 'Z');
  const outDir = path.join(root, startedAt.replace(/[-:]/g, ''));
  if (fs.existsSync(outDir)) {
    console.error(`ERROR: ${outDir} already exists; refusing to overwrite a snapshot`);
    process.exit(2);
  }
  process.umask(0o077);
  fs.mkdirSync(outDir, { recursive: true });

  const proxy = process.env.HTTPS_PROXY || process.env.https_proxy;
  const browser = await chromium.launch({ proxy: proxy ? { server: proxy } : undefined });
  const commit = git(['rev-parse', 'HEAD']) || 'unavailable';
  const modified = commit === 'unavailable' ? 'unknown'
    : git(['ls-files', '--error-unmatch', __filename]) === null ? 'untracked'
    : git(['diff', '--name-only', 'HEAD', '--', __filename]) ? 'yes' : 'no';
  fs.writeFileSync(path.join(outDir, '00_collection-info.txt'), [
    `target=${TARGET}`,
    `collected_at_utc=${startedAt}`,
    'collection_scope=public-landing-page-view-only-no-interaction',
    `collector_sha256=${sha256(fs.readFileSync(__filename))}`,
    `collector_git_commit=${commit}`,
    `collector_modified_since_commit=${modified}`,
    `browser=chromium ${browser.version()}`,
    `playwright=${require('playwright/package.json').version}`,
    `https_proxy_configured=${proxy ? 'yes' : 'no'}`,
    'tls_certificate_errors_ignored=yes (egress proxy re-signs TLS; certificates come from CT instead)',
    '',
  ].join('\n'));

  const stored = new Set();
  const summaries = {};
  for (const [label, options] of Object.entries(VIEWPORTS)) {
    summaries[label] = await capture(browser, outDir, label, options, stored);
    if (summaries[label].bot_challenge_detected) break;
  }

  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const extras = [];
  for (const p of EXTRA_PATHS) {
    const url = `https://${TARGET}${p}`;
    try {
      const res = await context.request.get(url, { maxRedirects: 0, timeout: 20000 });
      const body = await res.body();
      const name = `extra-${p.replace(/[^A-Za-z0-9._-]/g, '_').replace(/^_/, '')}`;
      fs.writeFileSync(path.join(outDir, name), body);
      extras.push({ url, status: res.status(), headers: redact(res.headers()), stored_as: name,
        body_sha256: sha256(body) });
    } catch (err) {
      extras.push({ url, error: String(err.message || err) });
    }
  }
  fs.writeFileSync(path.join(outDir, 'extra-requests.json'), JSON.stringify(extras, null, 2));
  await context.close();
  await browser.close();

  const files = fs.readdirSync(outDir).filter((f) => f !== 'SHA256SUMS').sort();
  const manifest = files.map((f) => `${sha256(fs.readFileSync(path.join(outDir, f)))}  ${f}`);
  fs.writeFileSync(path.join(outDir, 'SHA256SUMS'), manifest.join('\n') + '\n');
  console.log(`Evidence written to ${outDir}`);
  for (const [label, s] of Object.entries(summaries)) {
    console.log(`${label}: status=${s.main_status} title=${JSON.stringify(s.title)} ` +
      `requests=${s.requests.length} challenge=${s.bot_challenge_detected}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
