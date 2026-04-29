const APP_VERSION = 15;
const symbolIcons = {
  diamond: "♦️",
  bell: "🔔",
  plum: "🍇",
  orange: "🍊",
  lemon: "🍋",
  cherry: "🍒"
};

const spinThresholds = [
  {limit: 40, type: "3diamond", multiplier: 50},
  {limit: 220, type: "2diamond", multiplier: 0},
  {limit: 320, type: "3bell", multiplier: 20},
  {limit: 900, type: "2bell", multiplier: 0},
  {limit: 1040, type: "3plum", multiplier: 10},
  {limit: 2080, type: "2plum", multiplier: 0},
  {limit: 3120, type: "3orange", multiplier: 6},
  {limit: 5200, type: "2orange", multiplier: 0},
  {limit: 6400, type: "3lemon", multiplier: 4},
  {limit: 8800, type: "2lemon", multiplier: 0},
  {limit: 11280, type: "3cherry", multiplier: 3},
  {limit: 20080, type: "2cherry", multiplier: 1.5},
  {limit: 32720, type: "1cherry", multiplier: 0.5}
];

const nonCherrySymbols = ["lemon", "orange", "plum", "bell", "diamond"];

const balanceEl = document.getElementById("balance");
const cashEl = document.getElementById("cash-value");
const resultTextEl = document.getElementById("result-text");
const reelEls = [
  document.getElementById("reel-0"),
  document.getElementById("reel-1"),
  document.getElementById("reel-2")
];
const betInput = document.getElementById("bet-input");
const betDisplay = document.getElementById("bet-display");
const spinBtn = document.getElementById("spin-btn");
const maxBtn = document.getElementById("max-btn");
const stopBtn = document.getElementById("stop-btn");
const betDownBtn = document.getElementById("bet-down");
const betUpBtn = document.getElementById("bet-up");
const adminBtn = document.getElementById("admin-btn");
const adminMenu = document.getElementById("admin-dropdown");
const adminPasswordInput = document.getElementById("admin-password");
const versionLabel = document.getElementById("version-label");
const adminSave = document.getElementById("admin-save");
const adminClose = document.getElementById("admin-close");
const adminAmount = document.getElementById("admin-amount");

const spinState = {
  isSpinning: false,
  currentReel: 0,
  intervals: [],
  finalReels: [],
  outcome: null,
  bet: 0
};

loadState();

function setCurrentUser(userId, createIfMissing = false) {
  const id = String(userId || "").trim();
  if (!id) {
    resultTextEl.textContent = "Enter a valid player ID.";
    return false;
  }
  if (!users[id]) {
    if (!createIfMissing) {
      resultTextEl.textContent = `Player "${id}" not found.`;
      return false;
    }
    users[id] = { balance: STARTING_BALANCE };
    resultTextEl.textContent = `Created new player ${id}.`;
  } else if (createIfMissing) {
    resultTextEl.textContent = `Loaded existing player ${id}.`;
  } else {
    resultTextEl.textContent = `Loaded player ${id}.`;
  }
  currentUserId = id;
  updateUI();
  return true;
}

function updateUI(message = "Ready to spin") {
  balanceEl.textContent = getCurrentBalance().toString();
  if (cashEl) {
    cashEl.textContent = formatCash(getCurrentBalance());
  }
  if (versionLabel) {
    versionLabel.textContent = `v${APP_VERSION}`;
  }
  betDisplay.textContent = betInput.value;
  resultTextEl.textContent = message;
  saveState();
  spinBtn.disabled = getCurrentBalance() < 1 || spinState.isSpinning;
  maxBtn.disabled = getCurrentBalance() < 1 || spinState.isSpinning;
}

