const fs=require('node:fs'),path=require('node:path');
const sharp=require('C:/Users/ljour/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
(async()=>{
 const records=JSON.parse(fs.readFileSync(path.join(__dirname,'generation.json'),'utf8'));
 const manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'manifest.json'),'utf8'));
 const report=[];
 for(const record of records){
  const asset=manifest.find(a=>a.id===`enemy:${record.id}`||a.id===`boss:${record.id}`);
  const {data,info}=await sharp(record.source).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const cols=asset.width/asset.frameWidth,rows=asset.height/asset.frameHeight;
  const frames=[];
  for(const [state,definition] of Object.entries(asset.states))for(let col=0;col<definition.frames;col++){
   const x0=Math.round(col*info.width/cols),x1=Math.round((col+1)*info.width/cols),y0=Math.round(definition.row*info.height/rows),y1=Math.round((definition.row+1)*info.height/rows);
   let left=x1,top=y1,right=-1,bottom=-1,edgePixels=0,pixels=0;
   for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)if(data[(y*info.width+x)*4+3]>=32){
    left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);pixels++;
    if(x<=x0+1||x>=x1-2||y<=y0+1||y>=y1-2)edgePixels++;
   }
   frames.push({state,col,row:definition.row,x0,y0,x1,y1,left,top,right,bottom,pixels,edgePixels});
  }
  report.push({id:record.id,width:info.width,height:info.height,frames,edgeFrames:frames.filter(f=>f.edgePixels>0).map(f=>`${f.state}_${f.col}:${f.edgePixels}`)});
 }
 fs.writeFileSync(path.join(__dirname,'raw-review.json'),JSON.stringify(report,null,2));
 console.log(JSON.stringify(report.map(r=>({id:r.id,edgeFrames:r.edgeFrames})),null,2));
})().catch(e=>{console.error(e);process.exit(1)});
