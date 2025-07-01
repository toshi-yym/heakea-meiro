/*
 * "白詰草のヘアケア迷路" – simple maze / quiz game
 * Author: Cascade AI helper 2025-06-21
 */

// ============== GAME DATA =================
let tileSize = 32;
const cols = 10;
const rows = 10;

// 0 = wall, 1 = path, 2 = goal
const maze = [
  [1,0,0,0,0,0,0,0,0,0],
  [1,1,1,1,0,1,1,1,1,0],
  [0,0,0,1,0,1,0,0,1,0],
  [0,1,0,1,1,1,0,1,1,0],
  [0,1,0,0,0,0,0,1,0,0],
  [0,1,1,1,1,1,0,1,0,0],
  [0,0,0,0,0,1,0,1,0,0],
  [0,1,1,1,0,1,1,1,1,0],
  [0,1,0,1,0,0,0,0,1,0],
  [0,1,0,1,1,1,1,0,1,2]
];

// Item definitions
const itemsSprite = new Image();
itemsSprite.src = "ChatGPT Image.png"; // sprite with 3 icons horizontally
let itemW = 0;
itemsSprite.onload = () => { itemW = itemsSprite.width / 3; render(); };

const items = [
  { name: "シャンプー", key: "shampoo", col: 7, row: 7, spriteIdx: 0, quiz: { q: "シャンプーで大事なのはどっち？", a: ["髪の毛を洗う", "頭皮を洗う"], correct: 0, hint: "頭皮の汚れは予洗いでほとんど取れるよ！" } },
  { name: "トリートメント", key: "treatment", col: 7, row: 4, spriteIdx: 1, quiz: { q: "髪の傷みはトリートメントで治る？", a: ["治る", "治らない"], correct: 1, hint: "髪は一度傷んだら治らない死滅細胞なんだよ！" } },
  { name: "ドライヤー", key: "dryer", col: 2, row: 1, spriteIdx: 2, quiz: { q: "髪の乾かし方はどっちが良い？", a: ["半乾きで終わる", "完全に乾かす"], correct: 1, hint: "髪は濡れた状態が一番傷みやすいよ！" } }
];

let collected = {};
items.forEach(it => (collected[it.key] = false));
let hairLevel = 0; // 0-3

// ===== Cheer Bubble =====
const cheerBubble = document.getElementById("cheerBubble");
function updateCheer(){
  const phrases=["頑張れ～","こっちだよ～","あと少しだよ～",""]; // for hairLevel 0-3
  cheerBubble.textContent = phrases[Math.min(hairLevel,3)];
}
updateCheer();

const player = { col: 0, row: 0 };

// ============== CANVAS =================
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
// recalculate tile size based on new canvas width
function computeTile(){ tileSize = canvas.width / cols; }
computeTile();
window.addEventListener('resize',()=>{computeTile();render();});

function drawMaze() {
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const val = maze[r][c];
      let color;
      if (val === 0) color = "#dfe8f2"; // wall
      else if (val === 2) color = "#e6ffe6"; // goal
      else color = "#ffffff"; // path
      ctx.fillStyle = color;
      ctx.fillRect(c * tileSize, r * tileSize, tileSize, tileSize);
    }
  }
}

function drawItems() {
  items.forEach(it => {
    if (collected[it.key]) return;
    if (itemsSprite.complete && itemW) {
      const sx = it.spriteIdx * itemW;
      const sy = 0;
      const sw = itemW;
      const sh = itemsSprite.height;
      const dw = tileSize * 0.8;
      const dh = (sh / sw) * dw;
      ctx.drawImage(itemsSprite, sx, sy, sw, sh,
        it.col * tileSize + (tileSize - dw)/2,
        it.row * tileSize + (tileSize - dh)/2,
        dw, dh);
    } else {
      // fallback circle while image loading
      ctx.fillStyle = "#ffe8ec";
      ctx.beginPath();
      ctx.arc(it.col * tileSize + tileSize/2, it.row * tileSize + tileSize/2, tileSize/3,0,Math.PI*2);
      ctx.fill();
    }
  });
}

