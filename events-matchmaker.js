const MATCHMAKER_PAIR_COUNT = 8;
const MATCHMAKER_MISMATCH_DELAY_MS = 3000;
const MATCHMAKER_ATTEMPT_OPTIONS = [
  { attempts: 4, cost: 0 },
  { attempts: 5, cost: 3 },
  { attempts: 6, cost: 6 },
  { attempts: 7, cost: 9 }
];

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
    selectedPairs: encounter.selectedPairs.map((pair) => ({
      ...pair,
      names: [...pair.names]
    })),
    cards: encounter.cards.map((card) => ({ ...card })),
    flippedCardIds: [],
    matchesFound: 0,
    turnsUsed: 0,
    turnLimit: null,
    resolving: false
  };

  matchmakerMessage.textContent = "";
  matchmakerIntro.classList.remove("hidden");
  matchmakerChoiceControls.classList.remove("hidden");
  matchmakerGameArea.classList.add("hidden");
  matchmakerBoard.innerHTML = "";
  updateMatchmakerChoiceButtons();

  showDialog({
    dialog: [
      "Next to being married, a girl likes to be crossed in love a little now and then. It is something to think of, and gives her a sort of distinction among her companions."
    ],
    dialogImage: "images/lib.png"
  });

  renderMatchmakerEvent();
  showSection("matchmaker");
}

function updateMatchmakerChoiceButtons() {
  const buttons = [
    matchmakerFourAttemptsButton,
    matchmakerFiveAttemptsButton,
    matchmakerSixAttemptsButton,
    matchmakerSevenAttemptsButton
  ];

  buttons.forEach((button, index) => {
    const option = MATCHMAKER_ATTEMPT_OPTIONS[index];
    button.disabled = gameState.gold < option.cost;
  });
}

function chooseMatchmakerAttemptOption(turnLimit, cost) {
  const eventData = gameState.currentMatchmakerEvent;

  if (!eventData || eventData.turnLimit !== null || gameState.gold < cost) {
    return;
  }

  gameState.gold -= cost;
  eventData.turnLimit = turnLimit;
  matchmakerIntro.classList.add("hidden");
  matchmakerChoiceControls.classList.add("hidden");
  matchmakerGameArea.classList.remove("hidden");
  matchmakerMessage.textContent = "";

  renderStats();
  renderMatchmakerEvent();
}

function renderMatchmakerEvent() {
  const eventData = gameState.currentMatchmakerEvent;
  matchmakerBoard.innerHTML = "";

  if (!eventData) {
    return;
  }

  if (eventData.turnLimit === null) {
    updateMatchmakerChoiceButtons();
    return;
  }

  matchmakerTurns.textContent = `Turns remaining: ${Math.max(0, eventData.turnLimit - eventData.turnsUsed)}`;
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

  if (
    !eventData ||
    eventData.turnLimit === null ||
    eventData.resolving ||
    eventData.turnsUsed >= eventData.turnLimit
  ) {
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
    matchmakerResolutionTimeoutId = setTimeout(() => {
      flippedCards.forEach((card) => {
        card.matched = true;
      });
      eventData.matchesFound += 1;
      eventData.flippedCardIds = [];
      eventData.resolving = false;
      matchmakerResolutionTimeoutId = null;
      renderMatchmakerEvent();
      maybeFinishMatchmakerEvent();
    }, MATCHMAKER_MISMATCH_DELAY_MS);
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

  if (eventData.turnLimit !== null && eventData.turnsUsed >= eventData.turnLimit) {
    startMatchmakerSummaryRewardPhase(
      eventData.matchesFound,
      getMatchedMatchmakerPairs(eventData)
    );
  }
}

function getMatchedMatchmakerPairs(eventData) {
  return eventData.selectedPairs.filter((pair) => {
    const pairCards = eventData.cards.filter((card) => card.pairId === pair.id);

    return pairCards.length === 2 && pairCards.every((card) => card.matched);
  });
}

function startMatchmakerSummaryRewardPhase(matchesFound, matchedPairs = []) {
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
  rewardMessage.innerHTML = buildMatchmakerRewardSummary(matchedPairs, trinketRewards);
  skipRewardButton.classList.remove("hidden");

  renderStats();
  renderInventory();

  showSection("reward");
}

function buildMatchmakerRewardSummary(matchedPairs, trinketRewards) {
  const pairSummary =
    matchedPairs.length > 0
      ? `
        <div class="matchmaker-reward-pairs">
          ${matchedPairs.map((pair) => {
            return `<div>${escapeMatchmakerRewardText(pair.names[0])} / ${escapeMatchmakerRewardText(pair.names[1])}</div>`;
          }).join("")}
        </div>
      `
      : "";

  const trinketSummary =
    trinketRewards.length > 0
      ? `<div>You found ${trinketRewards.map((trinket) => `${trinket.icon} ${escapeMatchmakerRewardText(trinket.name)}`).join(", ")}.</div>`
      : "<div>No pairs, no prize.</div>";

  return `${pairSummary}${trinketSummary}`;
}

function escapeMatchmakerRewardText(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function clearMatchmakerResolutionTimer() {
  if (matchmakerResolutionTimeoutId !== null) {
    clearTimeout(matchmakerResolutionTimeoutId);
    matchmakerResolutionTimeoutId = null;
  }
}
