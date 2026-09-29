#!/usr/bin/env node
// Capture public, informational pages of lojapayjoy.shop as an ordinary visitor sees them.
//
// Scope: loads a fixed list of pages (the home page, /modelos and one product page) on
// desktop, and the home page on mobile. Each page is scrolled once so lazy images load,
// then screenshots, the served and rendered HTML, visible text and the list of requests
// the page itself made are recorded, with the bodies of same-origin scripts, stylesheets
// and images. It never clicks, types, submits forms, opens the checkout routes, or sends
// requests of its own to any API. Additional requests: /robots.txt, /sitemap.xml, and the
// static JavaScript chunks listed in the app's own module manifest (downloaded as files,
// never executed or rendered). Bodies of API responses (fetch/XHR) are NOT stored, because
// they may contain third parties' personal data; their URL, status, size and SHA-256 are
// logged instead. A bot challenge is recorded as such and never bypassed.
// Same-origin requests are retried up to four times because some egress proxies drop
// parallel connections; the retry is recorded in 00_collection-info.txt.
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
const PAGES = {
  desktop: ['/', '/modelos', '/produto/samsung-galaxy-a26-5g-256gb'],
  mobile: ['/'],
};
const ATTEMPTS = 4;
const STORED_TYPES = new Set(['document', 'script', 'stylesheet', 'image', 'font', 'manifest']);
const REDACTED_HEADERS = new Set(['set-cookie', 'cookie', 'authorization', 'apikey']);
const VIEWPORTS = {
  desktop: { viewport: { width: 1366, height: 900 } },
  mobile: devices['Pixel 7'],
};

const sha256 = (buf) => crypto.createHash('sha256').update(buf).digest('hex');
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const isSameOrigin = (url) => {
  const host = new URL(url).hostname;
  return host === TARGET || host.endsWith(`.${TARGET}`);
};

async function withRetries(fn) {
  let lastError;
  for (let attempt = 1; attempt <= ATTEMPTS; attempt += 1) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      await sleep(1500 * attempt);
    }
  }
  throw lastError;
}

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

async function capture(browser, outDir, label, pagePath, options, stored) {
  const context = await browser.newContext({ ...options, ignoreHTTPSErrors: true });
  await context.route('**/*', async (route) => {
    if (!isSameOrigin(route.request().url())) return route.continue();
    try {
      const response = await withRetries(() => route.fetch({ timeout: 30000 }));
      return route.fulfill({ response });
    } catch {
      return route.abort('failed');
    }
  });
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
        if (isSameOrigin(request.url()) && STORED_TYPES.has(request.resourceType())) {
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
    mainResponse = await page.goto(new URL(pagePath, START_URL).href, { waitUntil: 'load', timeout: 60000 });
  } catch (err) {
    navigationError = String(err.message || err);
  }
  await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
  // Scroll once so lazily loaded images render; this is viewing, not interaction.
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 600) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
    window.scrollTo(0, 0);
  }).catch(() => {});
  await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(2000);
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
    page_path: pagePath,
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
    `same_origin_requests=fetched via Playwright route.fetch with up to ${ATTEMPTS} attempts`,
    '',
  ].join('\n'));

  const stored = new Set();
  const summaries = {};
  let challenged = false;
  for (const [viewport, options] of Object.entries(VIEWPORTS)) {
    for (const pagePath of PAGES[viewport]) {
      const slug = pagePath === '/' ? 'home' : pagePath.replace(/^\//, '').replace(/[^A-Za-z0-9_-]/g, '_');
      const label = `${viewport}-${slug}`;
      summaries[label] = await capture(browser, outDir, label, pagePath, options, stored);
      if (summaries[label].bot_challenge_detected) {
        challenged = true;
        break;
      }
    }
    if (challenged) break;
  }

  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const get = (url) => withRetries(() => context.request.get(url, { maxRedirects: 0, timeout: 30000 }));

  // Static chunks named in the app's own module manifest (m.f=[...] in the entry bundle).
  const chunks = [];
  const homeHtml = path.join(outDir, 'served-html-desktop-home.html');
  const entry = fs.existsSync(homeHtml)
    ? (fs.readFileSync(homeHtml, 'utf8').match(/\/assets\/index-[A-Za-z0-9_-]+\.js/) || [])[0]
    : undefined;
  if (entry && !challenged) {
    const entryBody = await (await get(`https://${TARGET}${entry}`)).body();
    const list = (entryBody.toString('utf8').match(/m\.f=\[([^\]]*)\]/) || [])[1] || '';
    const names = [entry.slice(1), ...(list.match(/assets\/[A-Za-z0-9._-]+\.(?:js|css)/g) || [])];
    for (const name of [...new Set(names)]) {
      const url = `https://${TARGET}/${name}`;
      try {
        const res = await get(url);
        const body = await res.body();
        const stored_as = assetName(url, body);
        if (!stored.has(stored_as)) {
          fs.writeFileSync(path.join(outDir, stored_as), body);
          stored.add(stored_as);
        }
        chunks.push({ url, status: res.status(), body_sha256: sha256(body), stored_as });
      } catch (err) {
        chunks.push({ url, error: String(err.message || err) });
      }
    }
  }
  fs.writeFileSync(path.join(outDir, 'static-chunks.json'), JSON.stringify(chunks, null, 2));

  const extras = [];
  for (const p of EXTRA_PATHS) {
    const url = `https://${TARGET}${p}`;
    try {
      const res = await get(url);
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