function buildReelSymbols(outcome) {
  switch (outcome) {
    case "3diamond":
      return ["diamond", "diamond", "diamond"];
    case "2diamond": {
      const nonDiamond = chooseRandom(nonCherrySymbols.filter(s => s !== "diamond"));
      const positions = [0, 1, 2].sort(() => Math.random() - 0.5);
      const result = ["diamond", "diamond", nonDiamond];
      return [result[positions[0]], result[positions[1]], result[positions[2]]];
    }
    case "3bell":
      return ["bell", "bell", "bell"];
    case "2bell": {
      const nonBell = chooseRandom(nonCherrySymbols.filter(s => s !== "bell"));
      const positions = [0, 1, 2].sort(() => Math.random() - 0.5);
      const result = ["bell", "bell", nonBell];
      return [result[positions[0]], result[positions[1]], result[positions[2]]];
    }
    case "3plum":
      return ["plum", "plum", "plum"];
    case "2plum": {
      const nonPlum = chooseRandom(nonCherrySymbols.filter(s => s !== "plum"));
      const positions = [0, 1, 2].sort(() => Math.random() - 0.5);
      const result = ["plum", "plum", nonPlum];
      return [result[positions[0]], result[positions[1]], result[positions[2]]];
    }
    case "3orange":
      return ["orange", "orange", "orange"];
    case "2orange": {
      const nonOrange = chooseRandom(nonCherrySymbols.filter(s => s !== "orange"));
      const positions = [0, 1, 2].sort(() => Math.random() - 0.5);
      const result = ["orange", "orange", nonOrange];
      return [result[positions[0]], result[positions[1]], result[positions[2]]];
    }
    case "3lemon":
      return ["lemon", "lemon", "lemon"];
    case "2lemon": {
      const nonLemon = chooseRandom(nonCherrySymbols.filter(s => s !== "lemon"));
      const positions = [0, 1, 2].sort(() => Math.random() - 0.5);
      const result = ["lemon", "lemon", nonLemon];
      return [result[positions[0]], result[positions[1]], result[positions[2]]];
    }
    case "3cherry":
      return ["cherry", "cherry", "cherry"];
    case "2cherry": {
      const nonCherry = chooseRandom(nonCherrySymbols);
      const positions = [0, 1, 2].sort(() => Math.random() - 0.5);
      const result = ["cherry", "cherry", nonCherry];
      return [result[positions[0]], result[positions[1]], result[positions[2]]];
    }
    case "1cherry": {
      const symbols = ["cherry", chooseRandom(nonCherrySymbols), chooseRandom(nonCherrySymbols)];
      return symbols.sort(() => Math.random() - 0.5);
    }
    default: {
      while (true) {
        const combo = [chooseRandom(nonCherrySymbols), chooseRandom(nonCherrySymbols), chooseRandom(nonCherrySymbols)];
        if (!(combo[0] === combo[1] && combo[1] === combo[2])) {
          return combo;
        }
      }
    }
  }
}

function getOutcome(roll) {
  return spinThresholds.find(({ limit }) => roll <= limit) || { type: "lose", multiplier: 0 };
}

function formatSymbols(symbols) {
  return symbols.map((symbol) => symbolIcons[symbol] || symbol).join(" ");
}

function determineMessage(type, winAmount, bet) {
  if (type.startsWith("2") && type !== "2cherry") {
    return `So close! Nearly had it. Lost ${bet} coins.`;
  }
  if (type === "lose") {
    return `Lost ${bet} coins. Try again.`;
  }
  if (winAmount === bet) {
    return `Push. Bet returned.`;
  }
  if (winAmount > bet) {
    return `Win ${winAmount - bet} coins!`;
  }
  return `Returned ${winAmount} coins.`;
}

function getAdjustedRoll(bet) {
  const penaltyFactor = bet >= 100 ? 1 : 1 + (100 - bet) * 0.01;
  const maxRoll = Math.floor(100000 * penaltyFactor);
  return randomInt(1, maxRoll);
}

function spin() {
  const bet = Number(betInput.value || 0);
  if (!bet || bet < 1) {
    resultTextEl.textContent = "Enter a valid bet.";
    return;
  }
  const currentBalance = getCurrentBalance();
  if (bet > currentBalance) {
    resultTextEl.textContent = "Not enough tokens.";
    return;
  }

  setCurrentBalance(currentBalance - bet);
  updateUI("Reels are spinning... Click STOP to lock each reel.");
  spinState.isSpinning = true;
  spinState.currentReel = 0;
  spinState.bet = bet;
  spinState.outcome = getOutcome(getAdjustedRoll(bet));
  spinState.finalReels = buildReelSymbols(spinState.outcome.type);

  spinBtn.disabled = true;
  maxBtn.disabled = true;
  betDownBtn.disabled = true;
  betUpBtn.disabled = true;
  stopBtn.classList.remove("hidden");
  stopBtn.disabled = false;

  reelEls.forEach((el) => {
    el.textContent = "0";
  });

  spinState.intervals = reelEls.map((el) =>
    setInterval(() => {
      el.textContent = symbolIcons[chooseRandom(Object.keys(symbolIcons))];
    }, 20)
  );
}

