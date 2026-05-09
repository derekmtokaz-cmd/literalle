function buildLitcanonEncounter() {
  const clue = getRandomLitcanonClue();

  return {
    clue,
    attemptsUsed: 0,
    maxAttempts: 3,
    selectedNovelId: null
  };
}

function getRandomLitcanonClue() {
  if (LITCANON_CLUES.length === 0) {
    throw new Error("No litcanon clues found.");
  }

  const randomIndex = Math.floor(Math.random() * LITCANON_CLUES.length);
  const clue = LITCANON_CLUES[randomIndex];

  if (!getLitcanonNovelById(clue.answerNovelId)) {
    throw new Error(`No litcanon novel found for clue answer: ${clue.answerNovelId}`);
  }

  return clue;
}

function startLitcanonEvent(encounter = buildLitcanonEncounter()) {
  gameState.currentLitcanonEvent = encounter;
  gameState.lastEventType = "litcanon";
  gameState.firstDraftUsedThisPuzzle = false;

  showDialog({
    dialog: ["I never read novels; I have something else to do."],
    dialogImage: "images/lib.png"
  });

  litcanonDescription.textContent = encounter.clue.description;
  litcanonMessage.textContent = "";
  litcanonAnswerInput.value = "";
  litcanonAnswerInput.disabled = false;
  submitLitcanonButton.disabled = false;

  renderLitcanonSuggestions();
  showSection("litcanon");
  litcanonAnswerInput.focus();
}

function renderLitcanonSuggestions() {
  litcanonSuggestions.innerHTML = "";

  const encounter = gameState.currentLitcanonEvent;

  if (!encounter) {
    return;
  }

  const query = normalizeLitcanonTitle(litcanonAnswerInput.value);

  if (query.length < 3) {
    return;
  }

  const matches = LITCANON_NOVELS.filter((novel) => {
    const title = normalizeLitcanonTitle(novel.title);

    return title.includes(query);
  }).slice(0, 8);

  matches.forEach((novel) => {
    const suggestionButton = document.createElement("button");
    suggestionButton.type = "button";
    suggestionButton.classList.add("litcanon-suggestion");
    suggestionButton.textContent = `${novel.title} - ${novel.author}`;

    suggestionButton.addEventListener("click", () => {
      selectLitcanonSuggestion(novel);
    });

    litcanonSuggestions.appendChild(suggestionButton);
  });
}

function selectLitcanonSuggestion(novel) {
  const encounter = gameState.currentLitcanonEvent;

  if (!encounter) {
    return;
  }

  encounter.selectedNovelId = novel.id;
  litcanonAnswerInput.value = novel.title;
  litcanonMessage.textContent = "";
  litcanonSuggestions.innerHTML = "";
}

function submitLitcanonGuess() {
  const encounter = gameState.currentLitcanonEvent;

  if (!encounter) {
    return;
  }

  const selectedNovelId =
    encounter.selectedNovelId || getLitcanonNovelIdFromInput();

  if (!selectedNovelId) {
    litcanonMessage.textContent = "Choose a novel from the suggestions.";
    return;
  }

  if (selectedNovelId === encounter.clue.answerNovelId) {
    startEmptyRewardPhase();
    return;
  }

  encounter.attemptsUsed += 1;

  takePuzzleDamage(3);
  renderStats();

  if (handlePlayerDeath()) {
    return;
  }

  if (encounter.attemptsUsed >= encounter.maxAttempts) {
    startEmptyRewardPhase();
    return;
  }

  encounter.selectedNovelId = null;
  litcanonAnswerInput.value = "";
  litcanonMessage.textContent = "";
  renderLitcanonSuggestions();
  litcanonAnswerInput.focus();
}

function getLitcanonNovelIdFromInput() {
  const normalizedInput = normalizeLitcanonTitle(litcanonAnswerInput.value);
  const exactMatch = LITCANON_NOVELS.find((novel) => {
    return normalizeLitcanonTitle(novel.title) === normalizedInput;
  });

  return exactMatch ? exactMatch.id : null;
}

function getLitcanonNovelById(novelId) {
  return LITCANON_NOVELS.find((novel) => {
    return novel.id === novelId;
  });
}

function normalizeLitcanonTitle(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
