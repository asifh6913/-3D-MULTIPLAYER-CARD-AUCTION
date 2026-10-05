'use strict';
/* ============================================================
   ARROW LOGIC — web edition. Ported from the Android app
   (Kotlin/Compose) to plain HTML/CSS/JS. No dependencies.
   Persists via localStorage. Run by opening index.html.
   ============================================================ */

/* ---------- icons (inline SVG paths) ---------- */
const IC = {
  home:'<svg viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>',
  palette:'<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c1.27 0 2.3-.9 2.3-2 0-.59-.23-1.08-.57-1.48-.32-.38-.48-.88-.48-1.42 0-1.1.9-2 2-2h2.75A6.25 6.25 0 0 0 24 8.75C24 4.5 18.83 2 12 2zm-5.5 9.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm3-4.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm3.5 4.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/></svg>',
  settings:'<svg viewBox="0 0 24 24"><path d="M19.14 12.94a7.5 7.5 0 0 0 .05-.94c0-.32-.02-.63-.05-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.3 7.3 0 0 0-1.62-.94L14.4 2.4A.5.5 0 0 0 13.93 2h-3.86a.5.5 0 0 0-.47.4l-.36 2.44c-.59.24-1.13.56-1.62.94l-2.39-.96a.5.5 0 0 0-.6.22L2.7 8.36a.5.5 0 0 0 .12.64l2.03 1.58a7.5 7.5 0 0 0 0 1.88L2.82 14.04a.5.5 0 0 0-.12.64l1.92 3.32c.13.23.4.32.6.22l2.39-.96c.49.38 1.03.7 1.62.94l.36 2.44c.05.24.27.4.47.4h3.86c.24 0 .44-.17.47-.4l.36-2.44c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.09.47 0 .6-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58zM12 15.5A3.5 3.5 0 1 1 12 8.5a3.5 3.5 0 0 1 0 7z"/></svg>',
  coins:'<svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16zm4.5-9.6c0 1.6-1.1 2.6-2.7 2.9v1.9h-1.2v-1.9c-1.4-.2-2.6-1-2.6-2.6h1.4c0 .9.6 1.5 1.7 1.5 1.1 0 1.6-.5 1.6-1.2 0-.9-.5-1.2-2-1.6-1.6-.4-2.7-1-2.7-2.6 0-1.3 1-2.3 2.6-2.5V5h1.2v1.8c1.5.2 2.4 1 2.6 2.5h-1.4c-.1-.8-.5-1.4-1.5-1.4-.9 0-1.4.4-1.4 1.1 0 .8.4 1.1 1.9 1.5 1.7.5 2.8 1.1 2.8 2.7z"/></svg>',
  diamond:'<svg viewBox="0 0 24 24"><path d="M12 2 2 9l10 13L22 9 12 2zm0 3.4 4.4 3.3H7.6L12 5.4zm-5.8 8.1L3.9 10h4.7l1.6 6.4-4-3zM12 19.2 10.2 13h3.6L12 19.2zm4.4-4.6-3.3 3-1.6-6.2h4.8l.1 3.2z"/></svg>',
  play:'<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>',
  back:'<svg viewBox="0 0 24 24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>',
  calendar:'<svg viewBox="0 0 24 24"><path d="M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 16H5V10h14v10zM5 8V6h14v2H5zm4 6h6v-2H9v2z"/></svg>',
  bolt:'<svg viewBox="0 0 24 24"><path d="M11 21h-1l1-7H7.5c-.58 0-.57-.32-.38-.66.19-.34.05-.08.07-.12C8.48 10.94 10.42 7.54 13 3h1l-1 7h3.5c.49 0 .56.33.47.51l-.07.15C12.96 17.55 11 21 11 21z"/></svg>',
  spa:'<svg viewBox="0 0 24 24"><path d="M12 22c6-3.5 8.5-8.5 8.87-13.31a9 9 0 0 1 .13-1 8.79 8.79 0 0 0-8.47 6.13A16.3 16.3 0 0 1 12 22zM7 21.2a16.32 16.32 0 0 1-2.53-5.76A12.79 12.79 0 0 1 4 10.4 9.8 9.8 0 0 1 5 5.68 4 4 0 0 1 5.5 4a9 9 0 0 0-3.5 6.4A18.1 18.1 0 0 0 8 20.3l-1 .9zm4.13-9.23a6.13 6.13 0 0 1 4.62-2.5A11.9 11.9 0 0 1 21 7.4a10.4 10.4 0 0 0-4.75-2.6A13 13 0 0 0 12.78 4a12.6 12.6 0 0 0-3.9 2.23 8.4 8.4 0 0 1 3.47 2.51A13 13 0 0 1 11.13 11.97z"/></svg>',
  trophy:'<svg viewBox="0 0 24 24"><path d="M19 5h-2V3H7v2H5a2 2 0 0 0-2 2v1c0 2.3 1.7 4.2 4 4.5.5 1.7 2 3 3.8 3.3V19H8v2h8v-2h-2.8v-3.2c1.8-.3 3.3-1.6 3.8-3.3 2.3-.3 4-2.2 4-4.5V7a2 2 0 0 0-2-2zM5 8V7h2v3.4C5.8 9.9 5 9 5 8zm14 0c0 1-.8 1.9-2 2.4V7h2v1z"/></svg>',
  gift:'<svg viewBox="0 0 24 24"><path d="M20 6h-2.18A3 3 0 0 0 15 4.32V2h-2v2.5h-.63A3 3 0 0 0 9.65 4H7v2H4a2 2 0 0 0-2 2v2h20V8a2 2 0 0 0-2-2zM9 4a1 1 0 0 1 1 1v1H8V5a1 1 0 0 1 1-1zm6.5 0a1 1 0 0 1 1 1v1h-2V5a1 1 0 0 1 1-1zM2 12v7a2 2 0 0 0 2 2h7v-9H2zm11 9h7a2 2 0 0 0 2-2v-7h-9v9z"/></svg>',
  bulb:'<svg viewBox="0 0 24 24"><path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7zm2.85 11.1-.85.6V16h-4v-2.3l-.85-.6A4.997 4.997 0 0 1 7 9c0-2.76 2.24-5 5-5s5 2.24 5 5a4.997 4.997 0 0 1-2.15 4.1z"/></svg>',
  undo:'<svg viewBox="0 0 24 24"><path d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z"/></svg>',
  restart:'<svg viewBox="0 0 24 24"><path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/></svg>',
  heart:'<svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>',
  heartEmpty:'<svg viewBox="0 0 24 24"><path d="M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3zm-4.4 15.55-.1.1-.1-.1C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05z"/></svg>',
  arrowFwd:'<svg viewBox="0 0 24 24"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/></svg>',
  lock:'<svg viewBox="0 0 24 24"><path d="M18 8h-1V6a5 5 0 0 0-10 0v2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2zm-6 9a2 2 0 1 1 0-4 2 2 0 0 1 0 4zM8.5 8v-2a3.5 3.5 0 0 1 7 0v2h-7z"/></svg>',
  layers:'<svg viewBox="0 0 24 24"><path d="M11.99 18.54l-7.37-5.73L3 14.07l9 7 9-7-1.63-1.27-7.38 5.74zM12 16l7.36-5.73L21 9l-9-7-9 7 1.63 1.27L12 16z"/></svg>',
  landscape:'<svg viewBox="0 0 24 24"><path d="M14 6l-3.75 5 2.85 3.8-1.6 1.2C9.81 13.75 7 10 7 10l-6 8h22L14 6z"/></svg>',
  playArrow:'<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>',
  premium:'<svg viewBox="0 0 24 24"><path d="M12 1 3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/></svg>',
  star:'<svg viewBox="0 0 24 24"><path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>',
  waves:'<svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>',
  touch:'<svg viewBox="0 0 24 24"><path d="M9 11.24V7.5a2.5 2.5 0 0 1 5 0v3.74c.6-.4 1.58-.92 2.5-.75a2.5 2.5 0 0 1 1.4 4.3l-4.12 3.16A2 2 0 0 1 12.18 18.5H8.97a2 2 0 0 1-1.87-1.23l-1.04-2.4a2.5 2.5 0 0 1 1.5-3.22l1.44-.52zM17 7.5c0-.55.45-1 1-1s1 .45 1 1v2h2v-2a3 3 0 0 0-6 0v2h2v-2z"/></svg>',
  darkmode:'<svg viewBox="0 0 24 24"><path d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.39 5.39 0 0 1-4.4 2.26 5.4 5.4 0 0 1-5.4-5.4c0-1.81.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z"/></svg>',
  shield:'<svg viewBox="0 0 24 24"><path d="M12 1 3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>',
  person:'<svg viewBox="0 0 24 24"><path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5zm0 2c-3.34 0-7 1.67-7 5v2h14v-2c0-3.33-3.66-5-7-5z"/></svg>',
  timer:'<svg viewBox="0 0 24 24"><path d="M15 1H9v2h6V1zm-4 13h2V8h-2v6zm8.03-6.61 1.42-1.42a9 9 0 0 0-1.41-1.41l-1.42 1.42A8.94 8.94 0 0 0 11 4a9 9 0 1 0 9 9 8.94 8.94 0 0 0-1.03-4.61zM12 20a7 7 0 1 1 7-7 7 7 0 0 1-7 7z"/></svg>',
  check:'<svg viewBox="0 0 24 24"><path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>',
  checkCircle:'<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>',
  x:'<svg viewBox="0 0 24 24"><path d="M18.3 5.71 12 12l6.3 6.29-1.41 1.42L10.59 13.41 4.29 19.71 2.88 18.29 9.17 12 2.88 5.71 4.29 4.29 10.59 10.59 16.89 4.29z"/></svg>'
};
/* ---------- game data (ported from Kotlin) ---------- */
const DIR = {UP:{dr:-1,dc:0},RIGHT:{dr:0,dc:1},DOWN:{dr:1,dc:0},LEFT:{dr:0,dc:-1}};
const DIR_ORD = {UP:0,RIGHT:1,DOWN:2,LEFT:3};
const MODE = {JOURNEY:'JOURNEY',DAILY:'DAILY',ZEN:'ZEN',RUSH:'RUSH'};
const STATUS = {PLAYING:'PLAYING',COMPLETE:'COMPLETE',FAILED:'FAILED'};
const ArrowSkins=[
 ['classic','Classic Blue','The original clean look',0],['mint','Mint Flow','Fresh teal arrows',300],
 ['sunset','Sunset','Warm coral glow',550],['gold','Golden Path','A bright champion finish',850],
 ['neon','Neon Pulse','Electric arcade energy',1250],['midnight','Midnight','Deep blue with cyan ink',1800],
 ['lava','Lava Core','Animated molten energy',2200],['ice','Frost Beam','Shimmering frozen arrows',2500],
 ['rainbow','Rainbow Rush','Every direction has a color',3000],['plasma','Plasma Shift','Pulsing cosmic energy',3600]];
const BoardSkins=[
 ['classic','Clean Slate','Soft modern tiles',0],['ice','Crystal Ice','Cool glass-like board',400],
 ['wood','Walnut','Warm crafted wood',650],['carbon','Carbon','Dark technical finish',950],
 ['candy','Candy Pop','Playful pink depth',1250],['royal','Royal','Rich violet frame',1750],
 ['lava','Lava Rock','Glowing volcanic cracks',2200],['tech','Cyber Grid','Animated circuit board',2700],
 ['jungle','Ancient Jungle','Carved emerald stone',3200],['galaxy','Galaxy Glass','Deep-space crystal',4000]];
const BackgroundSkins=[
 ['clean','Clean','The focused original',0],['ocean','Ocean Air','Calm blue horizon',450],
 ['sunset','Sunset Sky','A warm evening glow',700],['forest','Quiet Forest','Deep natural greens',1000],
 ['aurora','Aurora','A luminous polar wash',1400],['cosmos','Cosmos','A premium space mood',2000],
 ['lava','Lava World','A molten red atmosphere',2400],['candy','Candy Clouds','Bright playful gradients',2800],
 ['cyber','Cyber City','Electric neon horizon',3400],['heaven','Sky Temple','Golden clouds and light',4200]];
