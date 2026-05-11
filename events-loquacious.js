function buildLoquaciousEncounter() {
  const poem = poemDatabase[Math.floor(Math.random() * poemDatabase.length)];

  return {
    triviaType: "loquacious",
    poem,
    poemWords: getLoquaciousPoemWords(poem)
  };
}

function startLoquaciousEvent(encounter = buildLoquaciousEncounter()) {
  gameState.firstDraftUsedThisPuzzle = false;
  gameState.currentLoquaciousEvent = {
    encounter,
    submitted: false
  };

  loquaciousIntro.classList.remove("hidden");
  loquaciousChallenge.classList.add("hidden");
  loquaciousChoiceControls.classList.remove("hidden");
  loquaciousMessage.textContent = "";
  loquaciousAnswerInput.value = "";
  loquaciousAnswerInput.disabled = false;
  submitLoquaciousButton.disabled = false;
  gainHpLoquaciousButton.disabled = false;
  startLoquaciousButton.disabled = false;

  showDialog({
    dialog: ["I'm sure you'll come up with something perfectly cromulent."],
    dialogImage: "images/libfinger.png"
  });

  showSection("loquacious");
}

function chooseLoquaciousHpGain() {
  if (!gameState.currentLoquaciousEvent) {
    return;
  }

  gameState.hp = Math.min(gameState.maxHp, gameState.hp + 5);
  gameState.currentLoquaciousEvent = null;
  startLoquaciousResultRewardPhase("You gained 5 HP.");
}

function startLoquaciousChallenge() {
  const eventData = gameState.currentLoquaciousEvent;

  if (!eventData) {
    return;
  }

  loquaciousIntro.classList.add("hidden");
  loquaciousChoiceControls.classList.add("hidden");
  loquaciousChallenge.classList.remove("hidden");
  loquaciousMessage.textContent = "";
  loquaciousInstruction.textContent =
    `Name a word from ${eventData.encounter.poem.title}.`;
  loquaciousAnswerInput.value = "";
  loquaciousAnswerInput.focus();
}

function submitLoquaciousAttempt() {
  const eventData = gameState.currentLoquaciousEvent;

  if (!eventData || eventData.submitted) {
    return;
  }

  eventData.submitted = true;
  submitLoquaciousButton.disabled = true;
  loquaciousAnswerInput.disabled = true;

  const submittedLabel = loquaciousAnswerInput.value.trim();
  const normalizedWord = normalizeLoquaciousWord(submittedLabel);

  if (
    normalizedWord &&
    eventData.encounter.poemWords.includes(normalizedWord)
  ) {
    const tile = createLoquaciousBabelTile(normalizedWord, submittedLabel);
    gameState.inventory.push(tile);
    gameState.currentLoquaciousEvent = null;
    startLoquaciousResultRewardPhase(
      `You gained a ${getBabelTileLabel(tile)} Babel Tile.`
    );
    return;
  }

  gameState.currentLoquaciousEvent = null;
  startLoquaciousResultRewardPhase("Sorry, that word was not in the poem");
}

function startLoquaciousResultRewardPhase(resultText) {
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

function createLoquaciousBabelTile(normalizedWord, submittedLabel) {
  const uniqueLetters = [...new Set(normalizedWord.toUpperCase().split(""))];
  const displayLabel = normalizeLoquaciousDisplayLabel(submittedLabel);

  return createBabelTile(uniqueLetters, {
    displayLabel,
    source: "loquacious",
    echoEligible: false
  });
}

function getLoquaciousPoemWords(poem) {
  return [
    ...new Set(
      poem.lines
        .flatMap((line) => line.split(/\s+/))
        .map((word) => normalizeLoquaciousWord(word))
        .filter((word) => word.length > 0)
    )
  ];
}

function normalizeLoquaciousWord(word) {
  return String(word)
    .toLowerCase()
    .replace(/[^a-z]/g, "");
}

function normalizeLoquaciousDisplayLabel(label) {
  const trimmedLabel = String(label).trim();
  return trimmedLabel || normalizeLoquaciousWord(label);
}
