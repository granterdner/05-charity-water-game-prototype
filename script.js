const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const W = canvas.width;
const H = canvas.height;

let frameCount = 0;
let drop;
let obstacles = [];
let spawnInterval = 90;
let spawnTimer = 0;
let baseSpeed = 2.2;
let score = 0;
let lives = 3;
let gameRunning = false;

// Lanes
const lanes = 5;
const laneWidth = W / lanes;

// Cheerful colors for obstacles
const obstacleColors = ['#ff6b6b','#ffd93d','#6bcfff','#ff9f1c','#9b59b6','#00ff7f'];

// Drop class
class Drop {
  constructor() {
    this.lane = 2;
    this.targetLane = 2;
    this.x = this.laneCenter(this.lane);
    this.y = H * 0.35;
    this.r = 14;
    this.hit = false;
    this.hitTimer = 0;
    this.visible = true;
  }

  laneCenter(lane) {
    return lane * laneWidth + laneWidth/2;
  }

  update() {
    const targetX = this.laneCenter(this.targetLane);
    this.x += (targetX - this.x) * 0.18;

    if(this.hit) {
      this.hitTimer++;
      this.visible = (this.hitTimer % 14 < 7);
      if(this.hitTimer > 42) {
        this.hit = false;
        this.visible = true;
      }
    }
  }

  draw() {
    if(!this.visible) return;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.beginPath();
    ctx.moveTo(0, -this.r);
    ctx.bezierCurveTo(this.r*0.7,-this.r*0.7,this.r,this.r*0.6,0,this.r);
    ctx.bezierCurveTo(-this.r,this.r*0.6,-this.r*0.7,-this.r*0.7,0,-this.r);
    const grad = ctx.createRadialGradient(0,-this.r*0.2,2,0,0,this.r);
    grad.addColorStop(0,'#fffd82');
    grad.addColorStop(1,'#ff6b6b');
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(-this.r*0.25,-this.r*0.1,this.r*0.2,this.r*0.1,0,0,2*Math.PI);
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fill();
    ctx.restore();
  }

  moveLeft() { this.targetLane = Math.max(0,this.targetLane-1); }
  moveRight() { this.targetLane = Math.min(lanes-1,this.targetLane+1); }

  checkCollision(ob) {
    if(this.hit) return false;
    const dx = Math.abs(this.x - ob.x);
    const dy = Math.abs(this.y - ob.y);
    if(dx < ob.size*0.85 + this.r*0.65 && dy < ob.size*0.75 + this.r*0.65) {
      this.hit = true;
      this.hitTimer = 0;
      lives--;
      updateLives();
      if(lives <= 0) endGame();
      return true;
    }
    return false;
  }
}

class Obstacle {
  constructor() {
    this.lane = Math.floor(Math.random()*lanes);
    this.x = this.lane*laneWidth + laneWidth/2;
    this.y = H + 30;
    this.size = 18 + Math.random()*14;
    this.speed = baseSpeed + Math.random()*0.8;
    this.shape = ['rect','triangle','circle'][Math.floor(Math.random()*3)];
    this.color = obstacleColors[Math.floor(Math.random()*obstacleColors.length)];
  }

  update() { this.y -= this.speed; }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.shadowBlur = 12;
    ctx.shadowColor = this.color;
    ctx.fillStyle = this.color;
    if(this.shape==='rect'){
      const s=this.size;
      ctx.fillRect(-s/2,-s/2,s,s);
    } else if(this.shape==='triangle'){
      const s=this.size;
      ctx.beginPath();
      ctx.moveTo(0,-s/2);
      ctx.lineTo(s/2,s/2);
      ctx.lineTo(-s/2,s/2);
      ctx.closePath();
      ctx.fill();
    } else if(this.shape==='circle'){
      ctx.beginPath();
      ctx.arc(0,0,this.size/2,0,Math.PI*2);
      ctx.fill();
    }
    ctx.restore();
  }
}

function updateLives() {
  const livesEl = document.getElementById('lives');
  livesEl.innerHTML = '';
  for(let i=0;i<3;i++){
    const span = document.createElement('span');
    span.innerText = '♦';
    span.style.color = i<lives ? '#ff6b6b':'#ccc';
    span.style.marginRight = '4px';
    livesEl.appendChild(span);
  }
}

function spawnObstacle() { obstacles.push(new Obstacle()); }

function startGame() {
  document.getElementById('startOverlay').style.display='none';
  document.getElementById('gameOverOverlay').style.display='none';
  frameCount=0; obstacles=[]; spawnInterval=90; baseSpeed=2.2; score=0; lives=3;
  updateLives();
  drop=new Drop();
  gameRunning=true;
  requestAnimationFrame(gameLoop);
}

function endGame(){
  gameRunning=false;
  document.getElementById('finalScore').innerText='Score: '+score;
  document.getElementById('gameOverOverlay').style.display='flex';
}

function drawLanes(){
  ctx.strokeStyle='rgba(255,255,255,0.3)';
  ctx.lineWidth=2;
  ctx.setLineDash([4,4]);
  ctx.lineDashOffset=-frameCount*2;
  for(let i=1;i<lanes;i++){
    const x=i*laneWidth;
    ctx.beginPath();
    ctx.moveTo(x,0);
    ctx.lineTo(x,H);
    ctx.stroke();
  }
  ctx.setLineDash([]);
}

function gameLoop(){
  if(!gameRunning) return;
  frameCount++;
  ctx.clearRect(0,0,W,H);
  drawLanes();
  drop.update(); drop.draw();

  spawnTimer++;
  if(spawnTimer>=spawnInterval){ spawnTimer=0; spawnObstacle(); }

  for(let i=obstacles.length-1;i>=0;i--){
    const ob=obstacles[i];
    ob.update(); ob.draw();
    drop.checkCollision(ob);
    if(ob.y < -ob.size-20){
      obstacles.splice(i,1);
      score++;
      document.getElementById('score').innerText='Score: '+score;
    }
  }

  if(frameCount%400===0){ baseSpeed+=0.25; spawnInterval=Math.max(28,spawnInterval-5); }

  requestAnimationFrame(gameLoop);
}

window.addEventListener('keydown',e=>{
  if(!gameRunning) return;
  if(e.key==='ArrowLeft') drop.moveLeft();
  if(e.key==='ArrowRight') drop.moveRight();
});

function moveLeft(){ if(gameRunning) drop.moveLeft(); }
function moveRight(){ if(gameRunning) drop.moveRight(); }
