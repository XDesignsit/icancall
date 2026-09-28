#!/usr/bin/env node
// Builds "iCanCall Landing Page (standalone).html" — the offline, single-file
// copy of the homepage — from the same source the site renders (src/app/_home).
//
//   npm run build && node scripts/build-standalone-home.mjs
//
// It uses the compiled CSS from the last `next build`, pre-renders the page's
// markup in every language, bundles the homepage controller and simulator, and
// packs everything in the bundler format the other standalone pages use
// (gzip+base64 assets in __bundler/manifest, the page in __bundler/template,
// unpacked into blob: URLs by the loader). Links follow the other standalone
// copies: sibling standalone files where one exists, site paths otherwise.
//
// Then copy the output to the pCloud and Google Drive "Pages" folders
// (see docs/guides/standalone-html-sync.md).
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(path.join(ROOT, "package.json"));
const ts = require("typescript");
const { minify } = require("terser");

const OUT = path.join(ROOT, "iCanCall Landing Page (standalone).html");
const SHELL_SOURCE = path.join(ROOT, "iCanCall Seniors Landing (standalone).html"); // loader shell to reuse
const TMP = path.join(ROOT, "node_modules/.cache/standalone-home");
const LANGS = ["en", "es", "fr", "ja", "zh", "ar", "hi", "pt", "de", "it", "ko"];

const LINKS = [
  [/href="\/signup\?/g, 'href="iCanCall Signup (standalone).html?'],
  [/href="\/parents"/g, 'href="iCanCall Parents Landing (standalone).html"'],
  [/href="\/seniors"/g, 'href="iCanCall Seniors Landing (standalone).html"'],
  [/href="\/caregivers"/g, 'href="iCanCall Caregivers Landing (standalone).html"'],
  [/href="\/comparison-chart"/g, 'href="ICanCall_Comparison_Chart.html"'],
];
const SIGNUP_PATH = "iCanCall Signup (standalone).html";

/* ── 1. transpile the TypeScript sources the page needs into plain ES modules ── */
const SOURCES = [
  "src/app/_home/HomeV2.tsx",
  "src/app/_home/IconSprite.tsx",
  "src/app/_home/text.tsx",
  "src/app/_home/controller.ts",
  "src/app/_home/sim.ts",
  "src/lib/pricing.ts",
  "src/lib/planFeatures.ts",
  "src/lib/translations/home/format.ts",
  ...LANGS.flatMap((l) => [`src/lib/translations/home/${l}.ts`, `src/lib/translations/${l}.ts`]),
];
fs.rmSync(TMP, { recursive: true, force: true });
const outPath = (src) => path.join(TMP, src.replace(/\.tsx?$/, ".mjs"));
for (const src of SOURCES) {
  const code = fs.readFileSync(path.join(ROOT, src), "utf8");
  let js = ts.transpileModule(code, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
    fileName: src,
  }).outputText;
  const from = path.dirname(outPath(src));
  js = js.replace(/from "(@\/|\.\/)([^"]+)"/g, (_, kind, rest) => {
    const target = kind === "@/" ? outPath(`src/${rest}.ts`) : path.join(from, `${rest}.mjs`);
    let rel = path.relative(from, target);
    if (!rel.startsWith(".")) rel = "./" + rel;
    return `from "${rel}"`;
  });
  fs.mkdirSync(from, { recursive: true });
  fs.writeFileSync(outPath(src), js);
}
const load = (src) => import(pathToFileURL(outPath(src)).href);

/* ── 2. assets: the use-case photos (640px JPEG, like the other standalone copies) ── */
const manifest = {};
const extResources = [];
const asset = (mime, bytes, compress) => {
  const id = crypto.randomUUID();
  manifest[id] = { mime, compressed: compress, data: (compress ? zlib.gzipSync(bytes, { level: 9 }) : bytes).toString("base64") };
  return id;
};
const images = {};
for (const name of ["child-calling", "aging-parent", "special-abilities"]) {
  const png = path.join(ROOT, "public/usecases", `${name}.png`);
  let bytes, mime = "image/jpeg";
  try {
    const jpg = path.join(TMP, `${name}.jpg`);
    execFileSync("sips", ["-Z", "640", "-s", "format", "jpeg", "-s", "formatOptions", "80", png, "--out", jpg], { stdio: "ignore" });
    bytes = fs.readFileSync(jpg);
  } catch {
    bytes = fs.readFileSync(png); // no sips (not macOS): ship the PNG
    mime = "image/png";
  }
  const uuid = asset(mime, bytes, false);
  images[name] = uuid;
  // The loader only swaps asset ids inside the template; markup the script inserts
  // later (other languages) looks its images up in window.__resources instead.
  extResources.push({ id: name, uuid });
}
// In pre-rendered pages, photos point at a placeholder the script resolves.
const imagePlaceholders = (html) => html.replace(/src="\/usecases\/([\w-]+)\.png"/g, 'src="__RES:$1__"');

