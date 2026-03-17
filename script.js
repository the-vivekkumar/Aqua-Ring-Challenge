const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Fullscreen canvas
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// UI
const startBtn = document.getElementById("startBtn");
const startScreen = document.getElementById("startScreen");
const loadingScreen = document.getElementById("loadingScreen");
const gameUI = document.getElementById("gameUI");
const completeScreen = document.getElementById("completeScreen");

const restartBtn = document.getElementById("restartBtn");
const nextLevelBtn = document.getElementById("nextLevelBtn");
const exitBtn = document.getElementById("exitBtn");

const exitPopup = document.getElementById("exitPopup");
const closePopup = document.getElementById("closePopup");

const scoreText = document.getElementById("scoreText");
const levelText = document.getElementById("levelText");

// Game state
let level = 1;
let rings = [];
let pegs = [];
let fishes = [];
let gameRunning = false;

let keys = { left:false, right:false, pump:false };

// 🐟 REAL FISH ANIMATION
class Fish {
  constructor() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.speed = 1 + Math.random() * 2;
    this.size = 20 + Math.random() * 10;
    this.color = `hsl(${Math.random()*360},70%,60%)`;
    this.offset = Math.random() * 100;
  }

  update(time) {
    this.x += this.speed;
    this.y += Math.sin(time * 0.002 + this.offset) * 0.5;

    if (this.x > canvas.width + 50) {
      this.x = -50;
      this.y = Math.random() * canvas.height;
    }
  }

  draw() {
    ctx.fillStyle = this.color;

    // Body
    ctx.beginPath();
    ctx.ellipse(this.x, this.y, this.size, this.size/2, 0, 0, Math.PI*2);
    ctx.fill();

    // Tail
    ctx.beginPath();
    ctx.moveTo(this.x - this.size, this.y);
    ctx.lineTo(this.x - this.size - 10, this.y - 10);
    ctx.lineTo(this.x - this.size - 10, this.y + 10);
    ctx.closePath();
    ctx.fill();

    // Eye
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(this.x + this.size/3, this.y - 3, 3, 0, Math.PI*2);
    ctx.fill();
  }
}

// 🎯 RING (BOLD + GLOW)
class Ring {
  constructor(x,y){
    this.x=x; this.y=y;
    this.r=12;
    this.vx=0; this.vy=0;
    this.active=true;
  }

  update(){
    this.vy+=0.15;
    this.vx*=0.99;
    this.vy*=0.98;

    this.x+=this.vx;
    this.y+=this.vy;

    // Boundaries
    if(this.x<this.r) this.x=this.r;
    if(this.x>canvas.width-this.r) this.x=canvas.width-this.r;
    if(this.y>canvas.height-this.r) this.y=canvas.height-this.r;
    if(this.y<this.r) this.y=this.r;
  }

  draw(){
    if(!this.active) return;

    ctx.beginPath();
    ctx.arc(this.x,this.y,this.r,0,Math.PI*2);

    ctx.lineWidth = 5;
    ctx.strokeStyle = "white";

    ctx.shadowColor = "rgba(255,255,255,0.8)";
    ctx.shadowBlur = 10;

    ctx.stroke();

    ctx.shadowBlur = 0;
  }
}

// 🎯 MOVING TARGET
class Peg {
  constructor(x,y){
    this.baseX=x;
    this.baseY=y;
    this.x=x;
    this.y=y;
    this.r=15;
    this.occupied=false;
    this.offset=Math.random()*100;
  }

  update(time){
    this.x = this.baseX + Math.sin(time*0.002 + this.offset)*80;
    this.y = this.baseY + Math.cos(time*0.002 + this.offset)*30;
  }

  draw(){
    ctx.beginPath();
    ctx.arc(this.x,this.y,this.r,0,Math.PI*2);
    ctx.fillStyle = this.occupied ? "lime" : "gold";
    ctx.fill();
  }
}

// Init fish
function initFish(){
  fishes = [];
  for(let i=0;i<12;i++) fishes.push(new Fish());
}

// Init level
function initLevel(){
  rings = [];
  pegs = [];

  let count = 3 + level;

  for(let i=0;i<count;i++)
    rings.push(new Ring(canvas.width/2, canvas.height-120));

  for(let i=0;i<count;i++){
    let spacing = canvas.width/(count+1);
    pegs.push(new Peg(spacing*(i+1), canvas.height/3));
  }

  initFish();
  gameRunning = true;
  gameLoop();
}

// Controls
function pump(){
  rings.forEach(r => r.active && (r.vy -= 4));
}

function move(d){
  rings.forEach(r => r.active && (r.vx += d));
}

// Collision
function checkScore(){
  rings.forEach(r=>{
    if(!r.active) return;

    pegs.forEach(p=>{
      if(p.occupied) return;

      let dx = r.x - p.x;
      let dy = r.y - p.y;

      if(Math.sqrt(dx*dx + dy*dy) < p.r){
        r.active = false;
        p.occupied = true;
      }
    });
  });
}

// 🎮 GAME LOOP
function gameLoop(time=0){
  if(!gameRunning) return;

  ctx.clearRect(0,0,canvas.width,canvas.height);

  // Water BG
  let g = ctx.createLinearGradient(0,0,0,canvas.height);
  g.addColorStop(0,"#00c6ff");
  g.addColorStop(1,"#003566");
  ctx.fillStyle = g;
  ctx.fillRect(0,0,canvas.width,canvas.height);

  // Fish
  fishes.forEach(f=>{
    f.update(time);
    f.draw();
  });

  // Controls
  if(keys.left) move(-1);
  if(keys.right) move(1);
  if(keys.pump) pump();

  // Update
  rings.forEach(r=>{ r.update(); r.draw(); });
  pegs.forEach(p=>{ p.update(time); p.draw(); });

  checkScore();

  let placed = pegs.filter(p=>p.occupied).length;

  scoreText.innerText = `Placed: ${placed}/${pegs.length}`;
  levelText.innerText = `Level: ${level}`;

  // Level complete
  if(placed === pegs.length){
    gameRunning = false;
    gameUI.classList.add("hidden");
    completeScreen.classList.remove("hidden");
    return;
  }

  requestAnimationFrame(gameLoop);
}

// FLOW
startBtn.onclick = ()=>{
  startScreen.classList.add("hidden");
  loadingScreen.classList.remove("hidden");

  setTimeout(()=>{
    loadingScreen.classList.add("hidden");
    gameUI.classList.remove("hidden");
    initLevel();
  },1200);
};

restartBtn.onclick = ()=> initLevel();

nextLevelBtn.onclick = ()=>{
  level++;
  completeScreen.classList.add("hidden");
  gameUI.classList.remove("hidden");
  initLevel();
};

exitBtn.onclick = ()=>{
  gameRunning = false;
  exitPopup.classList.remove("hidden");
};

closePopup.onclick = ()=>{
  exitPopup.classList.add("hidden");
  startScreen.classList.remove("hidden");
  gameUI.classList.add("hidden");
};

// Keyboard
document.addEventListener("keydown",e=>{
  if(e.code==="ArrowLeft") keys.left=true;
  if(e.code==="ArrowRight") keys.right=true;
  if(e.code==="Space") keys.pump=true;
});

document.addEventListener("keyup",e=>{
  if(e.code==="ArrowLeft") keys.left=false;
  if(e.code==="ArrowRight") keys.right=false;
  if(e.code==="Space") keys.pump=false;
});