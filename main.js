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
  if (!isDeveloperToolsEnabled()) {
    gameState.developerMode = false;
    developerModeToggle.checked = false;
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

function initializeDeveloperTools() {
  if (!isDeveloperToolsEnabled()) {
    gameState.developerMode = false;
    developerModeToggle.checked = false;
    developerCard.classList.add("hidden");
    return;
  }

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
