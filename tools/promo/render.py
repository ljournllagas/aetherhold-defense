"""Render the promo from real app captures and registered release art; no external media."""
from pathlib import Path
from functools import lru_cache
import argparse, json, math, re, subprocess, wave
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageEnhance, ImageOps
import imageio_ffmpeg

ROOT = Path.cwd() / 'artifacts/promo'
PUBLIC = ROOT / 'source/public'
CAP = ROOT / 'captures'
OUT = ROOT / 'output'
OUT.mkdir(exist_ok=True)
M = json.loads((ROOT/'metadata.json').read_text())
ART = {a['id']: a for a in M['art']}
ENEMIES = {a['id']: a for a in M['enemies']}
FF = imageio_ffmpeg.get_ffmpeg_exe()
W,H,FPS = 1920,1080,24
GOLD = '#efd28c'
WHITE = '#f4f1e9'
TEAL = '#7ee0d2'
MUTED = '#b5c3c7'
BG = '#080e14'
COLORS = ['#aac982','#f0a66d','#a5e2f1','#a8d58e','#7adbd6','#e4aa7e','#9bdbff','#d4a3ef','#eba2f2','#ffe1a0']

@lru_cache(maxsize=120)
def font(size,serif=False):
    return ImageFont.truetype('C:/Windows/Fonts/georgiab.ttf' if serif else 'C:/Windows/Fonts/bahnschrift.ttf',size)

@lru_cache(maxsize=240)
def img(path):
    return Image.open(path).convert('RGBA')

def asset(key):
    return img(str(PUBLIC / ART[key]['path'].lstrip('/')))

def fit(im,box):
    return ImageOps.contain(im,box,Image.Resampling.LANCZOS)

def cover(im,box):
    return ImageOps.fit(im,box,Image.Resampling.BICUBIC)

@lru_cache(maxsize=360)
def thumb(key,w,h):
    return cover(asset(key),(w,h))

def text(im,xy,s,size=32,color=WHITE,serif=False,anchor=None):
    ImageDraw.Draw(im).text(xy,s,font=font(size,serif),fill=color,anchor=anchor,stroke_width=0)

def fitted_text(im,xy,s,size=70,maxwidth=1700,color=WHITE,serif=True):
    while font(size,serif).getlength(s)>maxwidth and size>20:size-=1
    text(im,xy,s,size,color,serif)

def lines(im,xy,s,size=34,maxwidth=650,color=MUTED,gap=12):
    x,y=xy;line=''
    for word in s.split():
        if line and font(size).getlength(line+' '+word)>maxwidth:
            text(im,(x,y),line,size,color);y+=size+gap;line=word
        else:line=(line+' '+word).strip()
    if line:text(im,(x,y),line,size,color)
    return y+size+gap

def paste(im,source,xy):
    im.paste(source,tuple(map(int,xy)),source if source.mode=='RGBA' else None)

def panel(im,box,color=GOLD):
    d=ImageDraw.Draw(im);d.rectangle(box,fill='#101c24',outline=color,width=2)

def art_sprite(key,t,box,cycle=True):
    a=ART[key];sheet=asset(key)
    if a['kind']=='sheet':
        states=list(a['states'].items());state,definition=states[min(int(t/0.8)%len(states),len(states)-1)] if cycle else states[1]
        frame=int(t*8)%definition['frames'];fw,fh=a['frameWidth'],a['frameHeight']
        sheet=sheet.crop((frame*fw,definition['row']*fh,(frame+1)*fw,(definition['row']+1)*fh))
    bounds=sheet.getchannel('A').getbbox()
    if bounds:sheet=sheet.crop(bounds)
    return fit(sheet,box)

def base(t,accent=GOLD):
    im=Image.new('RGB',(W,H),BG);d=ImageDraw.Draw(im)
    for x in range(-500,W,140):
        shift=(t*15)%140;d.line((x+shift,0,x+shift+600,H),fill='#101b24',width=1)
    d.line((60,48,W-60,48),fill=accent,width=2)
    for i in range(35):
        x=(i*137+math.sin(i*9)*160)%W;y=(i*97-t*(12+i%7))%H
        d.ellipse((x,y,x+2,y+2),fill='#6d6650')
    text(im,(60,H-45),'AEGIS OF THE BORDERKEEP',19,MUTED)
    text(im,(W-60,H-45),'AETHERHOLD DEFENSE',19,MUTED,anchor='ra')
    return im

