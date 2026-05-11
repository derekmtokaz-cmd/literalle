/* ---------------- INIT ---------------- */

function initializeGame() {
  initializeMusicControls();
  initializeDeveloperTools();
  buildRunPath();
  renderStats();
  renderInventory();
  renderBoard();
  startOpeningPuzzle();
}

function renderGame() {
  renderStats();
  renderInventory();
  renderBoard();
}

/* ---------------- EVENT LISTENERS ---------------- */

submitStartButton.addEventListener("click", submitCurrentPuzzleAttempt);
submitPoemButton.addEventListener("click", submitCurrentPuzzleAttempt);
skipRewardButton.addEventListener("click", endRewardPhase);
submitAuthorDateButton.addEventListener("click", submitAuthorDateAttempt);
submitDetectiveButton.addEventListener("click", submitDetectiveAttempt);
submitFanficButton.addEventListener("click", submitFanficAttempt);
submitShakespeareButton.addEventListener("click", submitShakespeareAttempt);
loseHpTimedShakespeareButton.addEventListener("click", chooseTimedShakespeareHpLoss);
completeTimedShakespeareButton.addEventListener("click", chooseTimedShakespeareChallenge);
timedShakespeareAnswerInput.addEventListener("input", () => {
  renderTimedShakespeareSuggestions();
});
timedShakespeareAnswerInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    submitTimedShakespeareAnswer();
  }
});
submitPhoneticButton.addEventListener("click", submitPhoneticAttempt);
submitLitcanonButton.addEventListener("click", submitLitcanonGuess);
litcanonAnswerInput.addEventListener("input", () => {
  if (gameState.currentLitcanonEvent) {
    gameState.currentLitcanonEvent.selectedNovelId = null;
  }

  renderLitcanonSuggestions();
});
litcanonAnswerInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    submitLitcanonGuess();
  }
});
closeProphecyButton.addEventListener("click", closeProphecyModal);
developerForcedTriviaSelect.addEventListener("change", () => {
  gameState.developerForcedTriviaType = developerForcedTriviaSelect.value;
});
developerStartAuthorDateButton.addEventListener("click", () => {
  startDeveloperTriviaEvent("authorDate");
});
developerStartDetectiveButton.addEventListener("click", () => {
  startDeveloperTriviaEvent("detective");
});
developerStartFanficButton.addEventListener("click", () => {
  startDeveloperTriviaEvent("fanfic");
});
developerStartShakespeareButton.addEventListener("click", () => {
  startDeveloperTriviaEvent("shakespeare");
});
developerStartTimedShakespeareButton.addEventListener("click", () => {
  startDeveloperTriviaEvent("timedShakespeare");
});
developerStartKjvButton.addEventListener("click", startDeveloperKjvEvent);
developerStartPhoneticButton.addEventListener("click", startDeveloperPhoneticEvent);
developerStartLitcanonButton.addEventListener("click", startDeveloperLitcanonEvent);
developerStartRestButton.addEventListener("click", startDeveloperRestEvent);
developerStartBossButton.addEventListener("click", startDeveloperBossEvent);
developerStartDeathButton.addEventListener("click", startDeveloperDeathEvent);
developerGoFloorOneButton.addEventListener("click", () => {
  goToDeveloperFloor(1);
});
developerGoFloorTwoButton.addEventListener("click", () => {
  goToDeveloperFloor(2);
});
developerRebuildFloorButton.addEventListener("click", rebuildDeveloperFloor);
developerSetHpFullButton.addEventListener("click", () => {
  setDeveloperHp(gameState.maxHp);
});
developerSetHpOneButton.addEventListener("click", () => {
  setDeveloperHp(1);
});
developerAddGoldButton.addEventListener("click", () => {
  gameState.gold += 10;
  renderStats();
});
developerAddRelicsButton.addEventListener("click", () => {
  addDeveloperRelics();
  renderInventory();
});
developerClearInventoryButton.addEventListener("click", () => {
  gameState.inventory = [];
  renderInventory();
});
developerModeToggle.addEventListener("change", () => {
  if (!developerModeToggle || !isDeveloperToolsEnabled()) {
    gameState.developerMode = false;
    if (developerModeToggle) {
      developerModeToggle.checked = false;
    }
    return;
  }

  gameState.developerMode = developerModeToggle.checked;

  if (gameState.developerMode) {
    addDeveloperRelics();
  } else {
    gameState.developerForcedTriviaType = "";
  }

  syncDeveloperControls();
  renderInventory();
  renderBoard();
});

