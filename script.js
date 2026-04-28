const ADMIN_PASSWORD = "changeme"; // Change this before using.
const BET_PER_SPIN = 1;

const outcomeTable = [
  { max: 0.62225, payout: 0, reels: ["🍊", "🍋", "🔔"], message: "No win this spin." },
  { max: 0.87225, payout: 1, reels: ["🍋", "🍋", "✨"], message: "Small win: +1 token." },
  { max: 0.95225, payout: 2, reels: ["🍒", "🍒", "✨"], message: "Nice hit: +2 tokens." },
  { max: 0.98725, payout: 5, reels: ["🔔", "🔔", "🔔"], message: "Great! +5 tokens." },
  { max: 0.997, payout: 20, reels: ["7️⃣", "7️⃣", "7️⃣"], message: "Big win! +20 tokens." },
  { max: 1, payout: 50, reels: ["💎", "💎", "💎"], message: "JACKPOT! +50 tokens!" },
];

const balanceEl = document.getElementById("balance");
const lastWinEl = document.getElementById("last-win");
const statusEl = document.getElementById("status");
const spinBtn = document.getElementById("spin-btn");
const reelEls = [
  document.getElementById("reel-1"),
  document.getElementById("reel-2"),
  document.getElementById("reel-3"),
];

const adminDialog = document.getElementById("admin-dialog");
const adminOpenBtn = document.getElementById("admin-open");
const adminCancelBtn = document.getElementById("admin-cancel");
const adminForm = document.getElementById("admin-form");
const adminPasswordInput = document.getElementById("admin-password");
const tokenAmountInput = document.getElementById("token-amount");
const adminMsg = document.getElementById("admin-msg");

let balance = 0;

function saveState() {
  localStorage.setItem("slot_balance", String(balance));
}

function loadState() {
  const stored = Number(localStorage.getItem("slot_balance"));
  if (Number.isFinite(stored) && stored >= 0) {
    balance = Math.floor(stored);
  }
}

function updateUi(lastWin = 0) {
  balanceEl.textContent = String(balance);
  lastWinEl.textContent = String(lastWin);
  spinBtn.disabled = balance < BET_PER_SPIN;
}

function drawOutcome() {
  const n = Math.random();
  return outcomeTable.find((entry) => n < entry.max) ?? outcomeTable[outcomeTable.length - 1];
}

function spin() {
  if (balance < BET_PER_SPIN) {
    statusEl.textContent = "Not enough tokens. Use Admin to add more.";
    return;
  }

  balance -= BET_PER_SPIN;
  const outcome = drawOutcome();
  balance += outcome.payout;

  reelEls.forEach((reel, idx) => {
    reel.textContent = outcome.reels[idx];
  });

  statusEl.textContent = outcome.message;
  updateUi(outcome.payout);
  saveState();
}

adminOpenBtn.addEventListener("click", () => {
  adminPasswordInput.value = "";
  tokenAmountInput.value = "";
  adminMsg.textContent = "";
  adminDialog.showModal();
});

adminCancelBtn.addEventListener("click", () => {
  adminDialog.close();
});

adminForm.addEventListener("submit", (event) => {
  event.preventDefault();
  adminMsg.textContent = "";

  if (adminPasswordInput.value !== ADMIN_PASSWORD) {
    adminMsg.textContent = "Wrong password.";
    return;
  }

  const amount = Number(tokenAmountInput.value);
  if (!Number.isInteger(amount) || amount <= 0) {
    adminMsg.textContent = "Enter a whole number greater than 0.";
    return;
  }

  balance += amount;
  saveState();
  updateUi(0);
  statusEl.textContent = `Added ${amount} tokens.`;
  adminDialog.close();
});

spinBtn.addEventListener("click", spin);

loadState();
updateUi(0);
