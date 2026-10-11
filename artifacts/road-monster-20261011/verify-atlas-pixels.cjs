const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const sharp=require('C:/Users/ljour/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root=path.resolve(__dirname,'../..');
(async()=>{
 const manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'manifest.json'),'utf8'));
 const results=[];
 for(const asset of manifest.filter(a=>a.kind==='sheet')){
  const file=path.join(root,'public',asset.path),buffer=fs.readFileSync(file);
  const {data,info}=await sharp(buffer).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  assert.equal(info.width,asset.width);assert.equal(info.height,asset.height);
  const frames=[],cell=asset.frameWidth,columns=asset.width/cell;
  for(const [state,def] of Object.entries(asset.states)){
   const hashes=new Set();
   for(let column=0;column<columns;column++){
    const crop=await sharp(buffer).extract({left:column*cell,top:def.row*cell,width:cell,height:cell}).raw().toBuffer();
    let occupied=0,bottom=-1,edge=0;
    for(let y=0;y<cell;y++)for(let x=0;x<cell;x++)if(crop[(y*cell+x)*4+3]>=32){occupied++;bottom=Math.max(bottom,y);if(x<4||x>=cell-4||y<4||y>=cell-4)edge++;}
    if(column<def.frames){
     assert(occupied>100,`${asset.id}/${state}_${column} empty`);assert.equal(edge,0,`${asset.id}/${state}_${column} clipped`);
     assert(Math.abs(bottom-Math.round(cell*.9))<=2,`${asset.id}/${state}_${column} anchor`);
     const hash=crypto.createHash('sha256').update(crop).digest('hex');assert(!hashes.has(hash),`${asset.id}/${state} duplicate pose`);hashes.add(hash);
     frames.push({state,column,occupied,bottom,edge,sha256:hash});
    }else assert.equal(occupied,0,`${asset.id}/${state}_${column} unused cell`);
   }
  }
  const stats=await sharp(buffer).stats();assert.equal(stats.isOpaque,false,`${asset.id} opaque background`);
  results.push({id:asset.id,path:asset.path,sha256:crypto.createHash('sha256').update(buffer).digest('hex'),frames});
 }
 const metadata=JSON.parse(fs.readFileSync(path.join(root,'src/game/art/enemyAtlasFrames.json'),'utf8'));
 const classic=[];
 for(const [id,spec] of Object.entries(metadata.enemies)){
  const atlasName=Object.keys(metadata.atlases).find(name=>metadata.atlases[name].textureKey===spec.atlas);
  const image=fs.readFileSync(path.join(root,'public/assets/enemies',atlasName));const info=await sharp(image).metadata();
  for(const facing of ['right','left'])for(const frame of spec[facing+'Frames']){
   assert(frame.x>=0&&frame.y>=0&&frame.x+frame.width<=info.width&&frame.y+frame.height<=info.height,`${id}/${frame.name} outside atlas`);
   const stats=await sharp(image).extract({left:frame.x,top:frame.y,width:frame.width,height:frame.height}).stats();assert(stats.channels[3].max>32);
  }
  classic.push({id,atlas:atlasName,right:spec.rightFrames.length,left:spec.leftFrames.length});
 }
 fs.writeFileSync(path.join(__dirname,'pixel-verification.json'),JSON.stringify({campaign:results,classic},null,2));
 console.log(JSON.stringify({campaignAtlases:results.length,requiredFrames:results.reduce((n,r)=>n+r.frames.length,0),classicArchetypes:classic.length}));
})().catch(e=>{console.error(e);process.exit(1)});
