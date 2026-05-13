const MATCHMAKER_PAIR_COUNT = 8;
const MATCHMAKER_TURN_COUNT = 5;
const MATCHMAKER_MISMATCH_DELAY_MS = 1000;

let matchmakerResolutionTimeoutId = null;

function buildMatchmakerEncounter(pairCount = MATCHMAKER_PAIR_COUNT) {
  if (MATCHMAKER_PAIRS.length < pairCount) {
    throw new Error(`Not enough Matchmaker pairs. Need ${pairCount}, but only found ${MATCHMAKER_PAIRS.length}.`);
  }

  const selectedPairs = shuffleArray(MATCHMAKER_PAIRS).slice(0, pairCount);
  const cards = shuffleArray(
    selectedPairs.flatMap((pair) => {
      return pair.names.map((name, index) => ({
        cardId: `${pair.id}-${index}`,
        pairId: pair.id,
        label: name,
        faceUp: false,
        matched: false
      }));
    })
  );

  return {
    triviaType: "matchmaker",
    selectedPairs,
    cards
  };
}

function startMatchmakerEvent(encounter = buildMatchmakerEncounter()) {
  gameState.firstDraftUsedThisPuzzle = false;
  clearMatchmakerResolutionTimer();

  gameState.currentMatchmakerEvent = {
    cards: encounter.cards.map((card) => ({ ...card })),
    flippedCardIds: [],
    matchesFound: 0,
    turnsUsed: 0,
    resolving: false
  };

  matchmakerMessage.textContent = "";

  showDialog({
    dialog: [
      "Next to being married, a girl likes to be crossed in love a little now and then. It is something to think of, and gives her a sort of distinction among her companions."
    ],
    dialogImage: "images/lib.png"
  });

  renderMatchmakerEvent();
  showSection("matchmaker");
}

function renderMatchmakerEvent() {
  const eventData = gameState.currentMatchmakerEvent;
  matchmakerBoard.innerHTML = "";

  if (!eventData) {
    return;
  }

  matchmakerTurns.textContent = `Turns remaining: ${Math.max(0, MATCHMAKER_TURN_COUNT - eventData.turnsUsed)}`;
  matchmakerMatches.textContent = `Pairs found: ${eventData.matchesFound}`;

  eventData.cards.forEach((card) => {
    const cardButton = document.createElement("button");
    cardButton.type = "button";
    cardButton.classList.add("matchmaker-card");
    cardButton.dataset.cardId = card.cardId;

    if (card.faceUp || card.matched) {
      cardButton.classList.add("face-up");
      cardButton.textContent = card.label;
    } else {
      cardButton.textContent = "?";
    }

    if (card.matched) {
      cardButton.classList.add("matched");
      cardButton.disabled = true;
    } else {
      cardButton.disabled = eventData.resolving || card.faceUp;
    }

    cardButton.addEventListener("click", () => {
      flipMatchmakerCard(card.cardId);
    });

    matchmakerBoard.appendChild(cardButton);
  });
}

function flipMatchmakerCard(cardId) {
  const eventData = gameState.currentMatchmakerEvent;

  if (!eventData || eventData.resolving || eventData.turnsUsed >= MATCHMAKER_TURN_COUNT) {
    return;
  }

  const card = eventData.cards.find((candidate) => candidate.cardId === cardId);

  if (!card || card.faceUp || card.matched) {
    return;
  }

  card.faceUp = true;
  eventData.flippedCardIds.push(card.cardId);
  matchmakerMessage.textContent = "";
  renderMatchmakerEvent();

  if (eventData.flippedCardIds.length === 2) {
    resolveMatchmakerTurn();
  }
}

function resolveMatchmakerTurn() {
  const eventData = gameState.currentMatchmakerEvent;

  if (!eventData) {
    return;
  }

  const flippedCards = eventData.flippedCardIds.map((cardId) => {
    return eventData.cards.find((card) => card.cardId === cardId);
  });

  if (flippedCards.length !== 2 || flippedCards.some((card) => !card)) {
    return;
  }

  eventData.turnsUsed += 1;
  eventData.resolving = true;
  renderMatchmakerEvent();

  if (flippedCards[0].pairId === flippedCards[1].pairId) {
    flippedCards.forEach((card) => {
      card.matched = true;
    });
    eventData.matchesFound += 1;
    eventData.flippedCardIds = [];
    eventData.resolving = false;
    renderMatchmakerEvent();
    maybeFinishMatchmakerEvent();
    return;
  }

  matchmakerResolutionTimeoutId = setTimeout(() => {
    flippedCards.forEach((card) => {
      card.faceUp = false;
    });
    eventData.flippedCardIds = [];
    eventData.resolving = false;
    matchmakerResolutionTimeoutId = null;
    renderMatchmakerEvent();
    maybeFinishMatchmakerEvent();
  }, MATCHMAKER_MISMATCH_DELAY_MS);
}

function maybeFinishMatchmakerEvent() {
  const eventData = gameState.currentMatchmakerEvent;

  if (!eventData || eventData.resolving) {
    return;
  }

  if (eventData.turnsUsed >= MATCHMAKER_TURN_COUNT) {
    startMatchmakerSummaryRewardPhase(eventData.matchesFound);
  }
}

function startMatchmakerSummaryRewardPhase(matchesFound) {
  clearMatchmakerResolutionTimer();
  gameState.currentMatchmakerEvent = null;
  gameState.currentRewardOffers = [];
  gameState.rewardTilePurchased = false;
  const trinketRewards = [];

  for (let i = 0; i < matchesFound; i += 1) {
    const trinket = getRandomTrinket();

    if (!trinket) {
      continue;
    }

    trinketRewards.push(trinket);
    gameState.inventory.push({
      type: "trinket",
      trinketId: trinket.id,
      ...(trinket.id === "babelBag" ? { babelTileCount: 0 } : {})
    });
  }

  tileOffersSection.classList.add("hidden");
  tileOfferContainer.innerHTML = "";
  goldRewardMessage.textContent = `You found ${matchesFound} pair${matchesFound === 1 ? "" : "s"}.`;
  rewardMessage.textContent =
    trinketRewards.length > 0
      ? `You found ${trinketRewards.map((trinket) => `${trinket.icon} ${trinket.name}`).join(", ")}.`
      : "No pairs, no prize.";
  skipRewardButton.classList.remove("hidden");

  renderStats();
  renderInventory();

  showSection("reward");
}

function clearMatchmakerResolutionTimer() {
  if (matchmakerResolutionTimeoutId !== null) {
    clearTimeout(matchmakerResolutionTimeoutId);
    matchmakerResolutionTimeoutId = null;
  }
}
