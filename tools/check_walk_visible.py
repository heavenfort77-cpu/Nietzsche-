# Session 44 fault check (owner 25 Nov 13:49: the near rack's white coat in the wings hid his path). Data only, no browser.
# Usage: python3 -I tools/check_walk_visible.py web/step0/walk/plates   (exit 1 on any FAIL)
# For each walk shot: walkable floor points inside its zone (0.1 m grid, 0.15 m in from the zone edge where he crosses into the next shot, clear of
# obstacles by the clown's radius) where the set hides his body (plate depth nearer than him) at 0.9 m or 1.2 m. Any such point is a FAIL.
import json,math,sys
bad=0
import numpy as np
from PIL import Image
D=sys.argv[1]
d=json.load(open(D+'/shots.json'));far=d['depthFar']
for name,sh in d['shots'].items():
    im=np.asarray(Image.open(D+'/'+sh['depth']).convert('RGBA')).astype(float);H,W=im.shape[:2]
    dep=(im[...,0]*256+im[...,1])/65535*far
    pos=np.array(sh['pos']);look=np.array(sh['look']);f=look-pos;f/=np.linalg.norm(f);r=np.cross(f,[0,1,0]);r/=np.linalg.norm(r);u=np.cross(r,f)
    th=math.tan(math.radians(sh['fov'])/2);asp=W/H;z=sh['zone'];tot=0;hid=[]
    for x in np.arange(z[0]+0.15,z[2]-0.15+1e-6,0.1):
      for y in np.arange(z[1]+0.15,z[3]-0.15+1e-6,0.1):
        if not any(w[0]<=x<=w[2] and w[1]<=y<=w[3] for w in d['walk']): continue
        if any(o[0]-.3<=x<=o[2]+.3 and o[1]-.3<=y<=o[3]+.3 for o in d['obstacles']): continue
        tot+=1;vis=0;n=0
        for hgt in (0.9,1.2):
          p=np.array([x,hgt,-y])-pos;zc=p@f;sx=(p@r)/(zc*th*asp);sy=(p@u)/(zc*th)
          if abs(sx)>=1 or abs(sy)>=1: continue
          n+=1;px=int((sx+1)/2*W);py=int((1-sy)/2*H)
          if dep[py,px]+0.05>=zc: vis+=1
        if n and vis<n: hid.append((round(x,1),round(y,1)))
    bad+=bool(hid)
    xs=[h[0] for h in hid];ys=[h[1] for h in hid]
    print(f"{'FAIL' if hid else 'PASS'} {name}: clown's body hidden by the set on {len(hid)} of {tot} walkable points" + (f" (x {min(xs)}..{max(xs)}, y {min(ys)}..{max(ys)})" if hid else ''))
print(f'RESULT walk visible {3-bad} of 3 shots pass')
sys.exit(1 if bad else 0)
