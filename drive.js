/* 🚗 ROADDRIVE — free driving (top-down, camera behind the car).
   Shared by the building game (go to work) and the store game (trip to the supermarket).
   ROADDRIVE.open({el, dir:"out"|"in", dest:"🏪", destAr:"السوبرماركت", tone, onDone({stars,hits,reds,noSig})})
   dir "out": take the car-park lift to YOUR car's floor, walk to the car, start it, use the gear (P / R / D),
              drive down the ramps, out through the barrier, and drive anywhere in the town to the destination car park.
   dir "in" : walk to your car at the destination, drive back to the building car park, go up the ramps
              to the floor you're told and park in your bay (gear on P).                                         */
(function(){
const LS="tower-carpark";
const FLAR=["الأرضي","الأوّل","الثاني","الثالث","الرابع","الخامس","السادس"];
const ARD=n=>String(n).replace(/[0-9]/g,d=>"٠١٢٣٤٥٦٧٨٩"[d]);
function getFloor(){try{const v=+localStorage.getItem(LS);return v>=1&&v<=6?v:5;}catch(e){return 5;}}
function setFloor(v){v=Math.max(1,Math.min(6,+v||5));try{localStorage.setItem(LS,String(v));}catch(e){}return v;}
/* the "your car" card: tells you which car-park floor your car is on — you go there yourself in the lift */
function pickerHtml(){const f=getFloor();return `<div class="cpk"><div class="cpkT">🅿️ سيّارتك في موقف السيّارات — الطابق <b>${FLAR[f]}</b> (P${f})<small>Your car is on car-park floor P${f}. Take the lift to that floor!</small></div></div>`;}
function bindPicker(){}
const css=`.cpk{background:#eceff1;border-radius:14px;padding:8px 10px;margin:8px auto;max-width:520px;text-align:center}.cpkT{font-weight:800}.cpkT small{display:block;font-weight:600;color:#607d8b;font-size:12px}
.rdw{position:relative;max-width:760px;margin:6px auto}.rdw canvas{width:100%;display:block;border-radius:16px;background:#7cb342;touch-action:none}
.rdmsg{position:absolute;top:8px;left:50%;transform:translateX(-50%);background:#263238e6;color:#fff;border-radius:12px;padding:6px 14px;font-weight:800;text-align:center;max-width:88%;pointer-events:none;font-size:15px;line-height:1.45}.rdmsg small{display:block;color:#b2dfdb;font-weight:600;font-size:12px}
.rdgear{display:flex;gap:8px;justify-content:center;align-items:center;margin-top:6px;direction:ltr}.rdgear b{font-size:13px;color:#455a64;margin-right:4px}
.rdgear button{border:0;border-radius:12px;min-width:68px;padding:8px 6px;font-size:24px;font-weight:900;background:#eceff1;color:#90a4ae;box-shadow:0 2px 5px #0003;cursor:pointer}.rdgear button small{display:block;font-size:11px;font-weight:700}
.rdgear button.on[data-gear="P"]{background:#c62828;color:#fff}.rdgear button.on[data-gear="R"]{background:#ef6c00;color:#fff}.rdgear button.on[data-gear="D"]{background:#2e7d32;color:#fff}
.rdctl{display:grid;grid-template-columns:repeat(6,1fr);gap:6px;margin-top:6px;direction:ltr}.rdctl button{border:0;border-radius:12px;padding:10px 4px;font-size:18px;font-weight:900;background:#fff;box-shadow:0 2px 5px #0003;cursor:pointer;touch-action:none;user-select:none;-webkit-user-select:none}
.rdctl button small{display:block;font-size:11px;font-weight:700;color:#607d8b}.rdctl .ind.on{background:#ffb300}.rdctl .gas{background:#c8e6c9}.rdctl .brk{background:#ffcdd2}.rdctl button.down{filter:brightness(.85)}
.rdboard{position:absolute;left:50%;bottom:22%;transform:translateX(-50%);border:0;border-radius:16px;padding:12px 22px;font-size:20px;font-weight:900;background:#ffd54f;box-shadow:0 4px 14px #0006;cursor:pointer;animation:rdp 1s infinite}.rdboard small{display:block;font-size:12px;font-weight:700;color:#5d4037}@keyframes rdp{50%{transform:translateX(-50%) scale(1.06)}}
.rdkeys{text-align:center;font-size:12px;color:#607d8b;margin-top:4px}
.rdlift{position:absolute;inset:0;border-radius:16px;background:linear-gradient(#90a4ae,#607d8b);display:flex;align-items:center;justify-content:center;z-index:3}
.rlbox{background:#cfd8dc;border:6px solid #455a64;border-radius:14px;padding:12px 16px;text-align:center;max-width:92%;box-shadow:inset 0 0 0 3px #eceff1}
.rldisp{display:inline-block;background:#111;color:#ff5252;font:900 34px monospace;border-radius:8px;padding:2px 18px;min-width:80px;margin-bottom:6px;letter-spacing:2px}
.rlmsg{font-weight:800;font-size:16px;line-height:1.5;margin:4px 0 8px}.rlmsg small{display:block;color:#455a64;font-weight:600;font-size:12px}
.rlkeys{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;direction:ltr;max-width:330px;margin:0 auto}.rlkeys button{border:3px solid #78909c;border-radius:50%;width:62px;height:62px;margin:auto;font:900 18px sans-serif;background:#eceff1;cursor:pointer;box-shadow:0 2px 4px #0004}
.rlkeys button small{display:block;font-size:11px;color:#607d8b}.rlkeys button.lit{background:#fff59d;border-color:#f9a825;box-shadow:0 0 12px #ffeb3b}.rlkeys button:disabled{opacity:.6;cursor:default}
.rlok{color:#2e7d32}.rlbad{color:#c62828}`;
let cssDone=false;function addCss(){if(cssDone)return;cssDone=true;const s=document.createElement("style");s.textContent=css;document.head.appendChild(s);}

/* ======================= maps ======================= */
const DW=760,DH=440;                         // a car-park deck
const BAYX=i=>120+60*i;                      // bay i (0..7) left x, width 60
function deckMap(f,mode,PF,o){
  const m={kind:"deck",f,W:DW,H:DH,solids:[],cars:[],zones:[],signs:[]};
  const S=(x,y,w,h,k,extra)=>m.solids.push(Object.assign({x,y,w,h,k},extra||{}));
  S(0,0,DW,20,"wall");S(0,DH-20,DW,20,"wall");S(0,0,20,DH,"wall");S(DW-20,0,20,DH,"wall");
  for(let k=0;k<=8;k+=2){S(BAYX(k)-7,100,14,14,"pillar");S(BAYX(k)-7,326,14,14,"pillar");}
  const cols=["#e53935","#fdd835","#43a047","#8e24aa","#fb8c00","#90a4ae","#6d4c41","#00897b"];
  let mine=null,target=null;
  for(let row=0;row<2;row++)for(let i=0;i<8;i++){
    const bx=BAYX(i),by=row?330:20,cx=bx+30,cy=by+45;
    if(mode==="out"&&f===PF&&row===0&&i===2){mine={x:cx,y:cy+8,h:0};continue;}
    if(mode==="in"&&f===PF&&row===1&&i===5){target={x:bx+4,y:by+4,w:52,h:82};continue;}
    if(((i*7+row*3+f*5)%9)===4)continue;                       // a few empty bays
    S(cx-15,cy-26,30,52,"car",{col:cols[(i+row*3+f)%8]});}
  m.bays=true;m.mine=mine;m.target=target;
  const last=mode==="out"?f===1:false, noRamp=mode==="in"&&f===PF;
  if(!noRamp)m.ramp={x:640,y:120,w:100,h:200,txt:mode==="out"?(last?"🚪 المخرج":`⬇ انزل إلى P${f-1}`):`⬆ اصعد إلى P${f+1}`,en:mode==="out"?(last?"EXIT":`down to P${f-1}`):`up to P${f+1}`};
  else S(640,120,100,200,"wall");
  m.lift={x:0,y:180,w:20,h:60};
  m.spawnDrive={x:70,y:220,h:Math.PI/2};
  return m;}
const RD=[300,1200,2100],RW2=70,WW=2400;
function onRoadXY(x,y){return RD.some(r=>Math.abs(x-r)<RW2||Math.abs(y-r)<RW2);}
function worldMap(o){
  const m={kind:"world",W:WW,H:WW,solids:[],cars:[],zones:[],deco:[]};
  const S=(x,y,w,h,k,extra)=>m.solids.push(Object.assign({x,y,w,h,k},extra||{}));
  S(-40,-40,WW+80,40,"fence");S(-40,WW,WW+80,40,"fence");S(-40,0,40,WW,"fence");S(WW,0,40,WW,"fence");
  /* the building car park (top-left block) with its exit tunnel and barrier */
  m.cp={x:30,y:40,w:170,h:240};
  S(30,40,170,85,"cp");S(30,215,170,65,"cp");S(30,125,90,90,"cp");
  m.tunnel={x:120,y:125,w:110,h:90};m.gate={x:208,y:125,w:8,h:90,open:0};
  /* the destination: a building with its own car park in the block between the 2nd and 3rd roads */
  m.dest={x:1450,y:1330,w:400,h:250,e:o.dest||"🏢",ar:o.destAr||""};S(1450,1330,400,250,"dest");
  m.lot={x:1450,y:1640,w:400,h:330};
  for(let i=0;i<6;i++){if(i===3)continue;S(1450+12+i*64+17,1660,30,52,"car",{col:["#e53935","#fdd835","#43a047","#8e24aa","#fb8c00","#90a4ae"][i]});}
  m.lotMine={x:1450+12+3*64+32,y:1660+34,h:0};
  /* town: buildings and trees in the other blocks — the grass between them is drivable */
  const I=[[0,230],[370,1130],[1270,2030],[2170,2400]];
  const B=[["🏠","#ffccbc"],["🏬","#b3e5fc"],["🏫","#fff9c4"],["🕌","#c8e6c9"],["🏥","#f8bbd0"],["⛽","#ffe0b2"],["🏪","#d1c4e9"],["🏨","#dcedc8"]];
  let seed=7;const rnd=()=>{seed=(seed*9301+49297)%233280;return seed/233280;};
  I.forEach((ix,a)=>I.forEach((iy,b)=>{
    if(a===0&&b===0)return;if(a===2&&b===2)return;
    const w=ix[1]-ix[0],h=iy[1]-iy[0];if(w<150||h<150){for(let t=0;t<2;t++)S(ix[0]+30+rnd()*(w-90),iy[0]+30+rnd()*(h-90),28,28,"tree");return;}
    const n=2+Math.floor(rnd()*2);
    for(let k=0;k<n;k++){const bw=110+rnd()*90,bh=90+rnd()*70,bx=ix[0]+40+(k%2)*(w/2)+rnd()*(w/2-bw-60),by=iy[0]+40+Math.floor(k/2)*(h/2)+rnd()*(h/2-bh-60);const t=B[Math.floor(rnd()*B.length)];S(bx,by,bw,bh,"bld",{e:t[0],col:t[1]});}
    for(let t=0;t<5;t++){const tx=ix[0]+25+rnd()*(w-55),ty=iy[0]+25+rnd()*(h-55);if(!m.solids.some(s=>tx+28>s.x-10&&tx<s.x+s.w+10&&ty+28>s.y-10&&ty<s.y+s.h+10))S(tx,ty,28,28,"tree");}
  }));
  /* traffic lights at every crossing (Malaysia: green → amber → red; the two roads take turns) */
  m.lights=[];RD.forEach((x,i)=>RD.forEach((y,j)=>m.lights.push({x,y,t:(i*5+j*3)%18})));
  m.spawnOut={x:150,y:170,h:Math.PI/2};
  /* other cars drive on the LEFT (Malaysia) */
  const AI=[["h",0,1],["h",1,-1],["h",2,1],["v",0,-1],["v",1,1],["v",2,-1],["h",1,1],["v",1,-1]];
  m.ai=AI.map((a,k)=>({ax:a[0],road:RD[a[1]],d:a[2],p:200+k*280,sp:110+(k%3)*25,col:["#e53935","#1e88e5","#fdd835","#43a047","#8e24aa","#00897b","#f4511e","#5e35b1"][k]}));
  return m;}
/* light state for the road the car is travelling on: axis "h" (east–west) or "v" (north–south) */
function lightState(L,ax){const c=L.t%18;const v=c<6?"g":c<8?"a":c<9?"r":"r",h=c<9?"r":c<15?"g":c<17?"a":"r";return ax==="v"?v:h;}

/* ======================= the game ======================= */
function open(o){addCss();
  const el=o.el,tone=o.tone||(()=>{}),dir=o.dir||"out";
  let PF=getFloor();
  if(dir==="in"){PF=setFloor(1+Math.floor(Math.random()*6));}      // today you park on a new floor — remember it for next time!
  el.innerHTML=`<div class="rdw"><canvas width="760" height="440"></canvas><div class="rdmsg" id="rdMsg"></div><button class="rdboard" id="rdBoard" hidden></button><div class="rdlift" id="rdLift" hidden></div></div>
    <div class="rdgear"><b>⚙️ ناقل الحركة<br><small>Gear</small></b><button data-gear="P">P<small>وقوف · Park</small></button><button data-gear="R">R<small>رجوع · Reverse</small></button><button data-gear="D">D<small>قيادة · Drive</small></button></div>
    <div class="rdctl"><button class="ind" data-k="il">⬅️💡<small>إشارة يسار Q</small></button><button data-k="l">↩️<small>يسار A ⬅️</small></button><button class="brk" data-k="b">🛑<small>فرامل S ⬇️</small></button><button class="gas" data-k="g">⬆️<small>سِر W ⬆️</small></button><button data-k="r">↪️<small>يمين D ➡️</small></button><button class="ind" data-k="ir">💡➡️<small>إشارة يمين E</small></button></div>
    <div class="rdkeys">⬆️ W سِر (للأمام في D، للخلف في R) · ⬇️ S فرامل · ⬅️➡️ A D لفّ المقود · P / R / F (أو ١ ٢ ٣) الناقل · Q / E الإشارات</div>`;
  const cv=el.querySelector("canvas"),g=cv.getContext("2d"),W=cv.width,H=cv.height,msgEl=el.querySelector("#rdMsg"),boardEl=el.querySelector("#rdBoard"),liftEl=el.querySelector("#rdLift");
  /* ---------- state ---------- */
  let map=null,phase="walk",gear="P",car={x:0,y:0,h:0},man={x:0,y:0,h:0},speed=0,ind=0,stars=0,hits=0,reds=0,noSig=0,done=false,last=performance.now(),bump=0,msg=null,msgT=0,hitCool=0,pHint=0,parked=false,grassSaid=false;
  const keys={};const say=(a,e,ms)=>{msg=`${a}<small>${e}</small>`;msgT=performance.now()+(ms||2800);};
  const kmh=()=>Math.round(Math.abs(speed)/280*80);
  const inR=(p,r,pad)=>p.x>r.x-(pad||0)&&p.x<r.x+r.w+(pad||0)&&p.y>r.y-(pad||0)&&p.y<r.y+r.h+(pad||0);
  function setGearUI(){el.querySelectorAll("[data-gear]").forEach(b=>b.classList.toggle("on",b.dataset.gear===gear));}
  function setGear(gr){if(phase!=="drive"){say("🚗 اركب السيّارة وشغّلها أوّلاً","Get in and start the car first");return;}if(gr===gear)return;
    if(Math.abs(speed)>12){say("✋ توقّف أوّلاً (S) ثمّ غيّر الناقل","Stop first (brake), then change gear");tone(300,.12);return;}
    gear=gr;speed=0;setGearUI();tone(gr==="P"?400:gr==="R"?600:800,.06);tone(200,.05,.06,"square",.05);
    if(gr==="P")say("🅿️ P — وضع الوقوف: السيّارة لا تتحرّك","P — Park: the car will not move");
    else if(gr==="R")say("↩️ R — رجوع: السهم ⬆️ يرجع بالسيّارة للخلف","R — Reverse: the ⬆️ arrow drives backwards");
    else say("🚗 D — قيادة: السهم ⬆️ يسير للأمام","D — Drive: the ⬆️ arrow drives forward");}
  setGearUI();
  const setInd=d=>{if(phase!=="drive")return;ind=ind===d?0:d;tone(ind?900:500,.04);el.querySelectorAll(".rdctl .ind").forEach(b=>b.classList.toggle("on",(b.dataset.k==="il"&&ind<0)||(b.dataset.k==="ir"&&ind>0)));};
  const KD=e=>{const t=e.target;if(t&&(t.tagName==="INPUT"||t.tagName==="TEXTAREA"))return;const c=e.code;let used=true;
    if(c==="KeyW"||c==="ArrowUp")keys.g=1;else if(c==="KeyS"||c==="ArrowDown"||c==="Space")keys.b=1;else if(c==="KeyA"||c==="ArrowLeft")keys.l=1;else if(c==="KeyD"||c==="ArrowRight")keys.r=1;
    else if(c==="Enter"&&!e.repeat){if(phase==="walk"||phase==="board")boardNext();}
    else if(c==="KeyQ"&&!e.repeat)setInd(-1);else if(c==="KeyE"&&!e.repeat)setInd(1);
    else if((c==="KeyP"||c==="Digit1"||c==="Numpad1")&&!e.repeat)setGear("P");else if((c==="KeyR"||c==="Digit2"||c==="Numpad2")&&!e.repeat)setGear("R");else if((c==="KeyF"||c==="Digit3"||c==="Numpad3")&&!e.repeat)setGear("D");
    else used=false;if(used)e.preventDefault();};
  const KU=e=>{const c=e.code;if(c==="KeyW"||c==="ArrowUp")keys.g=0;if(c==="KeyS"||c==="ArrowDown"||c==="Space")keys.b=0;if(c==="KeyA"||c==="ArrowLeft")keys.l=0;if(c==="KeyD"||c==="ArrowRight")keys.r=0;};
  addEventListener("keydown",KD);addEventListener("keyup",KU);
  el.querySelectorAll(".rdctl button").forEach(b=>{const k=b.dataset.k;
    if(k==="g"||k==="b"||k==="l"||k==="r"){const on=e=>{e.preventDefault();keys[k]=1;b.classList.add("down");},off=()=>{keys[k]=0;b.classList.remove("down");};b.addEventListener("pointerdown",on);b.addEventListener("pointerup",off);b.addEventListener("pointerleave",off);b.addEventListener("pointercancel",off);}
    else b.onclick=()=>{if(k==="il")setInd(-1);if(k==="ir")setInd(1);};});
  el.querySelectorAll("[data-gear]").forEach(b=>b.onclick=()=>setGear(b.dataset.gear));
  /* ---------- boarding ---------- */
  let bstep=0;const BSTEPS=[["🚗 اركب السيّارة","Get in the car (Enter)"],["🔒 اربط حزام الأمان","Fasten your seatbelt"],["🔑 شغّل السيّارة","Start the car"]];
  const myCarPos=()=>map.kind==="deck"?map.mine:map.lotMine;
  function boardNext(){if(phase==="drive"||phase==="lift")return;
    if(phase==="walk"){const mc=myCarPos();if(!mc||Math.hypot(man.x-mc.x,man.y-mc.y)>85)return;phase="board";bstep=1;tone(500,.08);tone(300,.1,.1);}
    else{bstep++;tone(bstep===1?900:700,.08);if(bstep>=BSTEPS.length){startDriving();return;}}
    const b=BSTEPS[bstep];boardEl.innerHTML=`${b[0]}<small>${b[1]}</small>`;boardEl.hidden=false;}
  boardEl.onclick=boardNext;
  function startDriving(){phase="drive";boardEl.hidden=true;const mc=myCarPos();car={x:mc.x,y:mc.y,h:mc.h};speed=0;gear="P";setGearUI();
    tone(110,.4,0,"sawtooth",.06);tone(170,.4,.3,"sawtooth",.05);
    say("🔑 السيّارة تعمل! الناقل على P. سيّارتك أمام الجدار — ضع الناقل على R وارجع للخلف ↩️","The car is on! It's in P. Put it in R and back out of the bay",6000);}
  /* ---------- the car-park lift: you must go to the floor where your car is ---------- */
  let liftAt=0,liftBusy=false,liftTries=0;
  function liftUI(m,cls){const fl=liftAt===0?"G":"P"+liftAt;
    liftEl.innerHTML=`<div class="rlbox"><div class="rldisp" id="rlD">${fl}</div><div class="rlmsg ${cls||""}">${m}</div>
      <div class="rlkeys">${[6,5,4,3,2,1,0].map(n=>`<button data-lf="${n}" ${liftBusy?"disabled":""}>${n?"P"+n:"G"}<small>${n?ARD(n):"الأرضي"}</small></button>`).join("")}</div></div>`;
    liftEl.querySelectorAll("[data-lf]").forEach(b=>b.onclick=()=>pressLift(+b.dataset.lf,b));}
  function pressLift(n,b){if(liftBusy)return;tone(900,.05);if(n===liftAt)return;liftBusy=true;liftTries++;b.classList.add("lit");liftEl.querySelectorAll("[data-lf]").forEach(x=>x.disabled=true);
    const d=liftEl.querySelector("#rlD");const step=()=>{if(done)return;if(liftAt===n){tone(1200,.08);tone(1500,.1,.12);arrived(n);return;}liftAt+=n>liftAt?1:-1;d.textContent=liftAt===0?"G":"P"+liftAt;tone(500,.03);setTimeout(step,480);};setTimeout(step,450);}
  function arrived(n){liftBusy=false;
    if(n===PF){if(liftTries===1){stars++;}
      liftUI(`✅ وصلتَ إلى الطابق ${FLAR[n]} (P${n})! هنا سيّارتك 🚗<small>You reached P${n} — your car is here!</small>`,"rlok");
      setTimeout(()=>{if(done)return;liftEl.hidden=true;phase="walk";say("🚶 امشِ إلى سيّارتك الزرقاء (⬆️ W للمشي، ⬅️➡️ للدوران)","Walk to your blue car (W to walk, A/D to turn)",4000);},1500);}
    else liftUI(n===0?`🙈 هذا الطابق الأرضي! سيّارتك في الطابق ${FLAR[PF]} (P${PF}).<small>This is the ground floor. Your car is on P${PF}.</small>`:`🙈 هذا الطابق ${FLAR[n]} (P${n})! سيّارتك ليست هنا. اضغط زرّ طابق سيّارتك.<small>This is P${n} — your car isn't here. Press your car's floor.</small>`,"rlbad");}
  /* ---------- loading maps ---------- */
  let deckF=0;
  function loadDeck(f,spawn){deckF=f;map=deckMap(f,dir,PF,o);if(spawn==="drive"){car={x:map.spawnDrive.x,y:map.spawnDrive.y,h:map.spawnDrive.h};}
    say(`🅿️ الطابق ${FLAR[f]} (P${f})`,`Car-park floor P${f}`,2200);tone(700,.06);}
  let world=null;
  function loadWorld(spawn){if(!world)world=worldMap(o);map=world;if(spawn==="out"){car={x:map.spawnOut.x,y:map.spawnOut.y,h:map.spawnOut.h};}}
  if(dir==="out"){loadDeck(PF);man={x:50,y:210,h:Math.PI/2};phase="lift";liftEl.hidden=false;
    liftUI(`🛗 سيّارتك في الطابق ${FLAR[PF]} (P${PF}).<br>اضغط زرّ الطابق الذي فيه سيّارتك!<small>Your car is on floor P${PF}. Press the button for your car's floor!</small>`);}
  else{loadWorld();const L=map.lot;man={x:L.x+40,y:L.y+150,h:Math.PI/2};phase="walk";
    say(`🚶 امشِ إلى سيّارتك الزرقاء. اليوم ستركنها في الطابق ${FLAR[PF]} (P${PF})`,`Walk to your car. Today you'll park on floor P${PF}`,5000);}
  /* ---------- collisions ---------- */
  function solidList(){const s=map.solids.slice();if(map.kind==="world"&&map.gate&&map.gate.open<1)s.push(map.gate);
    if(map.kind==="deck"&&phase!=="drive"&&map.mine)s.push({x:map.mine.x-15,y:map.mine.y-26,w:30,h:52});
    if(map.kind==="world"&&phase!=="drive"&&dir==="in")s.push({x:map.lotMine.x-15,y:map.lotMine.y-26,w:30,h:52});return s;}
  function hitAt(x,y,r){return solidList().some(s=>x+r>s.x&&x-r<s.x+s.w&&y+r>s.y&&y-r<s.y+s.h);}
  /* ---------- intersections: lights + indicators ---------- */
  const xs={};               // per light: {in, h0, ax}
  function crossCheck(){if(map.kind!=="world")return;
    map.lights.forEach((L,i)=>{const inside=Math.abs(car.x-L.x)<RW2&&Math.abs(car.y-L.y)<RW2;const st=xs[i]||(xs[i]={in:false});
      const ax=Math.abs(Math.sin(car.h))>Math.abs(Math.cos(car.h))?"h":"v";
      if(inside&&!st.in){st.in=true;st.h0=car.h;st.ind0=ind;
        if(Math.abs(speed)>20){const s=lightState(L,ax);if(s==="r"){reds++;tone(200,.3,0,"square");say("❌ تجاوزتَ الإشارة الحمراء! هذا خطر 🚨","You ran a red light!",3200);}else{stars++;tone(1000,.06);say(s==="a"?"🟡 مررتَ والإشارة صفراء — انتبه!":"✅ مررتَ والإشارة خضراء 👍",s==="a"?"Careful — it was amber":"Passed on green");}}}
      else if(!inside&&st.in){st.in=false;let dh=car.h-st.h0;while(dh>Math.PI)dh-=2*Math.PI;while(dh<-Math.PI)dh+=2*Math.PI;
        if(Math.abs(dh)>0.9&&speed>0){const need=dh>0?1:-1;if(ind===need||st.ind0===need){stars++;tone(1100,.07);say("✅ أحسنت! أشّرتَ قبل أن تلفّ 💡","Great — you signalled before turning!");}else{noSig++;tone(300,.12);say(`⚠️ استعمل الإشارة قبل أن تلفّ! (${need<0?"Q يسار":"E يمين"})`,"Use your indicator before turning!");}
          ind=0;el.querySelectorAll(".rdctl .ind").forEach(b=>b.classList.remove("on"));}}
      // waiting properly at a red light, just before the crossing
      const near=!inside&&Math.abs(car.x-L.x)<RW2+90&&Math.abs(car.y-L.y)<RW2+90;
      if(near&&Math.abs(speed)<4&&lightState(L,ax)==="r"&&!st.waited&&onRoadXY(car.x,car.y)){st.waited=true;stars++;say("👏 ممتاز! وقفتَ عند الإشارة الحمراء","Well done — you stopped at the red light!");}
      if(!near&&!inside)st.waited=false;});}
  /* ---------- update ---------- */
  function update(dt){
    if(world)world.lights.forEach(L=>{L.t=(L.t+dt)%18;});
    if(world)aiUpdate(dt);
    if(hitCool>0)hitCool-=dt;if(bump>0)bump-=dt;
    if(phase==="lift"||phase==="board"){return;}
    const steer=(keys.r?1:0)-(keys.l?1:0);
    if(phase==="walk"){man.h+=steer*2.6*dt;const v=keys.g?95:keys.b?-50:0;const nx=man.x+Math.sin(man.h)*v*dt,ny=man.y-Math.cos(man.h)*v*dt;
      if(!hitAt(nx,man.y,9))man.x=nx;if(!hitAt(man.x,ny,9))man.y=ny;
      const mc=myCarPos();const near=mc&&Math.hypot(man.x-mc.x,man.y-mc.y)<85;
      if(near){if(boardEl.hidden){bstep=0;boardEl.innerHTML=`${BSTEPS[0][0]}<small>${BSTEPS[0][1]}</small>`;boardEl.hidden=false;}}else boardEl.hidden=true;return;}
    if(phase!=="drive")return;
    /* --- gear: P never moves, R: ⬆️ goes back, D: ⬆️ goes forward --- */
    const offRoad=map.kind==="world"&&!onRoadXY(car.x,car.y)&&!inR(car,map.lot)&&!inR(car,map.tunnel);
    const maxF=map.kind==="deck"?120:offRoad?150:280,maxR=80;
    if(gear==="P"){speed=0;if((keys.g||steer)&&performance.now()>pHint){pHint=performance.now()+3500;say("🅿️ الناقل على P — السيّارة لن تتحرّك! ضع الناقل على D أو R","It's in Park — it won't move! Choose D or R");tone(250,.08);}}
    else{const sg=gear==="D"?1:-1,mx=gear==="D"?maxF:maxR;
      if(keys.b){const dv=420*dt;speed=Math.abs(speed)<=dv?0:speed-Math.sign(speed)*dv;}
      else if(keys.g){speed+=sg*170*dt;}
      else{const dv=70*dt;speed=Math.abs(speed)<=dv?0:speed-Math.sign(speed)*dv;}
      if(sg*speed>mx)speed=sg*Math.max(mx,Math.abs(speed)-300*dt);   // slow down gently, e.g. when going onto the grass
      if(sg*speed<-40)speed+=sg*200*dt;}
    if(offRoad&&!grassSaid&&Math.abs(speed)>60){grassSaid=true;say("🌱 أنت تقود خارج الطريق — هذا مسموح، لكنّ السيّارة أبطأ","Off-road driving is allowed — but it's slower");}
    if(!offRoad)grassSaid=false;
    car.h+=steer*2.3*dt*Math.max(-1,Math.min(1,speed/110));
    const nx=car.x+Math.sin(car.h)*speed*dt,ny=car.y-Math.cos(car.h)*speed*dt;
    let blocked=false;if(!hitAt(nx,car.y,14))car.x=nx;else blocked=true;if(!hitAt(car.x,ny,14))car.y=ny;else blocked=true;
    if(map.kind==="world")map.ai.forEach(a=>{const ap=aiPos(a);if(Math.hypot(ap.x-car.x,ap.y-car.y)<34){blocked=true;const dx=car.x-ap.x,dy=car.y-ap.y,d=Math.hypot(dx,dy)||1;car.x+=dx/d*4;car.y+=dy/d*4;}});
    if(blocked){if(Math.abs(speed)>70&&hitCool<=0){hits++;hitCool=1.2;bump=.4;tone(150,.2);say("💥 اصطدمتَ! خفّف السرعة وانتبه","You crashed! Slow down and be careful");}speed*=-0.25;}
    /* --- the barrier opens when you stop near it --- */
    if(map.kind==="world"){const gt=map.gate,gd=Math.hypot(car.x-(gt.x+4),car.y-(gt.y+45));
      if(gt.open<1&&gd<95){if(Math.abs(speed)<25){gt.open=Math.min(1,gt.open+dt*1.1);if(gt.open>=1){tone(1400,.08);say("🎫 فُتح الحاجز! تابع","Barrier open — go!");}}}
      else if(gt.open>=1&&gd>220)gt.open=0;}
    crossCheck();
    /* --- moving between floors / leaving the car park --- */
    if(map.kind==="deck"&&map.ramp&&inR(car,map.ramp)){
      if(dir==="out"){if(deckF===1){loadWorld("out");speed=0;say("🚧 هذا حاجز الموقف — قف قليلاً ليُفتح","The car-park barrier — stop so it opens",3500);}else loadDeck(deckF-1,"drive");}
      else loadDeck(deckF+1,"drive");}
    if(dir==="in"&&map.kind==="world"&&car.x<190&&inR(car,map.tunnel)){loadDeck(1,"drive");}
    /* --- parking: in the right place, stopped, and the gear on P --- */
    const zone=dir==="out"?(map.kind==="world"?map.lot:null):(map.kind==="deck"&&deckF===PF?map.target:null);
    if(zone&&inR(car,zone)&&!parked){if(gear==="P"){parked=true;stars++;tone(900,.1);tone(1200,.12,.12);
        say(dir==="out"?"🅿️ ركنتَ السيّارة ووضعتَ الناقل على P! 👏":`🅿️ ركنتَ سيّارتك في P${PF} ووضعتَ الناقل على P! 👏`,dir==="out"?"Parked, gear in P!":`Parked on P${PF}, gear in P!`,3000);setTimeout(finish,1500);}}
  }
  /* ---------- other cars (drive on the left, stop at red lights and behind you) ---------- */
  function aiPos(a){const off=a.ax==="h"?-a.d*35:a.d*35;return a.ax==="h"?{x:a.p,y:a.road+off,h:a.d>0?Math.PI/2:-Math.PI/2}:{x:a.road+off,y:a.p,h:a.d>0?Math.PI:0};}
  function aiUpdate(dt){const m=world;m.ai.forEach(a=>{let go=true;
    RD.forEach(c=>{const stopAt=c-a.d*(RW2+18),dist=(stopAt-a.p)*a.d;if(dist>0&&dist<30){const L=m.lights.find(L=>(a.ax==="h"?L.x===c&&L.y===a.road:L.y===c&&L.x===a.road));if(L&&lightState(L,a.ax)!=="g")go=false;}});
    if(map===world&&phase==="drive"){const ap=aiPos(a),fx=Math.sin(ap.h),fy=-Math.cos(ap.h),dx=car.x-ap.x,dy=car.y-ap.y,ahead=dx*fx+dy*fy,side=Math.abs(dx*fy-dy*fx);if(ahead>0&&ahead<75&&side<26)go=false;}
    if(go){a.p+=a.d*a.sp*dt;if(a.p>WW+60)a.p=-60;if(a.p<-60)a.p=WW+60;}a.stop=!go;});}
  function finish(){if(done)return;cleanup();setTimeout(()=>o.onDone&&o.onDone({stars,hits,reds,noSig}),400);}
  const cleanup=()=>{done=true;removeEventListener("keydown",KD);removeEventListener("keyup",KU);};
  /* ---------- drawing ---------- */
  const emo={};const twUrl=e=>{try{const ZWJ=String.fromCharCode(0x200d),VS=String.fromCharCode(0xfe0f);return `https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.1.0/assets/72x72/${twemoji.convert.toCodePoint(e.indexOf(ZWJ)<0?e.split(VS).join(""):e)}.png`;}catch(_){return null;}};
  const img=e=>{if(emo[e]!==undefined)return emo[e];emo[e]=null;const u=twUrl(e);if(u){const im=new Image();im.crossOrigin="anonymous";im.onload=()=>{emo[e]=im;};im.src=u;}return null;};
  let camH=0;
  /* draw something upright on the screen at a world point (labels, emoji) */
  const upright=(x,y,fn)=>{g.save();g.translate(x,y);g.rotate(camH);fn();g.restore();};
  const emoji=(e,x,y,sz)=>upright(x,y,()=>{const im=img(e);if(im)g.drawImage(im,-sz/2,-sz/2,sz,sz);else{g.font=`${sz*.85}px sans-serif`;g.textAlign="center";g.textBaseline="middle";g.fillText(e,0,0);}});
  const label=(t,x,y,sz,col,bg)=>upright(x,y,()=>{g.font=`900 ${sz}px "Noto Sans Arabic",Tahoma,sans-serif`;g.textAlign="center";g.textBaseline="middle";if(bg){const w=g.measureText(t).width+14;g.fillStyle=bg;g.fillRect(-w/2,-sz*.75,w,sz*1.5);}g.fillStyle=col||"#fff";g.fillText(t,0,0);});
  function carShape(x,y,h,col,opts){opts=opts||{};g.save();g.translate(x,y);g.rotate(h);const w=26,l=48;
    g.fillStyle="#0004";g.fillRect(-w/2+2,-l/2+3,w,l);g.fillStyle=col;g.beginPath();g.roundRect?g.roundRect(-w/2,-l/2,w,l,7):g.rect(-w/2,-l/2,w,l);g.fill();
    g.fillStyle="#263238cc";g.fillRect(-w/2+3,-l/2+9,w-6,10);g.fillRect(-w/2+4,l/2-14,w-8,7);
    g.fillStyle="#fff59d";g.fillRect(-w/2+2,-l/2,6,3);g.fillRect(w/2-8,-l/2,6,3);
    g.fillStyle=opts.brake?"#ff1744":"#b71c1c";g.fillRect(-w/2+2,l/2-3,7,3);g.fillRect(w/2-9,l/2-3,7,3);
    if(opts.rev){g.fillStyle="#fff";g.fillRect(-3,l/2-3,6,3);}
    if(opts.ind&&Math.floor(performance.now()/350)%2===0){g.fillStyle="#ffab00";g.shadowColor="#ffab00";g.shadowBlur=10;const sx=opts.ind<0?-w/2-2:w/2-4;g.fillRect(sx,-l/2+1,6,6);g.fillRect(sx,l/2-7,6,6);g.shadowBlur=0;}
    g.restore();}
  function drawDeck(m){g.fillStyle="#616161";g.fillRect(0,0,m.W,m.H);
    g.strokeStyle="#fff";g.lineWidth=3;for(let row=0;row<2;row++)for(let i=0;i<=8;i++){const by=row?330:20;g.beginPath();g.moveTo(BAYX(i),by);g.lineTo(BAYX(i),by+90);g.stroke();}
    g.strokeStyle="#ffd54f";g.setLineDash([24,18]);g.beginPath();g.moveTo(30,220);g.lineTo(630,220);g.stroke();g.setLineDash([]);
    label(`P${m.f}`,380,220,64,"#ffffff33");
    if(m.ramp){const r=m.ramp;g.fillStyle="#9e9e9e";g.fillRect(r.x,r.y,r.w,r.h);g.fillStyle="#ffd54f";for(let k=0;k<r.h;k+=28)g.fillRect(r.x,r.y+k,r.w,12);label(r.txt,r.x+r.w/2,r.y+r.h/2-12,22,"#fff","#1565c0");label(r.en,r.x+r.w/2,r.y+r.h/2+18,13,"#fff","#1565c0");}
    if(m.target){const t=m.target,blink=Math.floor(performance.now()/500)%2;g.fillStyle=blink?"#1e88e5aa":"#42a5f566";g.fillRect(t.x,t.y,t.w,t.h);g.strokeStyle="#fff";g.lineWidth=3;g.strokeRect(t.x,t.y,t.w,t.h);label("🅿️ مكانك",t.x+t.w/2,t.y+t.h/2,15,"#fff","#0d47a1");}
    const lf=m.lift;g.fillStyle="#b0bec5";g.fillRect(lf.x,lf.y,lf.w+6,lf.h);label("🛗",lf.x+24,lf.y+lf.h/2,22,"#000");
    m.solids.forEach(s=>{if(s.k==="wall"){g.fillStyle="#37474f";g.fillRect(s.x,s.y,s.w,s.h);}else if(s.k==="pillar"){g.fillStyle="#bdbdbd";g.fillRect(s.x,s.y,s.w,s.h);g.fillStyle="#ffd54f";g.fillRect(s.x,s.y+s.h-4,s.w,4);}else if(s.k==="car")carShape(s.x+s.w/2,s.y+s.h/2,0,s.col);});
    if(m.mine&&phase!=="drive"){carShape(m.mine.x,m.mine.y,m.mine.h,"#1565c0");label(`⬇ سيّارتك`,m.mine.x,m.mine.y+44,14,"#3e2723","#ffd54f");}}
  function drawWorld(m){g.fillStyle="#7cb342";g.fillRect(-40,-40,m.W+80,m.H+80);
    g.fillStyle="#689f38";for(let x=0;x<m.W;x+=120)for(let y=(x/120)%2*60;y<m.H;y+=120)g.fillRect(x,y,60,60);
    g.fillStyle="#546e7a";RD.forEach(r=>{g.fillRect(0,r-RW2,m.W,RW2*2);g.fillRect(r-RW2,0,RW2*2,m.H);});
    g.strokeStyle="#fff";g.lineWidth=3;g.setLineDash([26,22]);RD.forEach(r=>{g.beginPath();g.moveTo(0,r);g.lineTo(m.W,r);g.stroke();g.beginPath();g.moveTo(r,0);g.lineTo(r,m.H);g.stroke();});g.setLineDash([]);
    m.lights.forEach(L=>{g.fillStyle="#546e7a";g.fillRect(L.x-RW2,L.y-RW2,RW2*2,RW2*2);
      [["v",-1],["v",1],["h",-1],["h",1]].forEach(([ax,s])=>{const st=lightState(L,ax),c=st==="g"?"#00e676":st==="a"?"#ffab00":"#ff1744";g.fillStyle=c;
        if(ax==="v")g.fillRect(L.x-RW2,L.y+s*(RW2+4)-(s<0?8:0),RW2*2,8);else g.fillRect(L.x+s*(RW2+4)-(s<0?8:0),L.y-RW2,8,RW2*2);
        const px=ax==="v"?L.x+(s<0?-RW2-14:RW2+14):L.x+s*(RW2+14),py=ax==="v"?L.y+s*(RW2+14):L.y+(s<0?RW2+14:-RW2-14);
        g.fillStyle="#212121";g.beginPath();g.arc(px,py,9,0,7);g.fill();g.fillStyle=c;g.shadowColor=c;g.shadowBlur=8;g.beginPath();g.arc(px,py,6,0,7);g.fill();g.shadowBlur=0;});});
    /* destination car park */
    const lt=m.lot;g.fillStyle="#78909c";g.fillRect(lt.x,lt.y,lt.w,lt.h);g.strokeStyle="#fff";g.lineWidth=3;for(let i=0;i<=6;i++){g.beginPath();g.moveTo(lt.x+12+i*64,lt.y+10);g.lineTo(lt.x+12+i*64,lt.y+90);g.stroke();}
    label("🅿️ موقف — اركن هنا وضع الناقل على P",lt.x+lt.w/2,lt.y+lt.h-60,16,"#fff","#0d47a1");
    /* car park building + tunnel + barrier */
    g.fillStyle="#546e7a";g.fillRect(m.tunnel.x,m.tunnel.y,m.tunnel.w,m.tunnel.h);
    const gt=m.gate;g.save();g.translate(gt.x+4,gt.y);g.rotate(-gt.open*1.4);for(let k=0;k<9;k++){g.fillStyle=k%2?"#fff":"#e53935";g.fillRect(-4,k*10,8,10);}g.restore();g.fillStyle="#37474f";g.fillRect(gt.x-2,gt.y-8,12,10);
    m.solids.forEach(s=>{if(s.k==="fence"){g.fillStyle="#5d4037";g.fillRect(s.x,s.y,s.w,s.h);}
      else if(s.k==="cp"){g.fillStyle="#90a4ae";g.fillRect(s.x,s.y,s.w,s.h);g.strokeStyle="#455a64";g.lineWidth=3;g.strokeRect(s.x,s.y,s.w,s.h);}
      else if(s.k==="bld"){g.fillStyle=s.col;g.fillRect(s.x,s.y,s.w,s.h);g.strokeStyle="#0003";g.lineWidth=3;g.strokeRect(s.x,s.y,s.w,s.h);emoji(s.e,s.x+s.w/2,s.y+s.h/2,46);}
      else if(s.k==="dest"){g.fillStyle="#fff3e0";g.fillRect(s.x,s.y,s.w,s.h);g.strokeStyle="#ef6c00";g.lineWidth=5;g.strokeRect(s.x,s.y,s.w,s.h);emoji(m.dest.e,s.x+s.w/2,s.y+s.h/2-10,90);if(m.dest.ar)label(m.dest.ar,s.x+s.w/2,s.y+s.h-30,22,"#bf360c");}
      else if(s.k==="tree")emoji("🌳",s.x+14,s.y+14,38);
      else if(s.k==="car")carShape(s.x+s.w/2,s.y+s.h/2,0,s.col);});
    label("🅿️ موقف العمارة",m.cp.x+m.cp.w/2,m.cp.y+50,16,"#fff","#1565c0");
    if(dir==="in"&&phase!=="drive"){carShape(m.lotMine.x,m.lotMine.y,0,"#1565c0");label("⬇ سيّارتك",m.lotMine.x,m.lotMine.y+44,14,"#3e2723","#ffd54f");}
    m.ai.forEach(a=>{const p=aiPos(a);carShape(p.x,p.y,p.h,a.col,{brake:a.stop});});}
  function target(){if(dir==="out")return map.kind==="deck"?(map.ramp?{x:map.ramp.x+50,y:map.ramp.y+100}:null):{x:map.lot.x+map.lot.w/2,y:map.lot.y+map.lot.h/2};
    return map.kind==="deck"?(map.ramp?{x:map.ramp.x+50,y:map.ramp.y+100}:map.target?{x:map.target.x+26,y:map.target.y+41}:null):{x:map.tunnel.x+30,y:map.tunnel.y+45};}
  function render(){
    const me=phase==="drive"?car:man;camH=me.h;
    g.fillStyle=map.kind==="deck"?"#263238":"#7cb342";g.fillRect(0,0,W,H);
    g.save();const sh=bump>0?Math.sin(bump*50)*4:0;g.translate(W/2+sh,H*.66);g.rotate(-me.h);g.translate(-me.x,-me.y);
    if(map.kind==="deck")drawDeck(map);else drawWorld(map);
    if(phase==="drive")carShape(car.x,car.y,car.h,"#1565c0",{brake:keys.b||gear==="P",rev:gear==="R",ind});
    else if(phase!=="lift"){g.fillStyle="#0003";g.beginPath();g.arc(man.x,man.y+3,11,0,7);g.fill();emoji("🧍",man.x,man.y,30);g.save();g.translate(man.x,man.y);g.rotate(man.h);g.fillStyle="#ffd54f";g.beginPath();g.moveTo(0,-22);g.lineTo(-6,-14);g.lineTo(6,-14);g.fill();g.restore();}
    g.restore();
    /* HUD */
    if(phase==="drive"){g.fillStyle="#000a";g.fillRect(10,H-74,150,62);g.fillStyle="#fff";g.font="900 24px monospace";g.textAlign="left";g.textBaseline="alphabetic";g.fillText(String(kmh()).padStart(2," ")+" km/h",18,H-44);
      g.font="900 18px monospace";["P","R","D"].forEach((c,i)=>{g.fillStyle=gear===c?(c==="P"?"#ff5252":c==="R"?"#ffab40":"#69f0ae"):"#78909c";g.fillText(c,20+i*24,H-20);});g.font="700 13px sans-serif";g.fillStyle="#fff";g.fillText(`⭐${stars} 💥${hits}`,92,H-20);}
    if(map.kind==="deck"){g.fillStyle="#1565c0";g.fillRect(W-110,H-74,100,62);g.fillStyle="#fff";g.font="900 28px sans-serif";g.textAlign="center";g.fillText(`P${map.f}`,W-60,H-38);g.font="700 12px sans-serif";g.fillText("car park floor",W-60,H-20);}
    else{/* mini map */const s=120/WW,mx=W-132,my=H-132;g.fillStyle="#33691ecc";g.fillRect(mx,my,120,120);g.fillStyle="#90a4ae";RD.forEach(r=>{g.fillRect(mx,my+r*s-3,120,6);g.fillRect(mx+r*s-3,my,6,120);});
      g.fillStyle="#42a5f5";g.fillRect(mx+map.cp.x*s,my+map.cp.y*s,map.cp.w*s,map.cp.h*s);g.fillStyle="#ffa726";g.fillRect(mx+map.dest.x*s,my+map.dest.y*s,map.dest.w*s,(map.lot.y+map.lot.h-map.dest.y)*s);
      g.save();g.translate(mx+me.x*s,my+me.y*s);g.rotate(me.h);g.fillStyle="#ff1744";g.beginPath();g.moveTo(0,-7);g.lineTo(-5,5);g.lineTo(5,5);g.fill();g.restore();g.strokeStyle="#fff";g.lineWidth=2;g.strokeRect(mx,my,120,120);}
    const tg=target();if(tg&&phase==="drive"){const a=Math.atan2(tg.x-me.x,-(tg.y-me.y))-me.h,d=Math.hypot(tg.x-me.x,tg.y-me.y);
      g.save();g.translate(W-60,64);g.fillStyle="#000a";g.beginPath();g.arc(0,0,40,0,7);g.fill();g.rotate(a);g.fillStyle="#ffd54f";g.beginPath();g.moveTo(0,-30);g.lineTo(-14,6);g.lineTo(-5,4);g.lineTo(-5,22);g.lineTo(5,22);g.lineTo(5,4);g.lineTo(14,6);g.closePath();g.fill();g.restore();
      g.fillStyle="#fff";g.font="800 13px sans-serif";g.textAlign="center";g.fillText(`${ARD(Math.round(d/10))} م`,W-60,122);}
    const m=performance.now()<msgT?msg:autoMsg();if(msgEl.innerHTML!==m)msgEl.innerHTML=m;msgEl.style.display=m?"block":"none";}
  function autoMsg(){
    if(phase==="lift")return "";
    if(phase==="walk"){const mc=myCarPos();if(mc&&Math.hypot(man.x-mc.x,man.y-mc.y)<85)return "🚗 وصلتَ إلى سيّارتك! اضغط «اركب السيّارة» أو Enter<small>You reached your car — press Get in / Enter</small>";
      return "🚶 امشِ إلى سيّارتك الزرقاء (⬆️ للمشي، ⬅️➡️ للدوران)<small>Walk to your blue car</small>";}
    if(phase==="board")return "🚗 جلستَ في السيّارة — اتبع الخطوات<small>You're in the car — follow the steps</small>";
    if(map.kind==="world"){for(const L of map.lights){const dx=L.x-car.x,dy=L.y-car.y,fx=Math.sin(car.h),fy=-Math.cos(car.h),ahead=dx*fx+dy*fy,side=Math.abs(dx*fy-dy*fx);
        if(ahead>RW2&&ahead<RW2+190&&side<RW2&&onRoadXY(car.x,car.y)){const ax=Math.abs(fx)>Math.abs(fy)?"h":"v",st=lightState(L,ax);
          if(st==="r")return "🔴 الإشارة حمراء — قِف قبل الخطّ! (S)<small>Red light — stop before the line!</small>";if(st==="a")return "🟡 الإشارة صفراء — خفّف السرعة واستعدّ للوقوف<small>Amber — slow down</small>";return "🟢 الإشارة خضراء — تابع، وأشّر إذا ستلفّ 💡<small>Green — go, signal if you turn</small>";}}
      const gt=map.gate;if(gt.open<1&&Math.hypot(car.x-gt.x,car.y-(gt.y+45))<150)return "🚧 الحاجز — قِف قليلاً ليُفتح<small>Barrier — stop so it opens</small>";
      if(dir==="out"&&inR(car,map.lot,60))return gear==="P"?"":"🅿️ هذا الموقف! قِف داخله وضع الناقل على P<small>Stop inside the car park and put the gear in P</small>";
      if(dir==="out")return `🧭 قُد إلى ${map.dest.e} — اتبع السهم الأصفر. تستطيع القيادة في أيّ مكان!<small>Drive to the ${map.dest.e} — follow the yellow arrow. You can drive anywhere!</small>`;
      return `🧭 ارجع إلى موقف العمارة 🅿️ — اتبع السهم الأصفر<small>Drive back to the building car park — follow the yellow arrow</small>`;}
    if(map.kind==="deck"){if(dir==="in"&&deckF===PF)return map.target&&inR(car,map.target)&&gear!=="P"?"🅿️ أنت في مكانك! ضع الناقل على P<small>You're in your bay — put the gear in P</small>":`🅿️ هذا الطابق ${FLAR[PF]} — اركن في المكان الأزرق<small>Park in the blue bay on P${PF}</small>`;
      if(dir==="in")return `⬆ اصعد إلى الطابق ${FLAR[PF]} (P${PF}) — اتبع السهم<small>Drive up to floor P${PF}</small>`;
      if(gear==="P")return "🅿️ الناقل على P — اختر R لترجع أو D لتسير<small>In Park — choose R to reverse or D to drive</small>";
      return deckF===1?"🚪 قُد إلى المخرج (السهم الأصفر)<small>Drive to the exit</small>":"⬇ قُد إلى المنحدر لتنزل (السهم الأصفر)<small>Drive to the ramp to go down</small>";}
    return "";}
  function loop(now){if(done)return;if(!el.isConnected){cleanup();return;}const dt=Math.min(.05,(now-last)/1000);last=now;update(dt);render();requestAnimationFrame(loop);}
  render();requestAnimationFrame(loop);
  return {stop:cleanup,state:()=>({h:car.h,mx:Math.round(man.x),my:Math.round(man.y),mh:+man.h.toFixed(2),phase,gear,map:map.kind,floor:map.kind==="deck"?deckF:0,x:Math.round(car.x),y:Math.round(car.y),speed:kmh(),done,stars,hits,reds,PF})};
}
window.ROADDRIVE={open,pickerHtml,bindPicker,getFloor,setFloor,FLAR};
})();
