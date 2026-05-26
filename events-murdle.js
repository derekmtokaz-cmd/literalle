const MURDLE_WORD_LENGTH = 5;
const MURDLE_MAX_GUESSES = 6;
const MURDLE_FAILURE_DAMAGE = 5;
const MURDLE_DECOY_TILE_COUNT = 5;
const MURDLE_WEIGHTED_LETTER_BAG =
  "eeeeeeeeeeeaaaaaaaaaiiiiiiiiioooooooonnnnnnrrrrrrttttttllllssssuuuuddggbbccmmppffhhvvwwyykqxjz";

function buildMurdleEncounter() {
  const prompt = MURDLE_PROMPTS[Math.floor(Math.random() * MURDLE_PROMPTS.length)];

  return {
    triviaType: "murdle",
    prompt
  };
}

function startMurdleEvent(encounter = buildMurdleEncounter()) {
  const answer = normalizeMurdleGuess(encounter.prompt.answer);
  const lockedSlots = Array(MURDLE_WORD_LENGTH).fill(null);
  const decoyTiles = buildMurdleDecoyTiles(answer);

  gameState.currentMurdleEvent = {
    prompt: encounter.prompt,
    answer,
    guesses: [],
    slots: Array(MURDLE_WORD_LENGTH).fill(null),
    lockedSlots,
    decoyTiles,
    trayTiles: buildMurdleTrayTiles(answer, lockedSlots, decoyTiles),
    selectedTile: null,
    complete: false
  };
  gameState.lastEventType = "murdle";
  gameState.firstDraftUsedThisPuzzle = false;

  shuffleMurdleTray();

  showDialog({
    dialog: ["I never slur my speech. I only have a great vowel shift."],
    dialogImage: "images/libchaucer.png"
  });

  murdlePromptLine.textContent = encounter.prompt.displayLine;
  resetSubmitButtonAfterRewardProceed(submitMurdleButton);
  submitMurdleButton.disabled = false;
  murdleMessage.textContent = "";

  renderMurdle();
  showSection("murdle");
}

function buildMurdleAnswerTiles(answer, lockedSlots = []) {
  return answer
    .split("")
    .map((letter, index) => ({
      id: `murdle-${index}-${letter}`,
      letter,
      answerIndex: index
    }))
    .filter((tile) => !lockedSlots[tile.answerIndex]);
}

function buildMurdleDecoyTiles(answer) {
  const answerLetterSet = new Set(answer.split(""));
  const decoyLetterBag = MURDLE_WEIGHTED_LETTER_BAG
    .split("")
    .filter((letter) => !answerLetterSet.has(letter))
    .join("");
  const decoyTiles = Array.from({ length: MURDLE_DECOY_TILE_COUNT }, (_, index) => {
    const letter = getRandomMurdleDecoyLetter(decoyLetterBag);
    return {
      id: `murdle-decoy-${Date.now()}-${index}-${letter}-${Math.random()}`,
      letter
    };
  });

  return decoyTiles;
}

function buildMurdleTrayTiles(answer, lockedSlots = [], decoyTiles = []) {
  const answerTiles = buildMurdleAnswerTiles(answer, lockedSlots);
  return [...answerTiles, ...decoyTiles];
}

function getRandomMurdleDecoyLetter(decoyLetterBag) {
  const index = Math.floor(Math.random() * decoyLetterBag.length);
  return decoyLetterBag[index];
}

function shuffleMurdleTray() {
  const eventData = gameState.currentMurdleEvent;

  if (!eventData) {
    return;
  }

  for (let index = eventData.trayTiles.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [eventData.trayTiles[index], eventData.trayTiles[swapIndex]] = [
      eventData.trayTiles[swapIndex],
      eventData.trayTiles[index]
    ];
  }
}

function renderMurdle() {
  renderMurdleGrid();
  renderMurdleSlots();
  renderMurdleTray();
}

function renderMurdleGrid() {
  const eventData = gameState.currentMurdleEvent;
  murdleGrid.innerHTML = "";

  for (let rowIndex = 0; rowIndex < MURDLE_MAX_GUESSES; rowIndex += 1) {
    const row = document.createElement("div");
    row.classList.add("murdle-row");

    const guessData = eventData?.guesses[rowIndex] || null;

    for (let cellIndex = 0; cellIndex < MURDLE_WORD_LENGTH; cellIndex += 1) {
      const cell = document.createElement("div");
      cell.classList.add("murdle-cell");

      if (guessData) {
        cell.textContent = guessData.guess[cellIndex].toUpperCase();
        cell.classList.add(`murdle-cell-${guessData.feedback[cellIndex]}`);
      }

      row.appendChild(cell);
    }

    murdleGrid.appendChild(row);
  }
}

