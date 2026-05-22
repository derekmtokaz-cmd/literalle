function buildAuthorleEncounter() {
  const bibliography = getRandomAuthorleBibliography();

  return {
    bibliography,
    attemptsUsed: 0,
    maxAttempts: 3,
    selectedAuthor: null,
    suggestionMatches: [],
    highlightedSuggestionIndex: -1
  };
}

function getRandomAuthorleBibliography() {
  if (AUTHORLE_BIBLIOGRAPHIES.length === 0) {
    throw new Error("No Authorle bibliographies found.");
  }

  const randomIndex = Math.floor(Math.random() * AUTHORLE_BIBLIOGRAPHIES.length);
  return AUTHORLE_BIBLIOGRAPHIES[randomIndex];
}

function startAuthorleEvent(encounter = buildAuthorleEncounter()) {
  gameState.currentAuthorleEvent = encounter;
  gameState.lastEventType = "authorle";
  gameState.firstDraftUsedThisPuzzle = false;

  showDialog({
    dialog: ["dialog goes here."],
    dialogImage: "images/lib.png"
  });

  authorleMessage.textContent = "";
  authorleAnswerInput.value = "";
  authorleAnswerInput.disabled = false;
  submitAuthorleButton.disabled = false;
  encounter.selectedAuthor = null;
  encounter.suggestionMatches = [];
  encounter.highlightedSuggestionIndex = -1;

  renderAuthorleClues();
  renderAuthorleSuggestions();
  showSection("authorle");
  authorleAnswerInput.focus();
}

function renderAuthorleClues() {
  const encounter = gameState.currentAuthorleEvent;
  authorleClueList.innerHTML = buildAuthorleBibliographyTableHeader();

  if (!encounter) {
    return;
  }

  encounter.bibliography.novels.forEach((novel) => {
    authorleClueList.appendChild(buildAuthorleBibliographyRow(novel, true));
  });
}

function renderAuthorleSuggestions() {
  authorleSuggestions.innerHTML = "";

  const encounter = gameState.currentAuthorleEvent;

  if (!encounter) {
    return;
  }

  const query = normalizeAuthorleAuthor(authorleAnswerInput.value);

  if (query.length < 3) {
    encounter.suggestionMatches = [];
    encounter.highlightedSuggestionIndex = -1;
    return;
  }

  const matches = getAuthorleAuthorOptions().filter((author) => {
    return normalizeAuthorleAuthor(author).includes(query);
  }).slice(0, 8);

  encounter.suggestionMatches = matches;

  if (encounter.highlightedSuggestionIndex >= matches.length) {
    encounter.highlightedSuggestionIndex = matches.length - 1;
  }

  matches.forEach((author, index) => {
    const suggestionButton = document.createElement("button");
    suggestionButton.type = "button";
    suggestionButton.classList.add("litcanon-suggestion");

    if (index === encounter.highlightedSuggestionIndex) {
      suggestionButton.classList.add("highlighted");
    }

    suggestionButton.textContent = author;
    suggestionButton.addEventListener("click", () => {
      selectAuthorleSuggestion(author);
    });

    authorleSuggestions.appendChild(suggestionButton);
  });
}

function handleAuthorleAnswerKeydown(event) {
  if (event.key === "ArrowDown") {
    event.preventDefault();
    moveAuthorleSuggestionHighlight(1);
    return;
  }

  if (event.key === "ArrowUp") {
    event.preventDefault();
    moveAuthorleSuggestionHighlight(-1);
    return;
  }

  if (event.key === "Enter") {
    event.preventDefault();
    submitAuthorleGuess();
  }
}

function moveAuthorleSuggestionHighlight(direction) {
  const encounter = gameState.currentAuthorleEvent;

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
  renderAuthorleSuggestions();
}

function selectAuthorleSuggestion(author) {
  const encounter = gameState.currentAuthorleEvent;

  if (!encounter) {
    return;
  }

  encounter.selectedAuthor = author;
  authorleAnswerInput.value = author;
  authorleMessage.textContent = "";
  authorleSuggestions.innerHTML = "";
  encounter.suggestionMatches = [];
  encounter.highlightedSuggestionIndex = -1;
}

