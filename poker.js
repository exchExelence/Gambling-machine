const ADMIN_PASSWORD_POKER = "050211";

// Card deck
const suits = ['♠', '♥', '♦', '♣'];
const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

// Game state
const gameState = {
  isDealing: false,
  deck: [],
  playerHand: [],
  opponentHand: [],
  communityCards: [],
  playerBet: 0,
  opponentBet: 0,
  pot: 0,
  gamePhase: 'betting', // betting, flop, turn, river, showdown
  gameOver: false,
  minBet: 10
};

// Elements
const balanceEl = document.getElementById("balance");
const cashEl = document.getElementById("cash-value");
const resultTextEl = document.getElementById("result-text");
const betInput = document.getElementById("bet-input");
const betDisplay = document.getElementById("bet-display");
const dealBtn = document.getElementById("deal-btn");
const foldBtn = document.getElementById("fold-btn");
const callBtn = document.getElementById("call-btn");
const raiseBtn = document.getElementById("raise-btn");
const checkBtn = document.getElementById("check-btn");
const allInBtn = document.getElementById("all-in-btn");
const maxBtn = document.getElementById("max-btn");
const betDownBtn = document.getElementById("bet-down");
const betUpBtn = document.getElementById("bet-up");
const playerHandEl = document.getElementById("player-hand");
const opponentHandEl = document.getElementById("opponent-hand");
const communityCardsEl = document.getElementById("community-cards");
const bestHandEl = document.getElementById("best-hand");
const yourBetEl = document.getElementById("your-bet");
const opponentStatusEl = document.getElementById("opponent-status");
const adminBtn = document.getElementById("admin-btn");
const adminMenu = document.getElementById("admin-dropdown");
const adminPasswordInput = document.getElementById("admin-password");
const versionLabel = document.getElementById("version-label");
const adminSave = document.getElementById("admin-save");
const adminClose = document.getElementById("admin-close");
const adminAmount = document.getElementById("admin-amount");

// Initialize the game
function initGame() {
  loadState();
  updateBalance();
  setupEventListeners();
  renderCards();
}

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
  if (card.rank === 'A') return 14;
  if (card.rank === 'K') return 13;
  if (card.rank === 'Q') return 12;
  if (card.rank === 'J') return 11;
  return parseInt(card.rank);
}

function cardToString(card) {
  return `${card.rank}${card.suit}`;
}

function renderCards() {
  // Render player hand
  playerHandEl.innerHTML = '';
  for (let card of gameState.playerHand) {
    const cardEl = document.createElement('div');
    cardEl.className = 'card';
    cardEl.textContent = cardToString(card);
    playerHandEl.appendChild(cardEl);
  }

  // Render opponent hand
  opponentHandEl.innerHTML = '';
  if (gameState.gamePhase === 'showdown' || gameState.opponentHand.length === 0) {
    for (let card of gameState.opponentHand) {
      const cardEl = document.createElement('div');
      cardEl.className = 'card';
      cardEl.textContent = cardToString(card);
      opponentHandEl.appendChild(cardEl);
    }
  } else {
    for (let i = 0; i < gameState.opponentHand.length; i++) {
      const cardEl = document.createElement('div');
      cardEl.className = 'card back';
      cardEl.textContent = '?';
      opponentHandEl.appendChild(cardEl);
    }
  }

  // Render community cards
  communityCardsEl.innerHTML = '';
  for (let card of gameState.communityCards) {
    const cardEl = document.createElement('div');
    cardEl.className = 'card';
    cardEl.textContent = cardToString(card);
    communityCardsEl.appendChild(cardEl);
  }
}

function dealGame() {
  if (gameState.isDealing || getCurrentBalance() < gameState.minBet) {
    resultTextEl.textContent = 'Invalid bet amount';
    return;
  }

  const bet = parseInt(betInput.value) || 0;
  if (bet === 0) {
    resultTextEl.textContent = 'Place a bet first';
    return;
  }

  if (bet > getCurrentBalance()) {
    resultTextEl.textContent = 'Insufficient balance';
    return;
  }

  gameState.isDealing = true;
  gameState.gameOver = false;
  gameState.gamePhase = 'betting';
  gameState.deck = createDeck();
  gameState.playerHand = [];
  gameState.opponentHand = [];
  gameState.communityCards = [];
  gameState.playerBet = bet;
  gameState.opponentBet = bet;
  gameState.pot = bet * 2;

  // Deal two cards to each player
  gameState.playerHand = [drawCard(), drawCard()];
  gameState.opponentHand = [drawCard(), drawCard()];

  setCurrentBalance(getCurrentBalance() - bet);
  updateBalance();
  updateBestHand();
  renderCards();

  // Update UI
  betInput.value = '';
  resultTextEl.textContent = 'Your turn - Fold, Call, or Raise';
  dealBtn.classList.add('hidden');
  foldBtn.classList.remove('hidden');
  callBtn.classList.remove('hidden');
  raiseBtn.classList.remove('hidden');
  checkBtn.classList.add('hidden');
  allInBtn.classList.remove('hidden');
  betDownBtn.disabled = true;
  betUpBtn.disabled = true;
  betInput.disabled = true;
  maxBtn.disabled = true;
  yourBetEl.textContent = bet;
}

