/* ---------------- OPENING PUZZLE ---------------- */

function startOpeningPuzzle() {
  const openingPuzzleData = getStartPuzzleDataForCurrentFloor();
  const openingPuzzle = buildPuzzle(openingPuzzleData);

  gameState.currentPuzzle = openingPuzzle;
  gameState.currentPuzzleMode = "start";
  gameState.firstDraftUsedThisPuzzle = false;

  startTitle.textContent = openingPuzzleData.work;
  startMeta.textContent = openingPuzzleData.author;
  startMessage.textContent = "";
  submitStartButton.disabled = false;

  renderPuzzle(openingPuzzle, startPoemContainer);
  showSection("start");

  focusFirstOpenSlot();
}

function getStartPuzzleDataForCurrentFloor() {
  return floorStartPuzzleData[gameState.currentFloor] || floorStartPuzzleData[2];
}

function completeOpeningPuzzle() {
  gameState.currentPuzzle = null;
  gameState.currentPuzzleMode = null;

  completeCurrentMapNode();
  renderGame();
  showSection("board");
}

function startDeathPuzzle() {
  const deathPuzzle = buildPuzzle(deathPuzzleData);

  gameState.currentPuzzle = deathPuzzle;
  gameState.currentPuzzleMode = "death";
  gameState.firstDraftUsedThisPuzzle = false;
  gameState.echoTileUsedThisPuzzle = false;
  gameState.penNibUsedThisPuzzle = false;

  startTitle.textContent = deathPuzzleData.work;
  startMeta.textContent = deathPuzzleData.author;
  startMessage.textContent = "";
  submitStartButton.disabled = false;

  renderPuzzle(deathPuzzle, startPoemContainer);
  showSection("start");
  showDialog({
    dialog: [
      "Alas, poor Yorick! I knew him, Horatio."
    ],
    dialogImage: "images/libskull.png"
  });

  focusFirstOpenSlot();
}

function completeDeathPuzzle() {
  restartGame();
}


function preparePoemEvent(poemData, missingWordCount) {
  const missingWords = chooseMissingWords(poemData.lines, missingWordCount);

  return {
    ...poemData,
    puzzleType: "missingWords",
    missingWords
  };
}

function prepareLineOrderPoemEvent(poemData, lineCount = 4) {
  const selectedLines = chooseLineOrderLines(poemData.lines, lineCount);

  return {
    ...poemData,
    puzzleType: "lineOrder",
    lineOrder: {
      selectedLines,
      trayCardIds: shuffleArray(selectedLines.map((line) => line.cardId)),
      placements: Array(poemData.lines.length + 1).fill(null)
    }
  };
}

function chooseLineOrderLines(lines, lineCount) {
  const eligibleLines = lines
    .map((line, lineIndex) => ({
      cardId: `line-${lineIndex}`,
      lineIndex,
      text: line
    }))
    .filter((line) => isEligibleLineOrderLine(line.text));

  return shuffleArray(eligibleLines).slice(0, Math.min(lineCount, eligibleLines.length));
}

function isEligibleLineOrderLine(line) {
  const trimmedLine = line.replace(/\u00a0/g, " ").trim();

  return trimmedLine !== "" && trimmedLine !== "[...]";
}

function chooseMissingWords(lines, missingWordCount) {
  const eligibleWords = [];

  lines.forEach((line, lineIndex) => {
    const tokens = tokenizeLine(line);
    let wordIndex = 0;

    tokens.forEach((token) => {
      if (token.type === "word") {
        eligibleWords.push({
          lineIndex,
          wordIndex,
          text: token.text
        });

        wordIndex += 1;
      }
    });
  });

  const eligibleLineIndexes = new Set(
    eligibleWords.map((word) => word.lineIndex)
  );
  const targetMissingWordCount = Math.min(
    missingWordCount,
    eligibleLineIndexes.size
  );

  if (targetMissingWordCount === 0) {
    throw new Error("No eligible words found for this poem.");
  }

  const selectedWords = [];
  const usedLineIndexes = new Set();

  while (selectedWords.length < targetMissingWordCount) {
    const availableWords = eligibleWords.filter((word) => {
      return !usedLineIndexes.has(word.lineIndex);
    });

    const randomIndex = Math.floor(Math.random() * availableWords.length);
    const selectedWord = availableWords[randomIndex];

    selectedWords.push({
      lineIndex: selectedWord.lineIndex,
      wordIndex: selectedWord.wordIndex
    });

    usedLineIndexes.add(selectedWord.lineIndex);
  }

  return selectedWords;
}

