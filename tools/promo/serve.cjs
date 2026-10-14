// Local preview with byte ranges so browsers can seek through the MP4.
const http=require('node:http');const fs=require('node:fs');const path=require('node:path');
const root=path.resolve('marketing/2026-10-14');
const files=new Set(fs.readdirSync(root).filter(name=>fs.statSync(path.join(root,name)).isFile()));
const types={'.html':'text/html','.mp4':'video/mp4','.vtt':'text/vtt','.srt':'text/plain','.md':'text/plain','.json':'application/json','.jpg':'image/jpeg'};
http.createServer((req,res)=>{
 if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);return res.end();}
 let name;try{name=decodeURIComponent(new URL(req.url,'http://localhost').pathname).slice(1)||'index.html';}catch{res.writeHead(400);return res.end();}
 if(!files.has(name)){res.writeHead(404);return res.end();}
 const file=path.join(root,name),size=fs.statSync(file).size;
 let start=0,end=size-1,status=200;
 if(req.headers.range){
  const match=/^bytes=(\d+)-(\d*)$/.exec(req.headers.range);
  if(!match){res.writeHead(416,{'Content-Range':`bytes */${size}`});return res.end();}
  start=Number(match[1]);end=match[2]?Math.min(Number(match[2]),size-1):size-1;
  if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start>end||start>=size){res.writeHead(416,{'Content-Range':`bytes */${size}`});return res.end();}
  status=206;
 }
 const headers={'Content-Type':types[path.extname(name)]||'application/octet-stream','Content-Length':end-start+1,'Accept-Ranges':'bytes'};
 if(status===206)headers['Content-Range']=`bytes ${start}-${end}/${size}`;
 res.writeHead(status,headers);if(req.method==='HEAD')return res.end();
 const stream=fs.createReadStream(file,{start,end});stream.on('error',()=>res.destroy());res.on('close',()=>stream.destroy());stream.pipe(res);
}).listen(5181,'127.0.0.1',()=>console.log('Promo player: http://127.0.0.1:5181/'));
