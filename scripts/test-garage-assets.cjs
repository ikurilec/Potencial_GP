const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');const root=path.resolve(__dirname,'..');
for(const dir of [root,path.join(root,'nahlad')]){
 const index=fs.readFileSync(path.join(dir,'index.html'),'utf8'),sw=fs.readFileSync(path.join(dir,'sw.js'),'utf8');
 for(const name of ['garage','garage-integration']){assert.match(index,new RegExp('<script defer src="dist/'+name+'\\.[a-f0-9]{8}\\.js"></script>'),'Garage scripts must configure before DOMContentLoaded');const asset=index.match(new RegExp('src="(dist/'+name+'\\.[a-f0-9]{8}\\.js)"'))[1];assert.ok(fs.existsSync(path.join(dir,asset)));assert.ok(sw.includes("'./"+asset+"'"),'Garage script must work in PWA cache');}
 const css=index.match(/href="(dist\/garage\.[a-f0-9]{8}\.css)"/);assert.ok(css,'Garage uses own token-based CSS');assert.ok(fs.existsSync(path.join(dir,css[1])));assert.ok(sw.includes("'./"+css[1]+"'"));
 assert.ok(index.indexOf('dist/garage.')<index.indexOf('dist/garage-integration.'),'UI module loads before bridge');
}
assert.equal(fs.readFileSync(path.join(root,'garage-integration.js'),'utf8'),fs.readFileSync(path.join(root,'nahlad/garage-integration.js'),'utf8'));
console.log('Garage: live/preview modules and PWA precache references passed');