function fold() {
  resultTextEl.textContent = 'You folded! Opponent wins the pot.';
  gameState.gameOver = true;
  setCurrentBalance(getCurrentBalance() + gameState.opponentBet);
  updateBalance();
  endGame();
}

function call() {
  const additionalBet = gameState.opponentBet - gameState.playerBet;
  if (additionalBet <= 0) {
    check();
    return;
  }

  if (additionalBet > getCurrentBalance()) {
    resultTextEl.textContent = 'Insufficient balance to call';
    return;
  }

  gameState.playerBet = gameState.opponentBet;
  gameState.pot += additionalBet;
  setCurrentBalance(getCurrentBalance() - additionalBet);
  updateBalance();
  yourBetEl.textContent = gameState.playerBet;

  opponentAction();
}

function check() {
  resultTextEl.textContent = 'You checked. Moving to next round...';
  setTimeout(() => {
    advanceRound();
  }, 1500);
}

function raise() {
  const raiseAmount = parseInt(betInput.value) || 0;
  if (raiseAmount <= gameState.opponentBet) {
    resultTextEl.textContent = 'Raise must be higher than opponent bet';
    return;
  }

  if (raiseAmount > getCurrentBalance() + gameState.playerBet) {
    resultTextEl.textContent = 'Insufficient balance';
    return;
  }

  const additionalBet = raiseAmount - gameState.playerBet;
  gameState.playerBet = raiseAmount;
  gameState.pot += additionalBet;
  setCurrentBalance(getCurrentBalance() - additionalBet);
  updateBalance();
  yourBetEl.textContent = gameState.playerBet;
  betInput.value = '';

  resultTextEl.textContent = 'You raised. Opponent is deciding...';
  setTimeout(() => {
    opponentAction();
  }, 1500);
}

function allIn() {
  const remaining = getCurrentBalance();
  if (remaining <= 0) {
    resultTextEl.textContent = 'No balance to go all in';
    return;
  }

  gameState.playerBet += remaining;
  gameState.pot += remaining;
  setCurrentBalance(0);
  updateBalance();
  yourBetEl.textContent = gameState.playerBet;

  resultTextEl.textContent = 'You went all in! Opponent is deciding...';
  setTimeout(() => {
    opponentAction();
  }, 1500);
}

function opponentAction() {
  const actions = ['fold', 'call', 'raise'];
  const action = chooseRandom(actions);

  if (action === 'fold') {
    resultTextEl.textContent = 'Opponent folded! You win the pot!';
    const winnings = gameState.pot;
    setCurrentBalance(getCurrentBalance() + winnings);
    updateBalance();
    gameState.gameOver = true;
  } else if (action === 'call') {
    const additionalBet = gameState.playerBet - gameState.opponentBet;
    gameState.opponentBet = gameState.playerBet;
    gameState.pot += additionalBet;
    resultTextEl.textContent = 'Opponent called. Moving to next round...';
    setTimeout(() => {
      advanceRound();
    }, 1500);
  } else if (action === 'raise') {
    const raiseAmount = gameState.playerBet + randomInt(10, 50);
    gameState.opponentBet = raiseAmount;
    gameState.pot += (raiseAmount - gameState.opponentBet);
    resultTextEl.textContent = `Opponent raised to ${raiseAmount}. Your turn...`;
  }
}

function advanceRound() {
  switch (gameState.gamePhase) {
    case 'betting':
      // Deal flop (3 community cards)
      gameState.communityCards = [drawCard(), drawCard(), drawCard()];
      gameState.gamePhase = 'flop';
      resultTextEl.textContent = 'Flop dealt. Your action...';
      break;
    case 'flop':
      // Deal turn (1 more card)
      gameState.communityCards.push(drawCard());
      gameState.gamePhase = 'turn';
      resultTextEl.textContent = 'Turn dealt. Your action...';
      break;
    case 'turn':
      // Deal river (1 more card)
      gameState.communityCards.push(drawCard());
      gameState.gamePhase = 'river';
      resultTextEl.textContent = 'River dealt. Showdown!';
      setTimeout(() => {
        showdown();
      }, 1500);
      break;
  }

  renderCards();
  gameState.playerBet = 0;
  gameState.opponentBet = 0;
  yourBetEl.textContent = '0';
  betInput.value = '';
}

function showdown() {
  gameState.gamePhase = 'showdown';
  renderCards();

  const playerRank = rankHand(gameState.playerHand, gameState.communityCards);
  const opponentRank = rankHand(gameState.opponentHand, gameState.communityCards);

  if (playerRank > opponentRank) {
    resultTextEl.textContent = 'You win the showdown!';
    const winnings = gameState.pot;
    setCurrentBalance(getCurrentBalance() + winnings);
  } else if (playerRank < opponentRank) {
    resultTextEl.textContent = 'Opponent wins the showdown!';
  } else {
    resultTextEl.textContent = 'Split pot!';
    setCurrentBalance(getCurrentBalance() + gameState.pot / 2);
  }

  updateBalance();
  gameState.gameOver = true;
}