function startPoemEvent(poemData) {
  const poemEvent = buildPuzzle(poemData);

  gameState.currentPuzzle = poemEvent;
  gameState.firstDraftUsedThisPuzzle = false;
  showDialog({
    ...poemData,
    dialogImage: poemData.dialogImage || "images/lib.png"
  });
  gameState.echoTileUsedThisPuzzle = false;
  gameState.penNibUsedThisPuzzle = false;

  if (gameState.currentPuzzleMode !== "rest") {
    gameState.currentPuzzleMode = "event";
  }

  if (gameState.currentPuzzleMode === "rest") {
    gameState.currentPuzzle.restRevealed = false;
    gameState.restHealAmount = 0;
    gameState.pendingReplyReward = false;
    eventSection.classList.add("rest-mode");
    eventTitle.textContent = poemData.title;
    eventMeta.textContent = poemData.author;
    eventMessage.textContent = "";
    submitPoemButton.textContent = "Submit";
  } else {
    eventSection.classList.remove("rest-mode");
    eventTitle.textContent = poemData.title;
    eventMeta.textContent = poemData.author;
    eventMessage.textContent = "";
    submitPoemButton.textContent = "Submit";
  }

  stickyNoteDisplay.classList.add("hidden");
  stickyNoteDisplay.textContent = "";
  submitPoemButton.disabled = false;
  submitPoemButton.classList.remove("hidden");

  renderPuzzle(poemEvent, poemContainer);
  showSection("event");

  if (gameState.currentPuzzleMode === "rest") {
    submitPoemButton.textContent = "Submit";
    submitPoemButton.disabled = false;
  }

  focusFirstOpenSlot();
}

/* ---------------- PUZZLE BUILD / RENDER ---------------- */