def label(im,s,accent=GOLD):text(im,(60,72),s,25,accent)

def screen(im,frame,box,accent=GOLD):
    x,y,w,h=box
    panel(im,(x-2,y-2,x+w+2,y+h+2),accent)
    paste(im,cover(frame,(w,h)),(x,y))

def background(im,source,t,duration,dark=.55):
    z=1.035+0.035*t/duration
    full=cover(source,(int(W*z),int(H*z)))
    full=full.crop((int((full.width-W)*(0.3+0.3*t/duration)),int((full.height-H)*.5),int((full.width-W)*(0.3+0.3*t/duration))+W,int((full.height-H)*.5)+H))
    im.paste(ImageEnhance.Brightness(full.convert('RGB')).enhance(dark),(0,0))

T=[]
def add(kind,duration,**data):T.append({'kind':kind,'duration':duration,**data})
add('hero',5,title='Aegis of the Borderkeep',subtitle='The Gloomtide is coming.')
add('feature',3,clip='placement',title='BUILD.',subtitle='Pick a tower. Place your defence.',kicker='ONE SIMPLE MOVE')
add('feature',3,clip='normal',title='BATTLE.',subtitle='Let your towers do the talking.',kicker='WATCH THE CHAIN REACTION')
add('feature',3,clip='upgrade-action',title='UPGRADE.',subtitle='A little stronger. One more wave.',kicker='THE LOOP THAT PULLS YOU BACK')
add('classic',5,clip='heavy',title='Classic Siege',subtitle='30 waves. Three difficulties. One stronghold.',kicker='HOLD THE LINE')
add('feature',3,clip='classic-boss',title='BREAK THE SIEGE.',subtitle='Face the Gloomtide, elites and Siege bosses.',kicker='THE STRONGHOLD IS COUNTING ON YOU')
add('classic-roster',3,title='Meet the Gloomtide.',subtitle='Fast. Armored. Warded. Elite. Build to counter the threat.')
add('towers',7,title='Five towers. Your strategy.',subtitle='Physical · Splash · Slow · Arcane · Chain lightning')
add('evolution',5,clip='evolution',title='Choose your evolution.',subtitle='Ten branches. Permanent unlocks. Your own build.',kicker='CLASSIC PROGRESSION')
add('feature',3,still='evolutions-art',title='TEN PATHS TO POWER.',subtitle='Branch crests and rank upgrades make every evolved tower your own.',kicker='THE EVOLUTION COLLECTION')
add('feature',3,clip='mastery',title='KEEP GOING.',subtitle='Survive the Siege. Push into Endless. Build Mastery.',kicker='THE NEXT WAVE IS WAITING')
add('relics',7,title='Turn the tide.',subtitle='Ten Relics. Four rarities. One perfectly timed play.')
add('feature',3,clip='reward',title='KEEP IT. CAST IT.',subtitle='Store three Relics. Aim a Meteor. Freeze time. Change the fight.',kicker='YOUR NEXT GREAT MOMENT')
add('campaign',4,clip='campaign-map',title='100 LEVELS.',subtitle='Ten worlds. Three stars per mission. A journey worth mastering.')
for world in M['worlds']:add('world',4,clip='world-'+world['id'],world=world,title=world['name'])
for world in M['worlds']:add('boss',2,clip='boss-'+world['id'],world=world,title=ENEMIES[world['bossEnemyId']]['name'])
add('feature',4,clip='boss-aether_crown',title='THE FINAL STAND.',subtitle='Read the phases. Break the resistance. Expose the core.',kicker='LEVEL 100 · AETHER DEVOURER')
add('feature',4,still='preparation',title='MAKE IT YOURS.',subtitle='Targeting choices. Saved presets. Pre-battle preparation.',kicker='PLAN YOUR NEXT VICTORY')
add('specializations',5,title='Ten specializations.',subtitle='Choose the tradeoff that fits your defence.')
add('feature',4,clip='campaign-result',title='EARN EVERY STAR.',subtitle='Clear the mission. Protect your lives. Beat the mastery target.',kicker='SCORE · MASTERY · WORLD SIGILS')
add('feature',3,still='codex',title='KNOW YOUR ENEMY.',subtitle='Aether Codex tactics, enemy stats and boss guidance.',kicker='READ THE THREAT')
add('feature',3,clip='progression',title='A LITTLE MORE.',subtitle='Unlock art tiers, rerolls, achievements, banners and crests.',kicker='EVERY CLEAR MOVES YOU FORWARD')
add('feature',3,clip='leaderboard',title='LEAVE YOUR MARK.',subtitle='Separate Classic and Campaign public rankings.',kicker='HALL OF LEGENDS')
add('feature',3,clip='auto',title='YOUR PACE.',subtitle='Auto waves and situational Relics. Speed up. Pause. Take control.',kicker='SIMPLE TO PICK UP')
add('feature',3,still='settings',title='SETTLE IN.',subtitle='Tune music and effects. Set your preferred pace.',kicker='WARDEN SETTINGS')
add('feature',3,still='help',title='PICK IT UP. PLAY.',subtitle='Helpful hints. Clear controls. Build, upgrade and sell with confidence.',kicker='HOW TO PLAY')
add('phone',4,title='Tap. Drag. Defend.',subtitle='Play in your browser. Guest saves, or Google sync across devices.')
add('hero',6,title='Just one more wave.',subtitle='Play Aegis of the Borderkeep today.',end=True)
DURATION=sum(s['duration'] for s in T)