function renderMurdleSlots() {
  const eventData = gameState.currentMurdleEvent;
  murdleSlots.innerHTML = "";

  for (let index = 0; index < MURDLE_WORD_LENGTH; index += 1) {
    const slot = document.createElement("button");
    const tile = eventData?.slots[index] || null;
    const isLocked = isMurdleSlotLocked(index);
    slot.type = "button";
    slot.classList.add("murdle-slot");
    slot.dataset.index = index;
    slot.disabled = !eventData || eventData.complete || isLocked;
    slot.setAttribute("aria-label", `Answer slot ${index + 1}`);

    if (tile) {
      slot.textContent = tile.letter.toUpperCase();
      slot.classList.add("murdle-slot-filled");
      slot.draggable = !eventData.complete && !isLocked;
      slot.dataset.source = "slot";
      slot.dataset.tileIndex = index;
    }

    if (isLocked) {
      slot.classList.add("murdle-slot-locked");
      slot.setAttribute("aria-label", `Locked answer slot ${index + 1}: ${tile.letter.toUpperCase()}`);
    }

    if (isSelectedMurdleTile("slot", index)) {
      slot.classList.add("murdle-tile-selected");
    }

    slot.addEventListener("click", () => handleMurdleSlotClick(index));
    slot.addEventListener("dragover", handleMurdleDragover);
    slot.addEventListener("drop", (event) => handleMurdleSlotDrop(event, index));
    slot.addEventListener("dragstart", (event) => handleMurdleTileDragstart(event, "slot", index));
    murdleSlots.appendChild(slot);
  }
}

function renderMurdleTray() {
  const eventData = gameState.currentMurdleEvent;
  murdleTray.innerHTML = "";

  if (!eventData) {
    return;
  }

  eventData.trayTiles.forEach((tile, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.classList.add("murdle-tile");
    button.textContent = tile.letter.toUpperCase();
    button.dataset.index = index;
    button.disabled = eventData.complete;
    button.draggable = !eventData.complete;
    button.setAttribute("aria-label", `Letter ${tile.letter.toUpperCase()}`);

    if (isSelectedMurdleTile("tray", index)) {
      button.classList.add("murdle-tile-selected");
    }

    button.addEventListener("click", () => selectMurdleTile("tray", index));
    button.addEventListener("dragstart", (event) => handleMurdleTileDragstart(event, "tray", index));
    murdleTray.appendChild(button);
  });

  murdleTray.ondragover = handleMurdleDragover;
  murdleTray.ondrop = handleMurdleTrayDrop;
  murdleTray.onclick = handleMurdleTrayClick;
}

function handleMurdleSlotClick(index) {
  const eventData = gameState.currentMurdleEvent;

  if (!eventData || eventData.complete || isMurdleSlotLocked(index)) {
    return;
  }

  if (eventData.selectedTile) {
    moveSelectedMurdleTileToSlot(index);
    return;
  }

  if (eventData.slots[index]) {
    selectMurdleTile("slot", index);
  }
}

function handleMurdleTrayClick(event) {
  const eventData = gameState.currentMurdleEvent;

  if (!eventData || eventData.complete || event.target !== murdleTray) {
    return;
  }

  if (eventData.selectedTile?.source === "slot") {
    moveSelectedMurdleTileToTray();
  }
}

function selectMurdleTile(source, index) {
  const eventData = gameState.currentMurdleEvent;

  if (!eventData || eventData.complete || (source === "slot" && isMurdleSlotLocked(index))) {
    return;
  }

  if (isSelectedMurdleTile(source, index)) {
    eventData.selectedTile = null;
  } else {
    eventData.selectedTile = { source, index };
  }

  renderMurdle();
}

function isSelectedMurdleTile(source, index) {
  const selectedTile = gameState.currentMurdleEvent?.selectedTile;
  return selectedTile?.source === source && selectedTile.index === index;
}

function isMurdleSlotLocked(index) {
  return Boolean(gameState.currentMurdleEvent?.lockedSlots[index]);
}

