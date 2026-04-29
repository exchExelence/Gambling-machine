const STARTING_BALANCE = 150;
const ADMIN_PASSWORD = "050211"; // Change this before sharing
const symbolIcons = {
  diamond: "♦️",
  bell: "🔔",
  plum: "🍇",
  orange: "🍊",
  lemon: "🍋",
  cherry: "🍒"
};

const spinThresholds = [
  {limit: 50, type: "3diamond", multiplier: 50},
  {limit: 400, type: "3bell", multiplier: 20},
  {limit: 1300, type: "3plum", multiplier: 10},
  {limit: 3900, type: "3orange", multiplier: 6},
  {limit: 8000, type: "3lemon", multiplier: 4},
  {limit: 14100, type: "3cherry", multiplier: 3},
  {limit: 25100, type: "2cherry", multiplier: 1.5},
  {limit: 40900, type: "1cherry", multiplier: 0.5}
];

const nonCherrySymbols = ["lemon", "orange", "plum", "bell", "diamond"];
const STATE_STORAGE_KEY = "tokenCasinoState";
let users = {};
let currentUserId = "player1";

const playerIdEl = document.getElementById("player-id");
const balanceEl = document.getElementById("balance");
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
const betDownBtn = document.getElementById("bet-down");
const betUpBtn = document.getElementById("bet-up");
const adminBtn = document.getElementById("admin-btn");
const adminModal = document.getElementById("admin-modal");
const overlay = document.getElementById("overlay");
const adminSave = document.getElementById("admin-save");
const adminCancel = document.getElementById("admin-cancel");
const adminPassword = document.getElementById("admin-password");
const adminAmount = document.getElementById("admin-amount");
const userIdInput = document.getElementById("user-id-input");
const loadUserBtn = document.getElementById("load-user-btn");
const newUserBtn = document.getElementById("new-user-btn");

function loadState() {
  const stored = localStorage.getItem(STATE_STORAGE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed && typeof parsed === "object") {
        if (typeof parsed.currentUserId === "string") {
          currentUserId = parsed.currentUserId;
        }
        if (parsed.users && typeof parsed.users === "object") {
          users = parsed.users;
        }
      }
    } catch (err) {
      console.warn("Unable to parse saved state", err);
    }
  }

  if (!users[currentUserId]) {
    const firstId = Object.keys(users)[0];
    if (firstId) {
      currentUserId = firstId;
    } else {
      currentUserId = "player1";
      users[currentUserId] = { balance: STARTING_BALANCE };
    }
  }
}

function saveState() {
  localStorage.setItem(STATE_STORAGE_KEY, JSON.stringify({ currentUserId, users }));
}

function getCurrentUser() {
  if (!users[currentUserId]) {
    users[currentUserId] = { balance: STARTING_BALANCE };
  }
  return users[currentUserId];
}

function getCurrentBalance() {
  return getCurrentUser().balance;
}

function setCurrentBalance(amount) {
  getCurrentUser().balance = Math.max(0, Math.round(amount));
}

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
  playerIdEl.textContent = currentUserId;
  balanceEl.textContent = getCurrentBalance().toString();
  betDisplay.textContent = betInput.value;
  resultTextEl.textContent = message;
  saveState();
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function chooseRandom(array) {
  return array[randomInt(0, array.length - 1)];
}

function buildReelSymbols(outcome) {
  switch (outcome) {
    case "3diamond":
      return ["diamond", "diamond", "diamond"];
    case "3bell":
      return ["bell", "bell", "bell"];
    case "3plum":
      return ["plum", "plum", "plum"];
    case "3orange":
      return ["orange", "orange", "orange"];
    case "3lemon":
      return ["lemon", "lemon", "lemon"];
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
  const roll = randomInt(1, 100000);
  const outcome = getOutcome(roll);
  const reels = buildReelSymbols(outcome.type);
  reelEls.forEach((el, index) => {
    el.textContent = symbolIcons[reels[index]];
  });

  const prize = Math.round(bet * outcome.multiplier);
  setCurrentBalance(getCurrentBalance() + prize);
  const message = determineMessage(outcome.type, prize, bet);
  updateUI(`${message} ${formatSymbols(reels)}`);
}

function validateBet() {
  let bet = Number(betInput.value || 0);
  const currentBalance = getCurrentBalance();
  if (bet < 1) bet = 1;
  if (bet > currentBalance) bet = currentBalance;
  betInput.value = bet;
  betDisplay.textContent = bet.toString();
}

function openAdmin() {
  adminModal.classList.remove("hidden");
  overlay.classList.remove("hidden");
  adminPassword.value = "";
  adminAmount.value = "50";
}

function closeAdmin() {
  adminModal.classList.add("hidden");
  overlay.classList.add("hidden");
}

function addAdminCoins() {
  if (adminPassword.value !== ADMIN_PASSWORD) {
    resultTextEl.textContent = "Incorrect owner password.";
    return;
  }
  const amount = Number(adminAmount.value || 0);
  if (amount <= 0) {
    resultTextEl.textContent = "Enter a positive top-up amount.";
    return;
  }
  setCurrentBalance(getCurrentBalance() + amount);
  updateUI(`Owner added ${amount} coins to ${currentUserId}.`);
  closeAdmin();
}

betInput.addEventListener("input", validateBet);
betDownBtn.addEventListener("click", () => {
  betInput.value = Math.max(1, Number(betInput.value || 1) - 1);
  validateBet();
});
betUpBtn.addEventListener("click", () => {
  betInput.value = Math.min(getCurrentBalance(), Number(betInput.value || 1) + 1);
  validateBet();
});
spinBtn.addEventListener("click", spin);
maxBtn.addEventListener("click", () => {
  const balance = getCurrentBalance();
  betInput.value = balance > 0 ? balance : 1;
  validateBet();
});
loadUserBtn.addEventListener("click", () => {
  setCurrentUser(userIdInput.value, false);
});
newUserBtn.addEventListener("click", () => {
  setCurrentUser(userIdInput.value, true);
});
adminBtn.addEventListener("click", openAdmin);
adminCancel.addEventListener("click", closeAdmin);
adminSave.addEventListener("click", addAdminCoins);
overlay.addEventListener("click", closeAdmin);

loadState();
validateBet();
updateUI();
