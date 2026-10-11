import { expect, it } from 'vitest';
import { Miniflare, convertV4MiniflareOptions } from 'miniflare';
import first from '../migrations/0001_initial.sql?raw';
import second from '../migrations/0002_run_version.sql?raw';
import third from '../migrations/0003_score_constraints.sql?raw';
import fourth from '../migrations/0004_progression_results.sql?raw';
import fifth from '../migrations/0005_player_accounts.sql?raw';
it('preserves anonymous scores, cascades owned data and rolls back batches',async()=>{
  const mf=new Miniflare(convertV4MiniflareOptions({modules:true,script:'export default {fetch(){return new Response("ok")}}',d1Databases:['DB'],compatibilityDate:'2024-11-01'}));
  try {
    const db=await mf.getD1Database('DB');
    for(const sql of [first,second,third,fourth]) for(const s of sql.replace(/^--.*$/gm,'').split(';').filter(x=>x.trim())) await db.prepare(s).run();
    await db.prepare("INSERT INTO scores(player_name,difficulty,highest_wave,final_score,run_id,game_version,score_version) VALUES('Old','easy',1,100,'legacy-123','0.3.0',3)").run();
    for(const s of fifth.split(';').filter(x=>x.trim())) await db.prepare(s).run();
    expect(await db.prepare("SELECT player_name,final_score,player_id FROM scores WHERE run_id='legacy-123'").first()).toMatchObject({player_name:'Old',final_score:100,player_id:null});
    await db.prepare("INSERT INTO players(id,generation,issuer,subject,nickname,progress_json) VALUES('a','g','google','sub','Warden','{}')").run();
    await db.prepare("INSERT INTO sessions(token_hash,player_id,generation,expires_at,csrf) VALUES('hash','a','g',9999999,'csrf')").run();
    await expect(db.batch([db.prepare("UPDATE players SET nickname='Changed' WHERE id='a'"),db.prepare("INSERT INTO sessions(token_hash,player_id,generation,expires_at,csrf) VALUES('hash','a','g',1,'csrf')")])).rejects.toThrow();
    expect((await db.prepare("SELECT nickname FROM players WHERE id='a'").first())?.nickname).toBe('Warden');
    await db.prepare("DELETE FROM players WHERE id='a'").run();
    expect((await db.prepare('SELECT COUNT(*) AS n FROM sessions').first())?.n).toBe(0);
    expect((await db.prepare('SELECT COUNT(*) AS n FROM scores').first())?.n).toBe(1);
  } finally {await mf.dispose();}
},15000);