function tokenizeLine(line) {
  const regex = /[A-Za-z'’‘-]+|[^A-Za-z'’‘-]+/g;
  const matches = line.match(regex) || [];

  return matches.map((text) => {
    if (/[A-Za-z]/.test(text)) {
      return { type: "word", text };
    }

    return { type: "punctuation", text };
  });
}
function isAutoRevealedCharacter(char) {
  return /['’‘-]/.test(char);
}

function buildPuzzle(poemData) {
  if (poemData.puzzleType === "lineOrder") {
    return {
      ...poemData,
      lineOrder: {
        selectedLines: poemData.lineOrder.selectedLines.map((line) => ({ ...line })),
        trayCardIds: [...poemData.lineOrder.trayCardIds],
        placements: [...poemData.lineOrder.placements]
      }
    };
  }

  const selectedWords = poemData.missingWords.map((missingWord, blankIndex) => {
    const line = poemData.lines[missingWord.lineIndex];
    const tokens = tokenizeLine(line);
    const wordToken = getWordTokenByIndex(tokens, missingWord.wordIndex);

    return {
      blankIndex,
      lineIndex: missingWord.lineIndex,
      wordIndex: missingWord.wordIndex,
      answer: wordToken.text,
      letters: wordToken.text.split("").map((char) => ({
  answerChar: char,
  value: isAutoRevealedCharacter(char) ? char : "",
  locked: isAutoRevealedCharacter(char)
}))
    };
  });

  return {
    ...poemData,
    puzzleType: "missingWords",
    selectedWords
  };
}

function getWordTokenByIndex(tokens, targetWordIndex) {
  let wordCounter = 0;

  for (const token of tokens) {
    if (token.type === "word") {
      if (wordCounter === targetWordIndex) {
        return token;
      }

      wordCounter += 1;
    }
  }

  throw new Error(`No word token found at word index: ${targetWordIndex}`);
}

function renderPuzzle(puzzle, container) {
  container.innerHTML = "";

  if (puzzle.puzzleType === "lineOrder") {
    renderLineOrderPuzzle(puzzle, container);
    return;
  }

  puzzle.lines.forEach((line, lineIndex) => {
    const lineElement = document.createElement("div");
    lineElement.classList.add("poem-line");

    if (puzzle.italicLineIndexes && puzzle.italicLineIndexes.includes(lineIndex)) {
      lineElement.classList.add("italic");
    }

    const tokens = tokenizeLine(line);
    let wordCounter = 0;

    tokens.forEach((token) => {
      if (token.type === "word") {
        const selectedWord = puzzle.selectedWords.find(
          (word) => word.lineIndex === lineIndex && word.wordIndex === wordCounter
        );

        if (selectedWord) {
          lineElement.appendChild(createBlankWordElement(selectedWord));
        } else {
          lineElement.appendChild(document.createTextNode(token.text));
        }

        wordCounter += 1;
      } else {
        lineElement.appendChild(document.createTextNode(token.text));
      }
    });

    container.appendChild(lineElement);
  });

  attachSlotListeners(container);
}

function renderLineOrderPuzzle(puzzle, container) {
  const layout = document.createElement("div");
  layout.classList.add("line-order-layout");

  const poemArea = document.createElement("div");
  poemArea.classList.add("line-order-poem");
  poemArea.addEventListener("dragover", handleLineOrderPoemDragOver);
  poemArea.addEventListener("dragleave", handleLineOrderPoemDragLeave);
  poemArea.addEventListener("drop", handleLineOrderPoemDrop);

  const tray = document.createElement("div");
  tray.classList.add("line-order-tray");
  tray.dataset.dropTarget = "tray";
  tray.addEventListener("dragover", handleLineOrderDragOver);
  tray.addEventListener("drop", handleLineOrderTrayDrop);

  const selectedLineIndexes = getLineOrderSelectedLineIndexes(puzzle);

  puzzle.lines.forEach((line, lineIndex) => {
    if (selectedLineIndexes.has(lineIndex)) {
      poemArea.appendChild(createLineOrderDropzone(puzzle, lineIndex));
      return;
    }

    const lineElement = document.createElement("div");
    lineElement.classList.add("poem-line");

    if (puzzle.italicLineIndexes && puzzle.italicLineIndexes.includes(lineIndex)) {
      lineElement.classList.add("italic");
    }

    lineElement.textContent = line;
    poemArea.appendChild(lineElement);
  });

  puzzle.lineOrder.trayCardIds.forEach((cardId) => {
    const card = getLineOrderCardById(puzzle, cardId);

    if (card) {
      tray.appendChild(createLineOrderCard(puzzle, card));
    }
  });

  layout.appendChild(poemArea);
  layout.appendChild(tray);
  container.appendChild(layout);
}

function createLineOrderDropzone(puzzle, insertionIndex) {
  const dropzone = document.createElement("div");
  dropzone.classList.add("line-order-dropzone");
  dropzone.dataset.insertionIndex = insertionIndex;
  dropzone.addEventListener("dragover", handleLineOrderDragOver);
  dropzone.addEventListener("drop", handleLineOrderZoneDrop);

  const cardId = puzzle.lineOrder.placements[insertionIndex];
  const card = getLineOrderCardById(puzzle, cardId);

  if (card) {
    dropzone.appendChild(createLineOrderCard(puzzle, card));
  }

  return dropzone;
}

function createLineOrderCard(puzzle, card) {
  const cardElement = document.createElement("div");
  cardElement.classList.add("line-order-card");
  cardElement.draggable = true;
  cardElement.dataset.cardId = card.cardId;
  cardElement.textContent = card.text;

  if (puzzle.italicLineIndexes && puzzle.italicLineIndexes.includes(card.lineIndex)) {
    cardElement.classList.add("italic");
  }

  cardElement.addEventListener("dragstart", handleLineOrderDragStart);
  cardElement.addEventListener("dragend", clearLineOrderActiveDropzones);
  return cardElement;
}

function handleLineOrderDragStart(event) {
  event.dataTransfer.setData("text/plain", event.target.dataset.cardId);
  event.dataTransfer.effectAllowed = "move";
}

function handleLineOrderDragOver(event) {
  event.preventDefault();
  event.dataTransfer.dropEffect = "move";
}

function handleLineOrderZoneDrop(event) {
  event.preventDefault();
  event.stopPropagation();

  const cardId = event.dataTransfer.getData("text/plain");
  const insertionIndex = Number(event.currentTarget.dataset.insertionIndex);

  moveLineOrderCardToZone(cardId, insertionIndex);
  clearLineOrderActiveDropzones();
}

function handleLineOrderTrayDrop(event) {
  event.preventDefault();
  event.stopPropagation();

  const cardId = event.dataTransfer.getData("text/plain");

  moveLineOrderCardToTray(cardId);
  clearLineOrderActiveDropzones();
}

function handleLineOrderPoemDragOver(event) {
  event.preventDefault();

  const dropzone = getClosestLineOrderDropzone(event.currentTarget, event.clientY);

  clearLineOrderActiveDropzones();

  if (dropzone) {
    dropzone.classList.add("active");
  }
}

function handleLineOrderPoemDragLeave(event) {
  if (!event.currentTarget.contains(event.relatedTarget)) {
    clearLineOrderActiveDropzones();
  }
}

function handleLineOrderPoemDrop(event) {
  event.preventDefault();

  const cardId = event.dataTransfer.getData("text/plain");
  const dropzone = getClosestLineOrderDropzone(event.currentTarget, event.clientY);

  if (!dropzone) {
    return;
  }

  moveLineOrderCardToZone(cardId, Number(dropzone.dataset.insertionIndex));
  clearLineOrderActiveDropzones();
}

function getClosestLineOrderDropzone(poemArea, clientY) {
  const dropzones = Array.from(poemArea.querySelectorAll(".line-order-dropzone"));

  if (dropzones.length === 0) {
    return null;
  }

  return dropzones.reduce((closestDropzone, dropzone) => {
    const closestRect = closestDropzone.getBoundingClientRect();
    const dropzoneRect = dropzone.getBoundingClientRect();
    const closestDistance = Math.abs(clientY - (closestRect.top + closestRect.height / 2));
    const dropzoneDistance = Math.abs(clientY - (dropzoneRect.top + dropzoneRect.height / 2));

    return dropzoneDistance < closestDistance ? dropzone : closestDropzone;
  }, dropzones[0]);
}

function clearLineOrderActiveDropzones() {
  document.querySelectorAll(".line-order-dropzone.active").forEach((dropzone) => {
    dropzone.classList.remove("active");
  });
}

function moveLineOrderCardToZone(cardId, insertionIndex) {
  const puzzle = gameState.currentPuzzle;

  if (!puzzle || puzzle.puzzleType !== "lineOrder" || !getLineOrderCardById(puzzle, cardId)) {
    return;
  }

  const displacedCardId = puzzle.lineOrder.placements[insertionIndex];

  removeLineOrderCardFromCurrentLocation(puzzle, cardId);

  if (displacedCardId && displacedCardId !== cardId) {
    removeLineOrderCardFromCurrentLocation(puzzle, displacedCardId);
    addLineOrderCardToTray(puzzle, displacedCardId);
  }

  puzzle.lineOrder.placements[insertionIndex] = cardId;
  rerenderCurrentPuzzle();
}

function moveLineOrderCardToTray(cardId) {
  const puzzle = gameState.currentPuzzle;

  if (!puzzle || puzzle.puzzleType !== "lineOrder" || !getLineOrderCardById(puzzle, cardId)) {
    return;
  }

  removeLineOrderCardFromCurrentLocation(puzzle, cardId);
  addLineOrderCardToTray(puzzle, cardId);

  rerenderCurrentPuzzle();
}

function addLineOrderCardToTray(puzzle, cardId) {
  if (!puzzle.lineOrder.trayCardIds.includes(cardId)) {
    puzzle.lineOrder.trayCardIds.push(cardId);
  }
}

function removeLineOrderCardFromCurrentLocation(puzzle, cardId) {
  puzzle.lineOrder.trayCardIds = puzzle.lineOrder.trayCardIds.filter((id) => {
    return id !== cardId;
  });

  puzzle.lineOrder.placements = puzzle.lineOrder.placements.map((placement) => {
    return placement === cardId ? null : placement;
  });
}

function getLineOrderCardById(puzzle, cardId) {
  if (!cardId || !puzzle.lineOrder) {
    return null;
  }

  return puzzle.lineOrder.selectedLines.find((line) => line.cardId === cardId) || null;
}

function getLineOrderSelectedLineIndexes(puzzle) {
  return new Set(puzzle.lineOrder.selectedLines.map((line) => line.lineIndex));
}

function isLineOrderCurrentPuzzle() {
  return gameState.currentPuzzle && gameState.currentPuzzle.puzzleType === "lineOrder";
}

function createBlankWordElement(blankWord) {
  const wordElement = document.createElement("span");
  wordElement.classList.add("blank-word");
  wordElement.dataset.blankIndex = blankWord.blankIndex;

  blankWord.letters.forEach((letter, letterIndex) => {
    const input = document.createElement("input");
    input.classList.add("letter-slot");
    input.maxLength = 1;
    input.dataset.blankIndex = blankWord.blankIndex;
    input.dataset.letterIndex = letterIndex;
    input.value = letter.value;

    if (letter.revealedByGame) {
      input.classList.add("revealed");
      input.disabled = true;
    } else if (letter.locked) {
      input.classList.add("locked");
      input.disabled = true;
    }

    wordElement.appendChild(input);
  });

  return wordElement;
}

function attachSlotListeners(container) {
  const slots = getAllSlots(container);

  slots.forEach((slot) => {
    slot.addEventListener("input", handleSlotInput);
    slot.addEventListener("keydown", handleSlotKeydown);
  });
}

function handleSlotInput(event) {
  const slot = event.target;
  const blankIndex = Number(slot.dataset.blankIndex);
  const letterIndex = Number(slot.dataset.letterIndex);
  const blank = gameState.currentPuzzle.selectedWords[blankIndex];

  slot.value = slot.value.slice(-1);
  blank.letters[letterIndex].value = slot.value;

  if (slot.value.length === 1) {
    focusNextOpenSlot(blankIndex, letterIndex);
  }
}

function handleSlotKeydown(event) {
  const slot = event.target;

  if (event.key === "Enter") {
    event.preventDefault();
    submitCurrentPuzzleAttempt();
    return;
  }

  if (event.key === "Backspace" && slot.value === "") {
    event.preventDefault();
    focusPreviousOpenSlot(Number(slot.dataset.blankIndex), Number(slot.dataset.letterIndex));
  }
}

function getActivePuzzleContainer() {
  if (
    gameState.currentPuzzleMode === "start" ||
    gameState.currentPuzzleMode === "death"
  ) {
    return startPoemContainer;
  }

  if (
    gameState.currentPuzzleMode === "event" ||
    gameState.currentPuzzleMode === "rest"
  ) {
    return poemContainer;
  }

  return null;
}

function getAllSlots(container = null) {
  const slotContainer = container || getActivePuzzleContainer();

  if (!slotContainer) {
    return [];
  }

  return Array.from(slotContainer.querySelectorAll(".letter-slot"));
}

function focusFirstOpenSlot() {
  const firstOpenSlot = getAllSlots().find((slot) => !slot.disabled);

  if (firstOpenSlot) {
    firstOpenSlot.focus();
  }
}

function focusNextOpenSlot(currentBlankIndex, currentLetterIndex) {
  const slots = getAllSlots();
  const currentSlotIndex = slots.findIndex((slot) => {
    return (
      Number(slot.dataset.blankIndex) === currentBlankIndex &&
      Number(slot.dataset.letterIndex) === currentLetterIndex
    );
  });

  const nextSlot = slots
    .slice(currentSlotIndex + 1)
    .find((slot) => !slot.disabled && slot.value === "");

  if (nextSlot) {
    nextSlot.focus();
    return;
  }

  const firstOpenEmptySlot = slots.find((slot) => !slot.disabled && slot.value === "");

  if (firstOpenEmptySlot) {
    firstOpenEmptySlot.focus();
  }
}

function focusPreviousOpenSlot(currentBlankIndex, currentLetterIndex) {
  const slots = getAllSlots();
  const currentSlotIndex = slots.findIndex((slot) => {
    return (
      Number(slot.dataset.blankIndex) === currentBlankIndex &&
      Number(slot.dataset.letterIndex) === currentLetterIndex
    );
  });

  const previousSlot = slots
    .slice(0, currentSlotIndex)
    .reverse()
    .find((slot) => !slot.disabled);

  if (previousSlot) {
    previousSlot.focus();
    previousSlot.value = "";

    const blankIndex = Number(previousSlot.dataset.blankIndex);
    const letterIndex = Number(previousSlot.dataset.letterIndex);

    gameState.currentPuzzle.selectedWords[blankIndex].letters[letterIndex].value = "";
  }
}

function normalizeForComparison(char) {
  return char
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[‐-‒–—]/g, "-");
}
function countIncorrectOrBlankLetters(puzzle) {
  let incorrectOrBlankCount = 0;

  puzzle.selectedWords.forEach((blankWord) => {
    blankWord.letters.forEach((letter) => {
      if (letter.locked) {
        return;
      }

      const expected = normalizeForComparison(letter.answerChar);
      const actual = normalizeForComparison(letter.value);

      if (actual === "" || actual !== expected) {
        incorrectOrBlankCount += 1;
      }
    });
  });

  return incorrectOrBlankCount;
}

