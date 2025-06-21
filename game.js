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
const items = [
  {
    name: "シャンプー",
    key: "shampoo",
    col: 2,
    row: 1,
    color: "#ffb6c1",
    quiz: {
      q: "シャンプーで大事なのはどっち？",
      a: ["髪の毛を洗う", "頭皮を洗う"],
      correct: 0,
      hint: "頭皮の汚れは予洗いでほとんど取れるよ！"
    }
  },
  {
    name: "トリートメント",
    key: "treatment",
    col: 7,
    row: 4,
    color: "#ffe4b5",
    quiz: {
      q: "髪の傷みはトリートメントで治る？",
      a: ["治る", "治らない"],
      correct: 1,
      hint: "髪は一度傷んだら治らない死滅細胞なんだよ！"
    }
  },
  {
    name: "ドライヤー",
    key: "dryer",
    col: 7,
    row: 7,
    color: "#add8e6",
    quiz: {
      q: "髪の乾かし方はどっちが良い？",
      a: ["半乾きで終わる", "完全に乾かす"],
      correct: 1,
      hint: "髪は濡れた状態が一番傷みやすいよ！"
    }
  }
];

let collected = {};
items.forEach(it => (collected[it.key] = false));
let hairLevel = 0; // 0-3

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
    ctx.fillStyle = it.color;
    ctx.beginPath();
    ctx.arc(
      it.col * tileSize + tileSize / 2,
      it.row * tileSize + tileSize / 2,
      tileSize / 3,
      0,
      Math.PI * 2
    );
    ctx.fill();
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
        collected[item.key] = true;
        alert("正解！\n" + item.quiz.hint);
      } else {
        alert("残念…\n" + item.quiz.hint);
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

function checkGoal() {
  if (maze[player.row][player.col] === 2 && hairLevel === 3) {
    document.getElementById("goal-msg").classList.remove("hidden");
  }
}

// INIT
render();
