/* ---------------- DETECTIVE EVENT ---------------- */

function buildDetectiveEncounter(count = 4) {
  const selectedDetectives = pickRandomDetectives(count);
  const detectiveCards = shuffleArray(
    selectedDetectives.map((item) => ({
      detectiveId: item.id,
      label: item.detective
    }))
  );

  return {
    triviaType: "detective",
    entries: selectedDetectives,
    detectiveCards
  };
}

function startDetectiveEvent(encounter = buildDetectiveEncounter()) {
  const selectedDetectives = encounter.entries;
  const detectiveCards = encounter.detectiveCards;
  gameState.firstDraftUsedThisPuzzle = false;

  gameState.currentDetectiveEvent = {
    entries: selectedDetectives.map((item) => ({
      ...item,
      locked: false,
      placedDetective: null
    })),
    detectiveCards: detectiveCards.map((detectiveCard) => ({ ...detectiveCard }))
  };

  detectiveMessage.textContent = "";
  resetSubmitButtonAfterRewardProceed(submitDetectiveButton);
  submitDetectiveButton.disabled = false;

  showDialog({
    dialog: [
      "You are some gumshoe\nYou just don’t think well\nGet this dumb gumshoe\nYou come from my inkwell\n\n- You're Nothing Without Me (City of Angels)"
    ],
    dialogImage: "images/lib.png"
  });

  renderDetectiveEvent();
  showSection("detective");
}

function pickRandomDetectives(count) {
  if (DETECTIVES.length < count) {
    throw new Error(`Not enough detectives. Need ${count}, but only found ${DETECTIVES.length}.`);
  }

  const detectivesWithIds = DETECTIVES.map((item, index) => ({
    id: `detective-${index}`,
    ...item
  }));

  const shuffledDetectives = shuffleArray(detectivesWithIds);
  return shuffledDetectives.slice(0, count);
}

function renderDetectiveEvent() {
  detectiveMatchRows.innerHTML = "";
  detectivePool.innerHTML = "";

  gameState.currentDetectiveEvent.entries.forEach((entry) => {
    const row = document.createElement("div");
    row.classList.add("detective-match-row");

    const novelCard = document.createElement("div");
    novelCard.classList.add("detective-novel-card");

    const novelTitle = document.createElement("div");
    novelTitle.classList.add("detective-novel-title");
    novelTitle.textContent = entry.novel;

    const novelAuthor = document.createElement("div");
    novelAuthor.classList.add("detective-novel-author");
    novelAuthor.textContent = entry.author;

    novelCard.appendChild(novelTitle);
    novelCard.appendChild(novelAuthor);

    const dropZone = document.createElement("div");
    dropZone.classList.add("detective-dropzone");
    dropZone.dataset.detectiveId = entry.id;

    if (entry.locked) {
      dropZone.classList.add("locked");
    }

    if (entry.placedDetective) {
      const card = createDetectiveCard(entry.placedDetective);

      if (entry.locked) {
        card.draggable = false;
        card.classList.add("locked");
      }

      dropZone.appendChild(card);
    } else {
      dropZone.textContent = "Drop detective here";
    }

    dropZone.addEventListener("dragover", handleDetectiveDragOver);
    dropZone.addEventListener("drop", handleDetectiveDropOnNovel);

    row.appendChild(novelCard);
    row.appendChild(dropZone);

    detectiveMatchRows.appendChild(row);
  });

  gameState.currentDetectiveEvent.detectiveCards.forEach((detectiveCard) => {
    detectivePool.appendChild(createDetectiveCard(detectiveCard));
  });

  detectivePool.addEventListener("dragover", handleDetectiveDragOver);
  detectivePool.addEventListener("drop", handleDetectiveDropOnPool);
}
function createDetectiveCard(detectiveCard) {
  const card = document.createElement("div");
  card.classList.add("detective-card");
  card.textContent = detectiveCard.label;
  card.draggable = true;
  card.dataset.detectiveId = detectiveCard.detectiveId;
  card.dataset.label = detectiveCard.label;

  card.addEventListener("dragstart", (event) => {
    event.dataTransfer.setData("text/plain", JSON.stringify(detectiveCard));
  });

  return card;
}

function handleDetectiveDragOver(event) {
  event.preventDefault();
}

function handleDetectiveDropOnNovel(event) {
  event.preventDefault();

  const targetDetectiveId = event.currentTarget.dataset.detectiveId;
  const targetEntry = gameState.currentDetectiveEvent.entries.find(
    (entry) => entry.id === targetDetectiveId
  );

  if (!targetEntry || targetEntry.locked) {
    return;
  }

  const droppedCard = JSON.parse(event.dataTransfer.getData("text/plain"));

  if (targetEntry.placedDetective) {
    gameState.currentDetectiveEvent.detectiveCards.push(targetEntry.placedDetective);
  }

  removeDetectiveCardFromCurrentLocation(droppedCard);

  targetEntry.placedDetective = droppedCard;

  renderDetectiveEvent();
}

function handleDetectiveDropOnPool(event) {
  event.preventDefault();

  const droppedCard = JSON.parse(event.dataTransfer.getData("text/plain"));

  const alreadyInPool = gameState.currentDetectiveEvent.detectiveCards.some(
    (card) => card.detectiveId === droppedCard.detectiveId
  );

  if (!alreadyInPool) {
    gameState.currentDetectiveEvent.detectiveCards.push(droppedCard);
  }

  gameState.currentDetectiveEvent.entries.forEach((entry) => {
    if (
      entry.placedDetective &&
      entry.placedDetective.detectiveId === droppedCard.detectiveId &&
      !entry.locked
    ) {
      entry.placedDetective = null;
    }
  });

  renderDetectiveEvent();
}

function removeDetectiveCardFromCurrentLocation(detectiveCard) {
  gameState.currentDetectiveEvent.detectiveCards =
    gameState.currentDetectiveEvent.detectiveCards.filter(
      (card) => card.detectiveId !== detectiveCard.detectiveId
    );

  gameState.currentDetectiveEvent.entries.forEach((entry) => {
    if (
      entry.placedDetective &&
      entry.placedDetective.detectiveId === detectiveCard.detectiveId &&
      !entry.locked
    ) {
      entry.placedDetective = null;
    }
  });
}

function submitDetectiveAttempt() {
  if (handleSubmitButtonRewardProceed(submitDetectiveButton)) {
    return;
  }

  const eventData = gameState.currentDetectiveEvent;

  if (!eventData) {
    return;
  }

  const allRowsFilled = eventData.entries.every((entry) => {
    return entry.locked || entry.placedDetective;
  });

  if (!allRowsFilled) {
    detectiveMessage.textContent = "Place all detectives before submitting.";
    return;
  }

  let allCorrect = true;

  eventData.entries.forEach((entry) => {
    if (entry.locked) {
      return;
    }

    if (entry.placedDetective && entry.placedDetective.detectiveId === entry.id) {
      entry.locked = true;
    } else {
      if (entry.placedDetective) {
        eventData.detectiveCards.push(entry.placedDetective);
      }

      entry.placedDetective = null;
      allCorrect = false;
    }
  });

  if (allCorrect) {
    detectiveMessage.textContent = "Correct.";
    armSubmitButtonForRewardProceed(submitDetectiveButton, () => {
      gameState.currentDetectiveEvent = null;
      startTrinketRewardPhase();
    });
    return;
  }

  takePuzzleDamage(4);
  renderStats();

  if (handlePlayerDeath()) {
    return;
  }

  detectiveMessage.textContent = "";

  renderDetectiveEvent();
}
