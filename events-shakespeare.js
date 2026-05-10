function buildShakespeareEncounter(count = 4) {
  const selectedMatches = pickRandomShakespeareMatches(count);

  return {
    triviaType: "shakespeare",
    matches: selectedMatches
  };
}

function pickRandomShakespeareMatches(count) {
  if (SHAKESPEARE_CHARACTER_MATCHES.length < count) {
    throw new Error(`Not enough Shakespeare matches. Need ${count}, but only found ${SHAKESPEARE_CHARACTER_MATCHES.length}.`);
  }

  return shuffleArray([...SHAKESPEARE_CHARACTER_MATCHES]).slice(0, count);
}

function startShakespeareEvent(encounter = buildShakespeareEncounter()) {
  gameState.firstDraftUsedThisPuzzle = false;

  gameState.currentShakespeareEvent = {
    round: 1,
    matches: encounter.matches.map((match) => ({ ...match }))
  };

  prepareShakespeareRound();
  shakespeareMessage.textContent = "";
  submitShakespeareButton.disabled = false;

  showDialog({
    dialog: ["I never really liked Hamlet because after a three hour nap, I feel more groggy than refreshed."],
    dialogImage: "images/libskull.png"
  });

  renderShakespeareEvent();
  showSection("shakespeare");
}

function prepareShakespeareRound() {
  const eventData = gameState.currentShakespeareEvent;
  const characterField =
    eventData.round === 1 ? "roundOneCharacter" : "roundTwoCharacter";

  eventData.entries = eventData.matches.map((match) => ({
    ...match,
    locked: false,
    placedCharacter: null,
    correctCharacter: match[characterField]
  }));

  eventData.characterCards = shuffleArray(
    eventData.entries.map((entry) => ({
      playId: entry.id,
      label: entry.correctCharacter
    }))
  );
}

function renderShakespeareEvent() {
  const eventData = gameState.currentShakespeareEvent;

  shakespeareRoundLabel.textContent = "Match the character to their play.";
  shakespeareMatchRows.innerHTML = "";
  shakespearePool.innerHTML = "";

  eventData.entries.forEach((entry) => {
    const row = document.createElement("div");
    row.classList.add("shakespeare-match-row");

    const playCard = document.createElement("div");
    playCard.classList.add("shakespeare-play-card");
    playCard.textContent = entry.play;

    const dropZone = document.createElement("div");
    dropZone.classList.add("shakespeare-dropzone");
    dropZone.dataset.playId = entry.id;

    if (entry.locked) {
      dropZone.classList.add("locked");
    }

    if (entry.placedCharacter) {
      const card = createShakespeareCharacterCard(entry.placedCharacter);

      if (entry.locked) {
        card.draggable = false;
        card.classList.add("locked");
      }

      dropZone.appendChild(card);
    } else {
      dropZone.textContent = "Drop character here";
    }

    dropZone.addEventListener("dragover", handleShakespeareDragOver);
    dropZone.addEventListener("drop", handleShakespeareDropOnPlay);

    row.appendChild(playCard);
    row.appendChild(dropZone);

    shakespeareMatchRows.appendChild(row);
  });

  eventData.characterCards.forEach((characterCard) => {
    shakespearePool.appendChild(createShakespeareCharacterCard(characterCard));
  });

  shakespearePool.addEventListener("dragover", handleShakespeareDragOver);
  shakespearePool.addEventListener("drop", handleShakespeareDropOnPool);
}

function createShakespeareCharacterCard(characterCard) {
  const card = document.createElement("div");
  card.classList.add("shakespeare-card");
  card.textContent = characterCard.label;
  card.draggable = true;
  card.dataset.playId = characterCard.playId;
  card.dataset.label = characterCard.label;

  card.addEventListener("dragstart", (event) => {
    event.dataTransfer.setData("text/plain", JSON.stringify(characterCard));
  });

  return card;
}

function handleShakespeareDragOver(event) {
  event.preventDefault();
}

function handleShakespeareDropOnPlay(event) {
  event.preventDefault();

  const targetPlayId = event.currentTarget.dataset.playId;
  const targetEntry = gameState.currentShakespeareEvent.entries.find(
    (entry) => entry.id === targetPlayId
  );

  if (!targetEntry || targetEntry.locked) {
    return;
  }

  const droppedCard = JSON.parse(event.dataTransfer.getData("text/plain"));

  if (targetEntry.placedCharacter) {
    gameState.currentShakespeareEvent.characterCards.push(targetEntry.placedCharacter);
  }

  removeShakespeareCardFromCurrentLocation(droppedCard);

  targetEntry.placedCharacter = droppedCard;

  renderShakespeareEvent();
}

function handleShakespeareDropOnPool(event) {
  event.preventDefault();

  const droppedCard = JSON.parse(event.dataTransfer.getData("text/plain"));

  const alreadyInPool = gameState.currentShakespeareEvent.characterCards.some(
    (card) => card.playId === droppedCard.playId
  );

  if (!alreadyInPool) {
    gameState.currentShakespeareEvent.characterCards.push(droppedCard);
  }

  gameState.currentShakespeareEvent.entries.forEach((entry) => {
    if (
      entry.placedCharacter &&
      entry.placedCharacter.playId === droppedCard.playId &&
      !entry.locked
    ) {
      entry.placedCharacter = null;
    }
  });

  renderShakespeareEvent();
}

function removeShakespeareCardFromCurrentLocation(characterCard) {
  gameState.currentShakespeareEvent.characterCards =
    gameState.currentShakespeareEvent.characterCards.filter(
      (card) => card.playId !== characterCard.playId
    );

  gameState.currentShakespeareEvent.entries.forEach((entry) => {
    if (
      entry.placedCharacter &&
      entry.placedCharacter.playId === characterCard.playId &&
      !entry.locked
    ) {
      entry.placedCharacter = null;
    }
  });
}

function submitShakespeareAttempt() {
  const eventData = gameState.currentShakespeareEvent;

  if (!eventData) {
    return;
  }

  const allRowsFilled = eventData.entries.every((entry) => {
    return entry.locked || entry.placedCharacter;
  });

  if (!allRowsFilled) {
    shakespeareMessage.textContent = "Place all characters before submitting.";
    return;
  }

  let allCorrect = true;

  eventData.entries.forEach((entry) => {
    if (entry.locked) {
      return;
    }

    if (entry.placedCharacter && entry.placedCharacter.playId === entry.id) {
      entry.locked = true;
    } else {
      if (entry.placedCharacter) {
        eventData.characterCards.push(entry.placedCharacter);
      }

      entry.placedCharacter = null;
      allCorrect = false;
    }
  });

  if (allCorrect && eventData.round === 1) {
    eventData.round = 2;
    shakespeareMessage.textContent = "";
    prepareShakespeareRound();
    renderShakespeareEvent();
    return;
  }

  if (allCorrect) {
    shakespeareMessage.textContent = "Correct.";
    gameState.currentShakespeareEvent = null;
    startTrinketRewardPhase();
    return;
  }

  takePuzzleDamage(4);
  renderStats();

  if (handlePlayerDeath()) {
    return;
  }

  shakespeareMessage.textContent = "";
  renderShakespeareEvent();
}