initializeGame();

function handlePlayerDeath() {
  if (gameState.hp > 0 || gameState.currentPuzzleMode === "death") {
    return false;
  }

  startDeathPuzzle();
  return true;
}

function restartGame() {
  const keepDeveloperMode =
    isDeveloperToolsEnabled() &&
    developerModeToggle &&
    developerModeToggle.checked;

  Object.assign(gameState, {
    currentFloor: 1,
    hp: 100,
    maxHp: 100,
    gold: 3,
    inventory: [],
    currentNodeId: "start",
    completedNodeIds: [],
    availableNodeIds: [],
    runPath: [],
    currentFloorSeedSignature: "",
    floorPoemSeedIdsByFloor: {},
    currentPuzzle: null,
    currentPuzzleMode: null,
    lastEventType: null,
    echoTileUsedThisPuzzle: false,
    penNibUsedThisPuzzle: false,
    currentAuthorDateEvent: null,
    currentDetectiveEvent: null,
    currentFanficEvent: null,
    currentShakespeareEvent: null,
    currentTimedShakespeareEvent: null,
    currentPhoneticQuote: null,
    currentLitcanonEvent: null,
    currentKjvEncounter: null,
    currentKjvDifficulty: null,
    currentRewardOffers: [],
    prophecyUsedThisFloor: false,
    firstDraftUsedThisPuzzle: false,
    pendingReplyReward: false,
    usedPoemIds: [],
    usedPhoneticQuoteIds: [],
    developerMode: keepDeveloperMode,
    developerForcedTriviaType: ""
  });

  if (developerModeToggle) {
    developerModeToggle.checked = keepDeveloperMode;
  }

  syncMusicToCurrentFloor();
  clearTimedShakespeareTimer();
  buildRunPath();

  if (keepDeveloperMode) {
    addDeveloperRelics();
  }

  syncDeveloperControls();
  resetDisplayedHp();
  renderStats();
  renderInventory();
  renderBoard();
  startOpeningPuzzle();
}

function initializeDeveloperTools() {
  gameState.developerMode = false;

  if (!developerCard || !developerModeToggle) {
    return;
  }

  developerModeToggle.checked = false;

  if (!isDeveloperToolsEnabled()) {
    developerModeToggle.disabled = true;
    developerCard.remove();
    return;
  }

  developerModeToggle.disabled = false;
  developerCard.classList.remove("hidden");
  syncDeveloperControls();
}

function isDeveloperToolsEnabled() {
  return new URLSearchParams(window.location.search).get("dev") === "1";
}

function addDeveloperRelics() {
  ARTIFACTS.forEach((artifact) => {
    const alreadyOwned = gameState.inventory.some((item) => {
      return item.type === "artifact" && item.artifactId === artifact.id;
    });

    if (!alreadyOwned) {
      gameState.inventory.push({
        type: "artifact",
        artifactId: artifact.id
      });
    }
  });

  TRINKETS.forEach((trinket) => {
    const alreadyOwned = gameState.inventory.some((item) => {
      return item.type === "trinket" && item.trinketId === trinket.id;
    });

    if (!alreadyOwned) {
      gameState.inventory.push({
        type: "trinket",
        trinketId: trinket.id
      });
    }
  });
}

function syncDeveloperControls() {
  if (!developerControls) {
    return;
  }

  if (gameState.developerMode && isDeveloperToolsEnabled()) {
    developerControls.classList.remove("hidden");
  } else {
    developerControls.classList.add("hidden");
  }

  syncDeveloperForcedTriviaControl();
}

function syncDeveloperForcedTriviaControl() {
  if (developerForcedTriviaSelect) {
    developerForcedTriviaSelect.value = gameState.developerForcedTriviaType || "";
  }
}

