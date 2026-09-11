#!/usr/bin/env node
// ╔══════════════════════════════════════════════════════════════╗
// ║  Satori — build krok pre nahlad/  (F1-1 z vykonávacieho plánu) ║
// ║                                                                ║
// ║  nahlad/app.js a nahlad/app.css sú zdroj. Tento skript ich     ║
// ║  minifikuje, vypočíta hash z OBSAHU a uloží ako                ║
// ║  nahlad/dist/app.<hash>.js / .css. index.html a sw.js sa       ║
// ║  prepíšu tak, aby na ne ukazovali.                             ║
// ║                                                                ║
// ║  Staré app.<hash>.js/.css v dist/ sa NEMAŽÚ — to je návrat     ║
// ║  na predošlú verziu (F1-3): zmena jedného odkazu v index.html. ║
// ║  Čistenie starých buildov je samostatný krok (build.mjs --gc). ║
// ╚══════════════════════════════════════════════════════════════╝
import { build } from 'esbuild';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, unlinkSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const NAHLAD = resolve(ROOT, 'nahlad');
const DIST = resolve(NAHLAD, 'dist');

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

async function main() {
  const gc = process.argv.includes('--gc');
  mkdirSync(DIST, { recursive: true });

  const jsSrc = resolve(NAHLAD, 'app.js');
  const cssSrc = resolve(NAHLAD, 'app.css');

  console.log('Minifikujem app.js…');
  const jsOut = await minify(jsSrc, 'js');
  console.log('Minifikujem app.css…');
  const cssOut = await minify(cssSrc, 'css');

  const jsHash = hash8(jsOut);
  const cssHash = hash8(cssOut);
  const jsName = `app.${jsHash}.js`;
  const cssName = `app.${cssHash}.css`;

  writeFileSync(resolve(DIST, jsName), jsOut);
  writeFileSync(resolve(DIST, cssName), cssOut);

  const jsSrcSize = readFileSync(jsSrc).length;
  const cssSrcSize = readFileSync(cssSrc).length;
  console.log(`app.js:  ${jsSrcSize} → ${jsOut.length} bajtov (${jsName})`);
  console.log(`app.css: ${cssSrcSize} → ${cssOut.length} bajtov (${cssName})`);

  // ── index.html — prepíš odkazy na app.css/app.js na hashované dist/ súbory ──
  const idxPath = resolve(NAHLAD, 'index.html');
  let idx = readFileSync(idxPath, 'utf8');
  const before = idx;
  idx = idx.replace(/href="(?:dist\/)?app\.(?:[0-9a-f]{8}\.)?css(?:\?v=[\d.]+)?"/, `href="dist/${cssName}"`);
  idx = idx.replace(/src="(?:dist\/)?app\.(?:[0-9a-f]{8}\.)?js(?:\?v=[\d.]+)?"/, `src="dist/${jsName}"`);
  if (idx === before) {
    console.error('POZOR: index.html sa nezmenil — odkaz na app.css/app.js sa nenašiel presným tvarom, skontroluj ručne.');
    process.exit(1);
  }
  writeFileSync(idxPath, idx);

  // ── sw.js — APP_SHELL + CACHE_NAME ──
  const swPath = resolve(NAHLAD, 'sw.js');
  let sw = readFileSync(swPath, 'utf8');
  sw = sw.replace(/'\.\/(?:dist\/)?app\.(?:[0-9a-f]{8}\.)?css(?:\?v=[\d.]+)?'/, `'./dist/${cssName}'`);
  sw = sw.replace(/'\.\/(?:dist\/)?app\.(?:[0-9a-f]{8}\.)?js(?:\?v=[\d.]+)?'/, `'./dist/${jsName}'`);
  const cacheTag = `${jsHash}${cssHash}`.slice(0, 12);
  sw = sw.replace(/var CACHE_NAME = '[^']*';/, `var CACHE_NAME = 'potencial-nahlad-v${cacheTag}';`);
  writeFileSync(swPath, sw);

  console.log('\nHotovo. index.html a sw.js ukazujú na:');
  console.log('  dist/' + jsName);
  console.log('  dist/' + cssName);

  if (gc) {
    const keep = new Set([jsName, cssName]);
    let removed = 0;
    for (const f of readdirSync(DIST)) {
      if (!keep.has(f)) { unlinkSync(resolve(DIST, f)); removed++; }
    }
    console.log(`\n--gc: zmazaných starých buildov: ${removed}`);
  } else {
    console.log('\nStaré buildy v nahlad/dist/ zostali (návrat = zmena odkazu v index.html).');
    console.log('Zmaž ich ručne alebo spusti "node scripts/build.mjs --gc".');
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
