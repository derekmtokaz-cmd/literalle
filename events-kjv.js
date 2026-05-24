function buildKjvEncounter() {
  const passage = getRandomKjvPassage();
  const keyWordPositions = getKjvKeyWordPositions(passage);
  const sundaySchoolIndex = Math.floor(Math.random() * keyWordPositions.length);

  return {
    passage: {
      ...passage,
      dialog: getKjvDialogOptions(passage),
      dialogImage: getKjvDialogImage(passage)
    },
    keyWordPositions,
    sundaySchoolMissingWords: [keyWordPositions[sundaySchoolIndex]]
  };
}

function getKjvDialogImage(passage) {
  if (passage.id === "butlerian-prohibition") {
    return "images/libdune.png";
  }

  return "images/libbible.png";
}

function getKjvDialogOptions(passage) {
  if (passage.id === "butlerian-prohibition") {
    return [
      "Scotch is the mind killer. I must not scotch-- No, nevermind. Fear. Fear is the mind killer."
    ];
  }

  return [
    "\"Jesus wept.\" - 10 Yeezuz 3:16",
    "Di liebe is zees, nor zi iz gut mit broyt.",
    "\"Both read the Bible day and night, \nBut thou read’st black where I read white.\" - William Blake, The Everlasting Gospel"
  ];
}

function getRandomKjvPassage() {
  if (KJV_PASSAGES.length === 0) {
    throw new Error("No KJV passages found.");
  }

  const randomIndex = Math.floor(Math.random() * KJV_PASSAGES.length);
  return KJV_PASSAGES[randomIndex];
}

function getKjvKeyWordPositions(passage) {
  return passage.keyWords.map((keyWord) => {
    const position = findWordPositionByText(passage.lines, keyWord);

    if (!position) {
      throw new Error(`KJV key word not found: ${keyWord}`);
    }

    return position;
  });
}

function findWordPositionByText(lines, targetText) {
  const normalizedTarget = targetText.toLowerCase();

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    const tokens = tokenizeLine(lines[lineIndex]);
    let wordIndex = 0;

    for (const token of tokens) {
      if (token.type === "word") {
        const normalizedToken = token.text.toLowerCase();

        if (normalizedToken === normalizedTarget) {
          return { lineIndex, wordIndex };
        }

        wordIndex += 1;
      }
    }
  }

  return null;
}

function startKjvEvent(encounter) {
  gameState.currentPuzzle = null;
  gameState.currentPuzzleMode = null;
  gameState.currentKjvEncounter = encounter;
  gameState.currentKjvDifficulty = null;

  eventSection.classList.remove("rest-mode");
  eventTitle.textContent = "KJV";
  eventMeta.textContent = `${encounter.passage.title} — ${encounter.passage.source}`;
  eventMessage.textContent = "";
  stickyNoteDisplay.classList.add("hidden");
  stickyNoteDisplay.textContent = "";
  submitPoemButton.classList.add("hidden");

  renderKjvDifficultyChoices(encounter);
  showSection("event");
}

function renderKjvDifficultyChoices(encounter) {
  poemContainer.innerHTML = "";

  const choiceContainer = document.createElement("div");
  choiceContainer.classList.add("kjv-difficulty-choices");

  const choices = [
    {
      id: "sundaySchool",
      label: "Sunday School",
      description: "One key word is missing."
    },
    {
      id: "sundayBest",
      label: "Sunday Best",
      description: "All three key words are missing."
    },
    {
      id: "hailMary",
      label: "Hail Mary",
      description: "The entire passage is blank."
    }
  ];

  choices.forEach((choice) => {
    const choiceButton = document.createElement("button");
    choiceButton.type = "button";
    choiceButton.classList.add("kjv-difficulty-choice");
    choiceButton.innerHTML = `
      <strong>${choice.label}</strong>
      <span>${choice.description}</span>
    `;

    choiceButton.addEventListener("click", () => {
      startKjvPuzzle(encounter, choice.id);
    });

    choiceContainer.appendChild(choiceButton);
  });

  poemContainer.appendChild(choiceContainer);
}

function startKjvPuzzle(encounter, difficultyId) {
  const puzzleData = buildKjvPuzzleData(encounter, difficultyId);

  gameState.currentPuzzle = buildPuzzle(puzzleData);
  gameState.currentPuzzleMode = "event";
  gameState.currentKjvDifficulty = difficultyId;
  gameState.firstDraftUsedThisPuzzle = false;
  gameState.echoTileUsedThisPuzzle = false;
  gameState.penNibUsedThisPuzzle = false;
  showDialog(encounter.passage);

  eventTitle.textContent = encounter.passage.title;
  eventMeta.textContent = encounter.passage.source;
  eventMessage.textContent = "";
  resetSubmitButtonAfterRewardProceed(submitPoemButton);
  submitPoemButton.textContent = "Submit";
  submitPoemButton.disabled = false;
  submitPoemButton.classList.remove("hidden");

  renderPuzzle(gameState.currentPuzzle, poemContainer);
  renderInventory();
  focusFirstOpenSlot();
}

function buildKjvPuzzleData(encounter, difficultyId) {
  let missingWords;

  if (difficultyId === "sundaySchool") {
    missingWords = encounter.sundaySchoolMissingWords;
  } else if (difficultyId === "sundayBest") {
    missingWords = encounter.keyWordPositions;
  } else if (difficultyId === "hailMary") {
    missingWords = getAllWordPositions(encounter.passage.lines);
  } else {
    throw new Error(`Unknown KJV difficulty: ${difficultyId}`);
  }

  return {
    id: encounter.passage.id,
    title: encounter.passage.title,
    author: encounter.passage.source,
    source: encounter.passage.source,
    lines: encounter.passage.lines,
    missingWords: missingWords.map((missingWord) => ({ ...missingWord }))
  };
}

function getAllWordPositions(lines) {
  const wordPositions = [];

  lines.forEach((line, lineIndex) => {
    const tokens = tokenizeLine(line);
    let wordIndex = 0;

    tokens.forEach((token) => {
      if (token.type === "word") {
        wordPositions.push({ lineIndex, wordIndex });
        wordIndex += 1;
      }
    });
  });

  return wordPositions;
}