function submitAuthorleGuess() {
  const encounter = gameState.currentAuthorleEvent;

  if (!encounter) {
    return;
  }

  if (encounter.suggestionMatches.length > 0) {
    const suggestionIndex =
      encounter.highlightedSuggestionIndex >= 0
        ? encounter.highlightedSuggestionIndex
        : 0;
    const highlightedAuthor = encounter.suggestionMatches[suggestionIndex];

    if (highlightedAuthor) {
      selectAuthorleSuggestion(highlightedAuthor);
    }
  }

  const selectedAuthor =
    encounter.selectedAuthor || getAuthorleAuthorFromInput();

  if (!selectedAuthor) {
    authorleMessage.textContent = "Choose an author from the suggestions.";
    return;
  }

  if (
    normalizeAuthorleAuthor(selectedAuthor) ===
    normalizeAuthorleAuthor(encounter.bibliography.author)
  ) {
    gameState.currentAuthorleEvent = null;
    startTrinketRewardPhase();
    rewardMessage.innerHTML = buildAuthorleBibliographySummary(encounter.bibliography);
    return;
  }

  encounter.attemptsUsed += 1;

  takePuzzleDamage(3);
  renderStats();

  if (handlePlayerDeath()) {
    return;
  }

  if (encounter.attemptsUsed >= encounter.maxAttempts) {
    startAuthorleFailureRewardPhase(encounter);
    return;
  }

  encounter.selectedAuthor = null;
  encounter.suggestionMatches = [];
  encounter.highlightedSuggestionIndex = -1;
  authorleAnswerInput.value = "";
  authorleMessage.textContent = "";
  renderAuthorleSuggestions();
  authorleAnswerInput.focus();
}

function getAuthorleAuthorFromInput() {
  const normalizedInput = normalizeAuthorleAuthor(authorleAnswerInput.value);
  const exactMatch = getAuthorleAuthorOptions().find((author) => {
    return normalizeAuthorleAuthor(author) === normalizedInput;
  });

  return exactMatch || null;
}

function getAuthorleAuthorOptions() {
  const authors = LITCANON_NOVELS.map((novel) => {
    return novel.author;
  });

  return [...new Set(authors)].sort((authorA, authorB) => {
    return authorA.localeCompare(authorB);
  });
}

function startAuthorleFailureRewardPhase(encounter) {
  gameState.currentAuthorleEvent = null;
  gameState.currentRewardOffers = [];
  gameState.rewardTilePurchased = false;

  tileOffersSection.classList.add("hidden");
  tileOfferContainer.innerHTML = "";
  inkRewardMessage.textContent = encounter.bibliography.author;
  rewardMessage.innerHTML = buildAuthorleBibliographySummary(encounter.bibliography);
  skipRewardButton.classList.remove("hidden");

  renderStats();
  renderInventory();

  showSection("reward");
}

function buildAuthorleBibliographySummary(bibliography) {
  return `
    <div class="authorle-answer-list">
      ${buildAuthorleBibliographyTableHeader()}
      ${bibliography.novels.map((novel) => buildAuthorleBibliographyRowHtml(novel, false)).join("")}
    </div>
  `;
}

function buildAuthorleBibliographyTableHeader() {
  return `
    <div class="authorle-bibliography-row authorle-bibliography-header">
      <div>Title</div>
      <div>Date</div>
      <div>Goodreads score (# of ratings)</div>
    </div>
  `;
}

function buildAuthorleBibliographyRow(novel, maskTitle) {
  const row = document.createElement("div");
  row.classList.add("authorle-bibliography-row");

  const titleCell = document.createElement("div");
  const dateCell = document.createElement("div");
  const goodreadsCell = document.createElement("div");

  titleCell.textContent = maskTitle ? blankAuthorleTitle(novel.title) : novel.title;
  dateCell.textContent = novel.publicationYear;
  goodreadsCell.textContent = getAuthorleGoodreadsDisplay(novel.goodreads);

  row.appendChild(titleCell);
  row.appendChild(dateCell);
  row.appendChild(goodreadsCell);

  return row;
}

function buildAuthorleBibliographyRowHtml(novel, maskTitle) {
  const title = maskTitle ? blankAuthorleTitle(novel.title) : novel.title;

  return `
    <div class="authorle-bibliography-row">
      <div>${escapeAuthorleText(title)}</div>
      <div>${novel.publicationYear}</div>
      <div>${escapeAuthorleText(getAuthorleGoodreadsDisplay(novel.goodreads))}</div>
    </div>
  `;
}

function getAuthorleGoodreadsDisplay(goodreads) {
  return String(goodreads || "").trim();
}

function blankAuthorleTitle(title) {
  return String(title).replace(/[A-Za-z0-9]/g, "X");
}

function normalizeAuthorleAuthor(author) {
  return String(author)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function escapeAuthorleText(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