MECHANICS=['Wards. Summons. A late surge.','Shatter the armor. Reveal the core.','Watch the telegraph. Avoid the freeze.','Regeneration. Brood calls. Relentless pressure.','Physical. Arcane. Elemental. Shifting resistance.','Break the plates. Finish the exposed core.','A storm warning. A devastating surge.','Read the echoes. Track the true Regent.','Cover the bend. Watch the portal jump.','Four phases. One final opening.']
ROLES=['Arrows','Splash','Slow','Arcane','Lightning']

def draw_scene(s,t,frame=None):
    kind=s['kind'];duration=s['duration'];im=base(t)
    enter=1-(1-min(t/.4,1))**3;offset=int((1-enter)*32)
    if kind=='hero':
        background(im,img(str(PUBLIC/'assets/world/vistas/ancient-border-keep-vista-menu-v2.webp')),t,duration,.48)
        emblem=fit(img(str(PUBLIC/'assets/branding/aegis-emblem-v1.webp')),(260,260))
        paste(im,emblem,((W-emblem.width)/2,115+offset))
        text(im,(W/2,435+offset),'AEGIS OF THE',65,GOLD,True,'mm')
        text(im,(W/2,540+offset),'BORDERKEEP',117,WHITE,True,'mm')
        ImageDraw.Draw(im).line((530,635,1390,635),fill=GOLD,width=2)
        text(im,(W/2,700),s['title'] if s.get('end') else s['subtitle'],52,WHITE,False,'mm')
        text(im,(W/2,795),'CLASSIC SIEGE  /  100-LEVEL CAMPAIGN',28,GOLD,False,'mm')
        if s.get('end'):
            panel(im,(480,865,1440,950),GOLD)
            text(im,(960,905),'aetherhold-defense.ljournllagas.workers.dev',31,WHITE,False,'mm')
        else:text(im,(W/2,864),'BUILD. BATTLE. UPGRADE. REPEAT.',27,MUTED,False,'mm')
    elif kind in ('feature','classic','evolution','campaign'):
        label(im,s.get('kicker','THE CAMPAIGN · TEN WORLDS'))
        if kind=='campaign':
            text(im,(60,155+offset),str(min(100,int(100*min(t/.85,1)))),212,GOLD)
            text(im,(65,410),'LEVELS.',74,WHITE,True)
            lines(im,(67,530),s['subtitle'],40,635)
            text(im,(65,735),'300 mastery stars',34,TEAL)
            text(im,(65,795),'10 World Sigils',34,TEAL)
            if frame:screen(im,frame,(800,236,1060,596))
        else:
            fitted_text(im,(60,123+offset),s['title'],82,1780)
            if frame:screen(im,frame,(60,270,1328,747))
            y=lines(im,(1440,310),s['subtitle'],37,400)
            if kind=='classic':
                for i,a in enumerate(['EASY','MEDIUM','HARD']):
                    helm=fit(img(str(PUBLIC/f'assets/ui/difficulty-helm-{a.lower()}-v1.webp')),(108,108));paste(im,helm,(1435,y+50+i*150));text(im,(1570,y+84+i*150),a,28,GOLD)
            elif kind=='evolution':
                for tower_i,tower in enumerate(M['towers']):
                    pair=[e['name'] for e in M['evolutions'] if e['towerId']==tower['id']]
                    y=lines(im,(1440,y+22),' / '.join(pair),25,400,GOLD,8)
            elif s['title'] in ('BUILD.','BATTLE.','UPGRADE.'):
                text(im,(1440,min(y+120,915)),'BUILD → BATTLE',24,GOLD)
                text(im,(1440,min(y+160,955)),'UPGRADE → REPEAT',24,TEAL)
    elif kind=='towers':
        label(im,'FIVE FAMILIES · EVERY ART TIER')
        fitted_text(im,(60,125+offset),s['title'],74)
        text(im,(60,240),s['subtitle'],33,MUTED)
        phase=min(int(t/(duration/6)),5)
        for i,tower in enumerate(M['towers']):
            x=80+i*370;accent=COLORS[i];panel(im,(x,340,x+325,955),accent)
            if phase<4:
                if tower['id']=='ember' and phase<3:
                    sprite=img(str(PUBLIC/f'assets/towers/tower_bombard_stage{phase+1}-v2.webp'))
                else:
                    spec=next(a for a in M['classicAssets']['gameplay'] if a['key']==tower['assetKey'])
                    sheet=img(str(PUBLIC/spec['path'].lstrip('/')));sprite=sheet.crop(((phase%2)*627,(phase//2)*627,(phase%2+1)*627,(phase//2+1)*627))
                bounds=sprite.getchannel('A').getbbox()
                if bounds:sprite=sprite.crop(bounds)
                sprite=fit(sprite,(270,390))
            else:sprite=art_sprite(f"tower:{tower['id']}:tier{phase-2}",t,(270,390))
            paste(im,sprite,(x+(325-sprite.width)/2,740-sprite.height))
            text(im,(x+162,805),tower['name'],40,WHITE,True,'mm')
            text(im,(x+162,870),ROLES[i],27,accent,False,'mm')
        text(im,(960,985),f"CLASSIC FOUNDATION {phase+1}" if phase<4 else ['REINFORCED · CAMPAIGN TIER II','RUNIC MASTERWORK · CAMPAIGN TIER III'][phase-4],26,GOLD,False,'mm')
    elif kind=='relics':
        label(im,'POWER-UPS · CHOOSE THE MOMENT')
        fitted_text(im,(60,123+offset),s['title'],86)
        text(im,(60,235),s['subtitle'],35,MUTED)
        coords=[(24,28,365,357),(414,28,366,357),(810,28,363,357),(1197,28,366,357),(1595,28,364,357),(24,403,364,357),(414,403,366,359),(810,403,365,359),(1197,403,365,359),(1594,403,365,359)]
        sheet=img(str(PUBLIC/'assets/powerups/relic-icons-atlas-v1.webp'))
        for i,p in enumerate(M['powerups']):
            x=100+(i%5)*370;y=335+(i//5)*325
            a,b,w,h=coords[i];sprite=fit(sheet.crop((a,b,a+w,b+h)),(210,210))
            bob=math.sin(t*3+i)*8;paste(im,sprite,(x+50,y+bob))
            fitted_text(im,(x,y+226),p['name'],28,310,WHITE,False)
            text(im,(x,y+270),p['rarity'].upper(),21,GOLD)
    elif kind=='classic-roster':
        label(im,'THE CLASSIC BESTIARY · ORIGINAL ANIMATED ART')
        fitted_text(im,(60,123+offset),s['title'],80)
        text(im,(60,240),s['subtitle'],33,MUTED)
        manifest=json.loads((ROOT/'source/src/game/art/enemyAtlasFrames.json').read_text())
        roster=list(manifest['enemies'].items())
        for i,(eid,spec) in enumerate(roster):
            cols=5;x=135+(i%cols)*360;y=555+(i//cols)*375
            f=spec['rightFrames'][int(t*7)%len(spec['rightFrames'])]
            source=img(str(PUBLIC/('assets/enemies/'+spec['atlas']+'.png')))
            sprite=fit(source.crop((f['x'],f['y'],f['x']+f['width'],f['y']+f['height'])),(200,235))
            paste(im,sprite,(x+(240-sprite.width)/2,y-sprite.height))
            fitted_text(im,(x,y+24),eid.replace('_',' ').title(),27,300,GOLD,False)
    elif kind=='world':
        world=s['world'];wi=world['worldNumber']-1;accent=COLORS[wi]
        label(im,f"WORLD {world['worldNumber']:02} / 10    ·    LEVELS {world['levelStart']}–{world['levelEnd']}",accent)
        fitted_text(im,(60,120+offset),world['name'],74)
        if frame:screen(im,frame,(60,230,1168,657),accent)
        for j,family in enumerate('abcd'):
            x=1285+(j%2)*280;y=230+(j//2)*186
            panel(im,(x-1,y-1,x+259,y+147),accent)
            paste(im,thumb('map:'+world['id']+':'+family,258,146),(x,y))
            text(im,(x,y+155),'BATTLEFIELD '+family.upper(),18,accent)
        paste(im,thumb('world-panel:'+world['id'],535,265),(1285,628))
        ids=list(dict.fromkeys(e for l in M['levels'] if l['worldId']==world['id'] for e in l['enemyIds']))
        for j,eid in enumerate(ids):
            x=80+j*360;sprite=art_sprite('enemy:'+eid,t,(110,120));paste(im,sprite,(x+(110-sprite.width)/2,1010-sprite.height))
            fitted_text(im,(x+120,953),ENEMIES[eid]['name'],25,220,WHITE,False)
    elif kind=='boss':
        world=s['world'];wi=world['worldNumber']-1;accent=COLORS[wi]
        background(im,asset('world-panel:'+world['id']),t,duration,.27)
        label(im,f"BOSS {world['worldNumber']:02} / 10    ·    LEVEL {world['bossLevel']}",accent)
        fitted_text(im,(60,140+offset),s['title'],80,1780,WHITE)
        sprite=art_sprite('boss:'+world['bossEnemyId'],t,(540,600))
        paste(im,sprite,(60+(580-sprite.width)/2,860-sprite.height))
        if frame:screen(im,frame,(700,290,1160,653),accent)
        lines(im,(65,910),MECHANICS[wi],29,550,accent,8)
    elif kind=='specializations':
        label(im,'CAMPAIGN SIDEGRADES · BUILD YOUR WAY')
        fitted_text(im,(60,125+offset),s['title'],78)
        text(im,(60,240),s['subtitle'],34,MUTED)
        for i,tower in enumerate(M['towers']):
            x=80+i*370;sprite=art_sprite('tower:'+tower['id']+':tier3',t,(250,330));paste(im,sprite,(x+(325-sprite.width)/2,690-sprite.height))
            text(im,(x+160,750),tower['name'],35,WHITE,True,'mm')
            y=815
            for spec in M['specializations']:
                if spec['towerId']==tower['id']:y=lines(im,(x,y),spec['name'],27,325,GOLD,8)+16
    elif kind=='phone':
        label(im,'YOUR GAME · WHEREVER YOU PLAY')
        fitted_text(im,(60,200+offset),s['title'],90,1100)
        lines(im,(65,390),s['subtitle'],43,1000)
        text(im,(65,635),'Guest play · Saved progress · Google sync',31,TEAL)
        text(im,(65,710),'Pan · Pinch to zoom · Keyboard controls',31,GOLD)
        phone=fit(img(str(CAP/'phone-menu.png')),(440,840))
        panel(im,(1280,135,1280+phone.width+24,135+phone.height+24),GOLD);paste(im,phone,(1292,147))
    if t<.18:
        # A brief diagonal gold wipe connects the typography and gameplay cuts.
        d=ImageDraw.Draw(im);x=int(W*(1-t/.18));d.polygon([(x,0),(x+50,0),(x-200,H),(x-250,H)],fill=GOLD)
    return im

def clip_frame(name,t):
    file=CAP/(name+'.webm')
    result=subprocess.run([FF,'-loglevel','error','-ss',str(max(0,t)),'-i',str(file),'-frames:v','1','-f','image2pipe','-vcodec','png','-'],capture_output=True,check=True)
    import io
    return Image.open(io.BytesIO(result.stdout)).convert('RGB')

def get_still(name):return img(str(CAP/(name+'.png'))).convert('RGB')

def soundtrack():
    sr=48000;n=int(DURATION*sr);audio=np.zeros((n,2),dtype=np.float32);rng=np.random.default_rng(19)
    def add_sound(start,sound,level=1,pan=.5):
        i=int(start*sr);sound=np.asarray(sound,dtype=np.float32);end=min(n,i+len(sound))
        if end<=i:return
        sound=sound[:end-i]*level;audio[i:end,0]+=sound*math.sqrt(1-pan);audio[i:end,1]+=sound*math.sqrt(pan)
    def tone(freq,length):
        tt=np.arange(int(length*sr))/sr;return sum(np.sin(2*np.pi*freq*h*tt)/h**1.5 for h in range(1,5)),tt
    chords=[[110,130.81,164.81],[87.31,110,130.81],[130.81,164.81,196],[98,123.47,146.83]]
    for bar,start in enumerate(np.arange(0,DURATION,2)):
        chord=chords[(bar//2)%4]
        intensity=.35 if start<5 else .72 if start<33 else 1 if start<110 else .8
        for j,freq in enumerate(chord):
            sound,tt=tone(freq*2,2.5);env=np.minimum(tt/.3,1)*np.minimum((2.5-tt)/.65,1)
            add_sound(start,sound*env,.038*intensity,.2+j*.3)
        for k in range(8):
            sound,tt=tone(chord[k%3]*4,1);env=(1-np.exp(-tt*80))*np.exp(-tt*7)
            add_sound(start+k*.25,sound*env,.05*intensity,.25+.5*(k%2))
        sound,tt=tone(chord[0]/2,2);add_sound(start,sound*np.minimum(tt/.03,1)*np.minimum((2-tt)/.2,1),.13*intensity)
    for beat,start in enumerate(np.arange(0,DURATION,.5)):
        if start<4:continue
        tt=np.arange(int(.35*sr))/sr;phase=2*np.pi*(42*tt+95*.032*(1-np.exp(-tt/.032)))
        kick=np.sin(phase)*np.exp(-tt*13);add_sound(start,kick,.38)
        if beat%2:
            tt=np.arange(int(.22*sr))/sr;noise=rng.normal(0,.4,len(tt));snare=(noise+np.sin(2*np.pi*180*tt)*.18)*np.exp(-tt*20)
            add_sound(start,snare,.18)
        for sub in [0,.25]:
            tt=np.arange(int(.09*sr))/sr;noise=rng.normal(0,.4,len(tt));noise=np.diff(noise,prepend=0)
            add_sound(start+sub,noise*np.exp(-tt*55),.037,.7)
    cursor=0
    for s in T:
        tt=np.arange(int(.7*sr))/sr
        impact=np.sin(2*np.pi*(50*tt+80*.04*(1-np.exp(-tt/.04))))*np.exp(-tt*7)
        add_sound(cursor,impact,.35)
        whoosh=rng.normal(0,.25,len(tt))*np.sin(np.pi*tt/.7)**2*np.exp(-tt*3)
        add_sound(max(0,cursor-.4),whoosh,.07)
        cursor+=s['duration']
    env=np.minimum(np.arange(n)/sr/2,1)*np.minimum((DURATION-np.arange(n)/sr)/2.5,1)
    audio=np.tanh(audio*1.7)*env[:,None]
    audio*=.87/max(float(np.max(np.abs(audio))),1e-6)
    with wave.open(str(OUT/'original-score.wav'),'wb') as f:
        f.setnchannels(2);f.setsampwidth(2);f.setframerate(sr);f.writeframes((audio*32767).astype('<i2').tobytes())

def timestamp(t):
    ms=int(t*1000);return f'{ms//3600000:02}:{ms//60000%60:02}:{ms//1000%60:02},{ms%1000:03}'

def verify_sources():
    assert len(M['levels'])==100 and len(M['worlds'])==10
    for a in M['art']:assert (PUBLIC/a['path'].lstrip('/')).is_file(),a['path']
    for s in T:
        if 'clip' in s:assert (CAP/(s['clip']+'.webm')).is_file(),s['clip']
        if 'still' in s:assert (CAP/(s['still']+'.png')).is_file(),s['still']
    assert len([s for s in T if s['kind']=='world'])==10
    assert len([s for s in T if s['kind']=='boss'])==10

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--preview',action='store_true');args=parser.parse_args()
    verify_sources()
    cursor=0;subtitles=[]
    for i,s in enumerate(T):
        s['start']=cursor;subtitles.append(f"{i+1}\n{timestamp(cursor)} --> {timestamp(cursor+s['duration'])}\n{s['title']}\n{s.get('subtitle','')}\n");cursor+=s['duration']
    (OUT/'trailer.srt').write_text('\n'.join(subtitles),encoding='utf-8')
    (OUT/'timeline.json').write_text(json.dumps(T,indent=2),encoding='utf-8')
    if args.preview:
        sheets=[]
        for i,s in enumerate(T):
            fr=clip_frame(s['clip'],.7) if 'clip' in s else get_still(s['still']) if 'still' in s else None
            im=draw_scene(s,.8,fr);im.save(OUT/f'preview-{i:02}.jpg',quality=90)
            small=im.resize((480,270));ImageDraw.Draw(small).rectangle((0,245,480,270),fill='black');ImageDraw.Draw(small).text((8,248),f"{i:02} · {s['start']}s · {s['title']}",font=font(16),fill='white');sheets.append(small)
        for page in range(math.ceil(len(sheets)/12)):
            grid=Image.new('RGB',(1920,810),'black')
            for i,sm in enumerate(sheets[page*12:page*12+12]):grid.paste(sm,((i%4)*480,(i//4)*270))
            grid.save(OUT/f'contact-sheet-{page+1}.jpg',quality=93)
        print('Previewed',len(T),'scenes;',DURATION,'seconds',flush=True);return
    soundtrack()
    log=open(OUT/'encode.log','w')
    encoder=subprocess.Popen([FF,'-y','-f','rawvideo','-vcodec','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r',str(FPS),'-i','-','-i',str(OUT/'original-score.wav'),'-c:v','libx264','-preset','fast','-crf','19','-pix_fmt','yuv420p','-c:a','aac','-b:a','192k','-movflags','+faststart','-shortest',str(OUT/'aegis-of-the-borderkeep-promo.mp4')],stdin=subprocess.PIPE,stderr=log)
    for i,s in enumerate(T):
        print(f"Rendering {i+1}/{len(T)}: {s['title']}",flush=True)
        decoder=None
        if 'clip' in s:
            decoder=subprocess.Popen([FF,'-loglevel','error','-stream_loop','-1','-i',str(CAP/(s['clip']+'.webm')),'-vf',f'scale=1328:747,fps={FPS}','-f','rawvideo','-pix_fmt','rgb24','-'],stdout=subprocess.PIPE,stderr=subprocess.DEVNULL)
        still=get_still(s['still']) if 'still' in s else None
        for n in range(int(s['duration']*FPS)):
            fr=still
            if decoder:
                data=decoder.stdout.read(1328*747*3)
                if len(data)!=1328*747*3:raise RuntimeError('Truncated capture '+s['clip'])
                fr=Image.frombytes('RGB',(1328,747),data)
            rendered=draw_scene(s,n/FPS,fr)
            # Fade from and to black only at the ends; keep action cuts crisp.
            absolute=s['start']+n/FPS
            fade=min(1,absolute/.65,(DURATION-absolute)/.8)
            if fade<1:rendered=ImageEnhance.Brightness(rendered).enhance(max(0,fade))
            encoder.stdin.write(rendered.tobytes())
        if decoder:decoder.terminate();decoder.stdout.close();decoder.wait()
    encoder.stdin.close();code=encoder.wait();log.close()
    if code:raise RuntimeError('Video encoder failed; see encode.log')
    report={'seconds':DURATION,'resolution':[W,H],'fps':FPS,'scenes':len(T),'campaignLevels':len(M['levels']),'worldsFeatured':10,'campaignBossesFeatured':10,'registeredCampaignArtFeatured':len(M['art']),'soundtrack':'Original synthesized stereo score; no third-party recordings','sourceCommit':'9aed4cb','sourceBranch':'codex/campaign-v5-20261012'}
    (OUT/'verification.json').write_text(json.dumps(report,indent=2));print('Rendered',report,flush=True)

if __name__=='__main__':main()
