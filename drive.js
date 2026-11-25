/* 🚗 ROADDRIVE — pseudo-3D driving: multi-storey car park + real road with Malaysian traffic lights and indicators.
   Shared by the building game (go to work) and the store game (trip to the supermarket).
   ROADDRIVE.open({el, dir:"out"|"in", dest:"🏪", destAr:"السوبرماركت", tone, onDone({stars,hits,reds,noSig})})
   dir "out": start parked on your car-park floor, drive down the ramps, out of the barrier, along the road to dest.
   dir "in" : drive the road back, through the barrier, up the ramps and park in your bay.                        */
(function(){
const LS="tower-carpark";
const FLAR=["الأرضي","الأوّل","الثاني","الثالث","الرابع","الخامس","السادس"];
const ARD=n=>String(n).replace(/[0-9]/g,d=>"٠١٢٣٤٥٦٧٨٩"[d]);
function getFloor(){try{const v=+localStorage.getItem(LS);return v>=1&&v<=6?v:5;}catch(e){return 5;}}
function setFloor(v){v=Math.max(1,Math.min(6,+v||5));try{localStorage.setItem(LS,String(v));}catch(e){}return v;}
/* floor picker html + binder, for the "your car" step of each game */
function pickerHtml(){const f=getFloor();return `<div class="cpk"><div class="cpkT">🅿️ سيّارتك في موقف السيّارات — الطابق <b id="cpkCur">${FLAR[f]}</b><small>Your car is on car-park floor ${f}. Change it:</small></div><div class="cpkB">${[1,2,3,4,5,6].map(n=>`<button data-cpk="${n}" class="${n===f?"on":""}">P${n}<small>${ARD(n)}</small></button>`).join("")}</div></div>`;}
function bindPicker(root){(root||document).querySelectorAll("[data-cpk]").forEach(b=>b.onclick=()=>{const f=setFloor(b.dataset.cpk);(root||document).querySelectorAll("[data-cpk]").forEach(x=>x.classList.toggle("on",+x.dataset.cpk===f));const c=(root||document).querySelector("#cpkCur");if(c)c.textContent=FLAR[f];});}
const css=`.cpk{background:#eceff1;border-radius:14px;padding:8px 10px;margin:8px auto;max-width:520px;text-align:center}.cpkT{font-weight:800}.cpkT small{display:block;font-weight:600;color:#607d8b;font-size:12px}
.cpkB{display:flex;gap:6px;justify-content:center;margin-top:6px;flex-wrap:wrap;direction:ltr}.cpkB button{border:0;border-radius:10px;padding:6px 12px;font-weight:900;font-size:17px;background:#fff;cursor:pointer;box-shadow:0 2px 4px #0002}.cpkB button small{display:block;font-size:11px;color:#78909c}.cpkB button.on{background:#1565c0;color:#fff}.cpkB button.on small{color:#bbdefb}
.rdw{position:relative;max-width:760px;margin:6px auto}.rdw canvas{width:100%;display:block;border-radius:16px;background:#87ceeb;touch-action:none}
.rdmsg{position:absolute;top:8px;left:50%;transform:translateX(-50%);background:#263238e6;color:#fff;border-radius:12px;padding:6px 14px;font-weight:800;text-align:center;max-width:90%;pointer-events:none;font-size:15px;line-height:1.45}.rdmsg small{display:block;color:#b2dfdb;font-weight:600;font-size:12px}
.rdctl{display:grid;grid-template-columns:repeat(6,1fr);gap:6px;margin-top:6px;direction:ltr}.rdctl button{border:0;border-radius:12px;padding:10px 4px;font-size:18px;font-weight:900;background:#fff;box-shadow:0 2px 5px #0003;cursor:pointer;touch-action:none;user-select:none}
.rdctl button small{display:block;font-size:11px;font-weight:700;color:#607d8b}.rdctl .ind.on{background:#ffb300}.rdctl .gas{background:#c8e6c9}.rdctl .brk{background:#ffcdd2}
.rdboard{position:absolute;left:50%;bottom:22%;transform:translateX(-50%);border:0;border-radius:16px;padding:12px 22px;font-size:20px;font-weight:900;background:#ffd54f;box-shadow:0 4px 14px #0006;cursor:pointer;animation:rdp 1s infinite}.rdboard small{display:block;font-size:12px;font-weight:700;color:#5d4037}@keyframes rdp{50%{transform:translateX(-50%) scale(1.06)}}
.rdkeys{text-align:center;font-size:12px;color:#607d8b;margin-top:4px}`;
let cssDone=false;function addCss(){if(cssDone)return;cssDone=true;const s=document.createElement("style");s.textContent=css;document.head.appendChild(s);}

function open(o){addCss();
  const el=o.el,tone=o.tone||(()=>{}),dir=o.dir||"out",PF=getFloor();
  el.innerHTML=`<div class="rdw"><canvas width="760" height="420"></canvas><div class="rdmsg" id="rdMsg"></div><button class="rdboard" id="rdBoard" hidden></button></div>
    <div class="rdctl"><button class="ind" data-k="il">⬅️💡<small>إشارة يسار Q</small></button><button data-k="l">⬅️<small>يسار A</small></button><button class="brk" data-k="b">🛑<small>فرامل S</small></button><button class="gas" data-k="g">⬆️<small>سِر W</small></button><button data-k="r">➡️<small>يمين D</small></button><button class="ind" data-k="ir">💡➡️<small>إشارة يمين E</small></button></div>
    <div class="rdkeys">W/⬆️ سِر · S/⬇️/مسافة فرامل · A D ⬅️➡️ غيّر المسار · Q / E الإشارات (الغمّاز)</div>`;
  const cv=el.querySelector("canvas"),g=cv.getContext("2d"),W=cv.width,H=cv.height,msgEl=el.querySelector("#rdMsg");
  /* ---------- track ---------- */
  const SEG=200,RW=2000,CAMH=1000,DEPTH=0.84,DRAW=120,LANES=[-.62,0,.62];
  const segs=[];const sprites=[];const lights=[];let zones=[];
  const add=(n,curve,theme,extra)=>{for(let i=0;i<n;i++){const s={i:segs.length,curve:curve,theme,spr:[]};if(extra)extra(s,i);segs.push(s);}};
  const level=(f,up)=>{const st=segs.length;add(6,0,"park");add(12,up?1.6:-1.6,"park");add(6,0,"park");
    segs[st].spr.push({e:"sign",txt:`P${f}`,ar:`الطابق ${FLAR[f]}`,off:-1.25});zones.push({from:st,f});for(let k=st;k<segs.length;k+=4)segs[k].spr.push({e:"pillar",off:1.3},{e:"pillar",off:-1.3});};
  let gateSeg=-1,bay=-1;
  const road=()=>{const st=segs.length;
    add(30,0,"road");add(40,.8,"road");add(30,0,"road");lightAt(segs.length-1);add(40,-1,"road");add(40,0,"road");lightAt(segs.length-1);
    add(40,.6,"road");add(30,0,"road");lightAt(segs.length-1);add(40,-.5,"road");add(25,0,"road");
    for(let k=st;k<segs.length;k++){if(k%6===0)segs[k].spr.push({e:Math.random()<.5?"🌴":"🌳",off:-1.7-Math.random()*.6});if(k%9===3)segs[k].spr.push({e:["🏢","🏬","🏠","🏪","🕌"][k%5],off:2+Math.random()*.6,s:2.4});if(k%7===2)segs[k].spr.push({e:"🌳",off:1.6+Math.random()*.3});}};
  const lightAt=k=>{const L={seg:k,st:["g","a","r"][Math.floor(Math.random()*3)],t:2+Math.random()*3,passed:false};lights.push(L);segs[k].stop=true;segs[k].spr.push({e:"light",L,off:-1.22},{e:"light",L,off:1.22});};
  /* on foot first: walk along the parked cars to your own car, get in, then drive */
  let carSeg=0;
  const walkPart=th=>{const st=segs.length;add(34,0,th,(s,i)=>{if(i%3===1){s.spr.push({e:"parked",col:["#e53935","#fdd835","#43a047","#8e24aa","#fb8c00","#90a4ae"][i%6],off:-.95});if(i!==28)s.spr.push({e:"parked",col:["#90a4ae","#e53935","#fdd835","#43a047"][i%4],off:.95});}});
    carSeg=st+28;segs[carSeg].spr.push({e:"mycar",off:.8});if(th==="park")segs[st+1].spr.push({e:"sign",txt:`P${PF}`,ar:`الطابق ${FLAR[PF]}`,off:-1.25});else segs[st+1].spr.push({e:o.from||"🏪",off:-2,s:3});zones.push({from:st,f:th==="park"?PF:0});};
  if(dir==="out"){walkPart("park");add(4,0,"park");for(let f=PF;f>=1;f--)level(f,false);add(10,0,"park");gateSeg=segs.length;add(1,0,"park",s=>s.gate=true);add(12,0,"park");road();add(10,0,"road",(s,i)=>{if(i===4)s.spr.push({e:o.dest||"🏪",off:0,s:4,dest:1});});}
  else{walkPart("lot");add(6,0,"lot");road();add(12,0,"road");gateSeg=segs.length;add(1,0,"park",s=>s.gate=true);add(10,0,"park");for(let f=1;f<=PF;f++)level(f,true);bay=segs.length+6;add(14,0,"park",(s,i)=>{if(i===6){s.spr.push({e:"bay",txt:`P${PF}`,off:0});}});}
  const N=segs.length,LEN=N*SEG;
  /* other cars */
  const cars=[];const CE=["🚗","🚙","🚕","🚐","🛻"];
  const roadSegs=segs.filter(s=>s.theme==="road").map(s=>s.i);
  for(let k=0;k<9;k++){const si=roadSegs[Math.floor(roadSegs.length*(0.08+k*0.1))];if(si==null)continue;cars.push({z:si*SEG,lane:Math.floor(Math.random()*3),sp:SEG*(9+Math.random()*5),e:CE[k%5],col:["#e53935","#1e88e5","#fdd835","#43a047","#8e24aa"][k%5]});}
  /* ---------- state ---------- */
  let phase="walk",driveStart=0,blockT=0,pos=2*SEG,speed=0,x=LANES[0],lane=0,tx=x,ind=0,indT=0,brake=false,stars=0,hits=0,reds=0,noSig=0,done=false,last=performance.now(),bump=0,gateOpen=0,msg=null,msgT=0,parked=false;
  const MAX=SEG*30;
  const keys={};const say=(a,e,ms)=>{msg=`${a}<small>${e}</small>`;msgT=performance.now()+(ms||2600);};
  const kmh=()=>Math.round(speed/MAX*90);
  const setInd=d=>{ind=ind===d?0:d;indT=0;tone(ind?900:500,.04);};
  const changeLane=d=>{if(phase!=="drive")return;const nl=Math.max(0,Math.min(2,lane+d));if(nl===lane)return;
    if(ind===d){stars++;say("✅ أحسنت! أشّرتَ قبل أن تغيّر المسار 💡","Great — you signalled first!");tone(1100,.07);}else{noSig++;say("⚠️ استعمل الإشارة قبل تغيير المسار! (Q / E)","Use your indicator before changing lanes!");tone(300,.12);}
    lane=nl;tx=LANES[lane];ind=0;};
  const KD=e=>{const t=e.target;if(t&&(t.tagName==="INPUT"||t.tagName==="TEXTAREA"))return;const c=e.code;let used=true;
    if(c==="KeyW"||c==="ArrowUp")keys.g=1;else if(c==="KeyS"||c==="ArrowDown"||c==="Space")keys.b=1;else if((c==="KeyA"||c==="ArrowLeft")&&!e.repeat)changeLane(-1);else if((c==="KeyD"||c==="ArrowRight")&&!e.repeat)changeLane(1);
    else if((c==="Enter"||c==="KeyE")&&phase!=="drive"&&!e.repeat)boardNext();else if(c==="KeyQ"&&!e.repeat)setInd(-1);else if(c==="KeyE"&&!e.repeat)setInd(1);else used=false;if(used)e.preventDefault();};
  const KU=e=>{const c=e.code;if(c==="KeyW"||c==="ArrowUp")keys.g=0;if(c==="KeyS"||c==="ArrowDown"||c==="Space")keys.b=0;};
  addEventListener("keydown",KD);addEventListener("keyup",KU);
  el.querySelectorAll(".rdctl button").forEach(b=>{const k=b.dataset.k;
    if(k==="g"||k==="b"){const on=e=>{e.preventDefault();keys[k]=1;},off=()=>{keys[k]=0;};b.addEventListener("pointerdown",on);b.addEventListener("pointerup",off);b.addEventListener("pointerleave",off);b.addEventListener("pointercancel",off);}
    else b.onclick=()=>{if(k==="l")changeLane(-1);if(k==="r")changeLane(1);if(k==="il")setInd(-1);if(k==="ir")setInd(1);};});
  const boardEl=el.querySelector("#rdBoard");let bstep=0;
  const BSTEPS=[["🚗 اركب السيّارة","Get in the car (Enter)"],["🔒 اربط حزام الأمان","Fasten your seatbelt"],["🔑 شغّل السيّارة","Start the car"]];
  function boardNext(){if(phase==="drive")return;if(phase==="walk"){if(carSeg-Math.floor(pos/SEG)>12)return;phase="board";bstep=1;tone(500,.08);tone(300,.1,.1);}
    else{bstep++;tone(bstep===1?900:700,.08);if(bstep>=BSTEPS.length){phase="drive";pos=carSeg*SEG;driveStart=pos;speed=0;x=tx=LANES[0];lane=0;boardEl.hidden=true;tone(110,.4,0,"sawtooth",.06);tone(170,.4,.3,"sawtooth",.05);say("🚗 انطلق! W للسير","Go! W to drive");return;}}
    const b=BSTEPS[bstep];boardEl.innerHTML=`${b[0]}<small>${b[1]}</small>`;boardEl.hidden=false;}
  boardEl.onclick=boardNext;
  const cleanup=()=>{done=true;removeEventListener("keydown",KD);removeEventListener("keyup",KU);};
  /* ---------- drawing helpers ---------- */
  const emo={};const twUrl=e=>{try{const ZWJ=String.fromCharCode(0x200d),VS=String.fromCharCode(0xfe0f);return `https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.1.0/assets/72x72/${twemoji.convert.toCodePoint(e.indexOf(ZWJ)<0?e.split(VS).join(""):e)}.png`;}catch(_){return null;}};
  const img=e=>{if(emo[e]!==undefined)return emo[e];emo[e]=null;const u=twUrl(e);if(u){const im=new Image();im.crossOrigin="anonymous";im.onload=()=>{emo[e]=im;};im.src=u;}return null;};
  const drawEmoji=(e,cx,by,sz)=>{const im=img(e);if(im)g.drawImage(im,cx-sz/2,by-sz,sz,sz);else{g.font=`${sz*.9}px sans-serif`;g.textAlign="center";g.textBaseline="bottom";g.fillText(e,cx,by);}};
  const quad=(c,x1,y1,w1,x2,y2,w2)=>{g.fillStyle=c;g.beginPath();g.moveTo(x1-w1,y1);g.lineTo(x2-w2,y2);g.lineTo(x2+w2,y2);g.lineTo(x1+w1,y1);g.closePath();g.fill();};
  const proj=(wx,wy,wz,cx,cy,cz)=>{const dz=wz-cz;if(dz<=1)return null;const sc=DEPTH/dz;return {x:Math.round(W/2+sc*(wx-cx)*W/2),y:Math.round(H/2-sc*(wy-cy)*H/2),w:Math.round(sc*RW*W/2),sc};};
  function drawLight(L,cx,by,sc){const h=Math.max(18,sc*4200*1.0),w=h*.34;if(h<6)return;
    g.fillStyle="#37474f";g.fillRect(cx-w*.08,by-h*1.9,w*.16,h*1.9);                    // pole
    const bx=cx-w/2,bt=by-h*1.9;g.fillStyle="#212121";g.fillRect(bx,bt,w,h);g.strokeStyle="#ffd600";g.lineWidth=Math.max(1,w*.05);g.strokeRect(bx,bt,w,h);  // yellow backboard edge, Malaysian style
    const r=w*.32,cols=[["r","#ff1744","#4a1010"],["a","#ffab00","#4a3300"],["g","#00e676","#0b3d1f"]];   // vertical: red top, amber, green bottom
    cols.forEach((c,i)=>{const on=L.st===c[0];g.fillStyle=on?c[1]:c[2];if(on){g.shadowColor=c[1];g.shadowBlur=r*1.5;}g.beginPath();g.arc(cx,bt+h*(.18+i*.32),r,0,7);g.fill();g.shadowBlur=0;});
    if(h>40){g.fillStyle="#000";g.fillRect(cx+w*.6,bt+h*.3,w*.9,h*.36);g.fillStyle=L.st==="g"?"#00e676":L.st==="a"?"#ffab00":"#ff1744";g.font=`900 ${Math.round(h*.26)}px monospace`;g.textAlign="center";g.textBaseline="middle";g.fillText(String(Math.ceil(L.t)).padStart(2,"0"),cx+w*1.05,bt+h*.48);}}
  function drawSign(s,cx,by,sc){const h=Math.max(10,sc*2600),w=h*2.4;g.fillStyle="#1565c0";g.fillRect(cx-w/2,by-h*2.2,w,h);g.fillStyle="#fff";g.font=`900 ${Math.round(h*.42)}px sans-serif`;g.textAlign="center";g.textBaseline="middle";g.fillText(s.txt,cx-w*.28,by-h*1.7);g.font=`800 ${Math.round(h*.3)}px "Noto Sans Arabic",Tahoma,sans-serif`;g.fillText(s.ar,cx+w*.15,by-h*1.7);g.fillStyle="#90a4ae";g.fillRect(cx-2,by-h*1.2,4,h*1.2);}
  function drawCar(cx,by,w,col,tail){const h=w*.62;g.fillStyle="#0005";g.fillRect(cx-w*.52,by-h*.08,w*1.04,h*.12);g.fillStyle=col;g.beginPath();g.roundRect?g.roundRect(cx-w/2,by-h,w,h*.9,w*.08):g.rect(cx-w/2,by-h,w,h*.9);g.fill();
    g.fillStyle="#263238cc";g.fillRect(cx-w*.36,by-h*.98,w*.72,h*.3);g.fillStyle=tail?"#ff1744":"#b71c1c";g.fillRect(cx-w*.46,by-h*.5,w*.16,h*.12);g.fillRect(cx+w*.3,by-h*.5,w*.16,h*.12);g.fillStyle="#111";g.fillRect(cx-w*.46,by-h*.12,w*.18,h*.14);g.fillRect(cx+w*.28,by-h*.12,w*.18,h*.14);}
  function render(){
    const base=Math.floor(pos/SEG)%N,camZ=pos-(dir==="out"?0:0);let curX=0,dx=-(segs[base].curve*((pos%SEG)/SEG));const camX=(phase==="drive"?x:0)*RW;let maxy=H;
    const th=segs[base].theme;
    // sky / ceiling
    if(th==="park"){g.fillStyle="#455a64";g.fillRect(0,0,W,H);g.fillStyle="#37474f";g.fillRect(0,0,W,H*.32);for(let i=0;i<6;i++){g.fillStyle="#fffde7";g.fillRect(W*(.1+i*.16),H*.06,W*.06,6);}}
    else{const sk=g.createLinearGradient(0,0,0,H/2);sk.addColorStop(0,"#64b5f6");sk.addColorStop(1,"#e3f2fd");g.fillStyle=sk;g.fillRect(0,0,W,H/2+2);g.fillStyle="#90a4ae";for(let i=0;i<9;i++){const bw=40+((i*37)%50),bh=40+((i*53)%90);g.fillRect(((i*97-pos*.002)%W+W)%W,H/2-bh,bw,bh);}}
    const P=[];
    for(let n=0;n<DRAW;n++){const s=segs[(base+n)%N];const z1=(base+n)*SEG,z2=z1+SEG;
      const p1=proj(-curX,0,z1,camX,CAMH,camZ),p2=proj(-curX-dx,0,z2,camX,CAMH,camZ);curX+=dx;dx+=s.curve*12;
      if(!p1||!p2||p2.y>=maxy){P.push(null);continue;}
      const alt=Math.floor((base+n)/3)%2;
      if(s.theme==="park"){g.fillStyle=alt?"#616161":"#5a5a5a";g.fillRect(0,p2.y,W,p1.y-p2.y);quad(alt?"#ffd54f":"#424242",p1.x,p1.y,p1.w*1.12,p2.x,p2.y,p2.w*1.12);quad(alt?"#757575":"#6d6d6d",p1.x,p1.y,p1.w,p2.x,p2.y,p2.w);}
      else{g.fillStyle=alt?"#66bb6a":"#5cae60";g.fillRect(0,p2.y,W,p1.y-p2.y);quad(alt?"#e53935":"#fafafa",p1.x,p1.y,p1.w*1.1,p2.x,p2.y,p2.w*1.1);quad(alt?"#5f6368":"#595d61",p1.x,p1.y,p1.w,p2.x,p2.y,p2.w);
        if(alt){[-1/3,1/3].forEach(l=>quad("#fff",p1.x+p1.w*l*2,p1.y,p1.w*.012,p2.x+p2.w*l*2,p2.y,p2.w*.012));}}
      if(s.stop){quad("#fff",p1.x,p1.y,p1.w,p2.x,p2.y+(p1.y-p2.y)*.75,p2.w);}
      if(s.gate){quad("#f9a825",p1.x,p1.y,p1.w,p2.x,p2.y,p2.w);}
      P.push({p1,p2,s});maxy=p2.y;}
    // sprites + cars, far to near
    for(let n=P.length-1;n>=0;n--){const q=P[n];if(!q)continue;const {p1,s}=q;
      s.spr.forEach(sp=>{const cx=p1.x+p1.w*sp.off,sz=Math.max(4,p1.sc*RW*W/2*(sp.s||1)*.55);
        if(sp.e==="light")drawLight(sp.L,cx,p1.y,p1.sc*W/2);else if(sp.e==="sign")drawSign(sp,cx,p1.y,p1.sc*W/2);
        else if(sp.e==="pillar"){g.fillStyle="#9e9e9e";g.fillRect(cx-sz*.12,p1.y-sz*2.2,sz*.24,sz*2.2);g.fillStyle="#ffd54f";g.fillRect(cx-sz*.12,p1.y-sz*.5,sz*.24,sz*.15);}
        else if(sp.e==="parked"||sp.e==="mycar"){const w=p1.w*.5;drawCar(cx,p1.y,w,sp.e==="mycar"?"#1565c0":sp.col,false);
          if(sp.e==="mycar"&&phase!=="drive"){const lh=Math.max(12,w*.32);g.fillStyle="#ffd54f";g.fillRect(cx-lh*2.6,p1.y-w*.62-lh*1.6,lh*5.2,lh*1.2);g.fillStyle="#3e2723";g.font=`900 ${Math.round(lh*.75)}px "Noto Sans Arabic",Tahoma,sans-serif`;g.textAlign="center";g.textBaseline="middle";g.fillText(`⬇ سيّارتك P${PF}`,cx,p1.y-w*.62-lh);}}
        else if(sp.e==="bay"){g.strokeStyle="#fff";g.lineWidth=Math.max(1,sz*.06);g.strokeRect(cx-p1.w*.4,p1.y-sz*.2,p1.w*.8,sz*.2);g.fillStyle="#1565c0";g.fillRect(cx-sz*.5,p1.y-sz*1.6,sz,sz*.7);g.fillStyle="#fff";g.font=`900 ${Math.round(sz*.4)}px sans-serif`;g.textAlign="center";g.textBaseline="middle";g.fillText("🅿️ "+sp.txt,cx,p1.y-sz*1.25);}
        else drawEmoji(sp.e,cx,p1.y,sz);});
      if(s.gate){const cx=p1.x-p1.w*.9,len=p1.w*1.8*(1-gateOpen);g.fillStyle="#455a64";g.fillRect(cx-6,p1.y-p1.w*.5,12,p1.w*.5);g.save();g.translate(cx,p1.y-p1.w*.42);g.rotate(-gateOpen*1.3);for(let k=0;k<6;k++){g.fillStyle=k%2?"#fff":"#e53935";g.fillRect(k*p1.w*.3,0,p1.w*.3,Math.max(3,p1.w*.05));}g.restore();}
      cars.forEach(c=>{const cz=c.z-pos;const si=Math.floor(c.z/SEG);if(si%N!==s.i||cz<0)return;const w=p1.w*.42;drawCar(p1.x+p1.w*LANES[c.lane]*1.0,p1.y,w,c.col,c.braking);});}
    // my car (back view)
    const cw=W*.26,cx=W/2+(x-tx)*0,by=H-12+(bump>0?Math.sin(bump*40)*4:0);if(phase==="drive")drawCar(cx,by,cw,"#1565c0",brake);
    const blink=Math.floor(performance.now()/350)%2===0;if(ind&&blink){g.fillStyle="#ffab00";g.shadowColor="#ffab00";g.shadowBlur=14;const sx=ind<0?cx-cw*.5:cx+cw*.34;g.fillRect(sx,by-cw*.62*.72,cw*.16,cw*.62*.14);g.shadowBlur=0;}
    // HUD
    g.fillStyle="#000a";g.fillRect(10,H-70,120,58);g.fillStyle="#fff";g.font="900 26px monospace";g.textAlign="left";g.textBaseline="alphabetic";g.fillText(String(kmh()).padStart(2," ")+" km/h",18,H-36);
    g.font="700 13px sans-serif";g.fillText(`⭐ ${stars}   💥 ${hits}`,18,H-18);
    const fz=zones.filter(z=>z.from<=Math.floor(pos/SEG)).pop();if(segs[base].theme==="park"&&fz){g.fillStyle="#1565c0";g.fillRect(W-130,H-70,120,58);g.fillStyle="#fff";g.font="900 28px sans-serif";g.textAlign="center";g.fillText(`P${fz.f}`,W-70,H-32);g.font="700 13px sans-serif";g.fillText("car park floor",W-70,H-16);}
    if(ind){g.fillStyle=blink?"#ffab00":"#795548";g.font="900 26px sans-serif";g.textAlign="center";g.fillText(ind<0?"⬅":"➡",W/2+(ind<0?-cw*.75:cw*.75),H-30);}
    // progress bar
    g.fillStyle="#0006";g.fillRect(W*.25,H-8,W*.5,5);g.fillStyle="#ffd54f";g.fillRect(W*.25,H-8,W*.5*Math.min(1,pos/((N-8)*SEG)),5);
    const m=performance.now()<msgT?msg:autoMsg();if(msgEl.innerHTML!==m)msgEl.innerHTML=m;msgEl.style.display=m?"block":"none";}
  function nextLight(){return lights.find(L=>!L.passed&&L.seg*SEG>pos-SEG);}
  function autoMsg(){const bs=Math.floor(pos/SEG),L=nextLight();
    if(phase==="walk"){if(carSeg-bs<=12)return "🚗 وصلتَ إلى سيّارتك! اضغط «اركب السيّارة» أو Enter<small>You reached your car — press Get in / Enter</small>";
      return dir==="out"?`🚶 أنت في موقف السيّارات — الطابق ${FLAR[PF]} (P${PF}). امشِ إلى سيّارتك الزرقاء (W)<small>You're on car-park floor P${PF}. Walk to your blue car (W)</small>`:"🚶 انتهى التسوّق! امشِ في الموقف إلى سيّارتك الزرقاء (W)<small>Walk across the car park to your blue car (W)</small>";}
    if(phase==="board")return "🚗 جلستَ في السيّارة — اتبع الخطوات<small>You're in the car — follow the steps</small>";
    if(blockT>1.2)return "🚙 السيّارة أمامك بطيئة — غيّر المسار! (Q ثمّ A أو E ثمّ D)<small>The car ahead is slow — signal and change lane!</small>";
    if(speed<10&&!done&&pos-driveStart<SEG*8&&!parked)return dir==="out"?"⬆️ اضغط W أو ⬆️ لتسير — انزل من الموقف<small>Press W / ⬆️ to drive down out of the car park</small>":"⬆️ اضغط W أو ⬆️ لتسير إلى البيت<small>Press W / ⬆️ to drive home</small>";
    if(L){const d=L.seg-bs;if(d<14&&d>=0){if(L.st==="r")return "🔴 الإشارة حمراء — قِف قبل الخطّ الأبيض! (S)<small>Red light — stop before the white line!</small>";if(L.st==="a")return "🟡 الإشارة صفراء — خفّف السرعة واستعدّ للوقوف<small>Amber — slow down and get ready to stop</small>";return "🟢 الإشارة خضراء — تابع السير<small>Green — go</small>";}}
    if(gateSeg>=0&&gateSeg-bs<10&&gateSeg-bs>=0&&gateOpen<1)return "🚧 الحاجز — توقّف قليلاً ليُفتح<small>Barrier — slow down / stop so it opens</small>";
    if(dir==="in"&&bay>=0&&bay-bs<18&&bay-bs>=-1)return `🅿️ هذا مكانك P${PF} — قِف هنا لتركن (S)<small>This is your bay — stop here to park</small>`;
    return "";}
  /* ---------- update ---------- */
  function update(dt){
    if(phase!=="drive"){const bs0=Math.floor(pos/SEG);if(phase==="walk"){speed=keys.g?MAX*.11:keys.b?-MAX*.07:0;pos+=speed*dt;pos=Math.max(SEG,Math.min((carSeg-10)*SEG,pos));
        if(carSeg-bs0<=12){if(boardEl.hidden){bstep=0;boardEl.innerHTML=`${BSTEPS[0][0]}<small>${BSTEPS[0][1]}</small>`;boardEl.hidden=false;}}else boardEl.hidden=true;}
      speed=Math.max(0,speed);lights.forEach(L=>{L.t-=dt;if(L.t<=0){if(L.st==="g"){L.st="a";L.t=3;}else if(L.st==="a"){L.st="r";L.t=6;}else{L.st="g";L.t=7;}}});return;}
    // lights (Malaysia: green → amber → red → green, no red+amber)
    lights.forEach(L=>{L.t-=dt;if(L.t<=0){if(L.st==="g"){L.st="a";L.t=3;}else if(L.st==="a"){L.st="r";L.t=6;}else{L.st="g";L.t=7;}}});
    if(indT!==undefined)indT+=dt;
    brake=!!keys.b;
    if(keys.g&&!brake)speed+=MAX*.45*dt;else if(brake)speed-=MAX*1.6*dt;else speed-=MAX*.25*dt;
    const bs=Math.floor(pos/SEG);
    // barrier: must be almost stopped near it to open
    if(gateSeg>=0){const d=gateSeg-bs;if(d>=0&&d<6&&gateOpen<1){if(kmh()<12){gateOpen=Math.min(1,gateOpen+dt*1.2);if(gateOpen>=1){tone(1400,.08);say("🎫 فُتح الحاجز! تابع","Barrier open — go!");}}if(d<=1&&gateOpen<1){speed=0;pos=Math.min(pos,(gateSeg-1)*SEG);}}}
    if(segs[bs]&&segs[bs].theme==="park")speed=Math.min(speed,MAX*.5);
    speed=Math.max(0,Math.min(MAX,speed));
    // cars ahead in my lane
    let blocked=false;cars.forEach(c=>{let csp=c.sp;const L=lights.find(L=>L.seg*SEG>c.z&&L.seg*SEG-c.z<SEG*4);c.braking=false;if(L&&L.st!=="g"){csp=0;c.braking=true;}c.z+=csp*dt;
      const dz=c.z-pos;if(c.lane===lane&&dz>0&&dz<SEG*1.1&&Math.abs(x-LANES[c.lane])<.3){blocked=true;if(blockT>3.5&&!c.braking){c.lane=lane===2?1:lane+1;blockT=0;}if(speed>csp){if(speed-csp>MAX*.15){hits++;bump=.4;tone(150,.2);say("💥 اصطدمتَ بالسيّارة! غيّر المسار أو خفّف السرعة","You hit a car! Change lane or slow down");}speed=Math.min(speed,csp*.8);}}});
    blockT=blocked&&speed<MAX*.5?blockT+dt:0;
    const before=pos;pos+=speed*dt;
    // crossing stop lines
    lights.forEach(L=>{const sz=L.seg*SEG;if(!L.passed&&before<sz&&pos>=sz){L.passed=true;if(L.st==="r"){reds++;tone(200,.3,0,"square");say("❌ تجاوزتَ الإشارة الحمراء! هذا خطر 🚨","You ran a red light!",3200);}else{stars++;tone(1000,.06);say(L.st==="a"?"🟡 مررتَ والإشارة صفراء — انتبه!":"✅ مررتَ والإشارة خضراء 👍",L.st==="a"?"Careful — it was amber":"Passed on green");}}
      // waited properly at a red light
      if(!L.passed&&L.st==="r"&&sz-pos<SEG*2.5&&sz-pos>0&&speed<5&&!L.waited){L.waited=true;stars++;say("👏 ممتاز! وقفتَ عند الإشارة الحمراء","Well done — you stopped at the red light!");}});
    x+=(tx-x)*Math.min(1,dt*6);if(bump>0)bump-=dt;
    // finish
    if(dir==="out"&&pos>=(N-6)*SEG){finish();}
    if(dir==="in"&&bay>=0){const d=bay-bs;if(d<=2&&speed<3&&!parked){parked=true;stars++;tone(900,.1);tone(1200,.12,.12);say(`🅿️ ركنتَ سيّارتك في P${PF}! 👏`,`Parked on floor P${PF}!`,3000);setTimeout(finish,1400);}if(pos>(N-3)*SEG){pos=(N-3)*SEG;speed=0;keys.g=0;}}}
  function finish(){if(done)return;cleanup();setTimeout(()=>o.onDone&&o.onDone({stars,hits,reds,noSig}),400);}
  function loop(now){if(done)return;if(!el.isConnected){cleanup();return;}const dt=Math.min(.05,(now-last)/1000);last=now;update(dt);render();requestAnimationFrame(loop);}
  render();requestAnimationFrame(loop);
  return {stop:cleanup,state:()=>({pos:Math.round(pos/SEG),N,speed:kmh(),theme:segs[Math.floor(pos/SEG)%N].theme,gate:gateSeg,gateOpen,done})};
}
window.ROADDRIVE={open,pickerHtml,bindPicker,getFloor,setFloor,FLAR};
})();