/* ── 3. pre-render the markup in every language ── */
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const HomeV2 = (await load("src/app/_home/HomeV2.tsx")).default;
const IconSprite = (await load("src/app/_home/IconSprite.tsx")).default;
const pages = {}, dicts = {};
for (const lang of LANGS) {
  const t = (await load(`src/lib/translations/home/${lang}.ts`)).default;
  const base = (await load(`src/lib/translations/${lang}.ts`)).default;
  let html = renderToStaticMarkup(React.createElement(HomeV2, { t, base, lang, onLang() {}, root: { current: null } }));
  for (const [re, to] of LINKS) html = html.replace(re, to);
  pages[lang] = imagePlaceholders(html);
  dicts[lang] = { t, billedMonthly: base.ui.billedMonthlyCancelAnytime };
}
const sprite = renderToStaticMarkup(React.createElement(IconSprite));
const enHome = dicts.en.t;

/* ── 4. the browser script: format + sim + controller, then language switching ── */
const moduleBody = (src) =>
  fs
    .readFileSync(outPath(src), "utf8")
    .replace(/^"use client";\s*/m, "")
    .replace(/^import [^;]+;\s*$/gm, "")
    .replace(/^export (?=(function|const|let|class|async) )/gm, "")
    .replace(/^export \{[^}]*\};?\s*$/gm, "");
const runtime = `(function(){"use strict";
const {fill} = (function(){${moduleBody("src/lib/translations/home/format.ts")}; return {fill};})();
const {mountSim} = (function(){${moduleBody("src/app/_home/sim.ts")}; return {mountSim};})();
const {initHome} = (function(){${moduleBody("src/app/_home/controller.ts")}; return {initHome};})();
const PAGES = ${JSON.stringify(pages)};
const DICTS = ${JSON.stringify(dicts)};
const root = document.querySelector(".hp-page"), sprite = root.firstElementChild, H = document.documentElement;
const q = new URLSearchParams(location.search);
const rm = q.get("motion") === "reduced" || matchMedia("(prefers-reduced-motion: reduce)").matches;
root.classList.add(rm ? "rm" : "m");
if (!(window.CSS && CSS.supports && CSS.supports("animation-timeline", "view()"))) root.classList.add("no-sda");
let stop = null;
function render(lang, keepMarkup) {
  if (stop) stop();
  if (!keepMarkup) {
    while (sprite.nextSibling) sprite.nextSibling.remove();
    const res = window.__resources || {};
    sprite.insertAdjacentHTML("afterend", PAGES[lang].replace(/__RES:([\\w-]+)__/g, (m, id) => res[id] || ""));
  }
  H.lang = lang; H.dir = lang === "ar" ? "rtl" : "ltr";
  root.querySelectorAll(".hp-lang-sel").forEach((s) => {
    s.value = lang;
    s.addEventListener("change", () => { try { localStorage.setItem("lang", s.value); } catch (e) {} render(s.value); });
  });
  stop = initHome(root, { t: DICTS[lang].t, lang, billedMonthly: DICTS[lang].billedMonthly, signupPath: ${JSON.stringify(SIGNUP_PATH)} });
}
let saved = null;
try { saved = localStorage.getItem("lang"); } catch (e) {}
if (saved && saved !== "en" && PAGES[saved]) render(saved); else render("en", true);
})();`;
const runtimeMin = (await minify(runtime, { compress: true, mangle: true, format: { ascii_only: true } })).code;

