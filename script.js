const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const W = canvas.width;
const H = canvas.height;

const lanes = 5;
const laneW = W / lanes;

let drop;
let obstacles = [];
let frame = 0;
let score = 0;
let lives = 3;
let running = false;
let baseSpeed = 2;

const encouragementMessages = [
  "Great effort — keep going!",
  "Nice try! Every round gets better.",
  "You’re improving — play again!",
  "Keep pushing, you’ve got this.",
  "That was a good run!",
  "Progress comes one try at a time."
];

class Drop {
  constructor() {
    this.lane = 2;
    this.x = this.center(this.lane);
    this.targetX = this.x;
    this.y = H * 0.35;
    this.r = 18;
  }

  center(l) {
    return l * laneW + laneW / 2;
  }

  update() {
    this.x += (this.targetX - this.x) * 0.18;
  }

  draw() {
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#444";

    ctx.beginPath();
    ctx.moveTo(this.x, this.y - this.r);

    ctx.bezierCurveTo(
      this.x + this.r,
      this.y - this.r * 0.3,
      this.x + this.r * 0.6,
      this.y + this.r,
      this.x,
      this.y + this.r
    );

    ctx.bezierCurveTo(
      this.x - this.r * 0.6,
      this.y + this.r,
      this.x - this.r,
      this.y - this.r * 0.3,
      this.x,
      this.y - this.r
    );

    ctx.stroke();
  }

  moveLeft() {
    this.lane = Math.max(0, this.lane - 1);
    this.targetX = this.center(this.lane);
  }

  moveRight() {
    this.lane = Math.min(lanes - 1, this.lane + 1);
    this.targetX = this.center(this.lane);
  }
}

class Obstacle {
  constructor() {
    this.lane = Math.floor(Math.random() * lanes);
    this.x = this.lane * laneW + laneW / 2;
    this.y = H + 40;
    this.size = 22;
    this.speed = baseSpeed + Math.random() * 0.8;
    this.type = ["circle", "triangle", "blob"][Math.floor(Math.random() * 3)];
  }

  update() {
    this.y -= this.speed;
  }

  draw() {
    ctx.strokeStyle = "#444";
    ctx.lineWidth = 3;

    if (this.type === "circle") {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size / 2, 0, Math.PI * 2);
      ctx.stroke();
    } else if (this.type === "triangle") {
      ctx.beginPath();
      ctx.moveTo(this.x, this.y - this.size / 2);
      ctx.lineTo(this.x + this.size / 2, this.y + this.size / 2);
      ctx.lineTo(this.x - this.size / 2, this.y + this.size / 2);
      ctx.closePath();
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size / 2, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
}

function spawn() {
  obstacles.push(new Obstacle());
}

function startGame() {
  document.getElementById("startOverlay").classList.add("hidden");
  document.getElementById("gameOverOverlay").classList.add("hidden");

  drop = new Drop();
  obstacles = [];
  score = 0;
  lives = 3;
  frame = 0;
  baseSpeed = 2;

  document.querySelector("#score b").textContent = score;
  updateLives();

  running = true;
  loop();
}

function loop() {
  if (!running) return;

  frame++;
  baseSpeed += 0.002;

  ctx.clearRect(0, 0, W, H);

  drop.update();
  drop.draw();

  if (frame % 80 === 0) {
    spawn();
  }

  for (let i = obstacles.length - 1; i >= 0; i--) {
    let o = obstacles[i];

    o.update();
    o.draw();

    let dx = Math.abs(drop.x - o.x);
    let dy = Math.abs(drop.y - o.y);

    if (dx < 25 && dy < 25) {
      lives--;
      updateLives();
      obstacles.splice(i, 1);

      if (lives <= 0) {
        endGame();
        return;
      }

      continue;
    }

    if (o.y < -40) {
      score++;
      document.querySelector("#score b").textContent = score;
      obstacles.splice(i, 1);
    }
  }

  requestAnimationFrame(loop);
}

function updateLives() {
  let hearts = "";

  for (let i = 0; i < lives; i++) {
    hearts += "❤";
  }

  document.getElementById("lifeIcons").textContent = hearts;
}

function endGame() {
  running = false;

  document.getElementById("finalScore").textContent = "Score: " + score;

  const randomMessage =
    encouragementMessages[Math.floor(Math.random() * encouragementMessages.length)];

  const encouragementEl = document.getElementById("encouragement");
  if (encouragementEl) {
    encouragementEl.textContent = randomMessage;
  }

  document.getElementById("gameOverOverlay").classList.remove("hidden");
}

window.addEventListener("keydown", (e) => {
  if (!running) return;

  if (e.key === "ArrowLeft") drop.moveLeft();
  if (e.key === "ArrowRight") drop.moveRight();
});

function moveLeft() {
  if (running) drop.moveLeft();
}

function moveRight() {
  if (running) drop.moveRight();
}

