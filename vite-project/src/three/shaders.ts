const noise = /* glsl */ `
float hash(vec3 p){p=fract(p*0.3183099+.1);p*=17.0;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
float vnoise(vec3 x){
  vec3 i=floor(x);vec3 f=fract(x);f=f*f*(3.0-2.0*f);
  return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);
}
float fbm(vec3 p){float a=.5,s=0.;for(int i=0;i<4;i++){s+=a*vnoise(p);p=p*2.03+7.1;a*=.5;}return s;}
mat2 r2(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}
`

/* ---------- Organic Fresnel blob ---------- */
export const blobVert = /* glsl */ `
${noise}
uniform float uTime; uniform float uAmp; uniform vec2 uMouse;
varying vec3 vN; varying vec3 vView; varying float vD;
float disp(vec3 d){
  vec3 q=d*1.25+vec3(uMouse*.5,uTime*.12);
  return (fbm(q)-.35)*uAmp*2.2 + sin(d.y*3.+uTime*.6)*.03;
}
void main(){
  vec3 n0=normalize(position);
  float d=disp(n0);
  vec3 p0=n0*(1.+d);
  float e=.03;
  vec3 t1=normalize(cross(n0,vec3(0.,1.,.001)));
  vec3 t2=cross(n0,t1);
  vec3 a=normalize(n0+t1*e); vec3 b=normalize(n0+t2*e);
  vec3 pa=a*(1.+disp(a)); vec3 pb=b*(1.+disp(b));
  vec3 nn=normalize(cross(pa-p0,pb-p0));
  if(dot(nn,n0)<0.) nn=-nn;
  vN=normalize(normalMatrix*nn);
  vD=d;
  vec4 mv=modelViewMatrix*vec4(p0,1.);
  vView=-mv.xyz;
  gl_Position=projectionMatrix*mv;
}`
export const blobFrag = /* glsl */ `
uniform float uTime; uniform float uW; uniform vec3 uA; uniform vec3 uB;
varying vec3 vN; varying vec3 vView; varying float vD;
vec3 pal(float t){return .5+.5*cos(6.28318*(t+vec3(0.,.33,.67)));}
void main(){
  vec3 n=normalize(vN); vec3 v=normalize(vView);
  if(!gl_FrontFacing) n=-n;
  float f=pow(1.-abs(dot(n,v)),2.4);
  float l=dot(n,normalize(vec3(.5,.8,.6)))*.5+.5;
  vec3 base=mix(uA,uB,clamp(vD*2.4+l*.5,0.,1.));
  vec3 irid=pal(f*.7+vD*1.6+uTime*.03);
  vec3 col=base*(.1+.7*l)+irid*f*1.25+f*f*f*vec3(1.);
  float a=(.12+f*.95)*uW;
  gl_FragColor=vec4(col,a);
}`

/* ---------- Scroll-choreographed particle field ---------- */
export const dustVert = /* glsl */ `
${noise}
attribute vec3 aStruct; attribute vec3 aScatter; attribute vec4 aRand;
uniform float uTime; uniform float uP; uniform float uPx; uniform float uOp;
varying vec3 vC; varying float vA;
void main(){
  float p=uP;
  float conv=smoothstep(0.,.3,p);
  float c=clamp(conv*1.5-aRand.x*.5,0.,1.); c=c*c*(3.-2.*c);
  vec3 pos=mix(aScatter,aStruct,c);
  vec3 q=pos*.25+uTime*.08;
  vec3 fl=vec3(vnoise(q),vnoise(q+9.3),vnoise(q+19.7))-.5;
  pos+=fl*(2.2*(1.-c)+.12*c);
  pos.xz=r2(uTime*.12*c)*pos.xz;
  float def=smoothstep(.45,.72,p);
  vec3 f2=vec3(fbm(pos*.55+uTime*.15),fbm(pos*.55+11.),fbm(pos*.55+23.))-.5;
  pos+=f2*def*3.4;
  pos.xz=r2(def*pos.y*.7)*pos.xz;
  vec3 dir=normalize(aStruct+(aRand.yzw-.5)*1.6+.001);
  float fr=smoothstep(.7,.88,p);
  pos+=dir*fr*aRand.y*6.;
  float ds=smoothstep(.86,1.,p);
  pos+=dir*ds*(8.+aRand.z*14.);
  vec4 mv=modelViewMatrix*vec4(pos,1.);
  gl_Position=projectionMatrix*mv;
  gl_PointSize=uPx*(.8+aRand.w*1.8)*(18./-mv.z);
  vec3 cool=vec3(.42,.62,1.),warm=vec3(1.,.52,.38);
  vC=mix(cool,warm,clamp(aRand.w*.6+def*.35+fr*.4,0.,1.));
  vA=uOp*(1.-ds)*(.4+.6*aRand.w);
}`
export const dustFrag = /* glsl */ `
varying vec3 vC; varying float vA;
void main(){
  float d=length(gl_PointCoord-.5);
  float a=smoothstep(.5,0.,d); a*=a;
  gl_FragColor=vec4(vC,a*vA);
}`

