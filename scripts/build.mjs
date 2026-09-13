#!/usr/bin/env node
// ╔══════════════════════════════════════════════════════════════╗
// ║  Satori — build krok pre nahlad/ aj ostrú appku (koreň)       ║
// ║                                                                ║
// ║  app.js a app.css v danom priečinku sú zdroj. Tento skript ich ║
// ║  minifikuje, vypočíta hash z OBSAHU a uloží ako                ║
// ║  dist/app.<hash>.js / .css. index.html a sw.js sa               ║
// ║  prepíšu tak, aby na ne ukazovali.                             ║
// ║                                                                ║
// ║  Od v2.88.1 (promote Satori app) sú nahlad/ aj koreň rovnaká   ║
// ║  trojsúborová štruktúra (app.js/app.css/index.html/sw.js) —     ║
// ║  bez argumentu sa prestavia OBE, aby nezaostali jedna za       ║
// ║  druhou (presne to sa stalo pri prvom fixe po promote).        ║
// ║  Rozdiel medzi nimi je len CACHE_NAME prefix a nahlad banner.  ║
// ║                                                                ║
// ║  Staré app.<hash>.js/.css v dist/ sa NEMAŽÚ — to je návrat     ║
// ║  na predošlú verziu (F1-3): zmena jedného odkazu v index.html. ║
// ║  Čistenie starých buildov je samostatný krok (build.mjs --gc). ║
// ╚══════════════════════════════════════════════════════════════╝
import { build } from 'esbuild';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync, readdirSync, unlinkSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const TARGETS = {
  nahlad: { dir: resolve(ROOT, 'nahlad'), cachePrefix: 'potencial-nahlad-' },
  prod:   { dir: ROOT,                    cachePrefix: 'potencial-prod-' },
};

function hash8(buf) {
  return createHash('sha256').update(buf).digest('hex').slice(0, 8);
}

async function minify(srcPath, loader) {
  const result = await build({
    entryPoints: [srcPath],
    write: false,
    minify: true,
    charset: 'utf8',      // BEZ tohto esbuild rozbije diakritiku v regexoch (À-ž) — nájdené pri prvom pokuse
    loader: { [srcPath.slice(srcPath.lastIndexOf('.'))]: loader },
    logLevel: 'warning',
  });
  return Buffer.from(result.outputFiles[0].contents);
}

async function buildTarget(name, { dir, cachePrefix }, gc) {
  const dist = resolve(dir, 'dist');
  mkdirSync(dist, { recursive: true });

  const jsSrc = resolve(dir, 'app.js');
  const cssSrc = resolve(dir, 'app.css');

  console.log(`\n[${name}] Minifikujem app.js…`);
  const jsOut = await minify(jsSrc, 'js');
  console.log(`[${name}] Minifikujem app.css…`);
  const cssOut = await minify(cssSrc, 'css');

  const jsHash = hash8(jsOut);
  const cssHash = hash8(cssOut);
  const jsName = `app.${jsHash}.js`;
  const cssName = `app.${cssHash}.css`;

  writeFileSync(resolve(dist, jsName), jsOut);
  writeFileSync(resolve(dist, cssName), cssOut);

  const jsSrcSize = readFileSync(jsSrc).length;
  const cssSrcSize = readFileSync(cssSrc).length;
  console.log(`[${name}] app.js:  ${jsSrcSize} → ${jsOut.length} bajtov (${jsName})`);
  console.log(`[${name}] app.css: ${cssSrcSize} → ${cssOut.length} bajtov (${cssName})`);

  // ── index.html — prepíš odkazy na app.css/app.js na hashované dist/ súbory ──
  const idxPath = resolve(dir, 'index.html');
  let idx = readFileSync(idxPath, 'utf8');
  const cssRe = /href="(?:dist\/)?app\.(?:[0-9a-f]{8}\.)?css(?:\?v=[\d.]+)?"/;
  const jsRe = /src="(?:dist\/)?app\.(?:[0-9a-f]{8}\.)?js(?:\?v=[\d.]+)?"/;
  // Test zhody PRED nahradením — porovnanie výsledku so vstupom (before===after)
  // by nesprávne hlásilo "nič sa nenašlo" aj pri korektnej zhode, keď zdroj
  // odvtedy nezmenil obsah a hash tak vyjde identický ako v predošlom builde.
  const matched = cssRe.test(idx) && jsRe.test(idx);
  idx = idx.replace(cssRe, `href="dist/${cssName}"`);
  idx = idx.replace(jsRe, `src="dist/${jsName}"`);
  if (!matched) {
    console.error(`[${name}] POZOR: index.html sa nezmenil — odkaz na app.css/app.js sa nenašiel presným tvarom, skontroluj ručne.`);
    process.exit(1);
  }
  writeFileSync(idxPath, idx);

  // ── sw.js — APP_SHELL + CACHE_NAME ──
  const swPath = resolve(dir, 'sw.js');
  let sw = readFileSync(swPath, 'utf8');
  sw = sw.replace(/'\.\/(?:dist\/)?app\.(?:[0-9a-f]{8}\.)?css(?:\?v=[\d.]+)?'/, `'./dist/${cssName}'`);
  sw = sw.replace(/'\.\/(?:dist\/)?app\.(?:[0-9a-f]{8}\.)?js(?:\?v=[\d.]+)?'/, `'./dist/${jsName}'`);
  const cacheTag = `${jsHash}${cssHash}`.slice(0, 12);
  sw = sw.replace(/var CACHE_NAME = '[^']*';/, `var CACHE_NAME = '${cachePrefix}v${cacheTag}';`);
  writeFileSync(swPath, sw);

  console.log(`[${name}] Hotovo → dist/${jsName}, dist/${cssName}`);

  if (gc) {
    const keep = new Set([jsName, cssName]);
    let removed = 0;
    for (const f of readdirSync(dist)) {
      if (!keep.has(f)) { unlinkSync(resolve(dist, f)); removed++; }
    }
    console.log(`[${name}] --gc: zmazaných starých buildov: ${removed}`);
  }
}

async function main() {
  const gc = process.argv.includes('--gc');
  const only = process.argv.includes('--nahlad') ? ['nahlad'] : process.argv.includes('--prod') ? ['prod'] : ['nahlad', 'prod'];

  for (const name of only) {
    await buildTarget(name, TARGETS[name], gc);
  }

  if (!gc) {
    console.log('\nStaré buildy v dist/ zostali (návrat = zmena odkazu v index.html).');
    console.log('Zmaž ich ručne alebo spusti "node scripts/build.mjs --gc".');
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
