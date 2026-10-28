const smooth = (t: number) => { const x=Math.max(0,Math.min(1,t)); return x*x*(3-2*x); };
const phase=(t:number,a:number,b:number)=>smooth((t-a)/(b-a));
export function discoveryPose(seconds:number) {
 const t=Math.max(0,Math.min(13.3,seconds));
 const reach=(.13*phase(t,1.6,2.8)+.87*phase(t,3.4,7.2))*(1-phase(t,9.5,12.7));
 return {camera:phase(t,.2,8.8),reach,fingerCurl:phase(t,5.0,7.0)*(1-phase(t,9.3,12.0)),
   reveal:phase(t,2.8,5.8), touch:phase(t,6.8,7.4)*(1-phase(t,9.2,9.8))};
}
// The fingertip and gift share screen coordinates, so contact can be checked
// independently of the camera move and the hand's rotation.
export function discoveryHandGeometry(seconds:number) {
 const p=discoveryPose(seconds), x=930-390*p.reach, y=1650-490*p.reach;
 const rotation=(-15+13*p.reach)*Math.PI/180;
 const finger=(-5+26*p.fingerCurl)*Math.PI/180;
 const localX=12+120*Math.sin(finger), localY=-49-120*Math.cos(finger);
 const cam=1+.13*p.camera;
 return {x,y,rotationDegrees:-15+13*p.reach,
  tip:{x:x+localX*Math.cos(rotation)-localY*Math.sin(rotation),y:y+localX*Math.sin(rotation)+localY*Math.cos(rotation)},
  target:{x:540+(584-540)*cam,y:850+(981-850)*cam}};
}
