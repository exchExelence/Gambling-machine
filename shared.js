// Shared game state and utilities across all casino games

const STARTING_BALANCE = 0;
const ADMIN_PASSWORD = "050211"; // Change this before sharing
const STATE_STORAGE_KEY = "tokenCasinoState";

let users = {};
let currentUserId = "player1";

function loadState() {
  const stored = localStorage.getItem(STATE_STORAGE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed && typeof parsed === "object") {
        if (parsed.users && typeof parsed.users === "object") {
          users = parsed.users;
        }
        if (typeof parsed.currentUserId === "string") {
          currentUserId = parsed.currentUserId;
        }
      }
    } catch (err) {
      console.warn("Unable to parse saved state", err);
    }
  }

  Object.keys(users).forEach((id) => {
    const user = users[id];
    if (typeof user !== "object") return;
    if (!("balance" in user)) {
      user.balance = STARTING_BALANCE;
    }
  });

  if (!currentUserId || !users[currentUserId]) {
    const firstUser = Object.keys(users)[0];
    if (firstUser) {
      currentUserId = firstUser;
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
  if (!currentUserId) return null;
  if (!users[currentUserId]) {
    users[currentUserId] = { balance: STARTING_BALANCE };
  }
  return users[currentUserId];
}

function getCurrentBalance() {
  return getCurrentUser()?.balance || 0;
}

function setCurrentBalance(amount) {
  const user = getCurrentUser();
  if (!user) return;
  user.balance = Math.max(0, Math.round(amount));
  saveState();
}

function formatCash(amount) {
  return `$${(amount / 100).toFixed(2)}`;
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function chooseRandom(array) {
  return array[randomInt(0, array.length - 1)];
}

// Initialize state on load
loadState();
