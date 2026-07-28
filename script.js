// Supabase 設定
const SUPABASE_URL = "https://deebjpgtujatpefucajc.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlZWJqcGd0dWphdHBlZnVjYWpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUyMTk3NjgsImV4cCI6MjEwMDc5NTc2OH0.u9Q8Vv4z0XsPVN8zJVtdbo3_2Sv8lv9JD5SXbuWo5a4";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 遊戲狀態
let gameState = {
  className: "",
  seatNumber: 0,
  questionCount: 10,
  pairs: [],
  selectedExpression: null,
  selectedAnswer: null,
  matchedCount: 0,
  wrongCount: 0,
  score: 0,
  startTime: null,
  endTime: null,
  timerInterval: null,
  elapsedSeconds: 0,
  saved: false,
};

// DOM 元素
const startScreen = document.getElementById("start-screen");
const gameScreen = document.getElementById("game-screen");
const endScreen = document.getElementById("end-screen");
const startForm = document.getElementById("start-form");
const expressionsContainer = document.getElementById("expressions");
const answersContainer = document.getElementById("answers");
const timerDisplay = document.getElementById("timer");
const scoreDisplay = document.getElementById("score");
const progressDisplay = document.getElementById("progress");
const displayClass = document.getElementById("display-class");
const displaySeat = document.getElementById("display-seat");
const saveBtn = document.getElementById("save-btn");
const restartBtn = document.getElementById("restart-btn");
const saveStatus = document.getElementById("save-status");

// 切換畫面
function showScreen(screen) {
  document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
  screen.classList.add("active");
}

// 格式化時間
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const secs = (seconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
}

// 產生算式
function generateExpression() {
  const operators = ["+", "-"];
  const operator = operators[Math.floor(Math.random() * operators.length)];

  let a, b, answer;

  if (operator === "+") {
    a = Math.floor(Math.random() * 20) + 1; // 1 ~ 20
    b = Math.floor(Math.random() * 20) + 1; // 1 ~ 20
    answer = a + b;
  } else {
    a = Math.floor(Math.random() * 20) + 2; // 2 ~ 21
    b = Math.floor(Math.random() * a) + 1; // 1 ~ a，確保答案不為負
    answer = a - b;
  }

  return {
    id: Math.random().toString(36).substring(2, 9),
    expression: `${a} ${operator} ${b}`,
    answer: answer,
  };
}

// 產生不重複的題目組
function generateQuestions(count) {
  const pairs = [];
  const used = new Set();

  while (pairs.length < count) {
    const item = generateExpression();
    const key = `${item.expression}=${item.answer}`;
    if (!used.has(key)) {
      used.add(key);
      pairs.push(item);
    }
  }

  return pairs;
}

// 洗牌陣列
function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// 建立卡片元素
function createCard(content, type, id, dataValue) {
  const card = document.createElement("div");
  card.className = "card-item";
  card.textContent = content;
  card.dataset.type = type;
  card.dataset.id = id;
  if (dataValue !== undefined) {
    card.dataset.value = dataValue;
  }
  card.addEventListener("click", () => handleCardClick(card));
  return card;
}

// 渲染遊戲板
function renderBoard() {
  expressionsContainer.innerHTML = "";
  answersContainer.innerHTML = "";

  const shuffledExpressions = shuffle(gameState.pairs);
  const shuffledAnswers = shuffle(gameState.pairs);

  shuffledExpressions.forEach((pair) => {
    expressionsContainer.appendChild(
      createCard(pair.expression, "expression", pair.id, pair.answer)
    );
  });

  shuffledAnswers.forEach((pair) => {
    answersContainer.appendChild(createCard(pair.answer, "answer", pair.id));
  });
}

// 更新統計
function updateStats() {
  timerDisplay.textContent = formatTime(gameState.elapsedSeconds);
  scoreDisplay.textContent = gameState.score;
  progressDisplay.textContent = `${gameState.matchedCount}/${gameState.questionCount}`;
}

// 開始計時
function startTimer() {
  gameState.startTime = Date.now();
  gameState.elapsedSeconds = 0;
  updateStats();

  gameState.timerInterval = setInterval(() => {
    gameState.elapsedSeconds = Math.floor((Date.now() - gameState.startTime) / 1000);
    updateStats();
  }, 1000);
}

// 停止計時
function stopTimer() {
  clearInterval(gameState.timerInterval);
  gameState.endTime = Date.now();
  gameState.elapsedSeconds = Math.floor((gameState.endTime - gameState.startTime) / 1000);
  updateStats();
}

// 處理卡片點擊
function handleCardClick(card) {
  if (card.classList.contains("matched") || card.classList.contains("selected")) {
    return;
  }

  const type = card.dataset.type;

  if (type === "expression") {
    // 取消之前選的算式
    if (gameState.selectedExpression) {
      gameState.selectedExpression.classList.remove("selected");
    }
    gameState.selectedExpression = card;
    card.classList.add("selected");
  } else if (type === "answer") {
    // 取消之前選的答案
    if (gameState.selectedAnswer) {
      gameState.selectedAnswer.classList.remove("selected");
    }
    gameState.selectedAnswer = card;
    card.classList.add("selected");
  }

  // 檢查是否配對
  checkMatch();
}