/* ---------------- PUZZLE SUBMIT ---------------- */

function submitCurrentPuzzleAttempt() {
  if (gameState.currentPuzzleMode === "rest") {
    if (gameState.currentPuzzle.restRevealed) {
      startRewardPhase();
      return;
    }

    submitRestPuzzleAttempt();
    return;
  }

  if (isLineOrderCurrentPuzzle()) {
    submitLineOrderPuzzleAttempt();
    return;
  }

  let allCorrect = true;

  gameState.currentPuzzle.selectedWords.forEach((blankWord) => {
    blankWord.letters.forEach((letter) => {
      if (letter.locked) {
        return;
      }

      const expected = normalizeForComparison(letter.answerChar);
      const actual = normalizeForComparison(letter.value);

      if (actual === expected) {
        letter.locked = true;
      } else {
        letter.value = "";
        allCorrect = false;
      }
    });
  });

  if (allCorrect) {
    handlePuzzleSuccess();
    return;
  }

  if (
    gameState.currentPuzzleMode !== "start" &&
    gameState.currentPuzzleMode !== "death"
  ) {
    const incorrectOrBlankCount = countIncorrectOrBlankLetters(gameState.currentPuzzle);
    const damage = Math.ceil(incorrectOrBlankCount / 2);

    takePuzzleDamage(damage);
    renderStats();
    if (handlePlayerDeath()) {
      return;
    }
    showPuzzleMessage("");
  } else {
    showPuzzleMessage("Not quite. Try again.");
  }

  rerenderCurrentPuzzle();
  focusFirstOpenSlot();

  handlePlayerDeath();
}

