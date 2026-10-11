// Run the source regressions without needing a browser or touching live data.
const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const backend=[process.env.SATORI_APPS_SCRIPT_DIR,process.env.SATORI_BACKEND_DIR,path.join(root,'apps_script'),path.resolve(root,'../../apps_script')].filter(Boolean).find(dir=>['GOLEM','GYN','REAGILA'].every(line=>fs.existsSync(path.join(dir,'KOD_'+line+'.txt'))));
if(!backend){console.error('Backend regression tests require the private local Apps Script files. Set SATORI_APPS_SCRIPT_DIR to their folder; see maintenance/loading-audit-2.89.23.md.');process.exit(1);}
const env={...process.env,SATORI_APPS_SCRIPT_DIR:backend,SATORI_BACKEND_DIR:backend};
const files=fs.readdirSync(__dirname).filter(f=>/^test-.*\.cjs$/.test(f)&&!f.includes('browser')).sort();
for(const file of files){
 const result=spawnSync(process.execPath,[path.join(__dirname,file)],{cwd:root,stdio:'inherit',env});
 if(result.error){console.error(file+': '+result.error.message);process.exit(1);}
 if(result.status!==0){console.error('Failed: '+file);process.exit(result.status||1);}
}
console.log(files.length+' source regression suites passed');