function drawPlayer() {
  // body
  ctx.fillStyle = "#ffdab9"; // skin tone
  ctx.beginPath();
  ctx.arc(
    player.col * tileSize + tileSize / 2,
    player.row * tileSize + tileSize / 2,
    tileSize / 3,
    0,
    Math.PI * 2
  );
  ctx.fill();

    // === Hair overlay – visual changes by level ===
  const hairStyles = [
    { color: "#6b4e3d", spikes: 6, shine: false }, // messy
    { color: "#8b614e", spikes: 3, shine: false }, // a little better
    { color: "#c27d56", spikes: 0, shine: false }, // smooth
    { color: "#e2b17e", spikes: 0, shine: true }  // shiny with highlight
  ];
  const hs = hairStyles[hairLevel];

  // base hair arc
  ctx.fillStyle = hs.color;
  ctx.beginPath();
  ctx.arc(
    player.col * tileSize + tileSize / 2,
    player.row * tileSize + tileSize / 2 - 8,
    tileSize / 3,
    Math.PI,
    0
  );
  ctx.fill();

  // draw spikes for messy hair
  if (hs.spikes > 0) {
    ctx.strokeStyle = hs.color;
    ctx.lineWidth = 2;
    const centerX = player.col * tileSize + tileSize / 2;
    const centerY = player.row * tileSize + tileSize / 2 - 8;
    for (let i = 0; i < hs.spikes; i++) {
      const angle = (i / hs.spikes) * Math.PI - Math.PI; // top half
      const x1 = centerX + Math.cos(angle) * (tileSize / 3);
      const y1 = centerY + Math.sin(angle) * (tileSize / 3);
      const x2 = centerX + Math.cos(angle) * (tileSize / 3 + 6);
      const y2 = centerY + Math.sin(angle) * (tileSize / 3 + 6);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
  }

  // add shine for perfect hair
  if (hs.shine) {
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    const x = player.col * tileSize + tileSize / 2 + 4;
    const y = player.row * tileSize + tileSize / 2 - 14;
    ctx.beginPath();
    ctx.moveTo(x - 4, y);
    ctx.lineTo(x + 4, y);
    ctx.moveTo(x, y - 4);
    ctx.lineTo(x, y + 4);
    ctx.stroke();
  }

  // === body & dress ===
  const cx = player.col * tileSize + tileSize / 2;
  const headBottomY = player.row * tileSize + tileSize / 2 + tileSize / 3;
  const dressHeight = tileSize * 0.8;
  ctx.fillStyle = "#ffc7d1"; // pastel dress color
  ctx.beginPath();
  ctx.moveTo(cx, headBottomY); // top
  ctx.lineTo(cx - tileSize * 0.3, headBottomY + dressHeight); // bottom left
  ctx.lineTo(cx + tileSize * 0.3, headBottomY + dressHeight); // bottom right
  ctx.closePath();
  ctx.fill();

  // arms
  ctx.strokeStyle = "#ffdab9"; // same skin tone
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - tileSize * 0.3, headBottomY + dressHeight * 0.4);
  ctx.lineTo(cx - tileSize * 0.5, headBottomY + dressHeight * 0.2);
  ctx.moveTo(cx + tileSize * 0.3, headBottomY + dressHeight * 0.4);
  ctx.lineTo(cx + tileSize * 0.5, headBottomY + dressHeight * 0.2);
  ctx.stroke();
}

function render() {
  drawMaze();
  drawItems();
  drawPlayer();
}

// ============== INPUT =================
function move(dcol, drow) {
  const newCol = player.col + dcol;
  const newRow = player.row + drow;
  if (
    newCol < 0 ||
    newCol >= cols ||
    newRow < 0 ||
    newRow >= rows ||
    maze[newRow][newCol] === 0
  )
    return; // wall
  player.col = newCol;
  player.row = newRow;
  checkTile();
  render();
}

const directions = {
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0]
};

document.addEventListener("keydown", e => {
  if (modalVisible) return; // lock input during quiz
  const dir = directions[e.key];
  if (dir) move(dir[0], dir[1]);
});

// Touch controls
const ctrlButtons = document.querySelectorAll(".ctrl");
ctrlButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    const d = btn.dataset.dir;
    if (modalVisible) return;
    if (d === "up") move(0, -1);
    if (d === "down") move(0, 1);
    if (d === "left") move(-1, 0);
    if (d === "right") move(1, 0);
  });
});

// ============== QUIZ =================
const modal = document.getElementById("modal");
const questionEl = document.getElementById("question");
const answersEl = document.getElementById("answers");
const hintBox = document.getElementById("hintBox");
const hintText = document.getElementById("hintText");
let modalVisible = false;

// ==== Correct answer overlay ====
const correctMsg = document.createElement("div");
// ===== Wrong answer overlay =====
const wrongMsg = document.createElement("div");
correctMsg.id = "correct-msg";
correctMsg.classList.add("hidden");
correctMsg.textContent = "正解！";
document.body.appendChild(correctMsg);
wrongMsg.id = "wrong-msg";
wrongMsg.classList.add("hidden");
wrongMsg.innerHTML = "残念<br><span style='font-size:32px'>もう1度挑戦しよう！</span>";
document.body.appendChild(wrongMsg);
function showWrongMsg(){
  wrongMsg.classList.remove("hidden");
  setTimeout(()=>wrongMsg.classList.add("hidden"),1200);
}

function showCorrectMsg() {
  correctMsg.classList.remove("hidden");
  setTimeout(() => correctMsg.classList.add("hidden"), 1200);
}

