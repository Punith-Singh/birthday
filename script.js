const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const splash = document.getElementById('splash');
const skipSplash = document.getElementById('skipSplash');
let splashClosed = false;
document.body.classList.add('is-splash');
function closeSplash() {
  if (splashClosed) return;
  splashClosed = true;
  splash.classList.add('is-exiting');
  splash.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('is-splash');
  if (document.activeElement === skipSplash) document.querySelector('.brand').focus({preventScroll: true});
  window.setTimeout(() => { splash.hidden = true; }, reducedMotion.matches ? 0 : 800);
}
skipSplash.addEventListener('click', closeSplash);
window.setTimeout(closeSplash, reducedMotion.matches ? 1000 : 3300);

// A lightweight, full-page sky. The animation uses one canvas for both the
// opening and the site, and stops running while the browser tab is hidden.
const sky = document.getElementById('cosmosCanvas');
const skyCtx = sky.getContext('2d');
let skyWidth = 0, skyHeight = 0, skyDpr = 1, stars = [], meteors = [];
let nextMeteor = 0, skyFrame = 0;
function resizeSky() {
  skyWidth = window.innerWidth; skyHeight = window.innerHeight;
  skyDpr = Math.min(window.devicePixelRatio || 1, 2);
  sky.width = Math.round(skyWidth * skyDpr); sky.height = Math.round(skyHeight * skyDpr);
  skyCtx.setTransform(skyDpr, 0, 0, skyDpr, 0, 0);
  const count = Math.min(170, Math.max(65, Math.floor(skyWidth * skyHeight / 8000)));
  stars = Array.from({length: count}, () => ({x:Math.random()*skyWidth,y:Math.random()*skyHeight,r:.35+Math.random()*1.35,phase:Math.random()*7,speed:.6+Math.random()*1.6,opacity:.25+Math.random()*.6}));
  if (reducedMotion.matches) drawSky(0);
}
function drawSky(time) {
  skyCtx.clearRect(0, 0, skyWidth, skyHeight);
  for (const star of stars) {
    const flicker = reducedMotion.matches ? .6 : .36 + .64 * (Math.sin(time*.001*star.speed+star.phase)+1)/2;
    skyCtx.globalAlpha = star.opacity*flicker;
    skyCtx.fillStyle = '#fff2ff'; skyCtx.beginPath(); skyCtx.arc(star.x,star.y,star.r,0,Math.PI*2); skyCtx.fill();
    if (star.r>1.35 && flicker>.55) { skyCtx.globalAlpha *= .4; skyCtx.fillRect(star.x-3,star.y-.35,6,.7); skyCtx.fillRect(star.x-.35,star.y-3,.7,6); }
  }
  skyCtx.globalAlpha=1;
  if (!reducedMotion.matches) {
    if (time > nextMeteor) {
      if (meteors.length<5) meteors.push({x:skyWidth*(.15+Math.random()*.85),y:Math.random()*skyHeight*.65,life:0,duration:35+Math.random()*20,length:80+Math.random()*95,speed:4+Math.random()*3});
      nextMeteor=time+650+Math.random()*1350;
    }
    meteors = meteors.filter(m => m.life < m.duration);
    for (const meteor of meteors) {
      const x=meteor.x-meteor.life*meteor.speed, y=meteor.y+meteor.life*meteor.speed*.42;
      const a=Math.sin(Math.PI*meteor.life/meteor.duration)*.85;
      const trail=skyCtx.createLinearGradient(x,y,x+meteor.length,y-meteor.length*.42);
      trail.addColorStop(0,`rgba(255,245,255,${a})`); trail.addColorStop(.2,`rgba(255,193,239,${a*.5})`); trail.addColorStop(1,'rgba(224,173,255,0)');
      skyCtx.strokeStyle=trail; skyCtx.lineWidth=1.6; skyCtx.beginPath(); skyCtx.moveTo(x,y); skyCtx.lineTo(x+meteor.length,y-meteor.length*.42); skyCtx.stroke();
      meteor.life++;
    }
    if (!document.hidden) skyFrame=requestAnimationFrame(drawSky);
  }
}
resizeSky(); if (!reducedMotion.matches) skyFrame=requestAnimationFrame(drawSky);

