const TIMED_SHAKESPEARE_VISIBLE_SECONDS = 45;
const TIMED_SHAKESPEARE_GRACE_MS = 5000;

let timedShakespeareGraceTimeoutId = null;
let timedShakespeareCountdownIntervalId = null;

function buildTimedShakespeareEncounter() {
  return {
    triviaType: "timedShakespeare"
  };
}

function startTimedShakespeareEvent(encounter = buildTimedShakespeareEncounter()) {
  gameState.firstDraftUsedThisPuzzle = false;
  gameState.currentTimedShakespeareEvent = {
    encounter,
    correctNovelIds: [],
    suggestionMatches: [],
    highlightedSuggestionIndex: -1,
    remainingSeconds: TIMED_SHAKESPEARE_VISIBLE_SECONDS,
    taskActive: false
  };

  clearTimedShakespeareTimer();
  timedShakespeareIntro.classList.remove("hidden");
  timedShakespeareChallenge.classList.add("hidden");
  timedShakespeareChoiceControls.classList.remove("hidden");
  timedShakespeareMessage.textContent = "";
  timedShakespeareTimer.textContent = TIMED_SHAKESPEARE_VISIBLE_SECONDS;
  timedShakespeareAnswerInput.value = "";
  timedShakespeareAnswerInput.disabled = true;
  timedShakespeareSuggestions.innerHTML = "";
  timedShakespeareCorrectList.innerHTML = "";
  loseHpTimedShakespeareButton.disabled = false;
  completeTimedShakespeareButton.disabled = false;

  showDialog({
    dialog: ['"They were written by Christopher Marlow and Sir Francis Bacon" is not the correct answer.'],
    dialogImage: "images/libskull.png"
  });

  showSection("timedShakespeare");
}

function chooseTimedShakespeareHpLoss() {
  if (!gameState.currentTimedShakespeareEvent) {
    return;
  }

  clearTimedShakespeareTimer();
  loseHpTimedShakespeareButton.disabled = true;
  completeTimedShakespeareButton.disabled = true;
  gameState.hp = Math.max(0, gameState.hp - 5);
  renderStats();

  if (handlePlayerDeath()) {
    return;
  }

  gameState.currentTimedShakespeareEvent = null;
  startTimedShakespeareHpLossRewardPhase();
}

function chooseTimedShakespeareChallenge() {
  const eventData = gameState.currentTimedShakespeareEvent;

  if (!eventData) {
    return;
  }

  timedShakespeareIntro.classList.add("hidden");
  timedShakespeareChoiceControls.classList.add("hidden");
  timedShakespeareChallenge.classList.remove("hidden");
  timedShakespeareMessage.textContent = "";
  timedShakespeareTimer.textContent = TIMED_SHAKESPEARE_VISIBLE_SECONDS;
  timedShakespeareAnswerInput.disabled = false;
  timedShakespeareAnswerInput.value = "";
  timedShakespeareAnswerInput.focus();

  eventData.taskActive = true;
  renderTimedShakespeareCorrectList();
  renderTimedShakespeareSuggestions();

  timedShakespeareGraceTimeoutId = setTimeout(() => {
    timedShakespeareGraceTimeoutId = null;
    startTimedShakespeareCountdown();
  }, TIMED_SHAKESPEARE_GRACE_MS);
}

function startTimedShakespeareHpLossRewardPhase() {
  gameState.currentRewardOffers = [];
  gameState.rewardTilePurchased = false;

  tileOffersSection.classList.add("hidden");
  tileOfferContainer.innerHTML = "";
  goldRewardMessage.textContent = "You lost 5 HP.";
  rewardMessage.textContent = "";
  skipRewardButton.classList.remove("hidden");

  renderStats();
  renderInventory();

  showSection("reward");
}

function startTimedShakespeareCountdown() {
  const eventData = gameState.currentTimedShakespeareEvent;

  if (!eventData || !eventData.taskActive) {
    return;
  }

  timedShakespeareCountdownIntervalId = setInterval(() => {
    eventData.remainingSeconds -= 1;
    timedShakespeareTimer.textContent = eventData.remainingSeconds;

    if (eventData.remainingSeconds <= 0) {
      completeTimedShakespeareChallenge();
    }
  }, 1000);
}

function renderTimedShakespeareSuggestions() {
  timedShakespeareSuggestions.innerHTML = "";

  const eventData = gameState.currentTimedShakespeareEvent;

  if (!eventData || !eventData.taskActive) {
    return;
  }

  const query = normalizeLitcanonTitle(timedShakespeareAnswerInput.value);

  if (query.length < 3) {
    eventData.suggestionMatches = [];
    eventData.highlightedSuggestionIndex = -1;
    return;
  }

  const matches = LITCANON_NOVELS.filter((novel) => {
    return normalizeLitcanonTitle(novel.title).includes(query);
  }).slice(0, 8);

  eventData.suggestionMatches = matches;

  if (eventData.highlightedSuggestionIndex >= matches.length) {
    eventData.highlightedSuggestionIndex = matches.length - 1;
  }

  matches.forEach((novel, index) => {
    const suggestionButton = document.createElement("button");
    suggestionButton.type = "button";
    suggestionButton.classList.add("litcanon-suggestion");

    if (index === eventData.highlightedSuggestionIndex) {
      suggestionButton.classList.add("highlighted");
    }

    suggestionButton.textContent = novel.title;

    suggestionButton.addEventListener("click", () => {
      submitTimedShakespeareNovel(novel);
    });

    timedShakespeareSuggestions.appendChild(suggestionButton);
  });
}