function showQuiz(item) {
  // set hint immediately visible
  hintText.textContent = item.quiz.hint;
  hintBox.style.display = "flex";
  modalVisible = true;
  questionEl.textContent = item.quiz.q;
  answersEl.innerHTML = "";
  item.quiz.a.forEach((ans, idx) => {
    const btn = document.createElement("button");
    btn.textContent = (idx === 0 ? "A: " : "B: ") + ans;
    btn.style.margin = "8px";
    btn.style.padding = "8px 16px";
    btn.style.border = "none";
    btn.style.borderRadius = "6px";
    btn.style.background = "#f0dff7";
    btn.style.color = "#555";
    btn.onclick = () => {
      if (idx === item.quiz.correct) {
        hairLevel = Math.min(hairLevel + 1, 3);
        updateCheer();
        collected[item.key] = true;
        showCorrectMsg();
      } else {
        showWrongMsg();
      }
      modal.classList.add("hidden");
      modalVisible = false;
      hintBox.style.display = "none";
      checkGoal();
      render();
    };
    answersEl.appendChild(btn);
  });
  modal.classList.remove("hidden");
}

// ============== GAME EVENTS =================
function checkTile() {
  // Item check
  const item = items.find(it => it.col === player.col && it.row === player.row && !collected[it.key]);
  if (item) {
    showQuiz(item);
  }
  // Goal check after quiz maybe later
  if (maze[player.row][player.col] === 2) {
    checkGoal();
  }
}

// ==== Goal finish overlay ====
const goalFinishMsg = document.createElement("div");
goalFinishMsg.id = "goal-finish-popup";
goalFinishMsg.classList.add("hidden");
goalFinishMsg.textContent = "ゴール！";
// responsive style using vw so it scales on mobile
goalFinishMsg.style.cssText = `position:fixed;top:25%;left:50%;transform:translate(-50%,0);
  font-size:clamp(24px,8vw,72px);font-weight:900;color:#4caf50;
  text-shadow:0 4px 8px rgba(0,0,0,0.3);
  background:rgba(255,255,255,0.95);
  border:6px solid #a5d6a7;border-radius:24px;padding:12px 24px;
  z-index:2500;animation:pop 0.6s ease-out;text-align:center;`;
document.body.appendChild(goalFinishMsg);
function showGoalFinishMsg(){
  goalFinishMsg.classList.remove("hidden");
  // hide popup after 1.5s and then show long message
  setTimeout(() => {
    goalFinishMsg.classList.add("hidden");
    document.getElementById("goal-msg").classList.remove("hidden");
  }, 1500);
}

function checkGoal() {
  if (maze[player.row][player.col] === 2 && hairLevel === 3) {
    showGoalFinishMsg();
  }
}

// INIT
// 初回レンダリングはスプライト画像ロード後に行う（playerImg.onload 内）

/***********************\
 *  Fancy Visual Upgrade
\***********************/

// Load player sprites (3 frames side-by-side)
const playerImg = new Image();
playerImg.src = "player_sprites.png.png"; // place file in same directory
let frameW = 0;
playerImg.onload = () => {
  frameW = playerImg.width / 3;
  render();
};

// helper to draw rounded rectangle path
function pathRoundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// override drawMaze with gradient tiles & soft shadows
function drawMaze() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const val = maze[r][c];
      const x = c * tileSize;
      const y = r * tileSize;

      ctx.save();
      pathRoundRect(x, y, tileSize, tileSize, 6);
      ctx.clip();

      let grad;
      if (val === 0) {
        // wall
        grad = ctx.createLinearGradient(x, y, x + tileSize, y + tileSize);
        grad.addColorStop(0, "#f4d7e8"); // soft rose
        grad.addColorStop(1, "#f9eef4");
        ctx.shadowColor = "rgba(0,0,0,0.15)";
        ctx.shadowBlur = 6;
      } else if (val === 2) {
        // goal
        grad = ctx.createLinearGradient(x, y, x, y + tileSize);
        grad.addColorStop(0, "#fff5d7"); // champagne
        grad.addColorStop(1, "#ffebba");
        ctx.shadowColor = "rgba(255,255,200,0.8)";
        ctx.shadowBlur = 10;
      } else {
        // path
        grad = ctx.createLinearGradient(x, y, x, y + tileSize);
        grad.addColorStop(0, "#ffffff");
        grad.addColorStop(1, "#fdf7fa");
        ctx.shadowColor = "rgba(0,0,0,0.05)";
        ctx.shadowBlur = 4;
      }
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.restore();
    }
  }
}