/* ── 5. stylesheets from the last build, and the script ── */
const indexHtml = fs.readFileSync(path.join(ROOT, ".next/server/app/index.html"), "utf8");
const cssIds = [...indexHtml.matchAll(/<link rel="stylesheet" href="\/_next\/static\/chunks\/([^"]+\.css)"/g)].map(([, f]) => {
  // Drop the Geist @font-face rules: the homepage never uses those fonts and their URLs point into .next.
  const css = fs.readFileSync(path.join(ROOT, ".next/static/chunks", f), "utf8").replace(/@font-face\{[^}]*\}/g, "");
  return asset("text/css", Buffer.from(css), true);
});
if (!cssIds.length) throw new Error("No stylesheets found in .next/server/app/index.html — run `npm run build` first.");
const jsId = asset("application/javascript", Buffer.from(runtimeMin), true);

/* ── 6. the page template and the loader shell ── */
const esc = (s) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
const head = `<meta charset="utf-8">
  <title>${esc(enHome.meta.title)}</title>
  <meta name="description" content="${esc(enHome.meta.description)}">`;
const template = `<!DOCTYPE html>
<html lang="en" class="h-full antialiased">
<head>
  ${head}
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="theme-color" content="#f9fdff">
  <link rel="alternate" type="text/markdown" href="https://icancall.co/index.md">
  <link rel="describedby" type="text/plain" href="https://icancall.co/llms.txt">
${cssIds.map((id) => `  <link rel="stylesheet" href="${id}">`).join("\n")}
</head>
<body class="min-h-full flex flex-col">
<div class="hp-page">${sprite}${pages.en.replace(/__RES:([\w-]+)__/g, (m, id) => images[id])}</div>
<script src="${jsId}"></script>
</body>
</html>`;
const scriptJson = (v) => JSON.stringify(v).replace(/<\//g, "<\\/").replace(/<!--/g, "<\\u0021--");

const shell = fs.readFileSync(SHELL_SOURCE, "utf8");
const bodyStart = shell.indexOf("<body>");
const loaderStart = shell.indexOf("<script>", bodyStart);
const loaderEnd = shell.indexOf("</script>", loaderStart) + "</script>".length;
const loader = shell.slice(loaderStart, loaderEnd);
const consent = (shell.match(/<!-- CONCORD_COOKIE_CONSENT_START -->[\s\S]*?<!-- CONCORD_COOKIE_CONSENT_END -->/) || [""])[0];
const shellStyle = (shell.match(/<style>[\s\S]*?<\/style>/) || [""])[0].replace(/#0c3a4f/g, "#003b60");
const noscript = (shell.match(/<noscript>[\s\S]*?<\/noscript>/) || [""])[0];
const thumb = `<svg viewBox="0 0 1200 800" xmlns="http://www.w3.org/2000/svg"><rect width="1200" height="800" fill="#003b60"/><circle cx="600" cy="400" r="250" fill="none" stroke="#1f5378" stroke-width="3"/><path d="M600 400 C 700 400 740 275 816 275" fill="none" stroke="#50b7b8" stroke-width="6"/><path d="M600 400 C 700 400 740 525 816 525" fill="none" stroke="#4ab67f" stroke-width="6"/><rect x="455" y="320" width="290" height="160" rx="28" fill="#fff"/><rect x="490" y="385" width="220" height="30" rx="8" fill="#0f85b2"/><circle cx="816" cy="275" r="34" fill="#1f5378"/><circle cx="816" cy="525" r="34" fill="#fff" stroke="#4ab67f" stroke-width="6"/><circle cx="384" cy="275" r="34" fill="#1f5378"/><circle cx="384" cy="525" r="34" fill="#1f5378"/></svg>`;

const out = `<!DOCTYPE html>
<html>
<head>
${consent}


  ${head}
  <link rel="alternate" type="text/markdown" href="https://icancall.co/index.md">
  <link rel="describedby" type="text/plain" href="https://icancall.co/llms.txt">
  ${shellStyle}
  ${noscript}
</head>
<body>
  <div id="__bundler_thumbnail">
  ${thumb}
</div>
  <div id="__bundler_loading">Unpacking...</div>

  ${loader}
<script type="__bundler/manifest">${scriptJson(manifest)}</script>
<script type="__bundler/template">${scriptJson(template)}</script>
<script type="__bundler/ext_resources">${scriptJson(extResources)}</script>
</body>
</html>
`;
fs.writeFileSync(OUT, out);
fs.rmSync(TMP, { recursive: true, force: true });
console.log(`${path.basename(OUT)}: ${(out.length / 1024).toFixed(0)} KB (${Object.keys(manifest).length} assets, ${LANGS.length} languages)`);
