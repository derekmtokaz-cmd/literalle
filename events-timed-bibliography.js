const TIMED_BIBLIOGRAPHY_VISIBLE_SECONDS = 45;
const TIMED_BIBLIOGRAPHY_GRACE_MS = 5000;

let timedBibliographyGraceTimeoutId = null;
let timedBibliographyCountdownIntervalId = null;

function buildTimedBibliographyEncounter() {
  return {
    triviaType: "timedBibliography",
    bibliography: getRandomTimedBibliography()
  };
}

function getRandomTimedBibliography() {
  if (TIMED_BIBLIOGRAPHIES.length === 0) {
    throw new Error("No timed bibliographies found.");
  }

  return TIMED_BIBLIOGRAPHIES[Math.floor(Math.random() * TIMED_BIBLIOGRAPHIES.length)];
}

function normalizeTimedBibliographyTitle(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function startTimedBibliographyEvent(encounter = buildTimedBibliographyEncounter()) {
  const bibliography = encounter.bibliography || getRandomTimedBibliography();

  gameState.firstDraftUsedThisPuzzle = false;
  gameState.currentTimedBibliographyEvent = {
    encounter,
    bibliography,
    correctWorkIds: [],
    suggestionMatches: [],
    highlightedSuggestionIndex: -1,
    remainingSeconds: TIMED_BIBLIOGRAPHY_VISIBLE_SECONDS,
    taskActive: false
  };

  clearTimedBibliographyTimer();
  timedBibliographyIntro.classList.remove("hidden");
  timedBibliographyChallenge.classList.add("hidden");
  timedBibliographyChoiceControls.classList.remove("hidden");
  timedBibliographyPrompt.textContent =
    bibliography.promptText || `Name as many works by ${bibliography.author} as you can.`;
  timedBibliographyMessage.textContent = "";
  timedBibliographyTimer.textContent = TIMED_BIBLIOGRAPHY_VISIBLE_SECONDS;
  timedBibliographyAnswerInput.value = "";
  timedBibliographyAnswerInput.disabled = true;
  timedBibliographySuggestions.innerHTML = "";
  timedBibliographyCorrectList.innerHTML = "";
  loseHpTimedBibliographyButton.disabled = false;
  completeTimedBibliographyButton.disabled = false;
  loseHpTimedBibliographyButton.classList.remove("hidden");
  completeTimedBibliographyButton.classList.remove("hidden");
  hideStandaloneRewardProceedButton(proceedTimedBibliographyButton);

  showDialog({
    dialog: ["Every title you remember is one less book glaring at you from the shelf."],
    dialogImage: "images/libskull.png"
  });

  showSection("timedBibliography");
}

function chooseTimedBibliographyHpLoss() {
  if (!gameState.currentTimedBibliographyEvent) {
    return;
  }

  clearTimedBibliographyTimer();
  loseHpTimedBibliographyButton.disabled = true;
  completeTimedBibliographyButton.disabled = true;
  loseHpTimedBibliographyButton.classList.add("hidden");
  completeTimedBibliographyButton.classList.add("hidden");
  if (gameState.hp <= 5) {
    gameState.hp = Math.max(0, gameState.hp - 5);
    renderStats();

    if (handlePlayerDeath()) {
      return;
    }
  }

  timedBibliographyMessage.textContent = "Proceed when ready.";
  armStandaloneRewardProceedButton(proceedTimedBibliographyButton, () => {
    gameState.currentTimedBibliographyEvent = null;
    if (gameState.hp > 5) {
      gameState.hp = Math.max(0, gameState.hp - 5);
      renderStats();
    }

    startTimedBibliographyHpLossRewardPhase();
  });
}

function chooseTimedBibliographyChallenge() {
  const eventData = gameState.currentTimedBibliographyEvent;

  if (!eventData) {
    return;
  }

  timedBibliographyIntro.classList.add("hidden");
  timedBibliographyChoiceControls.classList.add("hidden");
  timedBibliographyChallenge.classList.remove("hidden");
  timedBibliographyMessage.textContent = "";
  timedBibliographyTimer.textContent = TIMED_BIBLIOGRAPHY_VISIBLE_SECONDS;
  timedBibliographyAnswerInput.disabled = false;
  timedBibliographyAnswerInput.value = "";
  timedBibliographyAnswerInput.focus();

  eventData.taskActive = true;
  renderTimedBibliographyCorrectList();
  renderTimedBibliographySuggestions();

  timedBibliographyGraceTimeoutId = setTimeout(() => {
    timedBibliographyGraceTimeoutId = null;
    startTimedBibliographyCountdown();
  }, TIMED_BIBLIOGRAPHY_GRACE_MS);
}

function startTimedBibliographyHpLossRewardPhase() {
  gameState.currentRewardOffers = [];
  gameState.rewardTilePurchased = false;

  tileOffersSection.classList.add("hidden");
  tileOfferContainer.innerHTML = "";
  inkRewardMessage.textContent = "You lost 5 HP.";
  rewardMessage.textContent = "";
  skipRewardButton.classList.remove("hidden");

  renderStats();
  renderInventory();

  showSection("reward");
}

function startTimedBibliographyCountdown() {
  const eventData = gameState.currentTimedBibliographyEvent;

  if (!eventData || !eventData.taskActive) {
    return;
  }

  timedBibliographyCountdownIntervalId = setInterval(() => {
    eventData.remainingSeconds -= 1;
    timedBibliographyTimer.textContent = eventData.remainingSeconds;

    if (eventData.remainingSeconds <= 0) {
      completeTimedBibliographyChallenge();
    }
  }, 1000);
}

function getTimedBibliographyWorks() {
  const eventData = gameState.currentTimedBibliographyEvent;
  return eventData?.bibliography?.works || [];
}

function renderTimedBibliographySuggestions() {
  timedBibliographySuggestions.innerHTML = "";

  const eventData = gameState.currentTimedBibliographyEvent;

  if (!eventData || !eventData.taskActive) {
    return;
  }

  const query = normalizeTimedBibliographyTitle(timedBibliographyAnswerInput.value);

  if (query.length < 2) {
    eventData.suggestionMatches = [];
    eventData.highlightedSuggestionIndex = -1;
    return;
  }

  const matches = getTimedBibliographyWorks().filter((work) => {
    return (
      !eventData.correctWorkIds.includes(work.id) &&
      normalizeTimedBibliographyTitle(work.title).includes(query)
    );
  }).slice(0, 8);

  eventData.suggestionMatches = matches;

  if (eventData.highlightedSuggestionIndex >= matches.length) {
    eventData.highlightedSuggestionIndex = matches.length - 1;
  }

  matches.forEach((work, index) => {
    const suggestionButton = document.createElement("button");
    suggestionButton.type = "button";
    suggestionButton.classList.add("litcanon-suggestion");

    if (index === eventData.highlightedSuggestionIndex) {
      suggestionButton.classList.add("highlighted");
    }

    suggestionButton.textContent = work.title;

    suggestionButton.addEventListener("click", () => {
      submitTimedBibliographyWork(work);
    });

    timedBibliographySuggestions.appendChild(suggestionButton);
  });
}

function handleTimedBibliographyAnswerKeydown(event) {
  if (event.key === "ArrowDown") {
    event.preventDefault();
    moveTimedBibliographySuggestionHighlight(1);
    return;
  }

  if (event.key === "ArrowUp") {
    event.preventDefault();
    moveTimedBibliographySuggestionHighlight(-1);
    return;
  }

  if (event.key === "Enter") {
    event.preventDefault();
    submitTimedBibliographyAnswer();
  }
}

function moveTimedBibliographySuggestionHighlight(direction) {
  const eventData = gameState.currentTimedBibliographyEvent;

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
  renderTimedBibliographySuggestions();
}

function submitTimedBibliographyAnswer() {
  const eventData = gameState.currentTimedBibliographyEvent;

  if (!eventData || !eventData.taskActive) {
    return;
  }

  if (eventData.suggestionMatches.length > 0) {
    const suggestionIndex =
      eventData.highlightedSuggestionIndex >= 0
        ? eventData.highlightedSuggestionIndex
        : 0;
    const highlightedWork = eventData.suggestionMatches[suggestionIndex];

    if (highlightedWork) {
      submitTimedBibliographyWork(highlightedWork);
      return;
    }
  }

  const normalizedInput = normalizeTimedBibliographyTitle(timedBibliographyAnswerInput.value);
  const selectedWork = getTimedBibliographyWorks().find((work) => {
    return normalizeTimedBibliographyTitle(work.title) === normalizedInput;
  });

  if (selectedWork) {
    submitTimedBibliographyWork(selectedWork);
    return;
  }

  resetTimedBibliographyInput();
}

function submitTimedBibliographyWork(work) {
  const eventData = gameState.currentTimedBibliographyEvent;

  if (!eventData || !eventData.taskActive) {
    return;
  }

  if (!eventData.correctWorkIds.includes(work.id)) {
    eventData.correctWorkIds.push(work.id);
    renderTimedBibliographyCorrectList();
  }

  resetTimedBibliographyInput();
}

function resetTimedBibliographyInput() {
  const eventData = gameState.currentTimedBibliographyEvent;

  if (eventData) {
    eventData.suggestionMatches = [];
    eventData.highlightedSuggestionIndex = -1;
  }

  timedBibliographyAnswerInput.value = "";
  timedBibliographySuggestions.innerHTML = "";
  timedBibliographyAnswerInput.focus();
}

function renderTimedBibliographyCorrectList() {
  const eventData = gameState.currentTimedBibliographyEvent;
  timedBibliographyCorrectList.innerHTML = "";

  if (!eventData) {
    return;
  }

  eventData.correctWorkIds.forEach((workId) => {
    const work = getTimedBibliographyWorks().find((item) => item.id === workId);

    if (!work) {
      return;
    }

    const answer = document.createElement("div");
    answer.classList.add("timed-bibliography-correct-answer");
    answer.textContent = work.title;
    timedBibliographyCorrectList.appendChild(answer);
  });
}

function completeTimedBibliographyChallenge() {
  const eventData = gameState.currentTimedBibliographyEvent;

  if (!eventData) {
    return;
  }

  clearTimedBibliographyTimer();
  eventData.taskActive = false;
  timedBibliographyAnswerInput.disabled = true;
  timedBibliographyChoiceControls.classList.remove("hidden");
  loseHpTimedBibliographyButton.disabled = true;
  completeTimedBibliographyButton.disabled = true;
  loseHpTimedBibliographyButton.classList.add("hidden");
  completeTimedBibliographyButton.classList.add("hidden");

  const correctCount = eventData.correctWorkIds.length;

  if (correctCount < 10) {
    const hpLoss = 10 - correctCount;
    if (gameState.hp <= hpLoss) {
      gameState.hp = Math.max(0, gameState.hp - hpLoss);
      renderStats();

      if (handlePlayerDeath()) {
        return;
      }
    }

    timedBibliographyMessage.textContent =
      `You named ${correctCount} works. Proceed when ready.`;
    armStandaloneRewardProceedButton(proceedTimedBibliographyButton, () => {
      gameState.currentTimedBibliographyEvent = null;
      if (gameState.hp > hpLoss) {
        gameState.hp = Math.max(0, gameState.hp - hpLoss);
        renderStats();
      }

      startTimedBibliographyResultRewardPhase(
        `You named ${correctCount} works. You lost ${hpLoss} HP.`
      );
    });
    return;
  }

  const rewardAmount = correctCount - 9;
  timedBibliographyMessage.textContent =
    `You named ${correctCount} works. Proceed when ready.`;
  armStandaloneRewardProceedButton(proceedTimedBibliographyButton, () => {
    gameState.currentTimedBibliographyEvent = null;
    gameState.hp = Math.min(gameState.maxHp, gameState.hp + rewardAmount);
    gameState.ink += rewardAmount;
    startTimedBibliographyResultRewardPhase(
      `You named ${correctCount} works. You gained ${rewardAmount} HP and ${rewardAmount} ink.`
    );
  });
}

function startTimedBibliographyResultRewardPhase(resultText) {
  gameState.currentRewardOffers = [];
  gameState.rewardTilePurchased = false;

  tileOffersSection.classList.add("hidden");
  tileOfferContainer.innerHTML = "";
  inkRewardMessage.textContent = resultText;
  rewardMessage.textContent = "";
  skipRewardButton.classList.remove("hidden");

  renderStats();
  renderInventory();

  showSection("reward");
}

function clearTimedBibliographyTimer() {
  if (timedBibliographyGraceTimeoutId !== null) {
    clearTimeout(timedBibliographyGraceTimeoutId);
    timedBibliographyGraceTimeoutId = null;
  }

  if (timedBibliographyCountdownIntervalId !== null) {
    clearInterval(timedBibliographyCountdownIntervalId);
    timedBibliographyCountdownIntervalId = null;
  }
}
