const ADMIN_PASSWORD_BJK = "050211";

// Card deck
const suits = ['♠', '♥', '♦', '♣'];
const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

// Game state
const gameState = {
  isDealing: false,
  deck: [],
  playerHand: [],
  dealerHand: [],
  bet: 0,
  gameOver: false
};

// Elements
const balanceEl = document.getElementById("balance");
const cashEl = document.getElementById("cash-value");
const resultTextEl = document.getElementById("result-text");
const betInput = document.getElementById("bet-input");
const betDisplay = document.getElementById("bet-display");
const dealBtn = document.getElementById("deal-btn");
const hitBtn = document.getElementById("hit-btn");
const standBtn = document.getElementById("stand-btn");
const doubleBtn = document.getElementById("double-btn");
const splitBtn = document.getElementById("split-btn");
const maxBtn = document.getElementById("max-btn");
const betDownBtn = document.getElementById("bet-down");
const betUpBtn = document.getElementById("bet-up");
const playerHandEl = document.getElementById("player-hand");
const playerValueEl = document.getElementById("player-value");
const dealerHandEl = document.getElementById("dealer-hand");
const dealerValueEl = document.getElementById("dealer-value");
const adminBtn = document.getElementById("admin-btn");
const adminMenu = document.getElementById("admin-dropdown");
const adminPasswordInput = document.getElementById("admin-password");
const versionLabel = document.getElementById("version-label");
const adminSave = document.getElementById("admin-save");
const adminClose = document.getElementById("admin-close");
const adminAmount = document.getElementById("admin-amount");

