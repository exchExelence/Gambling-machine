const ADMIN_PASSWORD_ROULETTE = "050211";

// Game state
const gameState = {
  isSpinning: false,
  bets: {}, // { betType: amount, betType2: amount, ... }
  totalBet: 0,
  lastWinningNumber: null,
  lastWinningColor: null,
  winnings: 0
};

// Roulette wheel data
const ROULETTE_NUMBERS = Array.from({ length: 37 }, (_, i) => i); // 0-36
const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
const BLACK_NUMBERS = [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35];

// Elements
const balanceEl = document.getElementById("balance");
const cashEl = document.getElementById("cash-value");
const resultTextEl = document.getElementById("result-text");
const betInput = document.getElementById("bet-input");
const totalBetsEl = document.getElementById("total-bets");
const betDownBtn = document.getElementById("bet-down");
const betUpBtn = document.getElementById("bet-up");
const maxBtn = document.getElementById("max-btn");
const spinBtn = document.getElementById("spin-btn");
const clearBetsBtn = document.getElementById("clear-bets");
const resultDisplay = document.getElementById("result-display");
const numberGrid = document.getElementById("number-grid");
const canvas = document.getElementById("roulette-canvas");
const ctx = canvas.getContext("2d");
const wheel = document.getElementById("roulette-wheel");
const adminBtn = document.getElementById("admin-btn");
const adminMenu = document.getElementById("admin-dropdown");
const adminPasswordInput = document.getElementById("admin-password");
const adminSave = document.getElementById("admin-save");
const adminClose = document.getElementById("admin-close");
const adminAmount = document.getElementById("admin-amount");

// Initialize game
function initGame() {
  loadState();
  updateBalance();
  drawWheel();
  createNumberGrid();
  setupEventListeners();
}

function drawWheel() {
  const radius = 140;
  const numSegments = 37;
  const sliceAngle = (Math.PI * 2) / numSegments;

  // Draw segments
  for (let i = 0; i < numSegments; i++) {
    const start = i * sliceAngle - Math.PI / 2;
    const end = start + sliceAngle;

    // Determine color
    let segmentColor = "#000000";
    if (RED_NUMBERS.includes(i)) {
      segmentColor = "#ef4444";
    } else if (BLACK_NUMBERS.includes(i)) {
      segmentColor = "#1f2937";
    } else if (i === 0) {
      segmentColor = "#22c55e";
    }

    // Draw segment
    ctx.beginPath();
    ctx.moveTo(150, 150);
    ctx.arc(150, 150, radius, start, end);
    ctx.closePath();
    ctx.fillStyle = segmentColor;
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw number
    const textAngle = start + sliceAngle / 2;
    const textX = 150 + Math.cos(textAngle) * (radius - 30);
    const textY = 150 + Math.sin(textAngle) * (radius - 30);
    
    ctx.font = "bold 14px Arial";
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(i.toString(), textX, textY);
  }

  // Draw center circle
  ctx.beginPath();
  ctx.arc(150, 150, 20, 0, Math.PI * 2);
  ctx.fillStyle = "#fff";
  ctx.fill();
  ctx.strokeStyle = "#1f2937";
  ctx.lineWidth = 3;
  ctx.stroke();
}

function createNumberGrid() {
  numberGrid.innerHTML = "";
  for (let i = 1; i <= 36; i++) {
    const btn = document.createElement("button");
    btn.className = "number-bet-btn";
    btn.textContent = i;
    
    // Color the button based on number color
    if (RED_NUMBERS.includes(i)) {
      btn.style.borderColor = "#ef4444";
    } else {
      btn.style.borderColor = "#1f2937";
    }
    
    btn.addEventListener("click", () => placeBet(`number-${i}`, 10));
    numberGrid.appendChild(btn);
  }
}

function placeBet(betType, minBet) {
  const betAmount = parseInt(betInput.value) || 0;
  
  if (betAmount === 0) {
    resultTextEl.textContent = "Enter a bet amount";
    return;
  }

  if (betAmount > getCurrentBalance()) {
    resultTextEl.textContent = "Insufficient balance";
    return;
  }

  // Add or update bet
  if (gameState.bets[betType]) {
    gameState.bets[betType] += betAmount;
  } else {
    gameState.bets[betType] = betAmount;
  }

  gameState.totalBet += betAmount;
  setCurrentBalance(getCurrentBalance() - betAmount);
  updateBalance();
  updateBetDisplay();

  resultTextEl.textContent = `Bet placed on ${formatBetType(betType)}`;
}

function formatBetType(betType) {
  if (betType.startsWith("number-")) {
    return `Number ${betType.split("-")[1]}`;
  }
  const names = {
    "red": "Red",
    "black": "Black",
    "even": "Even",
    "odd": "Odd",
    "high": "High (19-36)",
    "low": "Low (1-18)"
  };
  return names[betType] || betType;
}

function updateBetDisplay() {
  totalBetsEl.textContent = gameState.totalBet;
  betInput.value = "";
}

function clearAllBets() {
  // Refund all bets
  const totalRefund = gameState.totalBet;
  setCurrentBalance(getCurrentBalance() + totalRefund);
  updateBalance();

  gameState.bets = {};
  gameState.totalBet = 0;
  updateBetDisplay();
  resultTextEl.textContent = "All bets cleared";
}