function handleTimedShakespeareAnswerKeydown(event) {
  if (event.key === "ArrowDown") {
    event.preventDefault();
    moveTimedShakespeareSuggestionHighlight(1);
    return;
  }

  if (event.key === "ArrowUp") {
    event.preventDefault();
    moveTimedShakespeareSuggestionHighlight(-1);
    return;
  }

  if (event.key === "Enter") {
    event.preventDefault();
    submitTimedShakespeareAnswer();
  }
}

function moveTimedShakespeareSuggestionHighlight(direction) {
  const eventData = gameState.currentTimedShakespeareEvent;

  if (!eventData || eventData.suggestionMatches.length === 0) {
    return;
  }

  const matchCount = eventData.suggestionMatches.length;
  const currentIndex = eventData.highlightedSuggestionIndex;
  const nextIndex =
    currentIndex === -1
      ? direction > 0 ? 0 : matchCount - 1
      : (currentIndex + direction + matchCount) % matchCount;

  eventData.highlightedSuggestionIndex = nextIndex;
  renderTimedShakespeareSuggestions();
}

function submitTimedShakespeareAnswer() {
  const eventData = gameState.currentTimedShakespeareEvent;

  if (!eventData || !eventData.taskActive) {
    return;
  }

  if (eventData.suggestionMatches.length > 0) {
    const suggestionIndex =
      eventData.highlightedSuggestionIndex >= 0
        ? eventData.highlightedSuggestionIndex
        : 0;
    const highlightedNovel = eventData.suggestionMatches[suggestionIndex];

    if (highlightedNovel) {
      submitTimedShakespeareNovel(highlightedNovel);
      return;
    }
  }

  const normalizedInput = normalizeLitcanonTitle(timedShakespeareAnswerInput.value);
  const selectedNovel = LITCANON_NOVELS.find((novel) => {
    return normalizeLitcanonTitle(novel.title) === normalizedInput;
  });

  if (selectedNovel) {
    submitTimedShakespeareNovel(selectedNovel);
    return;
  }

  resetTimedShakespeareInput();
}

function submitTimedShakespeareNovel(novel) {
  const eventData = gameState.currentTimedShakespeareEvent;

  if (!eventData || !eventData.taskActive) {
    return;
  }

  if (isShakespearePlay(novel) && !eventData.correctNovelIds.includes(novel.id)) {
    eventData.correctNovelIds.push(novel.id);
    renderTimedShakespeareCorrectList();
  }

  resetTimedShakespeareInput();
}

function resetTimedShakespeareInput() {
  const eventData = gameState.currentTimedShakespeareEvent;

  if (eventData) {
    eventData.suggestionMatches = [];
    eventData.highlightedSuggestionIndex = -1;
  }

  timedShakespeareAnswerInput.value = "";
  timedShakespeareSuggestions.innerHTML = "";
  timedShakespeareAnswerInput.focus();
}

function renderTimedShakespeareCorrectList() {
  const eventData = gameState.currentTimedShakespeareEvent;
  timedShakespeareCorrectList.innerHTML = "";

  if (!eventData) {
    return;
  }

  eventData.correctNovelIds.forEach((novelId) => {
    const novel = getLitcanonNovelById(novelId);

    if (!novel) {
      return;
    }

    const answer = document.createElement("div");
    answer.classList.add("timed-shakespeare-correct-answer");
    answer.textContent = novel.title;
    timedShakespeareCorrectList.appendChild(answer);
  });
}

function completeTimedShakespeareChallenge() {
  const eventData = gameState.currentTimedShakespeareEvent;

  if (!eventData) {
    return;
  }

  clearTimedShakespeareTimer();
  eventData.taskActive = false;
  timedShakespeareAnswerInput.disabled = true;

  const correctCount = eventData.correctNovelIds.length;

  gameState.currentTimedShakespeareEvent = null;

  if (correctCount < 10) {
    const hpLoss = 10 - correctCount;
    gameState.hp = Math.max(0, gameState.hp - hpLoss);
    renderStats();

    if (handlePlayerDeath()) {
      return;
    }

    startTimedShakespeareResultRewardPhase(
      `You named ${correctCount} plays. You lost ${hpLoss} HP.`
    );
    return;
  }

  const rewardAmount = correctCount - 9;
  gameState.hp = Math.min(gameState.maxHp, gameState.hp + rewardAmount);
  gameState.gold += rewardAmount;
  startTimedShakespeareResultRewardPhase(
    `You named ${correctCount} plays. You gained ${rewardAmount} HP and ${rewardAmount} gold.`
  );
}

function startTimedShakespeareResultRewardPhase(resultText) {
  gameState.currentRewardOffers = [];
  gameState.rewardTilePurchased = false;

  tileOffersSection.classList.add("hidden");
  tileOfferContainer.innerHTML = "";
  goldRewardMessage.textContent = resultText;
  rewardMessage.textContent = "";
  skipRewardButton.classList.remove("hidden");

  renderStats();
  renderInventory();

  showSection("reward");
}

function clearTimedShakespeareTimer() {
  if (timedShakespeareGraceTimeoutId !== null) {
    clearTimeout(timedShakespeareGraceTimeoutId);
    timedShakespeareGraceTimeoutId = null;
  }

  if (timedShakespeareCountdownIntervalId !== null) {
    clearInterval(timedShakespeareCountdownIntervalId);
    timedShakespeareCountdownIntervalId = null;
  }
}

function isShakespearePlay(novel) {
  return novel.author === "William Shakespeare";
}