// smoother player drawing that supports fractional positions
function drawPlayer(px = player.col, py = player.row) {
  if (!playerImg.complete || frameW === 0) {
    // simple fallback avatar while image not ready
    const centerX = px * tileSize + tileSize / 2;
    const centerY = py * tileSize + tileSize / 2;
    ctx.fillStyle = "#ffdab9";
    ctx.beginPath();
    ctx.arc(centerX, centerY, tileSize/3, 0, Math.PI*2);
    ctx.fill();
    return;
  }
  const centerX = px * tileSize + tileSize / 2;
  const centerY = py * tileSize + tileSize / 2;
  const frameIdx = [0,1,1,2][Math.min(hairLevel,3)];
  const sx = frameIdx * frameW;
  const sy = 0;
  const sw = frameW;
  const sh = playerImg.height;
  const scale = tileSize / (sw * 0.8); // fit roughly in tile
  const dw = sw * scale;
  const dh = sh * scale;
  ctx.drawImage(playerImg, sx, sy, sw, sh, centerX - dw / 2, centerY - dh / 2, dw, dh);
} /* legacy player drawing disabled
  const centerY = py * tileSize + tileSize / 2;

  // head
  ctx.fillStyle = "#ffdab9";
  ctx.beginPath();
  ctx.arc(centerX, centerY, tileSize / 3, 0, Math.PI * 2);
  ctx.fill();

  // hair styles
  const hairStyles = [
    { color: "#6b4e3d", spikes: 6, shine: false },
    { color: "#8b614e", spikes: 3, shine: false },
    { color: "#c27d56", spikes: 0, shine: false },
    { color: "#e2b17e", spikes: 0, shine: true }
  ];
  const hs = hairStyles[hairLevel];

  // hair base
  ctx.fillStyle = hs.color;
  ctx.beginPath();
  ctx.arc(centerX, centerY - 8, tileSize / 3, Math.PI, 0);
  ctx.fill();

  // hair spikes
  if (hs.spikes) {
    ctx.strokeStyle = hs.color;
    ctx.lineWidth = 2;
    for (let i = 0; i < hs.spikes; i++) {
      const angle = (i / hs.spikes) * Math.PI - Math.PI;
      const x1 = centerX + Math.cos(angle) * (tileSize / 3);
      const y1 = centerY - 8 + Math.sin(angle) * (tileSize / 3);
      const x2 = centerX + Math.cos(angle) * (tileSize / 3 + 6);
      const y2 = centerY - 8 + Math.sin(angle) * (tileSize / 3 + 6);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
  }

  // shine
  if (hs.shine) {
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX + 0, centerY - 14);
    ctx.lineTo(centerX + 8, centerY - 14);
    ctx.moveTo(centerX + 4, centerY - 18);
    ctx.lineTo(centerX + 4, centerY - 10);
    ctx.stroke();
  }

  // dress
  const headBottomY = centerY + tileSize / 3;
  const dressHeight = tileSize * 0.8;
  ctx.fillStyle = "#ffc7d1";
  ctx.beginPath();
  ctx.moveTo(centerX, headBottomY);
  ctx.lineTo(centerX - tileSize * 0.3, headBottomY + dressHeight);
  ctx.lineTo(centerX + tileSize * 0.3, headBottomY + dressHeight);
  ctx.closePath();
  ctx.fill();

  // arms
  ctx.strokeStyle = "#ffdab9";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(centerX - tileSize * 0.3, headBottomY + dressHeight * 0.4);
  ctx.lineTo(centerX - tileSize * 0.5, headBottomY + dressHeight * 0.2);
  ctx.moveTo(centerX + tileSize * 0.3, headBottomY + dressHeight * 0.4);
  ctx.lineTo(centerX + tileSize * 0.5, headBottomY + dressHeight * 0.2);
  ctx.stroke();
*/

// enhanced render supporting fractional player position
function render(cx = player.col, cy = player.row) {
  drawMaze();
  drawItems();
  drawPlayer(cx, cy);
}

// smooth animated movement
let animating = false;
function move(dcol, drow) {
  if (animating) return;
  const newCol = player.col + dcol;
  const newRow = player.row + drow;
  if (
    newCol < 0 ||
    newCol >= cols ||
    newRow < 0 ||
    newRow >= rows ||
    maze[newRow][newCol] === 0
  ) {
    // simple wall bump effect
    return;
  }
  const startCol = player.col;
  const startRow = player.row;
  const duration = 200; // ms
  const startTime = performance.now();
  animating = true;

  (function animate() {
    const t = Math.min(1, (performance.now() - startTime) / duration);
    const interpCol = startCol + (newCol - startCol) * t;
    const interpRow = startRow + (newRow - startRow) * t;
    render(interpCol, interpRow);
    if (t < 1) {
      requestAnimationFrame(animate);
    } else {
      player.col = newCol;
      player.row = newRow;
      animating = false;
      checkTile();
      render();
    }
  })();
}

