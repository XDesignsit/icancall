#!/usr/bin/env node
// Embeds the site font (Atkinson Hyperlegible Next, public/fonts) into Concord
// standalone exports, so they match the Next.js app:
//
//   node scripts/embed-standalone-font.mjs public/seniors.html "iCanCall Seniors Landing (standalone).html" ...
//
// The font goes in as a data: URI inside the page template (the exports are
// single files, and CSP font-src allows data:), and the template's --font
// variable gets it in front of its system stack. Safe to re-run: an earlier
// embed is replaced, not duplicated.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FAMILY = "Atkinson Hyperlegible Next";

const data = fs.readFileSync(path.join(ROOT, "public/fonts/AtkinsonHyperlegibleNext-latin.woff2")).toString("base64");
const STYLE = `<style id="site-font">@font-face{font-family:"${FAMILY}";font-style:normal;font-weight:200 800;font-display:swap;src:url(data:font/woff2;base64,${data}) format("woff2")}</style>`;

const TEMPLATE_RE = /(<script type="__bundler\/template">)([\s\S]*?)(<\/script>)/;
const scriptJson = (v) => JSON.stringify(v).replace(/<\//g, "<\\/").replace(/<!--/g, "<\\u0021--");

const files = process.argv.slice(2);
if (!files.length) {
  console.error("usage: node scripts/embed-standalone-font.mjs <standalone.html> ...");
  process.exit(1);
}
for (const file of files) {
  const html = fs.readFileSync(file, "utf8");
  const m = html.match(TEMPLATE_RE);
  if (!m) throw new Error(`${file}: no __bundler/template block`);
  let t = JSON.parse(m[2]);
  if (!t.includes("<head>")) throw new Error(`${file}: template has no <head>`);
  if (!/--font:/.test(t)) throw new Error(`${file}: no --font variable in the template`);
  t = t.replace(/<style id="site-font">[\s\S]*?<\/style>/, "");
  t = t.replace("<head>", () => `<head>${STYLE}`);
  t = t.replace(/--font:\s*(?:"Atkinson Hyperlegible Next",\s*)?/g, `--font: "${FAMILY}", `);
  fs.writeFileSync(file, html.replace(TEMPLATE_RE, (_, open, __, close) => open + scriptJson(t) + close));
  console.log(`${path.basename(file)}: ${FAMILY} embedded`);
}
