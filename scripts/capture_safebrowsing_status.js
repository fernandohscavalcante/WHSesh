#!/usr/bin/env node
// Record the Google Safe Browsing Transparency Report page for lojapayjoy.shop.
//
// Loads only transparencyreport.google.com (a third party); the reported domain is never
// contacted. Saves a screenshot, the visible text and the rendered HTML of the report page,
// plus collection metadata and a SHA-256 manifest, so the status label shown to the public
// on that date is preserved without interpreting the report's undocumented status codes.
//
// Usage: NODE_PATH="$(npm root -g)" node scripts/capture_safebrowsing_status.js [evidence-root]
'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { chromium } = require('playwright');

const TARGET = 'lojapayjoy.shop';
const REPORT_URL = `https://transparencyreport.google.com/safe-browsing/search?url=${TARGET}&hl=pt_BR`;

const sha256 = (buf) => crypto.createHash('sha256').update(buf).digest('hex');

function git(args) {
  try {
    return execFileSync('git', ['-C', __dirname, ...args], { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString().trim();
  } catch {
    return null;
  }
}

async function main() {
  const root = process.argv[2] || path.join('evidence', `${TARGET}-reputation`);
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
    `source=${REPORT_URL}`,
    'collection_scope=third-party-report-page-only-no-request-to-target',
    `collector_sha256=${sha256(fs.readFileSync(__filename))}`,
    `collector_git_commit=${commit}`,
    `collector_modified_since_commit=${modified}`,
    `browser=chromium ${browser.version()}`,
    `https_proxy_configured=${proxy ? 'yes' : 'no'}`,
    'tls_certificate_errors_ignored=yes (egress proxy re-signs TLS)',
    '',
  ].join('\n'));

  const context = await browser.newContext({
    viewport: { width: 1366, height: 900 },
    locale: 'pt-BR',
    ignoreHTTPSErrors: true,
  });
  const page = await context.newPage();
  let status = null;
  let error = null;
  try {
    const response = await page.goto(REPORT_URL, { waitUntil: 'load', timeout: 60000 });
    status = response ? response.status() : null;
    await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(3000);
  } catch (err) {
    error = String(err.message || err);
  }
  await page.screenshot({ path: path.join(outDir, 'safebrowsing-report.png'), fullPage: true });
  fs.writeFileSync(path.join(outDir, 'safebrowsing-report.html'), await page.content());
  const text = await page.evaluate(() => (document.body ? document.body.innerText : '')).catch(() => '');
  fs.writeFileSync(path.join(outDir, 'safebrowsing-report.txt'), text);
  fs.writeFileSync(path.join(outDir, 'page-load.json'), JSON.stringify({
    url: REPORT_URL, final_url: page.url(), status, error, title: await page.title(),
  }, null, 2));
  await browser.close();

  const files = fs.readdirSync(outDir).filter((f) => f !== 'SHA256SUMS').sort();
  const manifest = files.map((f) => `${sha256(fs.readFileSync(path.join(outDir, f)))}  ${f}`);
  fs.writeFileSync(path.join(outDir, 'SHA256SUMS'), manifest.join('\n') + '\n');
  console.log(`Evidence written to ${outDir} (status=${status}${error ? `, error=${error}` : ''})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
