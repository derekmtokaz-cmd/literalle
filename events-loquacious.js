function buildLoquaciousEncounter() {
  const seededPoem = poemDatabase.find((poem) => {
    return poem.id === gameState.loquaciousPoemId;
  });
  const poem = seededPoem || poemDatabase[Math.floor(Math.random() * poemDatabase.length)];

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
    currentWordLength: 3,
    bestCorrectWord: null,
    correctWords: []
  };

  loquaciousIntro.classList.remove("hidden");
  loquaciousChallenge.classList.add("hidden");
  loquaciousChoiceControls.classList.remove("hidden");
  loquaciousMessage.textContent = "";
  loquaciousAnswerInput.value = "";
  loquaciousAnswerInput.disabled = false;
  resetSubmitButtonAfterRewardProceed(submitLoquaciousButton);
  resetSubmitButtonAfterRewardProceed(gainHpLoquaciousButton, "Gain 5 HP");
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
  if (handleSubmitButtonRewardProceed(gainHpLoquaciousButton)) {
    return;
  }

  if (!gameState.currentLoquaciousEvent) {
    return;
  }

  loquaciousMessage.textContent = "Proceed when ready.";
  startLoquaciousButton.disabled = true;
  armSubmitButtonForRewardProceed(gainHpLoquaciousButton, () => {
    gameState.hp = Math.min(gameState.maxHp, gameState.hp + 5);
    gameState.currentLoquaciousEvent = null;
    startLoquaciousResultRewardPhase("You gained 5 HP.");
  }, "Gain 5 HP");
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
  eventData.currentWordLength = 3;
  if (!advanceLoquaciousPromptToNextValidLength(eventData, eventData.currentWordLength, true)) {
    loquaciousAnswerInput.disabled = true;
    loquaciousMessage.textContent = "No valid words found. Proceed when ready.";
    armSubmitButtonForRewardProceed(submitLoquaciousButton, () => {
      gameState.currentLoquaciousEvent = null;
      startLoquaciousResultRewardPhase("No valid words found.");
    });
    return;
  }

  loquaciousAnswerInput.value = "";
  loquaciousAnswerInput.focus();
}

function submitLoquaciousAttempt() {
  if (handleSubmitButtonRewardProceed(submitLoquaciousButton)) {
    return;
  }

  const eventData = gameState.currentLoquaciousEvent;

  if (!eventData) {
    return;
  }

  const submittedLabel = loquaciousAnswerInput.value.trim();
  const normalizedWord = normalizeLoquaciousWord(submittedLabel);

  if (isCorrectLoquaciousWord(eventData, normalizedWord)) {
    eventData.bestCorrectWord = normalizedWord;
    eventData.correctWords.push(normalizedWord);
    loquaciousAnswerInput.value = "";

    if (!advanceLoquaciousPromptToNextValidLength(eventData, eventData.currentWordLength + 1, false)) {
      loquaciousAnswerInput.disabled = true;
      loquaciousMessage.textContent = "Correct. Proceed when ready.";
      armSubmitButtonForRewardProceed(submitLoquaciousButton, () => {
        awardLoquaciousNoteToSelf(normalizedWord);
        gameState.currentLoquaciousEvent = null;
        startLoquaciousResultRewardPhase("You gained a Note to self.");
      });
      return;
    }

    loquaciousMessage.textContent = "Correct.";
    loquaciousAnswerInput.focus();
    return;
  }

  const hpLoss = eventData.currentWordLength;
  if (gameState.hp <= hpLoss) {
    gameState.hp = Math.max(0, gameState.hp - hpLoss);
    renderStats();

    if (handlePlayerDeath()) {
      return;
    }
  }

  if (eventData.bestCorrectWord) {
    loquaciousAnswerInput.disabled = true;
    loquaciousMessage.textContent = "Incorrect. Proceed when ready.";
    armSubmitButtonForRewardProceed(submitLoquaciousButton, () => {
      gameState.currentLoquaciousEvent = null;
      if (gameState.hp > hpLoss) {
        gameState.hp = Math.max(0, gameState.hp - hpLoss);
        renderStats();
      }

      awardLoquaciousNoteToSelf(eventData.bestCorrectWord);
      startLoquaciousResultRewardPhase(`You lost ${hpLoss} HP. You gained a Note to self.`);
    });
    return;
  }

  loquaciousAnswerInput.disabled = true;
  loquaciousMessage.textContent = "Incorrect. Proceed when ready.";
  armSubmitButtonForRewardProceed(submitLoquaciousButton, () => {
    gameState.currentLoquaciousEvent = null;
    if (gameState.hp > hpLoss) {
      gameState.hp = Math.max(0, gameState.hp - hpLoss);
      renderStats();
    }

    startLoquaciousResultRewardPhase(`You lost ${hpLoss} HP.`);
  });
}

function advanceLoquaciousPromptToNextValidLength(eventData, minimumLength, allowShortestFallback) {
  const nextLength = getNextLoquaciousWordLength(
    eventData.encounter.poemWords,
    minimumLength,
    allowShortestFallback
  );

  if (!nextLength) {
    return false;
  }

  eventData.currentWordLength = nextLength;
  loquaciousInstruction.textContent =
    `Name a ${nextLength}-letter word from ${eventData.encounter.poem.author}'s ${eventData.encounter.poem.title} or lose ${nextLength} HP.`;
  return true;
}

function getNextLoquaciousWordLength(poemWords, minimumLength, allowShortestFallback) {
  const sortedLengths = [...new Set(poemWords.map((word) => word.length))]
    .filter((length) => length > 0)
    .sort((a, b) => a - b);

  const nextLength = sortedLengths.find((length) => length >= minimumLength);

  if (nextLength) {
    return nextLength;
  }

  return allowShortestFallback ? sortedLengths[0] || null : null;
}

function isCorrectLoquaciousWord(eventData, normalizedWord) {
  return (
    normalizedWord &&
    normalizedWord.length === eventData.currentWordLength &&
    eventData.encounter.poemWords.includes(normalizedWord) &&
    !eventData.correctWords.includes(normalizedWord)
  );
}

function awardLoquaciousNoteToSelf(normalizedWord) {
  if (!normalizedWord) {
    return;
  }

  const tile = createLoquaciousBabelTile(normalizedWord, normalizedWord);
  gameState.inventory.push(tile);
}

function startLoquaciousResultRewardPhase(resultText) {
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
  const fullTextSource =
    typeof LOQUACIOUS_POEM_TEXTS !== "undefined"
      ? LOQUACIOUS_POEM_TEXTS[poem.id]
      : null;
  const sourceLines = Array.isArray(fullTextSource)
    ? fullTextSource
    : typeof fullTextSource === "string"
      ? [fullTextSource]
      : poem.lines;

  return [
    ...new Set(
      sourceLines
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