function createDeck() {
  const deck = [];
  for (let suit of suits) {
    for (let rank of ranks) {
      deck.push({ suit, rank });
    }
  }
  // Shuffle deck
  for (let i = deck.length - 1; i > 0; i--) {
    const j = randomInt(0, i);
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function drawCard() {
  if (gameState.deck.length < 20) {
    gameState.deck = createDeck();
  }
  return gameState.deck.pop();
}

function getCardValue(card) {
  if (card.rank === 'A') return 11;
  if (['J', 'Q', 'K'].includes(card.rank)) return 10;
  return parseInt(card.rank);
}

function calculateHandValue(hand) {
  let value = 0;
  let aces = 0;
  
  for (let card of hand) {
    const cardValue = getCardValue(card);
    if (card.rank === 'A') aces++;
    value += cardValue;
  }
  
  while (value > 21 && aces > 0) {
    value -= 10;
    aces--;
  }
  
  return value;
}

function isBlackjack(hand) {
  return hand.length === 2 && calculateHandValue(hand) === 21;
}

function cardToString(card) {
  return `${card.rank}${card.suit}`;
}

function renderCards(hand, container, showHoleCard = true) {
  container.innerHTML = '';
  for (let i = 0; i < hand.length; i++) {
    const cardEl = document.createElement('div');
    cardEl.className = 'card';
    
    // If this is the dealer's second card and hole card is hidden, show card back
    if (container.id === 'dealer-hand' && i === 1 && !showHoleCard) {
      cardEl.textContent = '🂠';
      cardEl.classList.add('card-back');
    } else {
      cardEl.textContent = cardToString(hand[i]);
    }
    
    container.appendChild(cardEl);
  }
}

function updateUI(message = "") {
  balanceEl.textContent = getCurrentBalance().toString();
  if (cashEl) {
    cashEl.textContent = formatCash(getCurrentBalance());
  }
  if (versionLabel) {
    versionLabel.textContent = `v15`;
  }
  betDisplay.textContent = gameState.bet.toString();
  if (message) {
    resultTextEl.textContent = message;
  }
  
  const playerValue = calculateHandValue(gameState.playerHand);
  const dealerValue = calculateHandValue(gameState.dealerHand);
  
  playerValueEl.textContent = playerValue > 21 ? `BUST (${playerValue})` : playerValue;
  
  // Show dealer value only when hole card is revealed or game is over
  const showHoleCard = gameState.gameOver || gameState.dealerHand.length > 2;
  if (showHoleCard) {
    dealerValueEl.textContent = dealerValue > 21 ? `BUST (${dealerValue})` : dealerValue;
  } else if (gameState.dealerHand.length >= 1) {
    dealerValueEl.textContent = '?';
  } else {
    dealerValueEl.textContent = '';
  }
  
  renderCards(gameState.playerHand, playerHandEl);
  renderCards(gameState.dealerHand, dealerHandEl, showHoleCard);
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

function dealCards() {
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
  gameState.bet = bet;
  gameState.playerHand = [drawCard(), drawCard()];
  gameState.dealerHand = [drawCard(), drawCard()];
  gameState.gameOver = false;
  gameState.isDealing = true;
  
  updateUI("Blackjack!");
  
  dealBtn.disabled = true;
  hitBtn.classList.remove("hidden");
  standBtn.classList.remove("hidden");
  betDownBtn.disabled = true;
  betUpBtn.disabled = true;
  maxBtn.disabled = true;
  
  const playerVal = calculateHandValue(gameState.playerHand);
  const playerBJ = isBlackjack(gameState.playerHand);
  const dealerBJ = isBlackjack(gameState.dealerHand);
  
  if (playerBJ && dealerBJ) {
    resolvePush();
  } else if (playerBJ) {
    resolveBlackjack();
  } else if (playerVal > 21) {
    playerBust();
  } else {
    // Check if can double down
    if (gameState.playerHand.length === 2 && getCurrentBalance() >= gameState.bet) {
      doubleBtn.classList.remove("hidden");
    }
    // Check if can split
    if (gameState.playerHand.length === 2 && gameState.playerHand[0].rank === gameState.playerHand[1].rank && getCurrentBalance() >= gameState.bet) {
      splitBtn.classList.remove("hidden");
    }
    updateUI("Your turn - Hit or Stand?");
  }
}

function playerHit() {
  if (!gameState.isDealing) return;
  
  gameState.playerHand.push(drawCard());
  const playerVal = calculateHandValue(gameState.playerHand);
  
  updateUI();
  
  if (playerVal > 21) {
    playerBust();
  } else if (playerVal === 21) {
    resultTextEl.textContent = "21! Stand or hit again?";
  }
}

function playerStand() {
  if (!gameState.isDealing) return;
  
  dealerPlay();
}

function playerDouble() {
  if (!gameState.isDealing || gameState.playerHand.length !== 2) return;
  
  const currentBalance = getCurrentBalance();
  if (currentBalance < gameState.bet) {
    resultTextEl.textContent = "Not enough tokens to double down.";
    return;
  }
  
  setCurrentBalance(currentBalance - gameState.bet);
  gameState.bet *= 2;
  gameState.playerHand.push(drawCard());
  
  updateUI();
  
  const playerVal = calculateHandValue(gameState.playerHand);
  if (playerVal > 21) {
    playerBust();
  } else {
    dealerPlay();
  }
}

function playerSplit() {
  if (!gameState.isDealing || gameState.playerHand.length !== 2) return;
  if (gameState.playerHand[0].rank !== gameState.playerHand[1].rank) return;
  
  const currentBalance = getCurrentBalance();
  if (currentBalance < gameState.bet) {
    resultTextEl.textContent = "Not enough tokens to split.";
    return;
  }
  
  setCurrentBalance(currentBalance - gameState.bet);
  gameState.bet *= 2;
  
  const secondCard = gameState.playerHand.pop();
  gameState.playerHand.push(drawCard());
  
  updateUI("Split - First hand");
  // Simple implementation: just hit on first hand until player decides
}

function playerBust() {
  gameState.gameOver = true;
  gameState.isDealing = false;
  resultTextEl.textContent = `BUST! Lost ${gameState.bet} tokens.`;
  endRound();
}

function dealerPlay() {
  gameState.isDealing = false;
  hitBtn.classList.add("hidden");
  standBtn.classList.add("hidden");
  doubleBtn.classList.add("hidden");
  splitBtn.classList.add("hidden");
  
  updateUI("Dealer reveals hole card...");
  
  // Small delay to show the hole card reveal
  setTimeout(() => {
    updateUI("Dealer's turn...");
    
    while (calculateHandValue(gameState.dealerHand) < 17) {
      gameState.dealerHand.push(drawCard());
      updateUI();
    }
    
    gameState.gameOver = true;
    determineWinner();
  }, 1000);
}

function determineWinner() {
  const playerVal = calculateHandValue(gameState.playerHand);
  const dealerVal = calculateHandValue(gameState.dealerHand);
  
  if (playerVal > 21) {
    resultTextEl.textContent = `BUST! Lost ${gameState.bet} tokens.`;
  } else if (dealerVal > 21) {
    const winnings = Math.round(gameState.bet * 2);
    setCurrentBalance(getCurrentBalance() + winnings);
    resultTextEl.textContent = `Dealer bust! Won ${gameState.bet} tokens!`;
  } else if (playerVal > dealerVal) {
    const winnings = Math.round(gameState.bet * 2);
    setCurrentBalance(getCurrentBalance() + winnings);
    resultTextEl.textContent = `Won ${gameState.bet} tokens!`;
  } else if (playerVal < dealerVal) {
    resultTextEl.textContent = `Lost ${gameState.bet} tokens.`;
  } else {
    resolvePush();
  }
  
  updateUI();
  endRound();
}

function resolvePush() {
  gameState.gameOver = true;
  gameState.isDealing = false;
  setCurrentBalance(getCurrentBalance() + gameState.bet);
  resultTextEl.textContent = "Push! Bet returned.";
  updateUI();
  endRound();
}

function resolveBlackjack() {
  gameState.gameOver = true;
  gameState.isDealing = false;
  const winnings = Math.round(gameState.bet * 2.5); // 3:2 payout
  setCurrentBalance(getCurrentBalance() + winnings);
  resultTextEl.textContent = `Blackjack! Won ${winnings - gameState.bet} tokens!`;
  updateUI();
  endRound();
}

function endRound() {
  hitBtn.classList.add("hidden");
  standBtn.classList.add("hidden");
  doubleBtn.classList.add("hidden");
  splitBtn.classList.add("hidden");
  dealBtn.disabled = getCurrentBalance() < 1;
  betDownBtn.disabled = getCurrentBalance() < 1;
  betUpBtn.disabled = getCurrentBalance() < 1;
  maxBtn.disabled = getCurrentBalance() < 1;
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
  if (password !== ADMIN_PASSWORD_BJK) {
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
  resultTextEl.textContent = `Owner added ${amount} tokens.`;
  updateUI();
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
  resultTextEl.textContent = `Owner removed ${amount} tokens.`;
  updateUI();
  closeAdmin();
}

// Event listeners
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
dealBtn.addEventListener("click", dealCards);
hitBtn.addEventListener("click", playerHit);
standBtn.addEventListener("click", playerStand);
doubleBtn.addEventListener("click", playerDouble);
splitBtn.addEventListener("click", playerSplit);
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

// Initialize
gameState.deck = createDeck();
updateUI("Place your bet to start");
