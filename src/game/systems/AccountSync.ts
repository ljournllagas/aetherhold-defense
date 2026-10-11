import type {AccountRef,ApiResult} from '../../shared/account.ts';
export function retryDelay(failures:number,retryAfterMs=0,random=Math.random):number {return Math.max(retryAfterMs,[2000,5000,15000,30000,60000][Math.min(failures,4)]*(0.9+random()*0.2));}
export class AccountSync {
  private timer:ReturnType<typeof setTimeout>|null=null;
  private running=false;
  private failures=0;
  private stopped=false;
  constructor(private readonly flushNow:(ref:AccountRef)=>Promise<ApiResult<null>>){}
  async flush(ref:AccountRef):Promise<void>{
    this.stopped=false;if(this.running)return;this.running=true;
    if(this.timer){clearTimeout(this.timer);this.timer=null;}
    try{const result=await this.flushNow(ref);if(result.ok){this.failures=0;return;}if(result.status===0||result.status===429||result.status>=500){const delay=retryDelay(this.failures++,result.retryAfterMs);if(!this.stopped)this.timer=setTimeout(()=>void this.flush(ref),delay);}}finally{this.running=false;}
  }
  stop():void{this.stopped=true;if(this.timer)clearTimeout(this.timer);this.timer=null;}
}
