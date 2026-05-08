/* ---------------- FAN FICTION EVENT ---------------- */

function buildFanficEncounter(count = 4) {
  const selectedPairings = pickRandomFanficPairings(count);
  const fanficCards = shuffleArray(
    selectedPairings.map((pairing) => ({
      pairingId: pairing.id,
      label: pairing.fanfic
    }))
  );

  return {
    triviaType: "fanfic",
    pairings: selectedPairings,
    fanficCards
  };
}

function startFanficEvent(encounter = buildFanficEncounter()) {
  gameState.firstDraftUsedThisPuzzle = false;

  gameState.currentFanficEvent = {
    pairings: encounter.pairings.map((pairing) => ({
      ...pairing,
      locked: false,
      placedFanfic: null
    })),
    fanficCards: encounter.fanficCards.map((fanficCard) => ({ ...fanficCard }))
  };

  fanficMessage.textContent = "";
  submitFanficButton.disabled = false;

  showDialog({
    dialog: ["I'm writing a fanfic shipping Aslan and the White Witch."],
    dialogImage: "images/libregency.png"
  });

  renderFanficEvent();
  showSection("fanfic");
}

function pickRandomFanficPairings(count) {
  if (FANFIC_PAIRINGS.length < count) {
    throw new Error(`Not enough fanfic pairings. Need ${count}, but only found ${FANFIC_PAIRINGS.length}.`);
  }

  const shuffledPairings = shuffleArray([...FANFIC_PAIRINGS]);
  return shuffledPairings.slice(0, count);
}

function renderFanficEvent() {
  fanficMatchRows.innerHTML = "";
  fanficPool.innerHTML = "";

  gameState.currentFanficEvent.pairings.forEach((pairing) => {
    const row = document.createElement("div");
    row.classList.add("fanfic-match-row");

    const originalCard = document.createElement("div");
    originalCard.classList.add("fanfic-original-card");
    originalCard.textContent = pairing.original;

    const dropZone = document.createElement("div");
    dropZone.classList.add("fanfic-dropzone");
    dropZone.dataset.pairingId = pairing.id;

    if (pairing.locked) {
      dropZone.classList.add("locked");
    }

    if (pairing.placedFanfic) {
      const card = createFanficCard(pairing.placedFanfic);

      if (pairing.locked) {
        card.draggable = false;
        card.classList.add("locked");
      }

      dropZone.appendChild(card);
    } else {
      dropZone.textContent = "Drop book here";
    }

    dropZone.addEventListener("dragover", handleFanficDragOver);
    dropZone.addEventListener("drop", handleFanficDropOnOriginal);

    row.appendChild(originalCard);
    row.appendChild(dropZone);

    fanficMatchRows.appendChild(row);
  });

  gameState.currentFanficEvent.fanficCards.forEach((fanficCard) => {
    fanficPool.appendChild(createFanficCard(fanficCard));
  });

  fanficPool.addEventListener("dragover", handleFanficDragOver);
  fanficPool.addEventListener("drop", handleFanficDropOnPool);
}

function createFanficCard(fanficCard) {
  const card = document.createElement("div");
  card.classList.add("fanfic-card");
  card.textContent = fanficCard.label;
  card.draggable = true;
  card.dataset.pairingId = fanficCard.pairingId;
  card.dataset.label = fanficCard.label;

  card.addEventListener("dragstart", (event) => {
    event.dataTransfer.setData("text/plain", JSON.stringify(fanficCard));
  });

  return card;
}

function handleFanficDragOver(event) {
  event.preventDefault();
}

function handleFanficDropOnOriginal(event) {
  event.preventDefault();

  const targetPairingId = event.currentTarget.dataset.pairingId;
  const targetPairing = gameState.currentFanficEvent.pairings.find(
    (pairing) => pairing.id === targetPairingId
  );

  if (!targetPairing || targetPairing.locked) {
    return;
  }

  const droppedCard = JSON.parse(event.dataTransfer.getData("text/plain"));

  if (targetPairing.placedFanfic) {
    gameState.currentFanficEvent.fanficCards.push(targetPairing.placedFanfic);
  }

  removeFanficCardFromCurrentLocation(droppedCard);

  targetPairing.placedFanfic = droppedCard;

  renderFanficEvent();
}

function handleFanficDropOnPool(event) {
  event.preventDefault();

  const droppedCard = JSON.parse(event.dataTransfer.getData("text/plain"));

  const alreadyInPool = gameState.currentFanficEvent.fanficCards.some(
    (card) => card.pairingId === droppedCard.pairingId
  );

  if (!alreadyInPool) {
    gameState.currentFanficEvent.fanficCards.push(droppedCard);
  }

  gameState.currentFanficEvent.pairings.forEach((pairing) => {
    if (
      pairing.placedFanfic &&
      pairing.placedFanfic.pairingId === droppedCard.pairingId &&
      !pairing.locked
    ) {
      pairing.placedFanfic = null;
    }
  });

  renderFanficEvent();
}

function removeFanficCardFromCurrentLocation(fanficCard) {
  gameState.currentFanficEvent.fanficCards =
    gameState.currentFanficEvent.fanficCards.filter(
      (card) => card.pairingId !== fanficCard.pairingId
    );

  gameState.currentFanficEvent.pairings.forEach((pairing) => {
    if (
      pairing.placedFanfic &&
      pairing.placedFanfic.pairingId === fanficCard.pairingId &&
      !pairing.locked
    ) {
      pairing.placedFanfic = null;
    }
  });
}

function submitFanficAttempt() {
  const eventData = gameState.currentFanficEvent;

  if (!eventData) {
    return;
  }

  const allRowsFilled = eventData.pairings.every((pairing) => {
    return pairing.locked || pairing.placedFanfic;
  });

  if (!allRowsFilled) {
    fanficMessage.textContent = "Place all books before submitting.";
    return;
  }

  let allCorrect = true;

  eventData.pairings.forEach((pairing) => {
    if (pairing.locked) {
      return;
    }

    if (pairing.placedFanfic && pairing.placedFanfic.pairingId === pairing.id) {
      pairing.locked = true;
    } else {
      if (pairing.placedFanfic) {
        eventData.fanficCards.push(pairing.placedFanfic);
      }

      pairing.placedFanfic = null;
      allCorrect = false;
    }
  });

  if (allCorrect) {
    fanficMessage.textContent = "Correct.";
    gameState.currentFanficEvent = null;
    startTrinketRewardPhase();
    return;
  }

  takePuzzleDamage(4);
  renderStats();

  fanficMessage.textContent = "";

  renderFanficEvent();

  if (gameState.hp <= 0) {
    fanficMessage.textContent = "You have run out of HP.";
    submitFanficButton.disabled = true;
  }
}
