/* ---------------- AUTHOR DATE EVENT ---------------- */

function buildAuthorDateEncounter(count = 4) {
  const selectedAuthors = pickRandomAuthors(count);
  const dateCards = shuffleArray(
    selectedAuthors.map((author) => ({
      authorId: author.id,
      label: `${author.birth}–${author.death}`
    }))
  );

  return {
    triviaType: "authorDate",
    authors: selectedAuthors,
    dateCards
  };
}

function startAuthorDateEvent(encounter = buildAuthorDateEncounter()) {
  const selectedAuthors = encounter.authors;
  const dateCards = encounter.dateCards;
  gameState.firstDraftUsedThisPuzzle = false;

  gameState.currentAuthorDateEvent = {
    authors: selectedAuthors.map((author) => ({
      ...author,
      locked: false,
      placedDate: null
    })),
    dateCards: dateCards.map((dateCard) => ({ ...dateCard }))
  };

  authorDateMessage.textContent = "";
  submitAuthorDateButton.disabled = false;

  showDialog({
    dialog: ["My perfect date is August 15th, 1456."],
    dialogImage: "images/libdate.png"
  });

  renderAuthorDateEvent();
  showSection("authorDate");
}

function pickRandomAuthors(count) {
  if (authorDatabase.length < count) {
    throw new Error(`Not enough authors. Need ${count}, but only found ${authorDatabase.length}.`);
  }

  const shuffledAuthors = shuffleArray([...authorDatabase]);
  return shuffledAuthors.slice(0, count);
}

function renderAuthorDateEvent() {
  authorMatchRows.innerHTML = "";
  datePool.innerHTML = "";

  gameState.currentAuthorDateEvent.authors.forEach((author) => {
    const row = document.createElement("div");
    row.classList.add("author-match-row");

    const name = document.createElement("div");
    name.classList.add("author-name");
    name.textContent = author.name;

    const dropZone = document.createElement("div");
    dropZone.classList.add("author-date-dropzone");
    dropZone.dataset.authorId = author.id;

    if (author.locked) {
      dropZone.classList.add("locked");
    }

    if (author.placedDate) {
      const card = createDateCard(author.placedDate);

      if (author.locked) {
        card.draggable = false;
        card.classList.add("locked");
      }

      dropZone.appendChild(card);
    } else {
      dropZone.textContent = "Drop dates here";
    }

    dropZone.addEventListener("dragover", handleDateDragOver);
    dropZone.addEventListener("drop", handleDateDropOnAuthor);

    row.appendChild(name);
    row.appendChild(dropZone);

    authorMatchRows.appendChild(row);
  });

  gameState.currentAuthorDateEvent.dateCards.forEach((dateCard) => {
    datePool.appendChild(createDateCard(dateCard));
  });

  datePool.addEventListener("dragover", handleDateDragOver);
  datePool.addEventListener("drop", handleDateDropOnPool);
}

function createDateCard(dateCard) {
  const card = document.createElement("div");
  card.classList.add("date-card");
  card.textContent = dateCard.label;
  card.draggable = true;
  card.dataset.authorId = dateCard.authorId;
  card.dataset.label = dateCard.label;

  card.addEventListener("dragstart", (event) => {
    event.dataTransfer.setData("text/plain", JSON.stringify(dateCard));
  });

  return card;
}

function handleDateDragOver(event) {
  event.preventDefault();
}

function handleDateDropOnAuthor(event) {
  event.preventDefault();

  const targetAuthorId = event.currentTarget.dataset.authorId;
  const targetAuthor = gameState.currentAuthorDateEvent.authors.find(
    (author) => author.id === targetAuthorId
  );

  if (!targetAuthor || targetAuthor.locked) {
    return;
  }

  const droppedCard = JSON.parse(event.dataTransfer.getData("text/plain"));

  // If this author already had a date, return it to the pool.
  if (targetAuthor.placedDate) {
    gameState.currentAuthorDateEvent.dateCards.push(targetAuthor.placedDate);
  }

  // Remove dropped card from pool or from another author's slot.
  removeDateCardFromCurrentLocation(droppedCard);

  targetAuthor.placedDate = droppedCard;

  renderAuthorDateEvent();
}

function handleDateDropOnPool(event) {
  event.preventDefault();

  const droppedCard = JSON.parse(event.dataTransfer.getData("text/plain"));

  const alreadyInPool = gameState.currentAuthorDateEvent.dateCards.some(
    (card) => card.authorId === droppedCard.authorId
  );

  if (!alreadyInPool) {
    gameState.currentAuthorDateEvent.dateCards.push(droppedCard);
  }

  gameState.currentAuthorDateEvent.authors.forEach((author) => {
    if (author.placedDate && author.placedDate.authorId === droppedCard.authorId && !author.locked) {
      author.placedDate = null;
    }
  });

  renderAuthorDateEvent();
}

function removeDateCardFromCurrentLocation(dateCard) {
  gameState.currentAuthorDateEvent.dateCards =
    gameState.currentAuthorDateEvent.dateCards.filter(
      (card) => card.authorId !== dateCard.authorId
    );

  gameState.currentAuthorDateEvent.authors.forEach((author) => {
    if (author.placedDate && author.placedDate.authorId === dateCard.authorId && !author.locked) {
      author.placedDate = null;
    }
  });
}

function submitAuthorDateAttempt() {
  const eventData = gameState.currentAuthorDateEvent;

  if (!eventData) {
    return;
  }

  const allRowsFilled = eventData.authors.every((author) => author.locked || author.placedDate);

  if (!allRowsFilled) {
    authorDateMessage.textContent = "Place all dates before submitting.";
    return;
  }

  let allCorrect = true;

  eventData.authors.forEach((author) => {
    if (author.locked) {
      return;
    }

    if (author.placedDate && author.placedDate.authorId === author.id) {
      author.locked = true;
    } else {
      if (author.placedDate) {
        eventData.dateCards.push(author.placedDate);
      }

      author.placedDate = null;
      allCorrect = false;
    }
  });

  if (allCorrect) {
    authorDateMessage.textContent = "Correct.";
    gameState.currentAuthorDateEvent = null;
    startTrinketRewardPhase();
    return;
  }

  takePuzzleDamage(4);
  renderStats();

  authorDateMessage.textContent = "";

  renderAuthorDateEvent();

  if (gameState.hp <= 0) {
    authorDateMessage.textContent = "You have run out of HP.";
    submitAuthorDateButton.disabled = true;
  }
}