function submitLineOrderPuzzleAttempt() {
  if (isLineOrderPuzzleCorrect(gameState.currentPuzzle)) {
    handlePuzzleSuccess();
    return;
  }

  takePuzzleDamage(4);
  renderStats();

  if (handlePlayerDeath()) {
    return;
  }

  showPuzzleMessage("The poem is still out of order.");
  rerenderCurrentPuzzle();
}

function isLineOrderPuzzleCorrect(puzzle) {
  const selectedLineIndexes = getLineOrderSelectedLineIndexes(puzzle);
  const reconstructedLineIndexes = [];

  for (let lineIndex = 0; lineIndex <= puzzle.lines.length; lineIndex += 1) {
    const placedCard = getLineOrderCardById(puzzle, puzzle.lineOrder.placements[lineIndex]);

    if (placedCard) {
      reconstructedLineIndexes.push(placedCard.lineIndex);
    }

    if (lineIndex < puzzle.lines.length && !selectedLineIndexes.has(lineIndex)) {
      reconstructedLineIndexes.push(lineIndex);
    }
  }

  if (reconstructedLineIndexes.length !== puzzle.lines.length) {
    return false;
  }

  return reconstructedLineIndexes.every((lineIndex, currentIndex) => {
    return lineIndex === currentIndex;
  });
}