function stopReel() {
  if (!spinState.isSpinning) return;
  const index = spinState.currentReel;
  if (index >= reelEls.length) return;

  clearInterval(spinState.intervals[index]);
  reelEls[index].textContent = symbolIcons[spinState.finalReels[index]];
  spinState.currentReel += 1;

  if (spinState.currentReel >= reelEls.length) {
    finalizeSpin();
    return;
  }

  resultTextEl.textContent = `Reel ${index + 1} locked. Click STOP to lock reel ${spinState.currentReel + 1}.`;
}

function finalizeSpin() {
  spinState.isSpinning = false;
  stopBtn.classList.add("hidden");

  const prize = Math.round(spinState.bet * spinState.outcome.multiplier);
  setCurrentBalance(getCurrentBalance() + prize);
  const message = determineMessage(spinState.outcome.type, prize, spinState.bet);
  updateUI(`${message} ${formatSymbols(spinState.finalReels)}`);

  spinBtn.disabled = getCurrentBalance() < 1;
  maxBtn.disabled = getCurrentBalance() < 1;
  betDownBtn.disabled = false;
  betUpBtn.disabled = false;
  spinState.intervals = [];
}

function validateBet() {
  let bet = Number(betInput.value || 0);
  const currentBalance = getCurrentBalance();
  if (currentBalance === 0) {
    bet = 0;
  } else {
    if (bet < 1) bet = 1;
    if (bet > currentBalance) bet = currentBalance;
  }
  betInput.value = bet;
  betDisplay.textContent = bet.toString();
}

function openAdmin() {
  if (!adminMenu) return;
  const isOpen = !adminMenu.classList.contains("hidden");
  if (isOpen) {
    closeAdmin();
    return;
  }
  adminMenu.classList.remove("hidden");
  adminAmount.value = "50";
  adminPasswordInput.value = "";
}

function closeAdmin() {
  if (!adminMenu) return;
  adminMenu.classList.add("hidden");
}

function isAdminPasswordValid() {
  if (!adminPasswordInput) return false;
  const password = String(adminPasswordInput.value || "");
  if (password !== ADMIN_PASSWORD) {
    resultTextEl.textContent = "Incorrect admin password.";
    return false;
  }
  return true;
}

function addAdminCoins() {
  if (!isAdminPasswordValid()) return;
  const amount = Number(adminAmount.value || 0);
  if (amount <= 0) {
    resultTextEl.textContent = "Enter a positive token amount.";
    return;
  }
  setCurrentBalance(getCurrentBalance() + amount);
  updateUI(`Owner added ${amount} tokens to ${currentUserId}.`);
  closeAdmin();
}

function removeAdminCoins() {
  if (!isAdminPasswordValid()) return;
  const amount = Number(adminAmount.value || 0);
  if (amount <= 0) {
    resultTextEl.textContent = "Enter a positive token amount.";
    return;
  }
  setCurrentBalance(getCurrentBalance() - amount);
  updateUI(`Owner removed ${amount} tokens from ${currentUserId}.`);
  closeAdmin();
}

betInput.addEventListener("input", validateBet);
betDownBtn.addEventListener("click", () => {
  const currentBalance = getCurrentBalance();
  if (currentBalance === 0) {
    betInput.value = 0;
  } else {
    betInput.value = Math.max(1, Number(betInput.value || 1) - 1);
  }
  validateBet();
});
betUpBtn.addEventListener("click", () => {
  betInput.value = Math.min(getCurrentBalance(), Number(betInput.value || 1) + 1);
  validateBet();
});
spinBtn.addEventListener("click", spin);
stopBtn.addEventListener("click", stopReel);
maxBtn.addEventListener("click", () => {
  const balance = getCurrentBalance();
  betInput.value = balance > 0 ? balance : 0;
  validateBet();
});
adminBtn.addEventListener("click", openAdmin);
adminClose?.addEventListener("click", closeAdmin);
adminSave?.addEventListener("click", addAdminCoins);
const adminWithdraw = document.getElementById("admin-withdraw");
adminWithdraw?.addEventListener("click", removeAdminCoins);

document.addEventListener("click", (event) => {
  if (!adminMenu || adminMenu.classList.contains("hidden")) return;
  const target = event.target;
  if (target === adminBtn || adminMenu.contains(target)) return;
  closeAdmin();
});

loadState();
validateBet();
updateUI();
