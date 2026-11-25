# Session 44 fault check (F49), scoped in session 45. Data only, no browser.
# Usage: python3 -I tools/check_walk_visible.py web/step0/walk/plates   (exit 1 on any FAIL)
# For each walk shot: walkable floor points inside its zone (0.1 m grid, 0.15 m in from the zone edge where he crosses into the next shot, clear of
# obstacles by the clown's radius); a point is hidden where the set hides his body (plate depth nearer than him) at 0.9 m or 1.2 m.
# Session 45 (owner 25 Nov 19:05, "Put the rack back"): the near rack in the wings hides him behind it on purpose (he walks behind it, as before
# session 44). The check now asks what the player needs: in each shot a path of visible points joins the way in (the zone's lowest walkable row,
# 0.35 m deep) to the way out (its highest walkable row, 0.35 m deep), so he can cross every shot from the corridor mouth to the ring door and back
# without the set hiding him. Hidden points are still counted and printed (INFO), so a set piece that grows over the path shows in the numbers.
import json,math,sys
from collections import deque
bad=0
import numpy as np
from PIL import Image
D=sys.argv[1]
d=json.load(open(D+'/shots.json'));far=d['depthFar']
STEP=0.1;EDGE=0.35
for name,sh in d['shots'].items():
    im=np.asarray(Image.open(D+'/'+sh['depth']).convert('RGBA')).astype(float);H,W=im.shape[:2]
    dep=(im[...,0]*256+im[...,1])/65535*far
    pos=np.array(sh['pos']);look=np.array(sh['look']);f=look-pos;f/=np.linalg.norm(f);r=np.cross(f,[0,1,0]);r/=np.linalg.norm(r);u=np.cross(r,f)
    th=math.tan(math.radians(sh['fov'])/2);asp=W/H;z=sh['zone'];tot=0;hid=[];seen={}
    xs0=np.arange(z[0]+0.15,z[2]-0.15+1e-6,STEP);ys0=np.arange(z[1]+0.15,z[3]-0.15+1e-6,STEP)
    for i,x in enumerate(xs0):
      for j,y in enumerate(ys0):
        if not any(w[0]<=x<=w[2] and w[1]<=y<=w[3] for w in d['walk']): continue
        if any(o[0]-.3<=x<=o[2]+.3 and o[1]-.3<=y<=o[3]+.3 for o in d['obstacles']): continue
        tot+=1;vis=0;n=0
        for hgt in (0.9,1.2):
          p=np.array([x,hgt,-y])-pos;zc=p@f;sx=(p@r)/(zc*th*asp);sy=(p@u)/(zc*th)
          if abs(sx)>=1 or abs(sy)>=1: continue
          n+=1;px=int((sx+1)/2*W);py=int((1-sy)/2*H)
          if dep[py,px]+0.05>=zc: vis+=1
        ok=bool(n) and vis==n
        if n and vis<n: hid.append((round(x,1),round(y,1)))
        seen[(i,j)]=(ok,y)
    ys=[v[1] for v in seen.values()];lo=min(ys);hi=max(ys)
    start=[k for k,v in seen.items() if v[0] and v[1]<=lo+EDGE];goal={k for k,v in seen.items() if v[0] and v[1]>=hi-EDGE}
    q=deque(start);got=set(start);reach=False
    while q:
      c=q.popleft()
      if c in goal: reach=True;break
      for dx,dy in ((1,0),(-1,0),(0,1),(0,-1)):
        k=(c[0]+dx,c[1]+dy)
        if k in seen and seen[k][0] and k not in got: got.add(k);q.append(k)
    bad+=not reach
    hx=[h[0] for h in hid];hy=[h[1] for h in hid]
    print(f"{'PASS' if reach else 'FAIL'} {name}: a visible path joins the way in (y {lo:.1f}) to the way out (y {hi:.1f})"
          f" | INFO hidden {len(hid)} of {tot} walkable points" + (f" (x {min(hx)}..{max(hx)}, y {min(hy)}..{max(hy)})" if hid else ''))
print(f'RESULT walk visible {3-bad} of 3 shots pass')
sys.exit(1 if bad else 0)