function submitRestPuzzleAttempt() {
  let correctLetters = 0;
  let allCorrect = true;

  gameState.currentPuzzle.selectedWords.forEach((blankWord) => {
    blankWord.letters.forEach((letter) => {
      if (letter.locked) {
        return;
      }

      const expected = normalizeForComparison(letter.answerChar);
      const actual = normalizeForComparison(letter.value);

      if (actual === expected) {
        letter.locked = true;
        letter.playerCorrect = true;
        correctLetters += 1;
      } else {
        letter.value = letter.answerChar;
        letter.locked = true;
        letter.revealedByGame = true;
        allCorrect = false;
      }
    });
  });

  gameState.restHealAmount = correctLetters;
  gameState.pendingReplyReward =
    allCorrect && gameState.currentPuzzle.id === "this-is-just-to-say";
  gameState.currentPuzzle.restRevealed = true;

  rerenderCurrentPuzzle();
  eventMessage.textContent = "";
  submitPoemButton.textContent = "Rest";
  submitPoemButton.disabled = false;
}

function handlePuzzleSuccess() {
  if (gameState.currentPuzzleMode === "start") {
    showPuzzleMessage("Correct.");
    completeOpeningPuzzle();
    return;
  }

  if (gameState.currentPuzzleMode === "death") {
    showPuzzleMessage("Correct.");
    completeDeathPuzzle();
    return;
  }

  if (gameState.currentPuzzleMode === "event") {
    showPuzzleMessage("Correct.");
    startRewardPhase();
  }
}