// 檢查配對
function checkMatch() {
  if (!gameState.selectedExpression || !gameState.selectedAnswer) {
    return;
  }

  const expressionValue = parseInt(gameState.selectedExpression.dataset.value);
  const answerValue = parseInt(gameState.selectedAnswer.dataset.value);

  if (expressionValue === answerValue) {
    // 配對成功
    gameState.selectedExpression.classList.add("matched");
    gameState.selectedAnswer.classList.add("matched");
    gameState.selectedExpression.classList.remove("selected");
    gameState.selectedAnswer.classList.remove("selected");

    gameState.matchedCount++;
    gameState.score += 10;
    gameState.selectedExpression = null;
    gameState.selectedAnswer = null;

    updateStats();

    // 檢查是否結束
    if (gameState.matchedCount >= gameState.questionCount) {
      endGame();
    }
  } else {
    // 配對失敗
    gameState.selectedExpression.classList.add("wrong");
    gameState.selectedAnswer.classList.add("wrong");

    gameState.wrongCount++;
    gameState.score = Math.max(0, gameState.score - 2);
    updateStats();

    setTimeout(() => {
      gameState.selectedExpression.classList.remove("selected", "wrong");
      gameState.selectedAnswer.classList.remove("selected", "wrong");
      gameState.selectedExpression = null;
      gameState.selectedAnswer = null;
    }, 600);
  }
}

// 結束遊戲
function endGame() {
  stopTimer();
  showScreen(endScreen);

  document.getElementById("end-class").textContent = gameState.className;
  document.getElementById("end-seat").textContent = gameState.seatNumber;
  document.getElementById("end-total").textContent = gameState.questionCount;
  document.getElementById("end-correct").textContent = gameState.matchedCount;
  document.getElementById("end-wrong").textContent = gameState.wrongCount;
  document.getElementById("end-time").textContent = formatTime(gameState.elapsedSeconds);
  document.getElementById("end-score").textContent = gameState.score;

  saveStatus.textContent = "";
  saveStatus.className = "save-status";
  saveBtn.disabled = false;
  saveBtn.textContent = "儲存成績";
  gameState.saved = false;
}

// 開始遊戲
function startGame(e) {
  e.preventDefault();

  gameState.className = document.getElementById("class-input").value.trim();
  gameState.seatNumber = parseInt(document.getElementById("seat-input").value);
  gameState.questionCount = parseInt(document.getElementById("question-count").value);
  gameState.pairs = generateQuestions(gameState.questionCount);
  gameState.selectedExpression = null;
  gameState.selectedAnswer = null;
  gameState.matchedCount = 0;
  gameState.wrongCount = 0;
  gameState.score = 0;
  gameState.saved = false;

  displayClass.textContent = gameState.className;
  displaySeat.textContent = `座號 ${gameState.seatNumber}`;

  showScreen(gameScreen);
  renderBoard();
  startTimer();
}

// 儲存成績到 Supabase
async function saveScore() {
  if (gameState.saved) {
    saveStatus.textContent = "成績已經儲存過了！";
    saveStatus.className = "save-status success";
    return;
  }

  saveBtn.disabled = true;
  saveBtn.textContent = "儲存中...";
  saveStatus.textContent = "正在儲存到 Supabase...";
  saveStatus.className = "save-status loading";

  try {
    const { data, error } = await supabase.from("數學遊戲紀錄").insert({
      班級: gameState.className,
      座號: gameState.seatNumber,
      分數: gameState.score,
      遊戲秒數: gameState.elapsedSeconds,
      總題數: gameState.questionCount,
      正確題數: gameState.matchedCount,
    });

    if (error) {
      throw error;
    }

    gameState.saved = true;
    saveStatus.textContent = "✅ 成績已儲存到 Supabase！";
    saveStatus.className = "save-status success";
    saveBtn.textContent = "已儲存";
  } catch (err) {
    console.error("儲存失敗:", err);
    saveStatus.textContent = "❌ 儲存失敗，請稍後再試。";
    saveStatus.className = "save-status error";
    saveBtn.disabled = false;
    saveBtn.textContent = "重新儲存";
  }
}

// 重新開始
function restartGame() {
  document.getElementById("start-form").reset();
  showScreen(startScreen);
}

// 事件綁定
startForm.addEventListener("submit", startGame);
saveBtn.addEventListener("click", saveScore);
restartBtn.addEventListener("click", restartGame);

// 防止遊戲中選取文字
expressionsContainer.addEventListener("selectstart", (e) => e.preventDefault());
answersContainer.addEventListener("selectstart", (e) => e.preventDefault());