function isDeveloperModeActive() {
  return isDeveloperToolsEnabled() && gameState.developerMode;
}

function prepareDeveloperLaunch() {
  if (!isDeveloperModeActive()) {
    return false;
  }

  clearTimedShakespeareTimer();
  gameState.currentPuzzle = null;
  gameState.currentPuzzleMode = null;
  gameState.currentAuthorDateEvent = null;
  gameState.currentDetectiveEvent = null;
  gameState.currentFanficEvent = null;
  gameState.currentShakespeareEvent = null;
  gameState.currentTimedShakespeareEvent = null;
  gameState.currentPhoneticQuote = null;
  gameState.currentLitcanonEvent = null;
  gameState.currentKjvEncounter = null;
  gameState.currentKjvDifficulty = null;
  gameState.currentRewardOffers = [];
  gameState.rewardTilePurchased = false;
  hideDialog();
  return true;
}

function startDeveloperTriviaEvent(triviaType) {
  if (!prepareDeveloperLaunch()) {
    return;
  }

  const buildEncounter = TRIVIA_GAME_BUILDERS[triviaType];
  const startEvent = TRIVIA_GAME_STARTERS[triviaType];

  if (!buildEncounter || !startEvent) {
    return;
  }

  gameState.lastEventType = "trivia";
  const encounter = buildEncounter();
  encounter.triviaCategory =
    TRIVIA_GAME_POOLS.special.includes(triviaType) ? "special" : "ordinary";
  startEvent(encounter);
}

function startDeveloperKjvEvent() {
  if (!prepareDeveloperLaunch()) {
    return;
  }

  gameState.lastEventType = "kjv";
  startKjvEvent(buildKjvEncounter());
}

function startDeveloperPhoneticEvent() {
  if (!prepareDeveloperLaunch()) {
    return;
  }

  gameState.lastEventType = "phonetic";
  startPhoneticEvent(buildPhoneticEncounter());
}

function startDeveloperLitcanonEvent() {
  if (!prepareDeveloperLaunch()) {
    return;
  }

  gameState.lastEventType = "litcanon";
  startLitcanonEvent(buildLitcanonEncounter());
}

function startDeveloperRestEvent() {
  if (!prepareDeveloperLaunch()) {
    return;
  }

  const restPoem = getRandomRestPoem();
  gameState.lastEventType = "rest";
  gameState.currentPuzzleMode = "rest";
  startPoemEvent(preparePoemEvent(restPoem, 6));
}

function startDeveloperBossEvent() {
  if (!prepareDeveloperLaunch()) {
    return;
  }

  const bossNode = gameState.runPath.find((node) => {
    return node.type === "boss" && node.encounter?.poemEvent;
  });
  const bossPoemEvent =
    bossNode?.encounter?.poemEvent ||
    preparePoemEvent(getRandomPoem(), gameState.currentFloor >= 2 ? 9 : 8);

  gameState.lastEventType = "boss";
  startPoemEvent(bossPoemEvent);
}

function startDeveloperDeathEvent() {
  if (!prepareDeveloperLaunch()) {
    return;
  }

  startDeathPuzzle();
}

function goToDeveloperFloor(floorNumber) {
  if (!isDeveloperModeActive()) {
    return;
  }

  gameState.currentFloor = floorNumber;
  rebuildDeveloperFloor();
}

function rebuildDeveloperFloor() {
  if (!isDeveloperModeActive()) {
    return;
  }

  clearTimedShakespeareTimer();
  gameState.currentPuzzle = null;
  gameState.currentPuzzleMode = null;
  gameState.lastEventType = null;
  gameState.currentRewardOffers = [];
  gameState.rewardTilePurchased = false;
  gameState.developerForcedTriviaType = "";
  syncMusicToCurrentFloor();
  buildRunPath();
  renderGame();
  syncDeveloperControls();
  showSection("board");
}

function setDeveloperHp(hpAmount) {
  gameState.hp = Math.max(0, Math.min(gameState.maxHp, hpAmount));
  renderStats();
}
