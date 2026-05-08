/* ---------------- INIT ---------------- */

function initializeGame() {
  initializeMusicControls();
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
  gameState.developerMode = developerModeToggle.checked;

  if (gameState.developerMode) {
    addDeveloperRelics();
  }

  renderInventory();
  renderBoard();
});

initializeGame();

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
