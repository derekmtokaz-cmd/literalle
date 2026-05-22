function buildLitcanonEncounter() {
  const clue = getRandomLitcanonClue();

  return {
    clue,
    attemptsUsed: 0,
    maxAttempts: 3,
    selectedNovelId: null,
    suggestionMatches: [],
    highlightedSuggestionIndex: -1
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
  encounter.suggestionMatches = [];
  encounter.highlightedSuggestionIndex = -1;

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
    encounter.suggestionMatches = [];
    encounter.highlightedSuggestionIndex = -1;
    return;
  }

  const matches = LITCANON_NOVELS.filter((novel) => {
    const title = normalizeLitcanonTitle(novel.title);

    return title.includes(query);
  }).slice(0, 8);

  encounter.suggestionMatches = matches;

  if (encounter.highlightedSuggestionIndex >= matches.length) {
    encounter.highlightedSuggestionIndex = matches.length - 1;
  }

  matches.forEach((novel, index) => {
    const suggestionButton = document.createElement("button");
    suggestionButton.type = "button";
    suggestionButton.classList.add("litcanon-suggestion");

    if (index === encounter.highlightedSuggestionIndex) {
      suggestionButton.classList.add("highlighted");
    }

    suggestionButton.textContent = `${novel.title} - ${novel.author}`;

    suggestionButton.addEventListener("click", () => {
      selectLitcanonSuggestion(novel);
    });

    litcanonSuggestions.appendChild(suggestionButton);
  });
}

function handleLitcanonAnswerKeydown(event) {
  if (event.key === "ArrowDown") {
    event.preventDefault();
    moveLitcanonSuggestionHighlight(1);
    return;
  }

  if (event.key === "ArrowUp") {
    event.preventDefault();
    moveLitcanonSuggestionHighlight(-1);
    return;
  }

  if (event.key === "Enter") {
    event.preventDefault();
    submitLitcanonGuess();
  }
}

function moveLitcanonSuggestionHighlight(direction) {
  const encounter = gameState.currentLitcanonEvent;

  if (!encounter || encounter.suggestionMatches.length === 0) {
    return;
  }

  const matchCount = encounter.suggestionMatches.length;
  const currentIndex = encounter.highlightedSuggestionIndex;
  const nextIndex =
    currentIndex === -1
      ? direction > 0 ? 0 : matchCount - 1
      : (currentIndex + direction + matchCount) % matchCount;

  encounter.highlightedSuggestionIndex = nextIndex;
  renderLitcanonSuggestions();
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
  encounter.suggestionMatches = [];
  encounter.highlightedSuggestionIndex = -1;
}

function submitLitcanonGuess() {
  const encounter = gameState.currentLitcanonEvent;

  if (!encounter) {
    return;
  }

  if (encounter.suggestionMatches.length > 0) {
    const suggestionIndex =
      encounter.highlightedSuggestionIndex >= 0
        ? encounter.highlightedSuggestionIndex
        : 0;
    const highlightedNovel = encounter.suggestionMatches[suggestionIndex];

    if (highlightedNovel) {
      selectLitcanonSuggestion(highlightedNovel);
    }
  }

  const selectedNovelId =
    encounter.selectedNovelId || getLitcanonNovelIdFromInput();

  if (!selectedNovelId) {
    litcanonMessage.textContent = "Choose a novel from the suggestions.";
    return;
  }

  if (selectedNovelId === encounter.clue.answerNovelId) {
    gameState.currentLitcanonEvent = null;
    startTrinketRewardPhase();
    return;
  }

  encounter.attemptsUsed += 1;

  takePuzzleDamage(3);
  renderStats();

  if (handlePlayerDeath()) {
    return;
  }

  if (encounter.attemptsUsed >= encounter.maxAttempts) {
    startLitcanonFailureRewardPhase(encounter);
    return;
  }

  encounter.selectedNovelId = null;
  encounter.suggestionMatches = [];
  encounter.highlightedSuggestionIndex = -1;
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

function startLitcanonFailureRewardPhase(encounter) {
  const answerNovel = getLitcanonNovelById(encounter.clue.answerNovelId);
  const answerText = answerNovel
    ? `${answerNovel.title} - ${answerNovel.author}`
    : "Correct answer unavailable.";

  gameState.currentLitcanonEvent = null;
  startTrinketRewardPhase();
  inkRewardMessage.textContent = answerText;
  rewardMessage.textContent = "Three attempts is enough. Let's move on.";
}

function normalizeLitcanonTitle(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