function rankHand(playerCards, communityCards) {
  const allCards = [...playerCards, ...communityCards];
  const bestCombo = findBestHand(allCards);
  return bestCombo.rank;
}

function findBestHand(cards) {
  // Simple hand ranking - in a real implementation, you'd check all 5-card combinations
  const sorted = [...cards].sort((a, b) => getCardValue(b) - getCardValue(a));
  
  // Check for flush
  if (isFlush(sorted)) {
    return { rank: 50, name: 'Flush' };
  }
  
  // Check for straight
  if (isStraight(sorted)) {
    return { rank: 40, name: 'Straight' };
  }
  
  // Check for pairs
  const pairs = countPairs(sorted);
  if (pairs.threeOfAKind) {
    return { rank: 35, name: 'Three of a Kind' };
  }
  if (pairs.twoPairs) {
    return { rank: 20, name: 'Two Pair' };
  }
  if (pairs.onePair) {
    return { rank: 10, name: 'One Pair' };
  }
  
  return { rank: getCardValue(sorted[0]), name: 'High Card' };
}

function isFlush(cards) {
  const suitCounts = {};
  for (let card of cards) {
    suitCounts[card.suit] = (suitCounts[card.suit] || 0) + 1;
    if (suitCounts[card.suit] >= 5) return true;
  }
  return false;
}

function isStraight(cards) {
  const values = [...new Set(cards.map(c => getCardValue(c)))].sort((a, b) => b - a);
  if (values.length < 5) return false;
  
  for (let i = 0; i <= values.length - 5; i++) {
    if (values[i] - values[i + 4] === 4) return true;
  }
  return false;
}

function countPairs(cards) {
  const rankCounts = {};
  for (let card of cards) {
    rankCounts[card.rank] = (rankCounts[card.rank] || 0) + 1;
  }
  
  const counts = Object.values(rankCounts).sort((a, b) => b - a);
  return {
    threeOfAKind: counts[0] >= 3,
    twoPairs: counts[0] === 2 && counts[1] === 2,
    onePair: counts[0] === 2
  };
}

function updateBestHand() {
  if (gameState.playerHand.length === 0) {
    bestHandEl.textContent = '-';
  } else {
    const allCards = [...gameState.playerHand, ...gameState.communityCards];
    if (allCards.length >= 5) {
      const best = findBestHand(allCards);
      bestHandEl.textContent = best.name;
    } else {
      bestHandEl.textContent = 'N/A';
    }
  }
}

function updateBalance() {
  const balance = getCurrentBalance();
  balanceEl.textContent = balance;
  cashEl.textContent = formatCash(balance);
}

function endGame() {
  dealBtn.classList.remove('hidden');
  foldBtn.classList.add('hidden');
  callBtn.classList.add('hidden');
  raiseBtn.classList.add('hidden');
  checkBtn.classList.add('hidden');
  allInBtn.classList.add('hidden');
  betDownBtn.disabled = false;
  betUpBtn.disabled = false;
  betInput.disabled = false;
  maxBtn.disabled = false;
  gameState.isDealing = false;
}

function setupEventListeners() {
  dealBtn.addEventListener('click', dealGame);
  foldBtn.addEventListener('click', fold);
  callBtn.addEventListener('click', call);
  raiseBtn.addEventListener('click', raise);
  checkBtn.addEventListener('click', check);
  allInBtn.addEventListener('click', allIn);
  maxBtn.addEventListener('click', () => {
    betInput.value = getCurrentBalance();
  });

  betDownBtn.addEventListener('click', () => {
    const current = parseInt(betInput.value) || 0;
    betInput.value = Math.max(0, current - 10);
  });

  betUpBtn.addEventListener('click', () => {
    const current = parseInt(betInput.value) || 0;
    betInput.value = current + 10;
  });

  // Admin menu
  adminBtn.addEventListener('click', () => {
    adminMenu.classList.toggle('hidden');
  });

  adminClose.addEventListener('click', () => {
    adminMenu.classList.add('hidden');
    adminPasswordInput.value = '';
  });

  adminSave.addEventListener('click', () => {
    if (adminPasswordInput.value === ADMIN_PASSWORD_POKER) {
      const amount = parseInt(adminAmount.value) || 0;
      setCurrentBalance(getCurrentBalance() + amount * 100);
      updateBalance();
      resultTextEl.textContent = `Added ${amount} tokens!`;
      adminMenu.classList.add('hidden');
      adminPasswordInput.value = '';
    } else {
      resultTextEl.textContent = 'Incorrect password';
    }
  });

  document.getElementById('admin-withdraw').addEventListener('click', () => {
    if (adminPasswordInput.value === ADMIN_PASSWORD_POKER) {
      const amount = parseInt(adminAmount.value) || 0;
      setCurrentBalance(Math.max(0, getCurrentBalance() - amount * 100));
      updateBalance();
      resultTextEl.textContent = `Removed ${amount} tokens!`;
      adminMenu.classList.add('hidden');
      adminPasswordInput.value = '';
    } else {
      resultTextEl.textContent = 'Incorrect password';
    }
  });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGame);
} else {
  initGame();
}
