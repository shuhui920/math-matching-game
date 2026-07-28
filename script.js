document.addEventListener("DOMContentLoaded", function () {
  // Supabase 設定
  const SUPABASE_URL = "https://deebjpgtujatpefucajc.supabase.co";
  const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlZWJqcGd0dWphdHBlZnVjYWpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUyMTk3NjgsImV4cCI6MjEwMDc5NTc2OH0.u9Q8Vv4z0XsPVN8zJVtdbo3_2Sv8lv9JD5SXbuWo5a4";

  let supabase = null;
  try {
    if (window.supabase && window.supabase.createClient) {
      supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
      console.log("Supabase client ready");
    } else {
      console.warn("Supabase library not loaded, saving disabled");
    }
  } catch (err) {
    console.warn("Supabase init failed:", err.message);
  }

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
    document.querySelectorAll(".screen").forEach(function (s) {
      s.classList.remove("active");
    });
    screen.classList.add("active");
  }

  // 格式化時間
  function formatTime(seconds) {
    var mins = String(Math.floor(seconds / 60)).padStart(2, "0");
    var secs = String(seconds % 60).padStart(2, "0");
    return mins + ":" + secs;
  }

  // 產生算式
  function generateExpression() {
    var operators = ["+", "-"];
    var operator = operators[Math.floor(Math.random() * operators.length)];

    var a, b, answer;

    if (operator === "+") {
      a = Math.floor(Math.random() * 20) + 1;
      b = Math.floor(Math.random() * 20) + 1;
      answer = a + b;
    } else {
      a = Math.floor(Math.random() * 20) + 2;
      b = Math.floor(Math.random() * a) + 1;
      answer = a - b;
    }

    return {
      id: Math.random().toString(36).substring(2, 9),
      expression: a + " " + operator + " " + b,
      answer: answer,
    };
  }

  // 產生不重複的題目組
  function generateQuestions(count) {
    var pairs = [];
    var used = new Set();

    while (pairs.length < count) {
      var item = generateExpression();
      var key = item.expression + "=" + item.answer;
      if (!used.has(key)) {
        used.add(key);
        pairs.push(item);
      }
    }

    return pairs;
  }

  // 洗牌
  function shuffle(array) {
    var arr = array.slice();
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
    return arr;
  }

  // 建立卡片
  function createCard(content, type, id, dataValue) {
    var card = document.createElement("div");
    card.className = "card-item";
    card.textContent = content;
    card.setAttribute("data-type", type);
    card.setAttribute("data-id", id);
    if (dataValue !== undefined) {
      card.setAttribute("data-value", dataValue);
    }
    card.addEventListener("click", function () {
      handleCardClick(card);
    });
    return card;
  }

  // 渲染遊戲板
  function renderBoard() {
    expressionsContainer.innerHTML = "";
    answersContainer.innerHTML = "";

    var shuffledExpressions = shuffle(gameState.pairs);
    var shuffledAnswers = shuffle(gameState.pairs);

    for (var i = 0; i < shuffledExpressions.length; i++) {
      expressionsContainer.appendChild(
        createCard(shuffledExpressions[i].expression, "expression", shuffledExpressions[i].id, shuffledExpressions[i].answer)
      );
    }

    for (var j = 0; j < shuffledAnswers.length; j++) {
      answersContainer.appendChild(
        createCard(shuffledAnswers[j].answer, "answer", shuffledAnswers[j].id)
      );
    }
  }

  // 更新統計
  function updateStats() {
    timerDisplay.textContent = formatTime(gameState.elapsedSeconds);
    scoreDisplay.textContent = gameState.score;
    progressDisplay.textContent = gameState.matchedCount + "/" + gameState.questionCount;
  }

  // 開始計時
  function startTimer() {
    gameState.startTime = Date.now();
    gameState.elapsedSeconds = 0;
    updateStats();

    gameState.timerInterval = setInterval(function () {
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
    if (card.classList.contains("matched")) return;
    if (card.classList.contains("selected")) return;

    var type = card.getAttribute("data-type");

    if (type === "expression") {
      if (gameState.selectedExpression) {
        gameState.selectedExpression.classList.remove("selected");
      }
      gameState.selectedExpression = card;
      card.classList.add("selected");
    } else if (type === "answer") {
      if (gameState.selectedAnswer) {
        gameState.selectedAnswer.classList.remove("selected");
      }
      gameState.selectedAnswer = card;
      card.classList.add("selected");
    }

    checkMatch();
  }

  // 檢查配對
  function checkMatch() {
    if (!gameState.selectedExpression || !gameState.selectedAnswer) return;

    var expVal = parseInt(gameState.selectedExpression.getAttribute("data-value"));
    var ansVal = parseInt(gameState.selectedAnswer.getAttribute("data-value"));

    if (expVal === ansVal) {
      gameState.selectedExpression.classList.add("matched");
      gameState.selectedAnswer.classList.add("matched");
      gameState.selectedExpression.classList.remove("selected");
      gameState.selectedAnswer.classList.remove("selected");

      gameState.matchedCount++;
      gameState.score += 10;
      gameState.selectedExpression = null;
      gameState.selectedAnswer = null;

      updateStats();

      if (gameState.matchedCount >= gameState.questionCount) {
        endGame();
      }
    } else {
      gameState.selectedExpression.classList.add("wrong");
      gameState.selectedAnswer.classList.add("wrong");

      gameState.wrongCount++;
      gameState.score = Math.max(0, gameState.score - 2);
      updateStats();

      var wrongExp = gameState.selectedExpression;
      var wrongAns = gameState.selectedAnswer;
      gameState.selectedExpression = null;
      gameState.selectedAnswer = null;

      setTimeout(function () {
        wrongExp.classList.remove("selected", "wrong");
        wrongAns.classList.remove("selected", "wrong");
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
    gameState.seatNumber = parseInt(document.getElementById("seat-input").value, 10);
    gameState.questionCount = parseInt(document.getElementById("question-count").value, 10);
    gameState.pairs = generateQuestions(gameState.questionCount);
    gameState.selectedExpression = null;
    gameState.selectedAnswer = null;
    gameState.matchedCount = 0;
    gameState.wrongCount = 0;
    gameState.score = 0;
    gameState.saved = false;

    displayClass.textContent = gameState.className;
    displaySeat.textContent = "座號 " + gameState.seatNumber;

    showScreen(gameScreen);
    renderBoard();
    startTimer();
  }

  // 儲存成績
  function saveScore() {
    if (!supabase) {
      saveStatus.textContent = "無法連線到資料庫，請稍後再試。";
      saveStatus.className = "save-status error";
      return;
    }

    if (gameState.saved) {
      saveStatus.textContent = "成績已經儲存過了！";
      saveStatus.className = "save-status success";
      return;
    }

    saveBtn.disabled = true;
    saveBtn.textContent = "儲存中...";
    saveStatus.textContent = "正在儲存到 Supabase...";
    saveStatus.className = "save-status loading";

    supabase
      .from("數學遊戲紀錄")
      .insert({
        班級: gameState.className,
        座號: gameState.seatNumber,
        分數: gameState.score,
        遊戲秒數: gameState.elapsedSeconds,
        總題數: gameState.questionCount,
        正確題數: gameState.matchedCount,
      })
      .then(function (result) {
        if (result.error) throw result.error;
        gameState.saved = true;
        saveStatus.textContent = "成績已儲存到 Supabase！";
        saveStatus.className = "save-status success";
        saveBtn.textContent = "已儲存";
        saveBtn.disabled = true;
      })
      .catch(function (err) {
        console.error("儲存失敗:", err);
        saveStatus.textContent = "儲存失敗，請稍後再試。";
        saveStatus.className = "save-status error";
        saveBtn.disabled = false;
        saveBtn.textContent = "重新儲存";
      });
  }

  // 重新開始
  function restartGame() {
    document.getElementById("start-form").reset();
    showScreen(startScreen);
  }

  // 事件綁定 - 確保元素都存在
  if (startForm) startForm.addEventListener("submit", startGame);
  if (saveBtn) saveBtn.addEventListener("click", saveScore);
  if (restartBtn) restartBtn.addEventListener("click", restartGame);

  // 防止文字選取
  if (expressionsContainer) {
    expressionsContainer.addEventListener("selectstart", function (e) { e.preventDefault(); });
    expressionsContainer.addEventListener("mousedown", function () { return false; });
  }
  if (answersContainer) {
    answersContainer.addEventListener("selectstart", function (e) { e.preventDefault(); });
    answersContainer.addEventListener("mousedown", function () { return false; });
  }

  // 確保開始畫面顯示
  showScreen(startScreen);

  console.log("Game ready!");
});