// The globe projects a rotating field of points onto a shaded sphere.
const galaxy = document.getElementById('galaxyCanvas');
const g = galaxy.getContext('2d');
let gw=0,gh=0,gdpr=1,galaxyFrame=0,galaxyVisible=true;
const spherePoints=Array.from({length:850},(_,i)=>{const y=1-(i/(850-1))*2;const rr=Math.sqrt(Math.max(0,1-y*y));const a=i*Math.PI*(3-Math.sqrt(5));return {x:Math.cos(a)*rr,y,z:Math.sin(a)*rr,size:.4+(i%7)*.14,phase:i*.78};});
const dust=Array.from({length:250},(_,i)=>({a:i*2.39996,r:1.15+(i%29)/70,s:.4+(i%5)*.19,phase:i*.29}));
function resizeGalaxy(){const box=galaxy.getBoundingClientRect();gw=box.width;gh=box.height;gdpr=Math.min(window.devicePixelRatio||1,2);galaxy.width=Math.round(gw*gdpr);galaxy.height=Math.round(gh*gdpr);g.setTransform(gdpr,0,0,gdpr,0,0);if(reducedMotion.matches)drawGalaxy(0);}
function drawGalaxy(time){
  if (!gw || !gh) return;
  g.clearRect(0,0,gw,gh);const x=gw/2,y=gh/2,r=Math.min(gw*.30,gh*.32,160), t=reducedMotion.matches ? 1 : time*.00013;
  const glow=g.createRadialGradient(x,y,r*.25,x,y,r*1.8);glow.addColorStop(0,'rgba(213,118,223,.19)');glow.addColorStop(.55,'rgba(129,74,177,.12)');glow.addColorStop(1,'rgba(61,30,92,0)');g.fillStyle=glow;g.fillRect(0,0,gw,gh);
  g.save();g.translate(x,y);g.rotate(-.35);
  for(let j=0;j<4;j++){g.beginPath();g.ellipse(0,0,r*(1.22+j*.14),r*(.31+j*.035),0,0,Math.PI*2);g.strokeStyle=`rgba(239,190,237,${.22-j*.035})`;g.lineWidth=1;g.stroke();}
  for(const d of dust){const a=d.a+t*.5;const dx=Math.cos(a)*r*d.r,dy=Math.sin(a)*r*d.r*.34;g.globalAlpha=.2+(Math.sin(time*.001+d.phase)+1)*.15;g.fillStyle=d.phase%3<1?'#ffd5e9':'#d7c4ff';g.beginPath();g.arc(dx,dy,d.s,0,Math.PI*2);g.fill();}g.restore();g.globalAlpha=1;
  const sphere=g.createRadialGradient(x-r*.35,y-r*.45,r*.02,x,y,r*1.05);sphere.addColorStop(0,'#bb8fd0');sphere.addColorStop(.25,'#795890');sphere.addColorStop(.57,'#3f295e');sphere.addColorStop(.85,'#241637');sphere.addColorStop(1,'#130d24');g.fillStyle=sphere;g.beginPath();g.arc(x,y,r,0,Math.PI*2);g.fill();
  g.strokeStyle='rgba(248,213,245,.55)';g.lineWidth=1;g.stroke();
  const cy=Math.cos(t),sy=Math.sin(t), tilt=-.22,ct=Math.cos(tilt),st=Math.sin(tilt);
  for(const p of spherePoints){const xx=p.x*cy+p.z*sy;const zz=p.z*cy-p.x*sy;const yy=p.y*ct-zz*st;const depth=p.y*st+zz*ct;if(depth<-.05)continue;const alpha=(.16+Math.max(0,depth)*.55)*(reducedMotion.matches?.8:.7+.3*Math.sin(time*.001+p.phase));g.globalAlpha=alpha;g.fillStyle=depth>.65?'#fff2ff':'#e9b9f3';g.beginPath();g.arc(x+xx*r,y+yy*r,p.size,0,Math.PI*2);g.fill();}
  g.globalAlpha=1;const sheen=g.createRadialGradient(x-r*.4,y-r*.45,0,x-r*.3,y-r*.35,r*.9);sheen.addColorStop(0,'rgba(255,244,255,.18)');sheen.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=sheen;g.beginPath();g.arc(x,y,r,0,Math.PI*2);g.fill();
  g.save();g.translate(x,y);g.rotate(-.35);g.beginPath();g.ellipse(0,0,r*1.50,r*.38,0,0,Math.PI);g.strokeStyle='rgba(255,221,243,.75)';g.shadowColor='#f4b8f4';g.shadowBlur=12;g.lineWidth=1.6;g.stroke();const a=t*2+.8;g.fillStyle='#fff7ff';g.shadowBlur=20;g.beginPath();g.arc(Math.cos(a)*r*1.5,Math.sin(a)*r*.38,3,0,Math.PI*2);g.fill();g.restore();
  if(!reducedMotion.matches && galaxyVisible && !document.hidden)galaxyFrame=requestAnimationFrame(drawGalaxy);
}
resizeGalaxy();if(!reducedMotion.matches)galaxyFrame=requestAnimationFrame(drawGalaxy);
if('IntersectionObserver' in window){new IntersectionObserver(entries=>{const visible=entries[0].isIntersecting;if(visible&&!galaxyVisible&&!reducedMotion.matches&&!document.hidden)galaxyFrame=requestAnimationFrame(drawGalaxy);galaxyVisible=visible;},{threshold:0}).observe(galaxy);}
window.addEventListener('resize',()=>{resizeSky();resizeGalaxy();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(skyFrame);cancelAnimationFrame(galaxyFrame);}else if(!reducedMotion.matches){skyFrame=requestAnimationFrame(drawSky);if(galaxyVisible)galaxyFrame=requestAnimationFrame(drawGalaxy);}});