function spin() {
  if (gameState.isSpinning) return;

  if (Object.keys(gameState.bets).length === 0) {
    resultTextEl.textContent = "Place bets before spinning";
    return;
  }

  gameState.isSpinning = true;
  spinBtn.disabled = true;
  clearBetsBtn.disabled = true;

  // Random winning number
  const winningNumber = randomInt(0, 36);
  gameState.lastWinningNumber = winningNumber;
  gameState.lastWinningColor = RED_NUMBERS.includes(winningNumber) 
    ? "red" 
    : BLACK_NUMBERS.includes(winningNumber) 
    ? "black" 
    : "green";

  // Animate wheel
  animateSpin(winningNumber);
}

function animateSpin(winningNumber) {
  const spins = 10 + randomInt(0, 5);
  const sliceAngle = (Math.PI * 2) / 37;
  const targetRotation = spins * Math.PI * 2 - (winningNumber * sliceAngle);
  
  let currentRotation = 0;
  let duration = 3000;
  let startTime = Date.now();

  function animate() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // Easing function (ease-out)
    const easeProgress = 1 - (1 - progress) ** 3;
    currentRotation = targetRotation * easeProgress;

    wheel.style.transform = `rotate(${currentRotation}rad)`;

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      calculateWinnings();
      gameState.isSpinning = false;
      spinBtn.disabled = false;
      clearBetsBtn.disabled = false;
    }
  }

  animate();
}

function calculateWinnings() {
  const winning = gameState.lastWinningNumber;
  const color = gameState.lastWinningColor;
  
  gameState.winnings = 0;

  // Check each bet
  for (let betType in gameState.bets) {
    let multiplier = 0;

    if (betType === "red" && color === "red") {
      multiplier = 2;
    } else if (betType === "black" && color === "black") {
      multiplier = 2;
    } else if (betType === "even" && winning !== 0 && winning % 2 === 0) {
      multiplier = 2;
    } else if (betType === "odd" && winning % 2 === 1) {
      multiplier = 2;
    } else if (betType === "high" && winning >= 19 && winning <= 36) {
      multiplier = 2;
    } else if (betType === "low" && winning >= 1 && winning <= 18) {
      multiplier = 2;
    } else if (betType.startsWith("number-")) {
      const number = parseInt(betType.split("-")[1]);
      if (number === winning) {
        multiplier = 18; // 17:1 + original bet
      }
    }

    gameState.winnings += gameState.bets[betType] * multiplier;
  }

  // Update balance
  if (gameState.winnings > 0) {
    resultTextEl.textContent = `Winning number: ${winning} (${color})! Won $${formatCash(gameState.winnings).replace("$", "")}`;
    setCurrentBalance(getCurrentBalance() + gameState.winnings);
  } else {
    resultTextEl.textContent = `Winning number: ${winning} (${color}). You lost this round.`;
  }

  updateBalance();
  resultDisplay.textContent = `${winning}`;
  resultDisplay.className = `result-display ${color}`;

  // Reset bets
  gameState.bets = {};
  gameState.totalBet = 0;
  updateBetDisplay();
}

function updateBalance() {
  const balance = getCurrentBalance();
  balanceEl.textContent = balance;
  cashEl.textContent = formatCash(balance);
}

function setupEventListeners() {
  // Bet amount buttons
  betDownBtn.addEventListener("click", () => {
    const current = parseInt(betInput.value) || 0;
    betInput.value = Math.max(0, current - 10);
  });

  betUpBtn.addEventListener("click", () => {
    const current = parseInt(betInput.value) || 0;
    betInput.value = current + 10;
  });

  maxBtn.addEventListener("click", () => {
    betInput.value = getCurrentBalance();
  });

  // Color/type bets
  document.getElementById("bet-red").addEventListener("click", () => placeBet("red", 10));
  document.getElementById("bet-black").addEventListener("click", () => placeBet("black", 10));
  document.getElementById("bet-even").addEventListener("click", () => placeBet("even", 10));
  document.getElementById("bet-odd").addEventListener("click", () => placeBet("odd", 10));
  document.getElementById("bet-high").addEventListener("click", () => placeBet("high", 10));
  document.getElementById("bet-low").addEventListener("click", () => placeBet("low", 10));

  // Spin and clear
  spinBtn.addEventListener("click", spin);
  clearBetsBtn.addEventListener("click", clearAllBets);

  // Admin menu
  adminBtn.addEventListener("click", () => {
    adminMenu.classList.toggle("hidden");
  });

  adminClose.addEventListener("click", () => {
    adminMenu.classList.add("hidden");
    adminPasswordInput.value = "";
  });

  adminSave.addEventListener("click", () => {
    if (adminPasswordInput.value === ADMIN_PASSWORD_ROULETTE) {
      const amount = parseInt(adminAmount.value) || 0;
      setCurrentBalance(getCurrentBalance() + amount * 100);
      updateBalance();
      resultTextEl.textContent = `Added ${amount} tokens!`;
      adminMenu.classList.add("hidden");
      adminPasswordInput.value = "";
    } else {
      resultTextEl.textContent = "Incorrect password";
    }
  });

  document.getElementById("admin-withdraw").addEventListener("click", () => {
    if (adminPasswordInput.value === ADMIN_PASSWORD_ROULETTE) {
      const amount = parseInt(adminAmount.value) || 0;
      setCurrentBalance(Math.max(0, getCurrentBalance() - amount * 100));
      updateBalance();
      resultTextEl.textContent = `Removed ${amount} tokens!`;
      adminMenu.classList.add("hidden");
      adminPasswordInput.value = "";
    } else {
      resultTextEl.textContent = "Incorrect password";
    }
  });
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initGame);
} else {
  initGame();
}
