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
submitPhoneticButton.addEventListener("click", submitPhoneticAttempt);
closeProphecyButton.addEventListener("click", closeProphecyModal);
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
  }

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
    gold: 2,
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
    currentPhoneticQuote: null,
    currentKjvEncounter: null,
    currentKjvDifficulty: null,
    currentRewardOffers: [],
    prophecyUsedThisFloor: false,
    firstDraftUsedThisPuzzle: false,
    pendingReplyReward: false,
    usedPoemIds: [],
    usedPhoneticQuoteIds: [],
    developerMode: keepDeveloperMode
  });

  if (developerModeToggle) {
    developerModeToggle.checked = keepDeveloperMode;
  }

  syncMusicToCurrentFloor();
  buildRunPath();

  if (keepDeveloperMode) {
    addDeveloperRelics();
  }

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