function moveSelectedMurdleTileToSlot(slotIndex) {
  const selectedTile = gameState.currentMurdleEvent?.selectedTile;

  if (!selectedTile) {
    return;
  }

  moveMurdleTileToSlot(selectedTile.source, selectedTile.index, slotIndex);
}

function moveSelectedMurdleTileToTray() {
  const selectedTile = gameState.currentMurdleEvent?.selectedTile;

  if (!selectedTile) {
    return;
  }

  moveMurdleTileToTray(selectedTile.source, selectedTile.index);
}

function moveMurdleTileToSlot(source, sourceIndex, targetSlotIndex) {
  const eventData = gameState.currentMurdleEvent;

  if (!eventData || eventData.complete || isMurdleSlotLocked(targetSlotIndex)) {
    return;
  }

  if (source === "slot" && sourceIndex === targetSlotIndex) {
    eventData.selectedTile = null;
    renderMurdle();
    return;
  }

  const tile = removeMurdleTile(source, sourceIndex);

  if (!tile) {
    return;
  }

  const displacedTile = eventData.slots[targetSlotIndex];
  eventData.slots[targetSlotIndex] = tile;

  if (displacedTile) {
    restoreDisplacedMurdleTile(displacedTile, source, sourceIndex);
  }

  eventData.selectedTile = null;
  murdleMessage.textContent = "";
  renderMurdle();
}

function moveMurdleTileToTray(source, sourceIndex) {
  const eventData = gameState.currentMurdleEvent;

  if (!eventData || eventData.complete || source !== "slot" || isMurdleSlotLocked(sourceIndex)) {
    return;
  }

  const tile = removeMurdleTile(source, sourceIndex);

  if (tile) {
    eventData.trayTiles.push(tile);
  }

  eventData.selectedTile = null;
  murdleMessage.textContent = "";
  renderMurdle();
}

function removeMurdleTile(source, index) {
  const eventData = gameState.currentMurdleEvent;

  if (!eventData) {
    return null;
  }

  if (source === "tray") {
    const [tile] = eventData.trayTiles.splice(index, 1);
    return tile || null;
  }

  if (source === "slot") {
    if (isMurdleSlotLocked(index)) {
      return null;
    }

    const tile = eventData.slots[index];
    eventData.slots[index] = null;
    return tile;
  }

  return null;
}

function restoreDisplacedMurdleTile(tile, source, sourceIndex) {
  const eventData = gameState.currentMurdleEvent;

  if (!eventData) {
    return;
  }

  if (source === "slot") {
    eventData.slots[sourceIndex] = tile;
    return;
  }

  eventData.trayTiles.splice(sourceIndex, 0, tile);
}

function handleMurdleTileDragstart(event, source, index) {
  const eventData = gameState.currentMurdleEvent;

  if (!eventData || eventData.complete || (source === "slot" && isMurdleSlotLocked(index))) {
    event.preventDefault();
    return;
  }

  event.dataTransfer.setData("text/plain", JSON.stringify({ source, index }));
  event.dataTransfer.effectAllowed = "move";
}

function handleMurdleDragover(event) {
  event.preventDefault();
  event.dataTransfer.dropEffect = "move";
}

function handleMurdleSlotDrop(event, slotIndex) {
  event.preventDefault();

  if (isMurdleSlotLocked(slotIndex)) {
    return;
  }

  const draggedTile = getDraggedMurdleTile(event);

  if (!draggedTile) {
    return;
  }

  moveMurdleTileToSlot(draggedTile.source, draggedTile.index, slotIndex);
}

function handleMurdleTrayDrop(event) {
  event.preventDefault();
  const draggedTile = getDraggedMurdleTile(event);

  if (!draggedTile) {
    return;
  }

  moveMurdleTileToTray(draggedTile.source, draggedTile.index);
}

function getDraggedMurdleTile(event) {
  try {
    return JSON.parse(event.dataTransfer.getData("text/plain"));
  } catch (error) {
    return null;
  }
}