const letterButton=document.getElementById('openLetter');
const letter=document.getElementById('letterCard');
const letterMessage=document.getElementById('letterMessage');
letterButton.addEventListener('click',()=>{const opening=letterButton.getAttribute('aria-expanded')!=='true';letterButton.setAttribute('aria-expanded',String(opening));letterMessage.hidden=!opening;letter.classList.toggle('is-open',opening);letterButton.querySelector('.open-letter-text').textContent=opening?'Close your letter':'Open your letter';});
const wishButton=document.getElementById('wishButton');
const flame=document.getElementById('flame');
const wishResult=document.getElementById('wishResult');
let candleOut=false;
wishButton.addEventListener('click',()=>{candleOut=!candleOut;flame.classList.toggle('out',candleOut);wishButton.querySelector('span').textContent=candleOut?'Make another wish':'Blow out the candle';wishResult.textContent=candleOut?'May your wish find its way to you. Happy birthday, Roseantic! ♡':'';if(candleOut&&!reducedMotion.matches){for(let i=0;i<65;i++){const piece=document.createElement('span');piece.className='confetti';piece.style.left=`${Math.random()*100}vw`;piece.style.backgroundColor=['#f0cf9e','#e4a4b5','#eed9d0','#b891bf'][i%4];piece.style.setProperty('--x',`${Math.random()*240-120}px`);piece.style.animationDelay=`${Math.random()*.8}s`;document.body.append(piece);setTimeout(()=>piece.remove(),4600);}}});
const hero=document.querySelector('.hero');
const heroImage=document.querySelector('.hero-image');
if(!reducedMotion.matches&&window.matchMedia('(hover: hover) and (pointer: fine) and (min-width: 851px)').matches){hero.addEventListener('pointermove',event=>{const bounds=hero.getBoundingClientRect();const x=((event.clientX-bounds.left)/bounds.width-.5)*10;const y=((event.clientY-bounds.top)/bounds.height-.5)*10;heroImage.style.transform=`scale(1.055) translate(${x}px, ${y}px)`;});hero.addEventListener('pointerleave',()=>{heroImage.style.transform='';});}
