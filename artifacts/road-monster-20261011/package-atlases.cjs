const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const sharp=require('C:/Users/ljour/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root=path.resolve(__dirname,'../..');
function findCut(nominal,radius,max,score){
 let best=nominal,count=Infinity;
 for(let p=Math.max(1,Math.floor(nominal-radius));p<=Math.min(max-2,Math.ceil(nominal+radius));p++){
  const n=score(p)+score(p-1);if(n<count||n===count&&Math.abs(p-nominal)<Math.abs(best-nominal)){best=p;count=n;}
 }
 return {position:best,count};
}
(async()=>{
 const records=JSON.parse(fs.readFileSync(path.join(__dirname,'generation.json'),'utf8'));
 const manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'manifest.json'),'utf8')),report=[];
 for(const record of records){
  const asset=manifest.find(a=>a.id===`enemy:${record.id}`||a.id===`boss:${record.id}`);
  const {data,info}=await sharp(record.source).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const cols=asset.width/asset.frameWidth,rows=asset.height/asset.frameHeight,alpha=(x,y)=>data[(y*info.width+x)*4+3];
  const rowCuts=[{position:0,count:0}];
  for(let r=1;r<rows;r++)rowCuts.push(findCut(r*info.height/rows,info.height/rows*.4,info.height,y=>{
   let count=0;for(let x=0;x<info.width;x++)if(alpha(x,y)>=32)count++;return count;
  }));
  rowCuts.push({position:info.height,count:0});
  const frames=[],cuts=[];
  for(const [state,definition] of Object.entries(asset.states)){
   const y0=rowCuts[definition.row].position,y1=rowCuts[definition.row+1].position;
   const columnCuts=[{position:0,count:0}];
   for(let col=1;col<cols;col++)columnCuts.push(findCut(col*info.width/cols,info.width/cols*.4,info.width,x=>{
    let count=0;for(let y=y0;y<y1;y++)if(alpha(x,y)>=32)count++;return count;
   }));
   columnCuts.push({position:info.width,count:0});cuts.push({state,columns:columnCuts});
   for(let col=0;col<definition.frames;col++){
    const x0=columnCuts[col].position,x1=columnCuts[col+1].position;
    let left=x1,top=y1,right=-1,bottom=-1,edgePixels=0;
    for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)if(alpha(x,y)>=32){
     left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);
     if(x===x0||x===x1-1||y===y0||y===y1-1)edgePixels++;
    }
    frames.push({state,col,row:definition.row,left,top,right,bottom,edgePixels});
   }
  }
  const blocked=frames.filter(f=>f.edgePixels>0||f.right<f.left).map(f=>`${f.state}_${f.col}:${f.edgePixels}`);
  const recordReport={id:record.id,rowCuts,cuts,blocked,frames};report.push(recordReport);
  if(blocked.length)continue;
  const cell=asset.frameWidth,maxDimension=Math.max(...frames.map(f=>Math.max(f.right-f.left+1,f.bottom-f.top+1)));
  const scale=cell*.78/maxDimension,composites=[];
  for(const f of frames){
   const w=f.right-f.left+1,h=f.bottom-f.top+1,width=Math.max(1,Math.round(w*scale)),height=Math.max(1,Math.round(h*scale));
   const input=await sharp(record.source).extract({left:f.left,top:f.top,width:w,height:h}).resize(width,height).png().toBuffer();
   composites.push({input,left:f.col*cell+Math.round((cell-width)/2),top:f.row*cell+Math.round(cell*.9)-height});
  }
  const dest=path.join(root,'public',asset.path),output=await sharp({create:{width:asset.width,height:asset.height,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(composites).png().toBuffer();
  fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,output);
  recordReport.output=asset.path;recordReport.sha256=crypto.createHash('sha256').update(output).digest('hex');recordReport.scale=scale;
 }
 fs.writeFileSync(path.join(__dirname,'packaging.json'),JSON.stringify(report,null,2));
 console.log(JSON.stringify(report.map(r=>({id:r.id,blocked:r.blocked,output:r.output})),null,2));
})().catch(e=>{console.error(e);process.exit(1)});