function submitMurdleGuess() {
  if (handleSubmitButtonRewardProceed(submitMurdleButton)) {
    return;
  }

  const eventData = gameState.currentMurdleEvent;

  if (!eventData || eventData.complete) {
    return;
  }

  if (eventData.slots.some((slot) => !slot)) {
    murdleMessage.textContent = "Place all five letter tiles.";
    return;
  }

  const guess = eventData.slots.map((slot) => slot.letter).join("");
  const feedback = getMurdleFeedback(guess, eventData.answer);
  eventData.guesses.push({ guess, feedback });
  eventData.selectedTile = null;
  murdleMessage.textContent = "";

  if (guess === eventData.answer) {
    renderMurdle();
    completeMurdleSuccess();
    return;
  }

  if (eventData.guesses.length >= MURDLE_MAX_GUESSES) {
    renderMurdle();
    completeMurdleFailure();
    return;
  }

  updateMurdleLockedSlots(feedback);
  eventData.slots = buildMurdleSlotsFromLocks();
  eventData.trayTiles = buildMurdleTrayTiles(
    eventData.answer,
    eventData.lockedSlots,
    eventData.decoyTiles
  );
  shuffleMurdleTray();
  renderMurdle();
}

function updateMurdleLockedSlots(feedback) {
  const eventData = gameState.currentMurdleEvent;

  if (!eventData) {
    return;
  }

  feedback.forEach((result, index) => {
    if (result !== "correct" || eventData.lockedSlots[index]) {
      return;
    }

    const letter = eventData.answer[index];
    eventData.lockedSlots[index] = {
      id: `murdle-locked-${index}-${letter}`,
      letter,
      answerIndex: index
    };
  });
}

function buildMurdleSlotsFromLocks() {
  const eventData = gameState.currentMurdleEvent;

  if (!eventData) {
    return Array(MURDLE_WORD_LENGTH).fill(null);
  }

  return eventData.lockedSlots.map((tile) => tile || null);
}

function getMurdleFeedback(guess, answer) {
  const feedback = Array(MURDLE_WORD_LENGTH).fill("absent");
  const remainingLetters = {};

  for (let index = 0; index < MURDLE_WORD_LENGTH; index += 1) {
    if (guess[index] === answer[index]) {
      feedback[index] = "correct";
    } else {
      remainingLetters[answer[index]] = (remainingLetters[answer[index]] || 0) + 1;
    }
  }

  for (let index = 0; index < MURDLE_WORD_LENGTH; index += 1) {
    if (feedback[index] === "correct") {
      continue;
    }

    const letter = guess[index];

    if (remainingLetters[letter] > 0) {
      feedback[index] = "present";
      remainingLetters[letter] -= 1;
    }
  }

  return feedback;
}

function completeMurdleSuccess() {
  const eventData = gameState.currentMurdleEvent;

  if (eventData) {
    eventData.complete = true;
    eventData.selectedTile = null;
  }

  renderMurdle();
  murdleMessage.textContent = "Correct.";
  armSubmitButtonForRewardProceed(submitMurdleButton, () => {
    gameState.currentMurdleEvent = null;
    startTrinketRewardPhase();
  });
}

function completeMurdleFailure() {
  const eventData = gameState.currentMurdleEvent;
  const answer = eventData.answer;

  eventData.complete = true;
  eventData.selectedTile = null;
  renderMurdle();

  if (gameState.hp <= MURDLE_FAILURE_DAMAGE) {
    gameState.hp = Math.max(0, gameState.hp - MURDLE_FAILURE_DAMAGE);
    renderStats();

    if (handlePlayerDeath()) {
      return;
    }
  }

  murdleMessage.textContent = "Out of guesses. Proceed when ready.";
  armSubmitButtonForRewardProceed(submitMurdleButton, () => {
    gameState.currentMurdleEvent = null;
    if (gameState.hp > MURDLE_FAILURE_DAMAGE) {
      gameState.hp = Math.max(0, gameState.hp - MURDLE_FAILURE_DAMAGE);
      renderStats();
    }

    gameState.currentRewardOffers = [];
    gameState.rewardTilePurchased = false;
    tileOffersSection.classList.add("hidden");
    tileOfferContainer.innerHTML = "";
    inkRewardMessage.textContent = `The answer was ${answer}.`;
    rewardMessage.textContent = `You lost ${MURDLE_FAILURE_DAMAGE} HP.`;
    skipRewardButton.classList.remove("hidden");

    renderInventory();
    showSection("reward");
  });
}

function normalizeMurdleGuess(guess) {
  return String(guess)
    .toLowerCase()
    .replace(/[^a-z]/g, "");
}