/* ---------- Instanced shards ---------- */
export const shardVert = /* glsl */ `
attribute float aSeed; uniform float uTime;
varying vec3 vN; varying vec3 vV; varying float vS;
void main(){
  vec4 lp=instanceMatrix*vec4(position,1.);
  float w=sin(uTime*.6+aSeed*40.+lp.x*.5)*.18;
  lp.xyz+=normalize(lp.xyz+.001)*w;
  vec4 mv=modelViewMatrix*lp;
  vN=normalize(mat3(modelViewMatrix)*mat3(instanceMatrix)*normal);
  vV=-mv.xyz; vS=aSeed;
  gl_Position=projectionMatrix*mv;
}`
export const shardFrag = /* glsl */ `
uniform float uW; varying vec3 vN; varying vec3 vV; varying float vS;
void main(){
  float f=pow(1.-abs(dot(normalize(vN),normalize(vV))),1.6);
  vec3 col=mix(vec3(.4,.6,1.),vec3(1.,.55,.4),vS)*(.35+f*1.4);
  gl_FragColor=vec4(col,(.22+.78*f)*uW);
}`

/* ---------- Flowing curve bundle ---------- */
export const weaveVert = /* glsl */ `
${noise}
attribute float aT; attribute float aSeed; uniform float uTime; uniform float uW;
varying float vA; varying float vS;
void main(){
  float a=aT*9.42+aSeed*6.2832+uTime*.12;
  float r=2.2+aSeed*2.8+sin(aT*9.+aSeed*20.+uTime*.4)*.35;
  vec3 p=vec3(cos(a)*r,(aT-.5)*9.+sin(a*2.+aSeed*10.)*.6,sin(a)*r*.6);
  p+=(vec3(vnoise(p*.4+uTime*.1),vnoise(p*.4+5.),vnoise(p*.4+9.))-.5)*1.1;
  vA=sin(aT*3.14159)*uW; vS=aSeed;
  gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);
}`
export const weaveFrag = /* glsl */ `
varying float vA; varying float vS;
void main(){ gl_FragColor=vec4(mix(vec3(.45,.65,1.),vec3(1.,.6,.45),vS),vA*.55); }`

/* ---------- Interface panels ---------- */
export const panelVert = /* glsl */ `
varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`
export const panelFrag = /* glsl */ `
${noise}
uniform float uTime; uniform float uW; uniform float uI; uniform float uSeed; varying vec2 vUv;
void main(){
  vec2 g=abs(fract(vUv*vec2(12.,8.))-.5);
  float l=smoothstep(.46,.5,max(g.x,g.y));
  vec2 e=min(vUv,1.-vUv);
  float b=1.-smoothstep(0.,.012,min(e.x,e.y));
  float sc=exp(-pow((vUv.y-fract(uTime*.15+uSeed))*8.,2.));
  float n=vnoise(vec3(vUv*6.,uTime*.3+uSeed))*.08;
  vec3 col=mix(vec3(.4,.6,1.),vec3(1.,.55,.45),vUv.x);
  float a=(.05+n+l*.1+b*.8+sc*.25)*uW*(.5+.5*uI);
  gl_FragColor=vec4(col,a);
}`