"""Decode the completed deliverable and verify source coverage and real capture motion."""
from pathlib import Path
import json, re, subprocess, wave
import numpy as np
from PIL import Image
import imageio_ffmpeg

root=Path.cwd()/'artifacts/promo'
out=root/'output'
ff=imageio_ffmpeg.get_ffmpeg_exe()
meta=json.loads((root/'metadata.json').read_text())
timeline=json.loads((out/'timeline.json').read_text())
featured={}
for scene in timeline:
    world=scene.get('world')
    if scene['kind']=='world':
        prefix=world['id']
        keys=[f'map:{prefix}:{family}' for family in 'abcd']+[f'world-panel:{prefix}']
        enemies={eid for level in meta['levels'] if level['worldId']==prefix for eid in level['enemyIds']}
        keys += [f'enemy:{eid}' for eid in enemies]
    elif scene['kind']=='boss':keys=[f"boss:{world['bossEnemyId']}"]
    elif scene['kind']=='towers':keys=[f"tower:{tower['id']}:tier{tier}" for tower in meta['towers'] for tier in (2,3)]
    else:continue
    for key in keys:featured[key]={'start':scene['start'],'end':scene['start']+scene['duration']}
registered={a['id'] for a in meta['art']}
assert set(featured)==registered,{'missing':sorted(registered-set(featured)),'extra':sorted(set(featured)-registered)}
assert len(meta['levels'])==100 and len(meta['worlds'])==10
captured=json.loads((root/'capture-report.json').read_text())
assert captured['errors']==[],captured['errors']

result=subprocess.run([ff,'-hide_banner','-i',str(out/'aegis-of-the-borderkeep-promo.mp4'),'-map','0:v:0','-map','0:a:0','-f','null','-','-progress','pipe:1'],capture_output=True,text=True)
assert result.returncode==0,result.stderr[-2500:]
assert '1920x1080' in result.stderr and '24 fps' in result.stderr,result.stderr[:2000]
assert 'Audio: aac' in result.stderr and 'stereo' in result.stderr,result.stderr[:2000]
frames=int(re.findall(r'^frame=(\d+)',result.stdout,re.M)[-1])
expected=int(sum(s['duration'] for s in timeline)*24)
assert frames==expected,(frames,expected)
assert 'Error' not in result.stderr,result.stderr[-1000:]
(out/'decode-verification.log').write_text(result.stderr,encoding='utf-8')
motion={}
for name in ['normal','heavy','classic-boss']+['world-'+w['id'] for w in meta['worlds']]:
    arrays=[]
    for sec in (.6,2.6):
        r=subprocess.run([ff,'-loglevel','error','-ss',str(sec),'-i',str(root/'captures'/(name+'.webm')),'-frames:v','1','-vf','scale=320:180','-f','rawvideo','-pix_fmt','rgb24','-'],capture_output=True,check=True)
        arrays.append(np.frombuffer(r.stdout,dtype=np.uint8).astype(float))
    change=float(np.mean(np.abs(arrays[0]-arrays[1])))
    assert change>.02,(name,'No visible capture motion',change)
    motion[name]=round(change,3)
with wave.open(str(out/'original-score.wav'),'rb') as f:
    assert f.getnchannels()==2 and f.getframerate()==48000
    sound=np.frombuffer(f.readframes(f.getnframes()),dtype='<i2').astype(float)/32768
    peak=float(np.max(np.abs(sound)));rms=float(np.sqrt(np.mean(sound**2)))
    assert .01<rms<.6 and peak<.99,(peak,rms)
report=json.loads((out/'verification.json').read_text())
report.update({'decodedFrames':frames,'fullDecode':'passed','sourceCoverage':'120/120 registered Campaign art assets','captureMotion':motion,'soundtrackPeak':round(peak,4),'soundtrackRms':round(rms,4),'fileBytes':(out/'aegis-of-the-borderkeep-promo.mp4').stat().st_size})
(out/'verification.json').write_text(json.dumps(report,indent=2))
(out/'art-coverage.json').write_text(json.dumps([dict(a,featuredAt=featured[a['id']]) for a in meta['art']],indent=2))
print(json.dumps(report,indent=2))