const WORLD_NAMES=['First Flight','Twisted Trails','Neon Crossings','Crystal Maze','Arrow Storm','Shadow Grid','Master Lines','Logic Forge','Expert Orbit','Final Frontier'];
/* ---------- seeded RNG (deterministic per level) ---------- */
class KRandom{
  constructor(seed){this.state=(Math.floor(seed)>>>0)^0x9e3779b9}
  next32(){let x=this.state;x^=x<<13;x>>>=0;x^=x>>>17;x^=x<<5;x>>>=0;this.state=x;return x}
  nextDouble(){return this.next32()/4294967296}
  nextInt(bound){return Math.floor(this.nextDouble()*bound)}
  pick(arr){return arr[this.nextInt(arr.length)]}
  shuffle(arr){for(let i=arr.length-1;i>0;i--){const j=this.nextInt(i+1);const t=arr[i];arr[i]=arr[j];arr[j]=t}return arr}
}
function today(){const d=new Date();const m=('0'+(d.getMonth()+1)).slice(-2),dd=('0'+d.getDate()).slice(-2);return d.getFullYear()+'-'+m+'-'+dd}
function timeStr(s){const m=Math.floor(s/60),ss=s%60;return ('0'+m).slice(-2)+':'+('0'+ss).slice(-2)}
function fmt(n){return n.toLocaleString('en-US')}
/* ---------- puzzle engine (ported from PuzzleEngine.kt) ---------- */
const PuzzleEngine={
  forJourney(level){
    const safe=Math.min(Math.max(level,1),1000);
    const tier=Math.floor((safe-1)/5)+1, step=(safe-1)%5;
    const size= safe<=5?3:safe<=10?4:safe<=50?5:safe<=200?6:safe<=400?7:safe<=600?8:safe<=800?9:10;
    const baseDensity=size===3?0.70:size===4?0.68:size===5?0.70:size===6?0.73:size===7?0.76:size===8?0.79:size===9?0.82:0.84;
    const density=Math.min(baseDensity+Math.min(tier-1,12)*0.012+step*0.006,0.96);
    return this.generate(size,size,8871+safe*104729,safe,density);
  },
  daily(seed){return this.generate(7,7,seed^0x41a7beef,4,0.9)},
  zen(seed,round){const size=Math.min(5+Math.floor(round/2),8);return this.generate(size,size,seed,Math.min(2+Math.floor(round/3),4),0.82)},
  rush(seed,round){const size=Math.min(5+Math.floor(round/2),7);return this.generate(size,size,seed,Math.min(1+Math.floor(round/2),4),0.76)},
  generate(rows,columns,seed,difficulty,density){
    const attempts=Math.min(Math.max(2+difficulty,3),10);
    let best=null,bestScore=-Infinity;
    for(let attempt=0;attempt<attempts;attempt++){
      const candidate=this.construct(rows,columns,seed+attempt*7919,difficulty,density);
      if(this.solve(candidate)!==null){
        const initiallyFree=this.availableTiles(candidate,new Set(candidate.tiles.map(t=>t.id))).length;
        const depScore=candidate.tiles.reduce((sum,tile)=>sum+this.rayCells(tile,rows,columns).filter(cell=>candidate.tiles.some(t=>t.row===cell.row&&t.col===cell.column)).length,0);
        const score=depScore*Math.max(1,difficulty)-initiallyFree*(3+difficulty);
        if(score>bestScore){best=candidate;bestScore=score}
      }
    }
    return best||this.construct(rows,columns,seed,difficulty,density);
  },
  construct(rows,columns,seed,difficulty,density){
    const random=new KRandom(seed);
    const all=[];
    for(let r=0;r<rows;r++)for(let c=0;c<columns;c++)if(random.nextDouble()<=density)all.push({row:r,column:c});
    for(let r=0;r<rows;r++)if(!all.some(x=>x.row===r))all.push({row:r,column:random.nextInt(columns)});
    for(let c=0;c<columns;c++)if(!all.some(x=>x.column===c))all.push({row:random.nextInt(rows),column:c});
    let distinct=[...new Set(all.map(c=>c.row+','+c.column))].map(s=>{const p=s.split(',');return{row:+p[0],column:+p[1]}});
    const original=new Set(distinct.map(c=>c.row+','+c.column));
    const assigned=[];let id=0;
    while(distinct.length){
      const candidates=distinct.map(cell=>{
        const open=Object.keys(DIR).filter(d=>{
          const v=DIR[d];let r=cell.row+v.dr,c=cell.column+v.dc;
          while(r>=0&&r<rows&&c>=0&&c<columns){
            if(distinct.some(x=>x.row===r&&x.column===c))return false;
            r+=v.dr;c+=v.dc;
          }
          return true;
        });
        return open.length?{cell,open}:null;
      }).filter(Boolean);
      let pool;
      if(difficulty<=1){
        candidates.sort((a,b)=>b.open.length-a.open.length);
        pool=candidates.slice(0,Math.max(1,Math.floor(candidates.length/2)));
      }else{
        candidates.sort((a,b)=>{
          const da=Math.max(...a.open.map(d=>this.ray(a.cell,d,rows,columns).filter(p=>original.has(p.row+','+p.column)&&!distinct.some(x=>x.row===p.row&&x.column===p.column)).length));
          const db=Math.max(...b.open.map(d=>this.ray(b.cell,d,rows,columns).filter(p=>original.has(p.row+','+p.column)&&!distinct.some(x=>x.row===p.row&&x.column===p.column)).length));
          return (a.open.length*100-da)-(b.open.length*100-db);
        });
        pool=candidates.slice(0,Math.min(Math.max(candidates.length-difficulty+1,1),candidates.length));
      }
      const chosen=pool[random.nextInt(pool.length)];
      const cell=chosen.cell;
      let direction;
      if(difficulty<=1){
        direction=chosen.open.reduce((m,d)=>this.ray(cell,d,rows,columns).filter(p=>original.has(p.row+','+p.column)).length<this.ray(cell,m,rows,columns).filter(p=>original.has(p.row+','+p.column)).length?d:m);
      }else{
        chosen.open.sort((a,b)=>this.ray(cell,b,rows,columns).filter(p=>original.has(p.row+','+p.column)&&!distinct.some(x=>x.row===p.row&&x.column===p.column)).length-this.ray(cell,a,rows,columns).filter(p=>original.has(p.row+','+p.column)&&!distinct.some(x=>x.row===p.row&&x.column===p.column)).length);
        direction=difficulty>=3?chosen.open[0]:random.pick(chosen.open.slice(0,Math.min(2,chosen.open.length)));
      }
      assigned.push({id:id++,row:cell.row,col:cell.column,direction});
      distinct=distinct.filter(x=>!(x.row===cell.row&&x.column===cell.column));
    }
    const shuffled=random.shuffle([...assigned]);
    return {rows,columns,tiles:shuffled,seed,difficulty};
  },
  ray(cell,direction,rows,columns){
    const out=[];const v=DIR[direction];
    let r=cell.row+v.dr,c=cell.column+v.dc;
    while(r>=0&&r<rows&&c>=0&&c<columns){out.push({row:r,column:c});r+=v.dr;c+=v.dc}
    return out;
  },
  rayCells(tile,rows,columns){return this.ray({row:tile.row,column:tile.col},tile.direction,rows,columns)},
  isClear(tile,puzzle,remainingIds){
    const occupied=new Set();
    puzzle.tiles.forEach(t=>{if(remainingIds.has(t.id)&&t.id!==tile.id)occupied.add(t.row+','+t.col)});
    return this.rayCells(tile,puzzle.rows,puzzle.columns).every(c=>!occupied.has(c.row+','+c.column));
  },
  availableTiles(puzzle,remainingIds){return puzzle.tiles.filter(t=>remainingIds.has(t.id)&&this.isClear(t,puzzle,remainingIds))},
  solve(puzzle,initialRemaining){
    const remaining=new Set(initialRemaining!==undefined?initialRemaining:puzzle.tiles.map(t=>t.id));
    const order=[];
    while(remaining.size){
      const legal=this.availableTiles(puzzle,remaining);
      if(!legal.length)return null;
      const chosen=legal.reduce((m,t)=>t.id<m.id?t:m);
      order.push(chosen.id);remaining.delete(chosen.id);
    }
    return order;
  },
  validate(puzzle){const s=this.solve(puzzle);return s!==null&&s.length===puzzle.tiles.length}
};
/* ---------- profile ---------- */
const SAVE_KEY='arrow_logic_web_v1';
function defaultProfile(){
  return {completedLevel:0,xp:0,coins:250,gems:20,hints:3,streak:0,lastDailyDate:'',lastGiftDate:'',
    totalPuzzles:0,totalMoves:0,bestRushScore:0,soundEnabled:true,hapticsEnabled:true,darkTheme:true,
    premium:false,unlockedArrowSkins:['classic'],selectedArrowSkin:'classic',
    unlockedBoardSkins:['classic'],selectedBoardSkin:'classic',
    unlockedBackgroundSkins:['clean'],selectedBackgroundSkin:'clean',levelStars:{}};
}
function loadProfile(){
  try{
    const raw=localStorage.getItem(SAVE_KEY);if(!raw)return defaultProfile();
    const p=JSON.parse(raw);const d=defaultProfile();
    return Object.assign(d,p,{levelStars:p.levelStars||{},unlockedArrowSkins:p.unlockedArrowSkins||['classic'],
      unlockedBoardSkins:p.unlockedBoardSkins||['classic'],unlockedBackgroundSkins:p.unlockedBackgroundSkins||['clean']});
  }catch(e){return defaultProfile()}
}
function saveProfile(){localStorage.setItem(SAVE_KEY,JSON.stringify(profile))}
/* ---------- audio (WebAudio beeps instead of ToneGenerator) ---------- */
let audioCtx=null;
function beep(freq,dur,type,delay){
  if(!profile.soundEnabled)return;
  try{
    audioCtx=audioCtx||new (window.AudioContext||window.webkitAudioContext)();
    const now=audioCtx.currentTime+(delay||0);
    const o=audioCtx.createOscillator(),g=audioCtx.createGain();
    o.type=type||'sine';o.frequency.value=freq;
    g.gain.setValueAtTime(.12,now);g.gain.exponentialRampToValueAtTime(.001,now+dur);
    o.connect(g);g.connect(audioCtx.destination);
    o.start(now);o.stop(now+dur+.02);
  }catch(e){}
}
function toneBeep(){beep(640,.045)}
function toneNack(){beep(190,.09,'square');beep(150,.1,'square',.05)}
function toneAck(){beep(520,.09);beep(780,.12,'sine',.09)}
/* ---------- global state ---------- */
let profile=loadProfile();
let session=null;
let currentScreen='home';
let ticker=null;
let sessionTimer=null;
let lastFlatCp=0;
function newSession(puzzle,mode,level,boardsCleared){
  return {puzzle,mode,level,remainingIds:new Set(puzzle.tiles.map(t=>t.id)),removedIds:[],hearts:3,
    moves:0,seconds:mode===MODE.RUSH?90:0,score:0,boardsCleared:boardsCleared||0,status:STATUS.PLAYING,
    exitingTileId:null,invalidTileId:null,invalidNonce:0,hintTileId:null,inputLocked:false,
    earnedStars:0,rewardCoins:0,rewardGems:0};
}
function sessionProgress(s){
  return s.puzzle.tiles.length?1-s.remainingIds.size/s.puzzle.tiles.length:1;
}
function remainingTiles(s){return s.puzzle.tiles.filter(t=>s.remainingIds.has(t.id))}
/* ---------- view model (ported from ArrowViewModel.kt) ---------- */
function startGame(mode,level){
  level=level||1;
  const now=Date.now();
  let puzzle;
  if(mode===MODE.JOURNEY)puzzle=PuzzleEngine.forJourney(level);
  else if(mode===MODE.DAILY)puzzle=PuzzleEngine.daily(parseInt(today().replace(/-/g,''),10));
  else if(mode===MODE.ZEN)puzzle=PuzzleEngine.zen(now^0x2e71,0);
  else puzzle=PuzzleEngine.rush(now^0x7a55,0);
  session=newSession(puzzle,mode,level);
  persistSession();startTicker();
  renderGame();
}
function tapTile(id){
  if(!session||session.status!==STATUS.PLAYING||session.inputLocked||!session.remainingIds.has(id))return;
  const tile=session.puzzle.tiles.find(t=>t.id===id);if(!tile)return;
  if(!PuzzleEngine.isClear(tile,session.puzzle,session.remainingIds)){
    toneNack();
    const newHearts=(session.mode===MODE.ZEN||session.mode===MODE.RUSH)?session.hearts:Math.max(0,session.hearts-1);
    const newSeconds=(session.mode===MODE.RUSH)?Math.max(0,session.seconds-5):session.seconds;
    const failed=newHearts===0||(session.mode===MODE.RUSH&&newSeconds===0);
    session.hearts=newHearts;session.seconds=newSeconds;
    session.status=failed?STATUS.FAILED:session.status;
    session.invalidTileId=id;session.invalidNonce++;session.hintTileId=null;
    if(failed&&session.mode===MODE.RUSH)finishRush();
    else persistSession();
    renderGame();
    if(session.status===STATUS.FAILED&&session.mode!==MODE.RUSH)showFailDialog();
    return;
  }
  toneBeep();
  session.moves++;session.score+=10;
  arrowLaunch.t=Date.now();
  session.exitingTileId=id;session.invalidTileId=null;session.hintTileId=null;session.inputLocked=true;
  renderGame();
  clearTimeout(sessionTimer);
  sessionTimer=setTimeout(()=>{
    if(!session||session.exitingTileId!==id)return;
    session.remainingIds.delete(id);
    session.removedIds.push(id);
    session.exitingTileId=null;session.inputLocked=false;
    if(session.remainingIds.size===0)onBoardCleared();
    else persistSession();
    renderGame();
  },260);
}
function onBoardCleared(){
  toneAck();
  if(session.mode===MODE.RUSH){
    const boardNumber=session.boardsCleared+1;
    const nextPuzzle=PuzzleEngine.rush(session.puzzle.seed+65537+boardNumber,boardNumber);
    session.puzzle=nextPuzzle;
    session.remainingIds=new Set(nextPuzzle.tiles.map(t=>t.id));
    session.removedIds=[];
    session.boardsCleared=boardNumber;
    session.seconds=Math.min(session.seconds+8,99);
    session.score+=500+session.seconds*5;
    session.inputLocked=false;
    return;
  }
  const repeatedDaily=session.mode===MODE.DAILY&&profile.lastDailyDate===today();
  let rewards;
  if(session.mode===MODE.JOURNEY)rewards=[60+session.level*2,200+Math.floor((session.level-1)/5)*10,session.level%5===0?2:0];
  else if(session.mode===MODE.DAILY)rewards=repeatedDaily?[10,0,0]:[150,250,5];
  else if(session.mode===MODE.ZEN)rewards=[30,80,0];
  else rewards=[0,0,0];
  const earnedStars=session.hearts>=3&&session.moves<=session.puzzle.tiles.length+2?3:session.hearts>=2?2:1;
  if(session.mode===MODE.JOURNEY){
    const cur=profile.levelStars[session.level]||0;
    profile.levelStars[session.level]=Math.max(cur,earnedStars);
    profile.completedLevel=Math.max(profile.completedLevel,session.level);
  }
  giveRewards(rewards[0],rewards[1],rewards[2],session.moves,earnedStars,session.mode===MODE.DAILY?today():null);
  session.status=STATUS.COMPLETE;
  session.earnedStars=earnedStars;
  session.rewardCoins=rewards[1];
  session.rewardGems=rewards[2];
  clearSessionSaved();
  renderGame();
}
function giveRewards(xp,coinsR,gems,moves,stars,dailyDate){
  profile.xp+=xp;profile.coins+=coinsR;profile.gems+=gems;
  profile.totalPuzzles+=1;profile.totalMoves+=moves;
  if(dailyDate!==null&&dailyDate!==undefined&&dailyDate!==profile.lastDailyDate){
    const prev=profile.lastDailyDate?new Date(profile.lastDailyDate):null;
    const cur=new Date(dailyDate);
    const oneDay=86400000;
    const continued=prev&&(Math.abs(cur-prev)>=oneDay)&&(Math.abs(cur-prev)<2*oneDay);
    profile.streak=continued?profile.streak+1:1;
    profile.lastDailyDate=dailyDate;
  }
  saveProfile();
}
function startTicker(){
  stopTicker();
  ticker=setInterval(()=>{
    if(!session||session.status!==STATUS.PLAYING)return;
    if(session.mode===MODE.RUSH){
      session.seconds=Math.max(0,session.seconds-1);
      if(session.seconds===0)finishRush();
      else persistSession();
    }else{
      session.seconds++;
      persistSession();
    }
    updateTimerUI();
  },1000);
}
function stopTicker(){if(ticker){clearInterval(ticker);ticker=null}}
function finishRush(){
  if(!session||session.status===STATUS.COMPLETE)return;
  session.status=STATUS.COMPLETE;session.seconds=0;session.inputLocked=true;
  session.earnedStars=0;
  profile.xp+=Math.max(Math.floor(session.score/20),20);
  profile.coins+=Math.max(Math.floor(session.score/30),15);
  profile.gems+=session.boardsCleared>=3?1:0;
  profile.totalPuzzles+=1;profile.totalMoves+=session.moves;
  profile.bestRushScore=Math.max(profile.bestRushScore,session.score);
  saveProfile();
  clearSessionSaved();
  renderGame();
}
function useHint(){
  if(!session||session.status!==STATUS.PLAYING||session.inputLocked)return;
  if(profile.hints<=0){message('You\u2019re out of hints. Find more in Rewards.');return}
  const tile=PuzzleEngine.availableTiles(session.puzzle,session.remainingIds)[0];
  if(!tile)return;
  profile.hints--;saveProfile();
  session.hintTileId=tile.id;
  renderGame();
}
function undo(){
  if(!session||session.status!==STATUS.PLAYING||session.inputLocked)return;
  const id=session.removedIds[session.removedIds.length-1];
  if(id===undefined)return;
  session.remainingIds.add(id);
  session.removedIds.pop();
  session.moves=Math.max(0,session.moves-1);
  session.hintTileId=null;
  persistSession();renderGame();
}
function retry(){
  if(!session)return;
  session=newSession(session.puzzle,session.mode,session.level);
  persistSession();startTicker();
  hideDialogs();renderGame();
}
function continueAfterFail(){
  if(!session||session.status!==STATUS.FAILED)return;
  if(profile.gems>=15){profile.gems-=15;saveProfile();
    session.hearts=3;session.status=STATUS.PLAYING;session.inputLocked=false;
    persistSession();hideDialogs();renderGame();
  }else message('You need 15 gems to continue.');
}
function nextPuzzle(){
  if(!session)return;
  if(session.mode===MODE.JOURNEY)startGame(MODE.JOURNEY,Math.min(session.level+1,1000));
  else if(session.mode===MODE.DAILY)startGame(MODE.DAILY);
  else if(session.mode===MODE.ZEN){
    const round=session.boardsCleared+1;
    const puzzle=PuzzleEngine.zen(Date.now()^session.puzzle.seed,round);
    session=newSession(puzzle,MODE.ZEN,round+1);
    session.boardsCleared=round;
    persistSession();startTicker();renderGame();
  }else startGame(MODE.RUSH);
  hideDialogs();
}
function abandonGame(){stopTicker();session=null;clearSessionSaved();renderHome()}
function claimDailyGift(){
  if(profile.lastGiftDate===today())message('Your next gift arrives tomorrow.');
  else{profile.lastGiftDate=today();profile.coins+=75;profile.hints+=1;saveProfile();
    message('Daily gift opened: +75 coins and +1 hint');renderCurrentScreen()}
}
function grantAdReward(coinsR,gems){profile.coins+=coinsR;profile.gems+=gems;saveProfile();
  message(coinsR>0?'+'+fmt(coinsR)+' coins added!':'+'+gems+' gems added!');renderCurrentScreen()}