function showPuzzleMessage(message) {
  if (
    gameState.currentPuzzleMode === "start" ||
    gameState.currentPuzzleMode === "death"
  ) {
    startMessage.textContent = message;
  }

  if (gameState.currentPuzzleMode === "event") {
    eventMessage.textContent = message;
  }
}

function rerenderCurrentPuzzle() {
  if (gameState.currentPuzzleMode === "event" || gameState.currentPuzzleMode === "rest") {
    renderPuzzle(gameState.currentPuzzle, poemContainer);
  }
}

function disableCurrentSubmitButton() {
  if (gameState.currentPuzzleMode === "event" || gameState.currentPuzzleMode === "rest") {
    submitPoemButton.disabled = true;
  }
}


/* ---------------- BABEL TILE USE ---------------- */

function useBabelTile(tileIndex, options = {}) {
  const consume = options.consume !== false;
  if (
    gameState.currentPuzzleMode !== "event" ||
    !gameState.currentPuzzle ||
    isLineOrderCurrentPuzzle()
  ) {
    return;
  }

  const tile = gameState.inventory[tileIndex];
  hideInventoryTooltip();

  if (!isBabelTile(tile)) {
    return;
  }

  let applied = false;
  const tileLetters = getBabelTileLetters(tile).map((letter) => {
    return letter.toLowerCase();
  });

  gameState.currentPuzzle.selectedWords.forEach((word) => {
    word.letters.forEach((letter) => {
      if (
        !letter.locked &&
        tileLetters.includes(letter.answerChar.toLowerCase())
      ) {
        letter.value = letter.answerChar;
        letter.locked = true;
        applied = true;
      }
    });
  });

  if (consume) {
    gameState.inventory.splice(tileIndex, 1);
  }

  renderInventory();
  rerenderCurrentPuzzle();
  focusFirstOpenSlot();

  if (applied) {
    showPuzzleMessage(`Used ${getBabelTileLabel(tile)} Babel Tile.`);
  } else {
    showPuzzleMessage(`Used ${getBabelTileLabel(tile)} Babel Tile, but no matching letters were hidden.`);
  }
}

function useEchoTile() {
  if (isLineOrderCurrentPuzzle()) {
    return;
  }

  const babelTileIndexes = gameState.inventory
    .map((item, index) => ({ item, index }))
    .filter((entry) => isBabelTileEchoEligible(entry.item))
    .map((entry) => entry.index);

  if (babelTileIndexes.length === 0) {
    return;
  }

  const randomIndex =
    babelTileIndexes[Math.floor(Math.random() * babelTileIndexes.length)];

  gameState.echoTileUsedThisPuzzle = true;

  useBabelTile(randomIndex, { consume: false });

  renderInventory();
}

function usePenNib() {
  if (
    gameState.currentPuzzleMode !== "event" ||
    !gameState.currentPuzzle ||
    isLineOrderCurrentPuzzle()
  ) {
    return;
  }

  hideInventoryTooltip();

  const targetLetter = findFirstUnsolvedPuzzleLetter();

  if (!targetLetter) {
    showPuzzleMessage("There are no blank letters for the Pen Nib to fill.");
    return;
  }

  targetLetter.value = targetLetter.answerChar;
  targetLetter.locked = true;
  gameState.penNibUsedThisPuzzle = true;

  renderInventory();
  rerenderCurrentPuzzle();
  focusFirstOpenSlot();

  showPuzzleMessage("The Pen Nib filled in the first blank letter.");
}

function findFirstUnsolvedPuzzleLetter() {
  for (const word of gameState.currentPuzzle.selectedWords) {
    const letter = word.letters.find((candidate) => {
      return !candidate.locked;
    });

    if (letter) {
      return letter;
    }
  }

  return null;
}

