#!/usr/bin/env node
/* Build the public model routes from the app pages.
   The app pages stay at /app; the routes at /badr and /uhud are the same
   document with /app asset paths prefixed. Relative paths keep the site
   working under a GitHub Pages subpath. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const routes = [
  { from: 'app/index.html', to: 'badr/index.html' },
  { from: 'app/uhud.html', to: 'uhud/index.html' },
  { from: 'app/khandaq.html', to: 'khandaq/index.html' }
];
const forbidden = /fonts\.googleapis|fonts\.gstatic|cdnjs|jsdelivr|unpkg/i;

let failed = false;
for (const route of routes) {
  const src = path.join(root, route.from);
  const dest = path.join(root, route.to);
  let html = fs.readFileSync(src, 'utf8');

  if (forbidden.test(html)) {
    console.error(`${route.from}: third-party font or script reference`);
    failed = true;
    continue;
  }

  html = html.replace(/(\b(?:href|src)=")(css|js|assets)\//g, '$1../app/$2/');
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, html);
  console.log(`${route.to}  ${(Buffer.byteLength(html) / 1024).toFixed(1)} KB`);
}

if (failed) process.exit(1);