function purchaseHints(amount,cost){
  if(profile.coins>=cost){
    profile.coins-=cost;profile.hints+=amount;saveProfile();
    message('Added '+amount+' hints to your inventory');renderCurrentScreen();
  }else message('Not enough coins yet.');
}
function purchasePremium(){
  if(profile.premium)message('Founder Pass is already active.');
  else if(profile.gems>=500){profile.gems-=500;profile.premium=true;saveProfile();message('Founder Pass unlocked \u2014 thank you!');renderCurrentScreen()}
  else message('Founder Pass requires 500 gems.');
}
function unlockOrSelectSkin(id,kind){
  const skins=kind==='board'?BoardSkins:kind==='bg'?BackgroundSkins:ArrowSkins;
  const skin=skins.find(s=>s[0]===id);if(!skin)return;
  const unlocked=kind==='board'?profile.unlockedBoardSkins:kind==='bg'?profile.unlockedBackgroundSkins:profile.unlockedArrowSkins;
  if(unlocked.includes(id)){
    if(kind==='board')profile.selectedBoardSkin=id;
    else if(kind==='bg')profile.selectedBackgroundSkin=id;
    else profile.selectedArrowSkin=id;
    saveProfile();message(skin[1]+(kind==='board'?' board equipped':kind==='bg'?' background equipped':' equipped'));
  }else if(profile.coins>=skin[3]){
    profile.coins-=skin[3];
    unlocked.push(id);
    if(kind==='board')profile.selectedBoardSkin=id;
    else if(kind==='bg')profile.selectedBackgroundSkin=id;
    else profile.selectedArrowSkin=id;
    saveProfile();message(skin[1]+' unlocked');
  }else message('You need '+fmt(skin[3]-profile.coins)+' more coins for '+skin[1]+'.');
  renderCurrentScreen();
}
function setSetting(key,val){
  if(key==='sound')profile.soundEnabled=val;
  else if(key==='haptics')profile.hapticsEnabled=val;
  else if(key==='dark')profile.darkTheme=val;
  saveProfile();renderCurrentScreen();
}
function message(text){
  const el=document.getElementById('snackbar');
  el.querySelector('.box').textContent=text;
  el.style.display='block';
  clearTimeout(message._t);
  message._t=setTimeout(()=>{el.style.display='none'},2600);
}
/* ---------- session persistence (same pipe encoding as the app) ---------- */
function encodeSession(s){
  const tiles=s.puzzle.tiles.map(t=>t.id+','+t.row+','+t.col+','+DIR_ORD[t.direction]).join(';');
  return [s.mode,s.level,s.puzzle.rows,s.puzzle.columns,s.puzzle.difficulty,s.puzzle.seed,
    [...s.remainingIds].join(','),s.removedIds.join(','),s.hearts,s.moves,s.seconds,s.score,s.boardsCleared,tiles,s.status].join('|');
}
function decodeSession(raw){
  try{
    const p=raw.split('|');
    if(p.length<15)return null;
    const tiles=p[13].split(';').filter(x=>x).map(e=>{const v=e.split(',');return{id:+v[0],row:+v[1],col:+v[2],direction:Object.keys(DIR)[+v[3]]}});
    const puzzle={rows:+p[2],columns:+p[3],tiles,difficulty:+p[4],seed:+p[5]};
    const s=newSession(puzzle,p[0],+p[1]);
    s.remainingIds=new Set(p[6].split(',').filter(x=>x).map(Number));
    s.removedIds=p[7].split(',').filter(x=>x).map(Number);
    s.hearts=+p[8];s.moves=+p[9];s.seconds=+p[10];s.score=+p[11];s.boardsCleared=+p[12];
    s.status=p[14];s.inputLocked=s.status===STATUS.COMPLETE;
    return s;
  }catch(e){return null}
}
function persistSession(){
  if(session&&session.status!==STATUS.COMPLETE&&session.status!==STATUS.FAILED){
    try{localStorage.setItem(SAVE_KEY+'_session',encodeSession(session))}catch(e){}
  }
}
function clearSessionSaved(){try{localStorage.removeItem(SAVE_KEY+'_session')}catch(e){}}
function restoreSession(){
  try{
    const raw=localStorage.getItem(SAVE_KEY+'_session');
    if(raw){
      const s=decodeSession(raw);
      if(s&&s.status===STATUS.PLAYING){session=s;startTicker()}
      else if(s&&s.status===STATUS.FAILED){session=s}
    }
  }catch(e){session=null}
}
/* ---------- palettes (ported from Cosmetics.kt) ---------- */
function hex(c){return '#'+c.toString(16).padStart(6,'0')}
const C=(r,g,b)=>'rgb('+r+','+g+','+b+')';
function withA(col,a){return col.replace('rgb','rgba').replace(')',','+a+')')}
function arrowPalette(id,fallback){
  const p={mint:['#12afa2','#fff'],sunset:['#ff7043','#fff'],gold:['#f5b82e','#422900'],neon:['#b94cff','#fff'],
    midnight:['#172a49','#71e7ff'],lava:['#ff4b19','#fff0b8'],ice:['#69dfff','#06354a'],
    rainbow:['#ff4f9a','#fff'],plasma:['#8b3dff','#8dffff']}[id];
  if(p)return{tile:p[0],ink:p[1]};
  return{tile:fallback||'#268cf5',ink:'#fff'};
}
function boardPalette(id,dark){
  const p={
    ice:dark?['#193448','#0d2130','#27516a','#8ddcff']:['#eaf9ff','#a8d6e9','#d4f1fc','#4a91ad'],
    wood:dark?['#4b3224','#24170f','#654735','#d8a777']:['#e5c29f','#956b47','#f2d5b4','#865a36'],
    candy:dark?['#5d2948','#301125','#7a3b61','#ffa4d4']:['#ffd9ec','#d876a8','#ffecf5','#b94e83'],
    royal:dark?['#322454','#160d2d','#4b3976','#c3a8ff']:['#e8dfff','#9274d2','#f4efff','#7658b9'],
    carbon:['#202731','#090d12','#303a46','#7d8998'],
    lava:['#32120d','#160503','#552018','#ff6a27'],
    tech:['#071e32','#020b13','#0d344d','#1fe4ff'],
    jungle:['#173b2a','#071b10','#275640','#82e07b'],
    galaxy:['#191033','#080414','#2a1d4d','#c383ff']
  }[id];
  if(p)return{shell:p[0],edge:p[1],cell:p[2],dot:p[3]};
  return dark?{shell:'#111d30',edge:'#07101d',cell:'#1a2a41',dot:'#53657d'}
    :{shell:'#ffffff',edge:'#b8c4d4',cell:'#eaf0f8',dot:'#9aa8bb'};
}
function backgroundPalette(id,dark){
  const p={
    ocean:dark?['#071827','#0b2d3b','#0e3a42']:['#eaf5ff','#ddf5f5','#cdeee8'],
    sunset:dark?['#251328','#422336','#3b2b35']:['#fff1e8','#ffe1de','#ede2ff'],
    forest:dark?['#091c17','#123126','#172a24']:['#edf7ef','#dceee3','#d2e7d9'],
    aurora:dark?['#10132e','#123a3a','#29214a']:['#e9e6ff','#d8f6ec','#e5eeff'],
    cosmos:dark?['#070b1c','#17143b','#26134a']:['#f0eeff','#e9e4ff','#f4e9ff'],
    lava:['#210503','#55120a','#19050b'],
    candy:['#401659','#7b286c','#173a72'],
    cyber:['#020c22','#102b55','#2a0942'],
    heaven:['#273777','#65539a','#b06b58']
  }[id];
  if(p)return p;
  return dark?['#0a1730','#17143a','#102d42']:['#e5eeff','#f0e7ff','#e3f7f3'];
}
/* ---------- board canvas renderer (ported from ArrowBoard) ---------- */
const arrowLaunch=[]; // {id, dir, startX, startY, t0}
let boardPhase=0;
let hintPulse01=0;let hintPulseDir=1;
let glowPulse=0;
let shakeAnim=null;
function boardAccentFor(bgId){
  return bgId==='lava'?'#ff5a22':bgId==='cyber'?'#24dfff':bgId==='candy'?'#ff62c8':
    bgId==='forest'?'#55d885':bgId==='heaven'?'#ffd46a':'#8c61ff';
}
function drawArrowIcon(ctx,cx,cy,len,dir,color,stroke,cap){
  const v=DIR[dir];
  const tail={x:cx-v.dc*len*.7,y:cy-v.dr*len*.7};
  const tip={x:cx+v.dc*len,y:cy+v.dr*len};
  const hb={x:tip.x-v.dc*len*.58,y:tip.y-v.dr*len*.58};
  ctx.lineCap='round';
  ctx.strokeStyle=color;ctx.lineWidth=stroke;
  ctx.beginPath();ctx.moveTo(tail.x,tail.y);ctx.lineTo(hb.x,hb.y);ctx.stroke();
  const pv={x:-v.dr,y:v.dc};
  ctx.beginPath();ctx.moveTo(tip.x,tip.y);
  ctx.lineTo(hb.x+pv.x*len*.46,hb.y+pv.y*len*.46);
  ctx.lineTo(hb.x-pv.x*len*.46,hb.y-pv.y*len*.46);
  ctx.closePath();ctx.fillStyle=color;ctx.fill();
  ctx.strokeStyle=withA('rgb(255,255,255)',.28);ctx.lineWidth=stroke*.3;ctx.stroke();
  ctx.fillStyle=color;ctx.beginPath();ctx.arc(tail.x,tail.y,stroke*.48,0,7);ctx.fill();
}
function hexRgb(h){const n=parseInt(h.slice(1),16);return[ n>>16&255,n>>8&255,n&255]}
function rgba(h,a){const c=hexRgb(h);return 'rgba('+c.join(',')+','+a+')'}
function tileColorFor(skinId,dir,pulse){
  if(skinId==='classic'||skinId==='rainbow'){
    return dir==='UP'?'#268cf5':dir==='DOWN'?'#a23deb':dir==='LEFT'?'#ff4d3d':'#62c91b';
  }
  if(skinId==='plasma')return lerpColor('#743cff','#ff43c8',pulse);
  if(skinId==='lava')return lerpColor('#db2a0a','#ff852d',pulse);
  return arrowPalette(skinId).tile;
}
function lerpColor(a,b,t){
  const ca=hexRgb(a),cb=hexRgb(b);
  const _c=ca.map((v,i)=>Math.round(v+(cb[i]-v)*t));
  return 'rgb('+_c.join(',')+')';
}
function drawBoardTexture(ctx,w,h,id,dot){
  ctx.strokeStyle=rgbaFromRgb(dot,.16);ctx.lineWidth=2;
  if(id==='wood'){for(let i=0;i<9;i++){const y=h*(i+1)/10;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y+(i%3-1)*4);ctx.stroke()}}
  else if(id==='carbon'){for(let x=-h;x<w;x+=22){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x+h,h);ctx.stroke()}}
  else if(id==='ice'){for(let i=0;i<18;i++){const x=(i*47%97)/97*w,y=(i*71%101)/101*h;
    ctx.fillStyle=rgbaFromRgb(dot,.20);ctx.beginPath();ctx.arc(x,y,i%3===0?3.5:2,0,7);ctx.fill()}}
  else if(id==='candy'){for(let i=0;i<12;i++){const x=(i*37%89)/89*w,y=(i*53%83)/83*h;
    ctx.strokeStyle=rgbaFromRgb(dot,.10);ctx.beginPath();ctx.arc(x,y,10+i%3*3,0,7);ctx.stroke()}}
  else if(id==='royal'){for(let i=0;i<8;i++){const y=h*(i+1)/9;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke()}}
  else if(id==='lava'){ctx.lineWidth=4;
    for(let i=0;i<7;i++){const y=h*(i+1)/8;
      ctx.strokeStyle=rgbaFromRgb(dot,.28);
      ctx.beginPath();ctx.moveTo(i%2*w*.18,y);ctx.lineTo(w*(.72+i%3*.12),y+18);ctx.stroke()}}
  else if(id==='tech'){
    for(let i=0;i<7;i++){const x=w*(i+1)/8;ctx.strokeStyle=rgbaFromRgb(dot,.20);ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke()}
    for(let i=0;i<12;i++){ctx.fillStyle=rgbaFromRgb(dot,.35);ctx.beginPath();ctx.arc((i*47%100)/100*w,(i*73%100)/100*h,3,0,7);ctx.fill()}}
  else if(id==='jungle'){for(let i=0;i<14;i++){const x=(i*61%100)/100*w,y=(i*39%100)/100*h;
    ctx.strokeStyle=rgbaFromRgb(dot,.14);ctx.beginPath();ctx.arc(x,y,7+i%4,0,7);ctx.stroke()}}
  else if(id==='galaxy'){for(let i=0;i<24;i++){const x=(i*67%100)/100*w,y=(i*43%100)/100*h;
    ctx.fillStyle=rgba(('#'+['ffffff'][0]),(.12+i%3*.06));ctx.beginPath();ctx.arc(x,y,1.5+i%3,0,7);ctx.fill()}}
}
function rgbaFromRgb(rgbStr,a){if(rgbStr.startsWith('#'))return rgba(rgbStr,a);return rgbStr.slice(0,-1)+','+a+')'}
let pressedTiles=new Map(); // id -> {scaleStart:ts, tape}
function renderBoardFrame(){
  const holder=document.getElementById('board-canvas');
  if(!holder)return;
  const dpr=window.devicePixelRatio||1;
  const w=holder.clientWidth,h=holder.clientHeight;
  if(w===0)return;
  if(holder.width!==Math.round(w*dpr)||holder.height!==Math.round(h*dpr)){
    holder.width=Math.round(w*dpr);holder.height=Math.round(h*dpr);
  }
  const ctx=holder.getContext('2d');
  ctx.setTransform(dpr,0,0,dpr,0,0);
  ctx.clearRect(0,0,w,h);
  if(!session)return;
  const s=session,p=s.puzzle;
  const dark=profile.darkTheme;
  const board=boardPalette(profile.selectedBoardSkin,dark);
  boardPhase+=0.016;
  drawBoardTexture(ctx,w,h,profile.selectedBoardSkin,board.dot);
  const cw=w/p.columns,ch=h/p.rows;
  const cell=Math.min(cw,ch);
  const inset=cell*.09;
  const outline=rgba(board.dot,.48);
  for(let r=0;r<p.rows;r++)for(let c=0;c<p.columns;c++){
    ctx.fillStyle=rgba(board.cell,.65);
    ctx.beginPath();
    roundRectPath(ctx,c*cw+inset,r*ch+inset,cw-inset*2,ch-inset*2,cell*.2);
    ctx.fill();
    ctx.fillStyle=outline;
    ctx.beginPath();ctx.arc(c*cw+cw/2,r*ch+ch/2,cell*.025,0,7);ctx.fill();
  }
  const allTiles=p.tiles;
  allTiles.forEach(tile=>{
    if(!s.remainingIds.has(tile.id))return;
    const isExiting=tile.id===s.exitingTileId;
    const isInvalid=tile.id===s.invalidTileId;
    const isHint=tile.id===s.hintTileId;
    const pr=isExiting?Math.min((Date.now()-(arrowLaunch.t||Date.now()))/260,1):0;
    if(isExiting&&pr>=1  &&!s.inputLocked){s.exitingTileId=null;persistSession()}
    const center={x:tile.col*cw+cw/2,y:tile.row*ch+ch/2};
    const flight=dirVec(tile.direction,tile,p);
    let cx=center.x,cy=center.y;
    const tcol=tileColorFor(profile.selectedArrowSkin,tile.direction,hintPulse01);
    if(isExiting){
      cx+=flight.x*pr;cy+=flight.y*pr;
      [.22,.14,.07].forEach((lag,index)=>{
        const ep=pr-lag;if(ep<=0)return;
        const e=center.x+flight.x*ep,ey=center.y+flight.y*ep;
        const ts=cell*.74*.92;
        ctx.globalAlpha=(.20-index*.06)*(1-pr);
        ctx.fillStyle=tcol;
        roundRectPath(ctx,e-ts/2,ey-ts/2,ts,ts,cell*.21);ctx.fill();
        ctx.globalAlpha=1;
      });
    }
    let shakeX=0;
    if(isInvalid&&shakeAnim&&!shakeAnim.done){shakeX=shakeAnim.x*cell*.08}
    if(isInvalid&&shakeAnim&&shakeAnim.done){session.invalidTileId=null;shakeAnim=null}
    cx+=shakeX;
    const scale=(isHint?.86+hintPulse01*.12:.92);
    const ts=cell*.74*scale;
    const ambient=(Math.sin(glowPulse+tile.id*.9)*.5+.5);
    ctx.fillStyle=rgbaHex(tcol,.05+ambient*.06);
    ctx.beginPath();ctx.arc(cx,cy,ts*.74,0,7);ctx.fill();
    if(['neon','plasma','lava','ice'].includes(profile.selectedArrowSkin)){
      ctx.fillStyle=rgbaHex(tcol,.13+hintPulse01*.12);
      ctx.beginPath();ctx.arc(cx,cy,ts*(.62+hintPulse01*.08),0,7);ctx.fill();
    }
    ctx.fillStyle='rgba(0,0,0,.10)';
    roundRectPath(ctx,cx-ts/2+cell*.035,cy-ts/2+cell*.05,ts,ts,cell*.21);ctx.fill();
    ctx.fillStyle=tcol;
    roundRectPath(ctx,cx-ts/2,cy-ts/2,ts,ts,cell*.21);ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,.24)';ctx.lineWidth=cell*.025;
    roundRectPath(ctx,cx-ts/2+cell*.025,cy-ts/2+cell*.025,ts-cell*.05,ts-cell*.05,cell*.18);ctx.stroke();
    if(isHint){
      ctx.fillStyle=rgba(arrowPalette(profile.selectedArrowSkin).tile,hintPulse01*.18);
      ctx.beginPath();ctx.arc(cx,cy,cell*.47*hintPulse01,0,7);ctx.fill();
    }
    const ink=isInvalid?'#fff':isHint?'#0a0a12':arrowPalette(profile.selectedArrowSkin).ink;
    if(!isExiting||pr<1){
      drawArrowIcon(ctx,cx,cy,cell*.25,tile.direction,ink,cell*.075);
    }
  });
}
function dirVec(dir,tile,p){
  if(dir==='UP')return{x:0,y:-(tile.row+2)*ch_()};
  if(dir==='DOWN')return{x:0,y:(p.rows-tile.row+1)*ch_()};
  if(dir==='LEFT')return{x:-(tile.col+2)*cw_(),y:0};
  return{x:(p.columns-tile.col+1)*cw_(),y:0};
  function ch_(){return document.getElementById('board-canvas').clientHeight/session.puzzle.rows}
  function cw_(){return document.getElementById('board-canvas').clientWidth/session.puzzle.columns}
}
function rgbaHex(h,a){const c=hexRgb(h);return 'rgba('+c.join(',')+','+a+')'}
function roundRectPath(ctx,x,y,w,h,r){
  ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);
  ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);
  ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.closePath();
}
function startShake(){
  if(shakeAnim&&!shakeAnim.done)return;
  const seq=[-1,1,-.75,.75,0];
  const dur=45;
  shakeAnim={x:0,done:false};
  let i=0,t0=Date.now();
  (function step(){
    const k=Date.now()-t0;
    while(i<seq.length&&k>=dur*(i+1))i++;
    shakeAnim.x=seq[Math.min(i,seq.length-1)];
    if(i>=seq.length){shakeAnim.done=true;return}
    requestAnimationFrame(step);
  })();
  requestAnimationFrame(step);
}
/* ---------- 3D board: tilt / zoom / pan / tap ---------- */
const boardView={rotX:0,rotY:0,panX:0,panY:0,zoom:1};
const PERSP=1200;
function applyBoardTransform(){
  const tilt=document.getElementById('board-tilt');
  const edge=document.getElementById('board-edge');
  if(!tilt)return;
  const v=boardView;
  if(v.zoom>1.03){
    tilt.style.transform='translate('+v.panX+'px,'+v.panY+'px) scale('+v.zoom+')';
  }else{
    if(edge)edge.style.transform='translateY(6px)';
    tilt.style.transform='rotateX('+v.rotX+'deg) rotateY('+v.rotY+'deg)';
  }
  const reset=document.getElementById('reset-view');
  if(reset){
    const isOdd=v.zoom>1.03||Math.abs(v.rotX)>.8||Math.abs(v.rotY)>.8;
    reset.style.display=isOdd?'block':'none';
  }
}
function resetView(){boardView.rotX=0;boardView.rotY=0;boardView.panX=0;boardView.panY=0;boardView.zoom=1;applyBoardTransform()}
function boardHitTest(px,py){
  const holder=document.getElementById('board-holder');
  const tilt=document.getElementById('board-tilt');
  const canvas=document.getElementById('board-canvas');
  if(!holder||!canvas)return null;
  const hr=holder.getBoundingClientRect();
  const v=boardView;
  const sx=px-hr.left-hr.width/2, sy=py-hr.top-hr.height/2;
  const w=canvas.clientWidth,h=canvas.clientHeight;
  let qx,qy;
  if(v.zoom>1.03){
    qx=(sx-v.panX)/v.zoom;qy=(sy-v.panY)/v.zoom;
  }else{
    const ax=v.rotX*Math.PI/180, ay=v.rotY*Math.PI/180;
    const tanX=Math.tan(ax),tanY=Math.tan(ay),secX=1/Math.cos(ax);
    const a1=1-(sx/PERSP)*tanY*secX, b1=(sx/PERSP)*tanX;
    const a2=-(sy/PERSP)*tanY*secX, b2=1+(sy/PERSP)*tanX;
    const det=a1*b2-a2*b1;
    if(Math.abs(det)<1e-9)return null;
    const u=(sx*b2-sy*b1)/det;
    const vart=(a1*sy-a2*sx)/det;
    qx=u/Math.cos(ay);
    qy=(vart-u*tanY*Math.sin(ax))/Math.cos(ax);
  }
  qx+=w/2;qy+=h/2;
  if(qx<0||qy<0||qx>w||qy>h)return null;
  const cw=w/session.puzzle.columns,ch=h/session.puzzle.rows;
  const col=Math.floor(qx/cw),row=Math.floor(qy/ch);
  if(col<0||col>=session.puzzle.columns||row<0||row>=session.puzzle.rows)return null;
  return {tile:remainingTiles(session).find(t=>t.row===row&&t.col===col)||null,row,col};
}
function initBoardGestures(){
  const tilt=document.getElementById('board-tilt');
  if(!tilt)return;
  const pointers=new Map();
  let pinchStart=0,pinchMid={x:0,y:0};
  let dragMode=null,pDown=null;
  const onDown=e=>{
    if(session&&session.inputLocked)return;
    tilt.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(pointers.size===2){
      const pts=[...pointers.values()];
      pinchStart=Math.hypot(pts[1].x-pts[0].x,pts[1].y-pts[0].y);
      pinchMid={x:(pts[0].x+pts[1].x)/2,y:(pts[0].y+pts[1].y)/2};
      pDown=null;
    }else if(pointers.size===1){
      pDown={x:e.clientX,y:e.clientY,t:Date.now(),moved:false,id:e.pointerId};
    }
  };
  const onMove=e=>{
    if(!pointers.has(e.pointerId))return;
    if(pointers.size===2){
      const pts=[...pointers.values()];
      const d=Math.hypot(pts[0].x-pts[1].x,pts[0].y-pts[1].y);
      const mid={x:(pts[0].x+pts[1].x)/2,y:(pts[0].y+pts[1].y)/2};
      if(pinchStart>0){
        const nz=Math.min(Math.max(boardView.zoom*(d/pinchStart),1),3);
        if(nz>1.03){boardView.zoom=nz;boardView.rotX=0;boardView.rotY=0}
        else resetView();
        const mw=document.getElementById('board-holder').clientWidth/2;
        const mh=document.getElementById('board-holder').clientHeight/2;
        const maxPX=mw*(nz-1)*.48,maxPY=mh*(nz-1)*.48;
        boardView.panX=Math.min(Math.max(boardView.panX+(mid.x-pinchMid.x),-maxPX),maxPX);
        boardView.panY=Math.min(Math.max(boardView.panY+(mid.y-pinchMid.y),-maxPY),maxPY);
        pinchMid=mid;
      }
      pinchStart=d;pDown=null;
      applyBoardTransform();
      return;
    }
    const p=pointers.get(e.pointerId);
    const dx=e.clientX-p.x,dy=e.clientY-p.y;
    pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(pDown&&pDown.id===e.pointerId){
      if(dx*dx+dy*dy>36)pDown.moved=true;
      if(pDown.moved){
        if(boardView.zoom>1.03){
          const mw=document.getElementById('board-holder').clientWidth/2;
          const mh=document.getElementById('board-holder').clientHeight/2;
          const maxPX=mw*(boardView.zoom-1)*.48,maxPY=mh*(boardView.zoom-1)*.48;
          boardView.panX=Math.min(Math.max(boardView.panX+dx,-maxPX),maxPX);
          boardView.panY=Math.min(Math.max(boardView.panY+dy,-maxPY),maxPY);
        }else{
          boardView.rotY=Math.min(Math.max(boardView.rotY+dx/16,-12),12);
          boardView.rotX=Math.min(Math.max(boardView.rotX-dy/16,-12),12);
        }
        applyBoardTransform();
      }
    }
  };
  const onUp=e=>{
    if(pointers.has(e.pointerId))pointers.delete(e.pointerId);
    if(pointers.size<2)pinchStart=0;
    if(pDown&&pDown.id===e.pointerId){
      const wasTap=!pDown.moved&&(Date.now()-pDown.t)<400&&pointers.size===0;
      pDown=null;
      if(wasTap&&session&&!session.inputLocked&&session.status===STATUS.PLAYING){
        const hit=boardHitTest(e.clientX,e.clientY);
        if(hit&&hit.tile)handleTap(hit.tile.id);
      }
    }
  };
  const onWheel=e=>{
    e.preventDefault();
    const v=boardView;
    if(v.zoom>1.03||e.deltaY<0){
      const nz=Math.min(Math.max(v.zoom*(e.deltaY<0?1.12:1/1.12),1),3);
      if(nz>1.03){v.zoom=nz;v.rotX=0;v.rotY=0}else resetView();
      applyBoardTransform();
    }
  };
  tilt.addEventListener('pointerdown',onDown);
  tilt.addEventListener('pointermove',onMove);
  tilt.addEventListener('pointerup',onUp);
  tilt.addEventListener('pointercancel',onUp);
  tilt.addEventListener('wheel',onWheel,{passive:false});
  tilt.addEventListener('dblclick',resetView);
}
function handleTap(id){tapTile(id)}
/* ---------- screen registry & render ---------- */
let dialogStack=[];
function showScreen(name){
  currentScreen=name;
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  const el=document.getElementById('screen-'+name);
  if(el)el.classList.add('active');
  const nav=document.getElementById('bottombar');
  const showNav=['home','skins','rewards','profile'].includes(name);
  nav.classList.toggle('show',showNav);
  if(showNav)renderNav();
}
function renderNav(){
  const nav=document.getElementById('bottombar');
  const items=[['home','HOME',IC.home],['skins','SKINS',IC.palette],['rewards','REWARDS',IC.gift],['profile','PROFILE',IC.person]];
  nav.innerHTML=items.map(([r,l,ic])=>
    '<button class="nav-item'+(currentScreen===r?' active':'')+'" data-s="'+r+'"><i class="orb">'+ic+'</i>'+l+'</button>').join('');
  nav.querySelectorAll('.nav-item').forEach(b=>b.addEventListener('click',()=>{
    showScreen(b.dataset.s);renderCurrentScreen();
  }));
}
function renderCurrentScreen(){
  if(currentScreen==='home')renderHome();
  else if(currentScreen==='levels')renderLevels();
  else if(currentScreen==='skins')renderSkins();
  else if(currentScreen==='rewards')renderRewards();
  else if(currentScreen==='profile')renderProfile();
  else if(currentScreen==='game')renderGame();
}
/* ---------- HOME ---------- */
function renderHome(){
  const root=document.getElementById('screens');
  let h=document.getElementById('screen-home');
  if(!h){h=document.createElement('div');h.id='screen-home';h.className='screen';root.appendChild(h)}
  const cont=session&&session.status!==STATUS.COMPLETE;
  const nextLevel=Math.min(profile.completedLevel+1,1000);
  h.innerHTML=
  '<div class="bg"></div><div class="in">'+
    '<div class="row">'+
      '<span class="pill">'+IC.coins+'<span id="hc-coins"></span></span>'+
      '<span class="pill" style="margin-left:8px">'+IC.diamond+'<span id="hc-gems"></span></span>'+
      '<span class="spacer"></span>'+
      '<button class="round-btn" id="hb-skins">'+IC.palette+'</button>'+
      '<button class="round-btn" style="margin-left:9px" id="hb-settings">'+IC.settings+'</button>'+
    '</div>'+
    '<div class="logo-wrap"><div class="logo-box"><div class="logo-ring"></div><div class="logo-tile">'+arrowSvgWhite()+'</div></div>'+
      '<div class="logo-title">ARROW LOGIC</div><div class="logo-sub">CLEAR THE PATH</div></div>'+
    (cont?'<div class="continue-card" id="hb-continue"><div class="cprog"><div class="lbl">'+IC.arrowFwd+'CONTINUE '+friendlyName(session.mode).toUpperCase()+'</div>'+
      '<div class="progress"><i style="width:'+(sessionProgress(session)*100)+'%"></i></div></div></div>':'')+
    '<div class="play-card" id="hb-play"><div class="top">'+
      '<div class="play-tag">LEVEL ADVENTURE</div>'+
      '<div class="play-title">World '+Math.floor((nextLevel-1)/100+1)+'</div>'+
      '<div class="play-level">Level '+nextLevel+' of 1,000</div>'+
      '<div class="play-progress"><i style="width:'+((nextLevel-1)%100)+'%"></i></div>'+
    '</div>'+worldArtSvg()+
    '<div class="play-btn"><span class="b"></span>PLAY '+IC.play+'</div></div>'+
    '<div class="row" style="justify-content:center;margin-top:10px">'+
      '<span style="font-size:12px;font-weight:600;color:rgba(255,255,255,.76)">'+profile.completedLevel+' / 1,000 LEVELS</span>'+
      '<span class="spacer" style="max-width:12px"></span>'+
      '<div class="progress" style="width:105px;height:7px"><i style="width:'+(profile.completedLevel/10)+'%;background:#ffd54a"></i></div>'+
    '</div>'+
    '<div class="action-row">'+
      '<button class="action" id="ha-skins">'+IC.palette+'<span>SKINS</span></button>'+
      '<button class="action" id="ha-rewards">'+IC.trophy+'<span>REWARDS</span></button>'+
      '<button class="action" id="ha-settings">'+IC.settings+'<span>SETTINGS</span></button>'+
    '</div>'+
    '<div class="modes-title">GAME MODES</div><div class="modes-sub">Pick a challenge</div>'+
    '<div class="daily-card" id="hb-daily"><div class="daily-icon">'+IC.calendar+'</div>'+
      '<div style="flex:1"><div class="daily-title">TODAY\'S CHALLENGE</div><div class="daily-name">Daily Puzzle</div>'+
      '<div class="daily-sub">Hard &bull; +250 coins &bull; +5 gems</div></div>'+IC.bolt+'</div>'+
    '<div class="mode-cards">'+
      '<div class="mode-card" id="hb-zen"><div class="mode-icon" style="background:#27d5be">'+IC.spa+'</div>'+
        '<div class="mode-name">ZEN</div><div class="mode-sub2" style="color:#27d5be">NO CLOCK</div></div>'+
      '<div class="mode-card" id="hb-rush"><div class="mode-icon" style="background:#6c8cff">'+IC.bolt+'</div>'+
        '<div class="mode-name">RUSH</div><div class="mode-sub2" style="color:#6c8cff">90 SEC</div></div>'+
    '</div>'+
  '</div>';
  document.getElementById('hc-coins').textContent=fmt(profile.coins);
  document.getElementById('hc-gems').textContent=fmt(profile.gems);
  document.getElementById('hb-skins').onclick=()=>{showScreen('skins');renderSkins()};
  document.getElementById('hb-settings').onclick=()=>{showScreen('profile');renderProfile()};
  document.getElementById('hb-play').onclick=()=>{showScreen('levels');renderLevels()};
  document.getElementById('ha-skins').onclick=()=>{showScreen('skins');renderSkins()};
  document.getElementById('ha-rewards').onclick=()=>{showScreen('rewards');renderRewards()};
  document.getElementById('ha-settings').onclick=()=>{showScreen('profile');renderProfile()};
  document.getElementById('hb-daily').onclick=()=>{startGame(MODE.DAILY);showScreen('game')};
  document.getElementById('hb-zen').onclick=()=>{startGame(MODE.ZEN);showScreen('game')};
  document.getElementById('hb-rush').onclick=()=>{startGame(MODE.RUSH);showScreen('game')};
  if(cont)document.getElementById('hb-continue').onclick=()=>{showScreen('game');renderGame()};
}
function arrowSvgWhite(){
  return '<svg viewBox="0 0 24 24" style="fill:#fff"><path d="M3 20 L15 8 M9.5 8 L15 8 M15 8 L15 13.5" stroke="#fff" stroke-width="2.6" stroke-linecap="round" fill="none"/></svg>';
}
function worldArtSvg(){
  return '<svg class="world-art" viewBox="0 0 100 100">'+
    '<ellipse cx="50" cy="82" rx="44" ry="7" fill="#120a38" opacity=".55"/>'+
    '<ellipse cx="51" cy="56" rx="41" ry="17" fill="#65412c"/>'+
    '<ellipse cx="52" cy="43" rx="43" ry="16" fill="#35b73f"/>'+
    '<ellipse cx="53" cy="41" rx="38" ry="11" fill="#74e358"/>'+
    '<circle cx="50" cy="34" r="10" fill="#8553f5"/>'+
    '<circle cx="47" cy="31" r="5" fill="#fff" opacity=".22"/>'+
    '<g stroke="#fff" stroke-width="3.6" stroke-linecap="round" fill="none">'+
    '<path d="M44 38 L52 30"/><path d="M52 30 L52 36"/><path d="M52 30 L46 30"/></g>'+
    '<circle cx="25" cy="52" r="4" fill="#1c8232"/><path d="M23.7 54.5 L26 62" stroke="#7a4a25" stroke-width="1.5"/>'+
    '<circle cx="42" cy="62" r="4" fill="#1c8232"/><path d="M41 65 L42 72" stroke="#7a4a25" stroke-width="1.5"/>'+
    '<circle cx="59" cy="52" r="4" fill="#1c8232"/><path d="M58 55 L60 63" stroke="#7a4a25" stroke-width="1.5"/>'+
    '<circle cx="76" cy="62" r="4" fill="#1c8232"/><path d="M75 65 L77 73" stroke="#7a4a25" stroke-width="1.5"/></svg>';
}
function friendlyName(mode){return mode===MODE.JOURNEY?'Level':mode===MODE.DAILY?'Daily':mode===MODE.ZEN?'Zen':'Rush'}
/* ---------- LEVELS ---------- */
let levelsWorld=0;
function renderLevels(){
  const root=document.getElementById('screens');
  let el=document.getElementById('screen-levels');
  if(!el){el=document.createElement('div');el.id='screen-levels';el.className='screen screen-levels';root.appendChild(el)}
  const w=levelsWorld;
  const reached=w*100<=profile.completedLevel;
  const progressInWorld=Math.min(Math.max(profile.completedLevel-w*100,0),100)/100*100;
  const starsFor=l=>profile.levelStars[l]||(l<=profile.completedLevel?1:0);
  const cells=[];
  for(let l=w*100+1;l<=w*100+100;l++){
    const completed=l<=profile.completedLevel;
    const unlocked=l<=profile.completedLevel+1;
    const stars=starsFor(l);
    cells.push('<div class="lvl '+(completed?'completed':unlocked?'unlocked':'locked')+'" data-l="'+l+'" style="'+(unlocked&&!completed?'animation:pulse 0.85s ease-in-out infinite alternate':'')+'">'+
      '<div class="base"></div><div class="top">'+
      (unlocked?'<span class="num">'+l+'</span>':'<svg class="lock" viewBox="0 0 24 24"><path d="M18 8h-1V6a5 5 0 0 0-10 0v2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2zm-6 9a2 2 0 1 1 0-4 2 2 0 0 1 0 4zM8.5 8v-2a3.5 3.5 0 0 1 7 0v2h-7z"/></svg>')+
      (unlocked?'<span class="stars">'+(stars>0?'<span style="color:#ffd43b">'+'★'.repeat(stars)+'</span>':'<span style="color:rgba(255,255,255,.42)">☆☆☆</span>')+(completed?'':'')+
      '</span>':'')+'</div></div>');
  }
  el.innerHTML='<div class="bg"></div><div class="in">'+
    '<div class="header-row">'+
      '<button class="back-btn" id="lb-back">'+IC.back+'</button>'+
      '<div style="flex:1"><div class="header-title">SELECT LEVEL</div>'+
      '<div class="header-sub">WORLD '+(w+1)+' &bull; LEVELS '+(w*100+1)+'-'+(w*100+100)+'</div></div>'+
      '<span class="pill">'+IC.coins+'<span>'+fmt(profile.coins)+'</span></span>'+
    '</div>'+
    '<div class="world-card"><div class="row"><div class="world-num">'+(w+1)+'</div>'+
      '<div style="flex:1;margin-left:12px"><div class="world-name">'+WORLD_NAMES[w]+'</div>'+
      '<div class="world-sub">Every level adds a tougher path</div></div></div>'+
      '<div class="world-bar"><i style="width:'+progressInWorld+'%"></i></div></div>'+
    '<div class="worlds-row">'+
      [0,1,2,3,4,5,6,7,8,9].map(i=>{
        const rch=i*100<=profile.completedLevel;
        return '<div class="world-chip'+(i===w?' active':'')+'" data-w="'+i+'"><div class="w">WORLD</div><div class="n">'+(i+1)+'</div>'+
          (rch?'':IC.lock)+'</div>';
      }).join('')+
    '</div>'+
    '<div class="lvl-grid" style="flex:1">'+cells.join('')+'</div>'+
  '</div>';
  el.querySelectorAll('.world-chip').forEach(c=>c.addEventListener('click',()=>{levelsWorld=+c.dataset.w;renderLevels()}));
  el.querySelectorAll('.lvl').forEach(c=>{
    if(c.classList.contains('locked'))return;
    c.addEventListener('click',()=>{startGame(MODE.JOURNEY,+c.dataset.l);showScreen('game')});
  });
  document.getElementById('lb-back').onclick=()=>showScreen('home');
}
/* ---------- SKINS ---------- */
let skinsTab=0;
const effectNames={
  arrow:{lava:'MOLTEN GLOW',ice:'FROST SHIMMER',rainbow:'COLOR SHIFT',plasma:'PULSE EFFECT',neon:'NEON GLOW'},
  board:{lava:'LAVA CRACKS',tech:'CIRCUIT PULSE',jungle:'STONE GLYPHS',galaxy:'STAR GLASS'},
  bg:{lava:'EMBER FIELD',candy:'COLOR CLOUDS',cyber:'NEON LIGHTS',heaven:'GOLDEN RAYS'}
};
function skinEffect(kind,id){const m=effectNames[kind];return m&&m[id]||(kind==='bg'?'LIVING GRADIENT':kind==='board'?'TEXTURED':'3D FINISH')}
function renderSkins(){
  const root=document.getElementById('screens');
  let el=document.getElementById('screen-skins');
  if(!el){el=document.createElement('div');el.id='screen-skins';el.className='screen screen-skins';root.appendChild(el)}
  const dark=true;
  const tab=skinsTab;
  const bg=backgroundPalette(profile.selectedBackgroundSkin,dark);
  const board=boardPalette(profile.selectedBoardSkin,dark);
  const arrowColors=arrowPalette(profile.selectedArrowSkin);
  let listHTML='';
  const skinData=tab===0?ArrowSkins:tab===1?BoardSkins:BackgroundSkins;
  for(const [id,title,subtitle,cost] of skinData){
    const unlocked=tab===0?profile.unlockedArrowSkins.includes(id):tab===1?profile.unlockedBoardSkins.includes(id):profile.unlockedBackgroundSkins.includes(id);
    const selected=tab===0?profile.selectedArrowSkin===id:tab===1?profile.selectedBoardSkin===id:profile.selectedBackgroundSkin===id;
    let actH;
    if(selected)actH='<button class="act-btn act-own">'+IC.check+'</button>';
    else if(unlocked)actH='<button class="act-btn act-equip" data-a="1">EQUIP</button>';
    else actH='<button class="act-btn act-buy" data-a="0">'+IC.coins+'<span>'+fmt(cost)+'</span></button>';
    listHTML+='<div class="skin-card'+(selected?' selected':'')+'" data-id="'+id+'" style="'+(selected?'box-shadow:0 0 14px rgba(255,255,255,.15)':'')+'">'+
      '<div class="base" style="background:'+(tab===0?arrowPalette(id).tile:tab===1?boardPalette(id,dark).edge:backgroundPalette(id,dark).slice(-1)[0])+'"></div>'+
      '<div class="top"><div class="skin-fx" style="background:'+(tab===0?rgbaHex(arrowPalette(id).tile,.18):'transparent')+'">'+skinPreviewHtml(tab,id,dark)+'</div>'+
      '<div style="flex:1;min-width:0"><div class="skin-title">'+title+'</div><div class="skin-sub">'+subtitle+'</div>'+
      '<span class="effect-chip" style="color:'+(tab===0?arrowPalette(id).tile:tab===1?boardPalette(id,dark).dot:backgroundPalette(id,dark).slice(-1)[0])+'">'+skinEffect(tab===0?'arrow':tab===1?'board':'bg',id)+'</span></div>'+
      '<span class="skin-act">'+actH+'</span></div></div>';
  }
  el.innerHTML='<div class="bg"></div><div class="in">'+
    '<div class="studio-head"><div class="studio-logo">'+IC.palette+'</div>'+
      '<div style="flex:1"><div class="studio-title">STYLE STUDIO</div><div class="studio-sub">BUILD YOUR PERFECT LOOK</div></div>'+
      '<span class="pill">'+IC.coins+'<span>'+fmt(profile.coins)+'</span></span></div>'+
    '<div class="preview" style="background:linear-gradient(135deg,'+bg.join(',')+')">'+
      '<span class="preview-tag">LIVE EFFECT PREVIEW</span>'+miniBoardHtml(arrowColors,board)+'</div>'+
    '<div class="tabs">'+
      [['ARROWS',IC.arrowFwd,'#ff4f9a'],['BOARDS',IC.layers,'#45d7ff'],['WORLDS',IC.landscape,'#75e45b']].map((t,i)=>
        '<button class="tab'+(i===tab?' active':'')+'" data-t="'+i+'"><span class="base"></span>'+t[1]+'<span>'+t[0]+'</span></button>').join('')+
    '</div><div class="skin-list">'+listHTML+'</div></div>';
  el.querySelectorAll('.tab').forEach(t=>t.addEventListener('click',()=>{skinsTab=+t.dataset.t;renderSkins()}));
  el.querySelectorAll('.skin-card').forEach(c=>c.addEventListener('click',()=>{
    unlockOrSelectSkin(c.dataset.id,tab===0?'arrow':tab===1?'board':'bg');
  }));
}
function miniBoardHtml(arrow,board){
  let cells='';
  for(let i=0;i<9;i++){
    const dirs=['UP','RIGHT','DOWN','LEFT'];
    cells+='<div class="mb-cell">'+(i%2===0?'<div class="skin-tile" style="background:'+arrow.tile+'"><svg viewBox="0 0 24 24" style="fill:'+arrow.ink+';transform:rotate('+(i%4?i*90:0)+'deg)"><path d="M4 20 L20 4 M11 4 L20 4 M20 4 L20 13"/></svg></div>':'')+'</div>';
  }
  return '<div class="mini-board" style="z-index:1"><div class="mb-sl" style="background:'+board.edge+'"></div>'+
    '<div class="mb-shell" style="background:'+board.shell+'">'+cells+'</div></div>';
}
function skinPreviewHtml(tab,id,dark){
  let bgC='rgba(255,255,255,.10)',inner='';
  if(tab===0){
    const a=arrowPalette(id);
    return '<div class="sub" style="background:'+a.tile+';'+(id==='plasma'?'animation:textPulse 0.7s ease-in-out infinite alternate':'')+'">'+
      '<svg viewBox="0 0 24 24" style="fill:'+a.ink+'"><path d="M4 20 L20 4 M11 4 L20 4 M20 4 L20 13"/></svg></div>';
  }
  if(tab===1){
    const b=boardPalette(id,dark);
    return '<div class="sub" style="background:transparent;box-shadow:none;display:flex;gap:4px;padding:0">'+
      '<div style="flex:1;height:100%;border-radius:6px;background:'+b.cell+'"></div>'+
      '<div style="flex:1;height:100%;border-radius:6px;background:'+b.cell+'"></div></div>';
  }
  const cols=backgroundPalette(id,dark);
  return '<div class="sub" style="border-radius:16px;width:60px;height:60px;background:linear-gradient(135deg,'+cols.join(',')+')">'+
    '<svg viewBox="0 0 24 24" style="fill:rgba(255,255,255,.4)"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16z"/></svg></div>';
}
/* ---------- REWARDS ---------- */
let adState={ready:true,showing:false};
function renderRewards(){
  const root=document.getElementById('screens');
  let el=document.getElementById('screen-rewards');
  if(!el){el=document.createElement('div');el.id='screen-rewards';el.className='screen screen-rewards';root.appendChild(el)}
  const giftAvail=profile.lastGiftDate!==today();
  el.innerHTML='<div class="bg"></div><div class="in">'+
    '<div class="rewards-head"><div class="rewards-logo">'+IC.trophy+'</div>'+
    '<div style="flex:1"><div class="rewards-title">REWARD VAULT</div><div class="rewards-sub">FREE LOOT &amp; POWER-UPS</div></div>'+
    '<span class="pill">'+IC.coins+'<span>'+fmt(profile.coins)+'</span></span>'+
    '<span class="pill" style="margin-left:6px">'+IC.diamond+'<span>'+fmt(profile.gems)+'</span></span></div>'+
    '<div class="chest-card" id="rw-gift"><div class="chest-left">'+
      '<div class="chest-title">'+(giftAvail?'DAILY TREASURE':'TREASURE OPENED')+'</div>'+
      '<div class="chest-name">'+(giftAvail?'Free Gift!':'Come back tomorrow')+'</div>'+
      '<div class="chest-sub">'+(giftAvail?'+75 coins &bull; +1 hint':'Your next chest is being prepared')+'</div>'+
      '<div class="d3 chest-btn"><span class="base" style="background:rgba(103,215,11,.4)"></span>'+
      '<span class="face" style="background:#67d70b;height:43px;font-weight:900;font-size:14px;color:#fff">'+(giftAvail?'OPEN NOW':'COLLECTED')+'</span></div></div>'+
      '<div class="chest-box"><div class="chest-glow"></div><div class="chest">'+IC.gift+'</div></div></div>'+
    '<div><div class="sec-title">WATCH &amp; EARN</div><div class="sec-sub">Every completed ad gives the full reward</div></div>'+
    '<div class="video-row">'+
      '<button class="video-btn" id="rw-coins"><span class="base" style="background:rgba(255,157,34,.4)"></span><span style="position:relative">'+
      '<span class="video-play" style="background:#ff9d22">'+IC.playArrow+'</span>'+
      '<span class="video-amt">+250</span><span class="video-lbl" style="color:#ff9d22">COINS</span>'+
      '<span class="video-status">'+(adState.showing?'SHOWING...':'WATCH AD')+'</span></span></button>'+
      '<button class="video-btn" id="rw-gems"><span class="base" style="background:rgba(112,78,255,.4)"></span><span style="position:relative">'+
      '<span class="video-play" style="background:#704eff">'+IC.playArrow+'</span>'+
      '<span class="video-amt">+5</span><span class="video-lbl" style="color:#704eff">GEMS</span>'+
      '<span class="video-status">'+(adState.showing?'SHOWING...':'WATCH AD')+'</span></span></button>'+
    '</div>'+
    '<div><div class="sec-title">POWER-UPS</div><div class="sec-sub">Spend coins earned by clearing levels</div></div>'+
    '<div class="power-card" data-p="3" data-c="120"><div class="base"></div><div class="top">'+
      '<div class="power-icon" style="background:#ffb327">'+IC.bulb+'</div>'+
      '<div style="flex:1"><div class="power-title">QUICK HINTS</div><div class="power-sub">3 safe-arrow reveals</div></div>'+
      '<button class="act-btn act-buy">'+IC.coins+'<span>120</span></button></div></div>'+
    '<div class="power-card" data-p="8" data-c="280"><div class="base"></div><div class="top">'+
      '<div class="power-icon" style="background:#31d4b5">'+IC.star+'</div>'+
      '<div style="flex:1"><div class="power-title">EXPLORER PACK</div><div class="power-sub">8 hints for harder boards</div></div>'+
      '<button class="act-btn act-buy">'+IC.coins+'<span>280</span></button></div></div>'+
    '<div class="founder" id="rw-premium">'+(profile.premium?IC.check:IC.premium)+'<div style="flex:1">'+
      '<div class="power-title">'+(profile.premium?'FOUNDER PASS ACTIVE':'FOUNDER PASS')+'</div>'+
      '<div class="power-sub">'+(profile.premium?'Permanent premium unlocked':'Exclusive badge and premium status')+'</div></div>'+
      '<div class="founder-price">'+(profile.premium?'OWNED':'500 '+IC.diamond)+'</div></div>'+
    '<div class="achieve"><div class="sec-title" style="color:#fff">ACHIEVEMENTS</div><div class="sec-sub">Keep clearing the path</div>'+
      '<div class="achieve-stats">'+achOrb(profile.totalPuzzles,'PUZZLES','#7854f7')+achOrb(profile.bestRushScore,'RUSH','#ff5a85')+achOrb(profile.completedLevel,'LEVEL','#36cda8')+'</div></div>'+
  '</div>';
  document.getElementById('rw-gift').onclick=()=>{claimDailyGift()};
  document.getElementById('rw-coins').onclick=()=>{watchAd(250,0)};
  document.getElementById('rw-gems').onclick=()=>{watchAd(0,5)};
  document.getElementById('rw-premium').onclick=()=>{purchasePremium()};
  el.querySelectorAll('.power-card').forEach(c=>c.addEventListener('click',()=>purchaseHints(+c.dataset.p,+c.dataset.c)));
}
function achOrb(v,lbl,c){
  return '<div class="ach-orb"><div class="o" style="background:'+c+'">'+fmt(v)+'</div><span>'+lbl+'</span></div>';
}
function watchAd(coinsR,gems){
  if(adState.showing)return;
  adState.showing=true;
  const overlay=document.getElementById('overlay');
  overlay.innerHTML='<div class="ad-box"><div class="ad-title">REWARDED AD</div>'+
    '<div class="ad-sub">A short sponsor video is playing&hellip;</div>'+
    '<div class="ad-ratio"><i id="ad-fill" style="width:0%"></i></div>'+
    '<div class="ad-reward">'+IC.coins+' <span id="ad-txt">'+coinsR+' coins</span> &nbsp; '+IC.diamond+' 5 gems</div></div>';
  overlay.classList.add('show');
  const t0=Date.now();
  const iv=setInterval(()=>{
    const k=Math.min((Date.now()-t0)/5000,1);
    document.getElementById('ad-fill').style.width=(k*100)+'%';
    document.getElementById('ad-txt').textContent=Math.round(k*6)+'s'; 
    if(k>=1){
      clearInterval(iv);
      adState.showing=false;
      overlay.classList.remove('show');overlay.innerHTML='';
      grantAdReward(coinsR,gems);
    }
  },100);
}
/* ---------- PROFILE ---------- */
function renderProfile(){
  const root=document.getElementById('screens');
  let el=document.getElementById('screen-profile');
  if(!el){el=document.createElement('div');el.id='screen-profile';el.className='screen screen-profile';root.appendChild(el)}
  const rank=Math.floor(profile.xp/300)+1;
  const xpIn=profile.xp%300;
  el.innerHTML='<div class="bg"></div><div class="in">'+
    '<div class="hero-card"><div class="hero-top">'+
      '<div class="hero-avatar"><div class="ring"></div><div class="core">'+rank+'</div></div>'+
      '<div style="flex:1"><div class="hero-role">PATHFINDER</div><div class="hero-name">PLAYER PROFILE</div>'+
      '<div class="hero-xp">Rank '+rank+' &bull; '+fmt(profile.xp)+' XP</div></div>'+
      (profile.premium?'<div class="hero-badge">'+IC.premium+'</div>':'')+
    '</div>'+
    '<div class="hero-rank"><div class="row"><span class="l">NEXT RANK</span><span class="r">'+xpIn+'/300 XP</span></div>'+
    '<div class="rank-bar"><i style="width:'+(xpIn/300*100)+'%"></i></div></div></div>'+
    '<div class="stat-row">'+
      statCard(profile.totalPuzzles,'PUZZLES','#7653f3')+statCard(profile.completedLevel,'LEVEL','#ff9f2a')+statCard(profile.bestRushScore,'RUSH','#ff527d')+
    '</div>'+
    '<div class="sec-label">GAME SETTINGS</div>'+
    setCard(IC.waves,'SOUND EFFECTS','Launches, hits and rewards','#734df0','sound',profile.soundEnabled)+
    setCard(IC.touch,'HAPTIC POWER','Feel every move and mistake','#ff9d2c','haptics',profile.hapticsEnabled)+
    setCard(IC.darkmode,'DARK WORLD','Deep purple game atmosphere','#2dcdb3','dark',profile.darkTheme)+
    '<div class="sec-label">PLAYER MILESTONES</div>'+
    mileCard(IC.trophy,'PUZZLE HUNTER',profile.totalPuzzles,100,'#ffa527')+
    mileCard(IC.shield,'LOGIC LEGEND',profile.completedLevel,1000,'#6c55ee')+
  '</div>';
  el.querySelectorAll('.set-card').forEach(c=>{
    c.addEventListener('click',()=>{setSetting(c.dataset.k,!JSON.parse(c.dataset.v))});
  });
}
function statCard(v,l,c){
  return '<div class="stat-card"><span class="base" style="background:'+c+'"></span><div class="top">'+
    '<div class="stat-val">'+fmt(v)+'</div><div class="stat-lbl" style="color:'+c+'">'+l+'</div></div></div>';
}
function setCard(ic,t,s,c,k,v){
  return '<div class="set-card" data-k="'+k+'" data-v="'+v+'"><div class="base"></div><div class="top">'+
    '<div class="set-icon" style="background:'+c+'">'+ic+'</div>'+
    '<div style="flex:1"><div class="set-title">'+t+'</div><div class="set-sub">'+s+'</div></div>'+
    '<div class="switch'+(v?' on':'')+'"><i></i></div></div></div>';
}
function mileCard(ic,t,v,target,c){
  const pct=Math.min(v/target,1)*100;
  return '<div class="mile-card"><div class="mile-icon" style="background:'+c+'">'+ic+'</div>'+
    '<div style="flex:1"><div class="mile-title">'+t+'</div><div class="mile-bar"><i style="width:'+pct+'%;background:'+c+'"></i></div></div>'+
    '<div class="mile-count" style="color:'+c+'">'+Math.min(v,target)+'/'+target+'</div></div>';
}
/* ---------- GAME SCREEN ---------- */
function renderGame(){
  const root=document.getElementById('screens');
  let el=document.getElementById('screen-game');
  if(!el){el=document.createElement('div');el.id='screen-game';el.className='screen screen-game no-scroll';root.appendChild(el)}
  if(!session){showScreen('home');return}
  const s=session;
  const title=s.mode===MODE.JOURNEY?'LEVEL '+s.level:s.mode===MODE.DAILY?'DAILY PUZZLE':s.mode===MODE.ZEN?'ZEN BOARD '+s.level:'RUSH';
  const subtitle=s.mode===MODE.JOURNEY?'DIFFICULTY '+s.puzzle.difficulty:s.mode===MODE.DAILY?'TODAY &bull; EXPERT':s.mode===MODE.ZEN?'TAKE YOUR TIME':s.score+' POINTS';
  const dark=profile.darkTheme;
  const bgs=backgroundPalette(profile.selectedBackgroundSkin,dark);
  const board=boardPalette(profile.selectedBoardSkin,dark);
  const accent=boardAccentFor(profile.selectedBackgroundSkin);
  let particles='';
  for(let i=0;i<12;i++){
    particles+='<div style="position:absolute;left:'+(i*73%100)+'%;top:'+(i*41%100)+'%;width:'+(7+i%5*4)+'px;height:'+(7+i%5*4)+'px;border-radius:50%;background:'+accent+
      ';opacity:.05;animation:floaty '+(3+i%2*2)+'s ease-in-out infinite alternate"></div>';
  }
  el.innerHTML='<div class="bg" style="position:absolute;inset:0;background:linear-gradient(180deg,'+bgs.join(',')+')">'+particles+'</div>'+
  '<div class="in">'+
    '<div class="game-top">'+
      '<button class="back-btn" id="gb-back">'+IC.back+'</button>'+
      '<div style="flex:1;text-align:center"><div class="game-title">'+title+'</div><div class="game-sub">'+subtitle+'</div></div>'+
      '<div class="timer-box" style="color:'+(s.mode===MODE.RUSH&&s.seconds<=15?'#ff6b6b':'inherit')+'">'+IC.timer+'<span id="gt-timer">'+(s.mode===MODE.RUSH?s.seconds+'s':timeStr(s.seconds))+'</span></div>'+
    '</div>'+
    '<div class="game-mid">'+
      '<div id="gt-lives">'+(s.mode===MODE.JOURNEY||s.mode===MODE.DAILY?heartsHtml(s.hearts):'<span class="lives-lbl">'+(s.mode===MODE.ZEN?'\u221E LIVES':s.boardsCleared+' BOARDS')+'</span>')+'</div>'+
      '<span class="spacer"></span><span class="left-lbl"><span id="gt-left">'+s.remainingIds.size+'</span> LEFT</span>'+
      '<span class="moves-lbl" id="gt-moves">'+s.moves+' MOVES</span>'+
    '</div>'+
    '<div class="progress" style="margin-top:9px"><i id="gt-prog" style="width:'+(sessionProgress(s)*100)+'%"></i></div>'+
    '<div class="board-wrap"><div class="board-holder" id="board-holder">'+
      '<div class="board-tilt" id="board-tilt">'+
        '<div class="board-edge" id="board-edge" style="background:'+board.edge+'"></div>'+
        '<div class="board-shell" style="background:'+board.shell+'">'+
          '<canvas id="board-canvas"></canvas>'+
        '</div>'+
      '</div>'+
      '<button class="reset-view" id="reset-view" style="display:none">RESET VIEW</button>'+
    '</div></div>'+
    '<div class="hint-text'+(s.hintTileId!==null?' on':'')+'" id="gt-hint">'+(s.hintTileId!==null?'The glowing arrow has a clear path':s.puzzle.rows>=7?'Pinch to zoom &bull; drag to pan &bull; tap arrows':'Tap arrows &bull; drag the board to tilt it in 3D')+'</div>'+
    '<div class="tool-row">'+
      '<button class="tool" id="gt-undo" '+(s.removedIds.length===0||s.inputLocked?'disabled':'')+'>'+
        '<span class="btn3d"><span class="b"></span>'+IC.undo+'</span><span>UNDO</span></button>'+
      '<button class="tool" id="gt-hint">'+
        '<span class="hint3d"><span class="b"></span>'+IC.bulb+'<b>'+profile.hints+'</b></span><span>HINT</span></button>'+
      '<button class="tool" id="gt-retry" '+(s.inputLocked?'disabled':'')+'>'+
        '<span class="btn3d"><span class="b"></span>'+IC.restart+'</span><span>RESTART</span></button>'+
    '</div>'+
  '</div>';
  document.getElementById('gb-back').onclick=()=>{showScreen('home');renderHome()};
  document.getElementById('gt-undo').onclick=()=>undo();
  document.getElementById('gt-hint').onclick=()=>useHint();
  document.getElementById('gt-retry').onclick=()=>retry();
  document.getElementById('reset-view').onclick=()=>resetView();
  resetView();
  fitBoard();
  initBoardGestures();
  if(s.status===STATUS.FAILED)showFailDialog();
  if(s.status===STATUS.COMPLETE)showCompleteDialog();
}
function heartsHtml(n){
  let h='<div class="hearts">';
  for(let i=0;i<3;i++)h+= i<n?'<svg viewBox="0 0 24 24" style="fill:#ff5e6c"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>'
    :'<svg viewBox="0 0 24 24" style="fill:#41516a"><path d="M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3zm-4.4 15.55-.1.1-.1-.1C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05z"/></svg>';
  return h+'</div>';
}
function fitBoard(){
  const wrap=document.querySelector('.board-wrap');
  const holder=document.getElementById('board-holder');
  if(!wrap||!holder)return;
  const size=Math.min(wrap.clientWidth,wrap.clientHeight);
  holder.style.width=size+'px';
  holder.style.height=size+'px';
}
function updateTimerUI(){
  const t=document.getElementById('gt-timer');
  if(t&&session){
    const s=session;
    t.textContent=s.mode===MODE.RUSH?s.seconds+'s':timeStr(s.seconds);
    t.parentElement.style.color=s.mode===MODE.RUSH&&s.seconds<=15?'#ff6b6b':'';
  }
  const l=document.getElementById('gt-left');
  if(l&&session)l.textContent=session.remainingIds.size;
  const m=document.getElementById('gt-moves');
  if(m&&session)m.textContent=session.moves+' MOVES';
  const lb=document.getElementById('gt-lives');
  if(lb&&session){
    if(session.mode===MODE.JOURNEY||session.mode===MODE.DAILY)lb.innerHTML=heartsHtml(session.hearts);
    else lb.innerHTML='<span class="lives-lbl">'+(session.mode===MODE.ZEN?'\u221E LIVES':session.boardsCleared+' BOARDS')+'</span>';
  }
  const p=document.getElementById('gt-prog');
  if(p&&session)p.style.width=(sessionProgress(session)*100)+'%';
}
/* ---------- dialogs ---------- */
function getDialogRoot(){
  let d=document.getElementById('dialog-root');
  if(!d){d=document.createElement('div');d.id='dialog-root';document.body.appendChild(d)}
  return d;
}
function hideDialogs(){getDialogRoot().innerHTML=''}
function showFailDialog(){
  const d=getDialogRoot();
  d.innerHTML='<div class="dialog show"><div class="dialog-card" style="background:linear-gradient(180deg,#3a1247,#241040)">'+
    '<div class="dlg-icon" style="background:rgba(255,107,107,.15)">'+IC.heartEmpty+'</div>'+
    '<div class="dlg-title">Out of lives</div>'+
    '<div class="dlg-text">The board is still solvable. Continue with three fresh lives, or restart and try a new order.</div>'+
    '<button class="dlg-btn" id="fd-cont"><span class="b" style="background:#46309c"></span><span class="face" style="background:#6a5ae0">'+IC.diamond+' 15 &bull; CONTINUE</span></button>'+
    '<div class="dlg-row"><button class="dlg-btn" id="fd-restart"><span class="b" style="background:#101030"></span><span class="face" style="background:#2a2a55">RESTART</span></button>'+
    '<button class="dlg-btn" id="fd-home"><span class="b" style="background:#101030"></span><span class="face" style="background:#2a2a55">HOME</span></button></div>'+
  '</div></div>';
  document.getElementById('fd-cont').onclick=()=>{hideDialogs();continueAfterFail()};
  document.getElementById('fd-restart').onclick=()=>{hideDialogs();retry()};
  document.getElementById('fd-home').onclick=()=>{hideDialogs();abandonGame()};
}
function showCompleteDialog(){
  const d=getDialogRoot();
  const s=session;
  const isRush=s.mode===MODE.RUSH,isZen=s.mode===MODE.ZEN;
  const earnedStars=isRush?3:Math.max(s.earnedStars,1);
  let confetti='';
  const cols=['#ffc12f','#54dbff','#ff4f91','#77e557'];
  for(let i=0;i<24;i++){
    confetti+='<i style="left:'+(i*43%100)+'%;background:'+cols[i%4]+';animation-duration:'+(1.4+i%5*.3)+'s;animation-delay:'+(i%8*.15)+'s"></i>';
  }
  const coins=isRush?'+'+fmt(Math.max(Math.floor(s.score/30),15)):'+'+fmt(s.rewardCoins);
  d.innerHTML='<div class="dialog show"><div class="dialog-card complete-card">'+
    '<div class="confetti">'+confetti+'</div>'+
    '<div class="badge-circle">'+(isRush?'&#9889;':'&#10003;')+'</div>'+
    '<div class="complete-title">'+(isRush?'TIME\'S UP!':'LEVEL CLEARED!')+'</div>'+
    '<div class="complete-sub">'+(isRush?'AMAZING RUN':'PERFECT LOGIC')+'</div>'+
    '<div class="stars-row">'+[0,1,2].map(i=>{
      const earned=isRush||i<earnedStars;
      return '<div class="star '+(earned?'earned':'empty')+'">'+(earned?'\u2605':'\u2606')+'</div>';
    }).join('')+'</div>'+
    '<div class="complete-stats">'+(isRush?s.boardsCleared+' BOARDS &bull; '+fmt(s.score)+' POINTS':s.moves+' MOVES &bull; '+timeStr(s.seconds))+'</div>'+
    '<div class="reward-pill">'+IC.coins+'<span>'+coins+'</span>'+(s.rewardGems>0?'<span style="margin-left:10px">'+IC.diamond+'<span style="color:#62dfff;margin-left:4px">+'+s.rewardGems+'</span></span>':'')+'</div>'+
    '<div class="d3 complete-ok" id="gc-next"><span class="b"></span><span class="face">'+(isRush?'PLAY AGAIN':isZen?'NEW BOARD':'NEXT LEVEL')+'</span></div>'+
    '<button class="complete-home" id="gc-home">BACK TO HOME</button>'+
  '</div></div>';
  document.getElementById('gc-next').onclick=()=>{hideDialogs();nextPuzzle()};
  document.getElementById('gc-home').onclick=()=>{hideDialogs();abandonGame()};
}
/* ---------- main loop & boot ---------- */
function animLoop(){
  hintPulse01+=0.016/0.7*(hintPulseDir);
  if(hintPulse01>1){hintPulse01=1;hintPulseDir=-1}
  if(hintPulse01<.65){hintPulse01=.65;hintPulseDir=1}
  glowPulse+=0.016/5.2*2*Math.PI;
  if(document.getElementById('board-canvas'))renderBoardFrame();
  requestAnimationFrame(animLoop);
}
window.addEventListener('resize',()=>{fitBoard()});
window.addEventListener('orientationchange',()=>setTimeout(fitBoard,200));
restoreSession();
renderHome();
showScreen('home');
requestAnimationFrame(animLoop);