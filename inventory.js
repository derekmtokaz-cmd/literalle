/* ---------------- STATS / INVENTORY ---------------- */

let displayedHp = null;
let hpAnimationFrame = null;

function renderStats() {
  renderHpDisplay();
  goldDisplay.textContent = gameState.gold;
}

function renderHpDisplay() {
  if (displayedHp === null) {
    displayedHp = gameState.hp;
    updateHpDisplay();
    return;
  }

  animateHpDisplay(gameState.hp);
}

function updateHpDisplay() {
  hpDisplay.textContent = `${displayedHp} / ${gameState.maxHp}`;
}

function animateHpDisplay(targetHp) {
  if (hpAnimationFrame !== null) {
    cancelAnimationFrame(hpAnimationFrame);
    hpAnimationFrame = null;
  }

  if (displayedHp === targetHp) {
    updateHpDisplay();
    return;
  }

  const startingHp = displayedHp;
  const hpDifference = targetHp - startingHp;
  const duration = Math.min(2000, Math.max(700, Math.abs(hpDifference) * 130));
  const startTime = performance.now();

  function tick(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    displayedHp = Math.round(startingHp + hpDifference * progress);
    updateHpDisplay();

    if (progress < 1) {
      hpAnimationFrame = requestAnimationFrame(tick);
      return;
    }

    displayedHp = targetHp;
    hpAnimationFrame = null;
    updateHpDisplay();
  }

  hpAnimationFrame = requestAnimationFrame(tick);
}

function renderInventory() {
  inventoryDisplay.innerHTML = "";

  if (gameState.inventory.length === 0) {
    inventoryDisplay.innerHTML = `<span class="empty-inventory">Empty</span>`;
    return;
  }

  const regularItems = gameState.inventory.filter((item) => item.type !== "artifact");
  const artifacts = gameState.inventory.filter((item) => item.type === "artifact");

  regularItems.forEach((item) => {
    const index = gameState.inventory.indexOf(item);
    renderInventoryItem(item, index);
  });

  if (artifacts.length > 0) {
    const lineBreak = document.createElement("div");
    lineBreak.classList.add("inventory-line-break");
    inventoryDisplay.appendChild(lineBreak);

    artifacts.forEach((item) => {
      const index = gameState.inventory.indexOf(item);
      renderInventoryItem(item, index);
    });
  }
}

function renderInventoryItem(item, index) {
  const itemButton = document.createElement("button");
  itemButton.classList.add("inventory-tile");

  if (item.type === "babelTile") {
    itemButton.textContent = item.letter;
    itemButton.disabled = gameState.currentPuzzleMode !== "event";

    itemButton.addEventListener("click", () => {
      useBabelTile(index);
    });
  }

  if (item.type === "trinket") {
    const trinket = getTrinketById(item.trinketId);

    itemButton.textContent = trinket ? trinket.icon : "?";
    itemButton.disabled = !canUseTrinket(item);

    itemButton.addEventListener("click", () => {
      useTrinket(index);
    });
  }

  if (item.type === "artifact") {
    const artifact = getArtifactById(item.artifactId);

    itemButton.textContent = artifact ? artifact.icon : "?";

    const isEchoTile = item.artifactId === "echo_tile";
    const isPenNib = item.artifactId === "pen_nib";
    const isFirstDraft = item.artifactId === "first_draft";

    let canUse = false;

    if (isEchoTile) {
      const hasBabelTiles = gameState.inventory.some((inventoryItem) => {
        return inventoryItem.type === "babelTile";
      });

      const inPoemPuzzle = gameState.currentPuzzle !== null;

      canUse =
        inPoemPuzzle &&
        !gameState.echoTileUsedThisPuzzle &&
        hasBabelTiles;
    }

    if (isPenNib) {
      const inPoemPuzzle =
        gameState.currentPuzzleMode === "event" &&
        gameState.currentPuzzle !== null;

      const hasBlankLetters =
        inPoemPuzzle &&
        gameState.currentPuzzle.selectedWords.some((word) =>
          word.letters.some((letter) => !letter.locked)
        );

      canUse =
        inPoemPuzzle &&
        !gameState.penNibUsedThisPuzzle &&
        hasBlankLetters;
    }

    if (isFirstDraft) {
      itemButton.type = "button";

      if (gameState.firstDraftUsedThisPuzzle) {
        itemButton.classList.add("spent");
      }
    } else {
      itemButton.disabled = !canUse;
    }

    if (canUse) {
      itemButton.addEventListener("click", () => {
        if (isEchoTile) {
          useEchoTile();
        }

        if (isPenNib) {
          usePenNib();
        }
      });
    }
  }

  itemButton.addEventListener("mouseenter", (event) => {
    showInventoryTooltip(event, item);
  });

  itemButton.addEventListener("mousemove", (event) => {
    positionInventoryTooltip(event);
  });

  itemButton.addEventListener("mouseleave", () => {
    hideInventoryTooltip();
  });

  inventoryDisplay.appendChild(itemButton);
}

function showInventoryTooltip(event, item) {
  if (item.type === "babelTile") {
    inventoryTooltip.innerHTML = `
      <strong>Babel Tile: ${item.letter}</strong><br>
      Spend this Babel Tile to reveal all ${item.letter}s in the current poem puzzle.
    `;
  }

  if (item.type === "trinket") {
    const trinket = getTrinketById(item.trinketId);

    inventoryTooltip.innerHTML = `
      <strong>${trinket.icon} ${trinket.name}</strong><br>
      ${trinket.description}
    `;
  }

  if (item.type === "artifact") {
    const artifact = getArtifactById(item.artifactId);

    inventoryTooltip.innerHTML = `
      <strong>${artifact ? artifact.icon : "?"} ${artifact ? artifact.name : "Artifact"}</strong><br>
      ${artifact ? artifact.description : ""}
    `;
  }

  inventoryTooltip.classList.remove("hidden");
  positionInventoryTooltip(event);
}

function getRandomArtifactReward() {
  const artifactIds = [
    "echo_tile",
    "pen_nib",
    "first_draft"
  ];

  const ownedArtifactIds = gameState.inventory
    .filter((item) => item.type === "artifact")
    .map((item) => item.artifactId);

  const availableArtifactIds = artifactIds.filter((id) => {
    return !ownedArtifactIds.includes(id);
  });

  if (availableArtifactIds.length === 0) {
    return null;
  }

  const randomIndex = Math.floor(Math.random() * availableArtifactIds.length);
  const artifactId = availableArtifactIds[randomIndex];

  return getArtifactById(artifactId);
}

/* ---------------- TRINKETS ---------------- */

function getTrinketById(trinketId) {
  return TRINKETS.find((trinket) => trinket.id === trinketId);
}

function getRandomTrinket() {
  const randomTrinkets = TRINKETS.filter((trinket) => {
    return trinket.id !== "prophecy" && trinket.id !== "reply";
  });
  const randomIndex = Math.floor(Math.random() * randomTrinkets.length);
  return randomTrinkets[randomIndex];
}

function canUseTrinket(item) {
  if (item.type !== "trinket") {
    return false;
  }

  if (item.trinketId === "leakyPen" || item.trinketId === "stickyNote") {
    return gameState.currentPuzzleMode === "event" && gameState.currentPuzzle;
  }

  if (item.trinketId === "prophecy") {
    return (
      isMapScreenVisible() &&
      !gameState.prophecyUsedThisFloor &&
      getNextProphecyPoemNode() !== null
    );
  }

  if (item.trinketId === "reply") {
    return true;
  }

  return false;
}

function useTrinket(itemIndex) {
  const item = gameState.inventory[itemIndex];

  if (!item || item.type !== "trinket") {
    return;
  }

  if (item.trinketId === "leakyPen") {
    useLeakyPen(itemIndex);
  }

  if (item.trinketId === "stickyNote") {
    useStickyNote(itemIndex);
  }

  if (item.trinketId === "prophecy") {
    useProphecy();
  }

  if (item.trinketId === "reply") {
    useReply(itemIndex);
  }
}

function useLeakyPen(itemIndex) {
  if (gameState.currentPuzzleMode !== "event" || !gameState.currentPuzzle) {
    return;
  }

  hideInventoryTooltip();

  const hiddenLetters = [];

  gameState.currentPuzzle.selectedWords.forEach((word) => {
    word.letters.forEach((letter) => {
      if (!letter.locked) {
        hiddenLetters.push(letter);
      }
    });
  });

  if (hiddenLetters.length === 0) {
    showPuzzleMessage("There are no blank letters for the Leaky Pen to fill.");
    return;
  }

  const shuffledLetters = shuffleArray(hiddenLetters);
  const lettersToReveal = shuffledLetters.slice(0, 3);

  lettersToReveal.forEach((letter) => {
    letter.value = letter.answerChar;
    letter.locked = true;
  });

  gameState.inventory.splice(itemIndex, 1);

  renderInventory();
  rerenderCurrentPuzzle();
  focusFirstOpenSlot();

  showPuzzleMessage(`The Leaky Pen filled in ${lettersToReveal.length} letters.`);
}

function useStickyNote(itemIndex) {
  if (gameState.currentPuzzleMode !== "event" || !gameState.currentPuzzle) {
    return;
  }

  hideInventoryTooltip();

  const scrabbleValues = {
    A: 1,
    B: 3,
    C: 3,
    D: 2,
    E: 1,
    F: 4,
    G: 2,
    H: 4,
    I: 1,
    J: 8,
    K: 5,
    L: 1,
    M: 3,
    N: 1,
    O: 1,
    P: 3,
    Q: 10,
    R: 1,
    S: 1,
    T: 1,
    U: 1,
    V: 4,
    W: 4,
    X: 8,
    Y: 4,
    Z: 10
  };

  const missingLetterCounts = {};

  gameState.currentPuzzle.selectedWords.forEach((word) => {
    word.letters.forEach((letter) => {
      if (!letter.locked) {
        const answerChar = letter.answerChar.toUpperCase();

        if (!missingLetterCounts[answerChar]) {
          missingLetterCounts[answerChar] = 0;
        }

        missingLetterCounts[answerChar] += 1;
      }
    });
  });

  const missingLetters = Object.keys(missingLetterCounts);

  if (missingLetters.length === 0) {
    showPuzzleMessage("There are no missing letters for the Sticky Note to identify.");
    return;
  }

  let bestLetter = missingLetters[0];
  let bestScore = missingLetterCounts[bestLetter] * scrabbleValues[bestLetter];

  missingLetters.forEach((letter) => {
    const score = missingLetterCounts[letter] * scrabbleValues[letter];

    if (score > bestScore) {
      bestLetter = letter;
      bestScore = score;
    }
  });

  gameState.inventory.splice(itemIndex, 1);

  renderInventory();

  stickyNoteDisplay.innerHTML = `Call me.<br>- ${bestLetter}`;
  stickyNoteDisplay.classList.remove("hidden");
}

function getNextProphecyPoemNode() {
  const availableNodes = gameState.availableNodeIds
    .map((nodeId) => getMapNodeById(nodeId))
    .filter((node) => node !== null);

  return (
    availableNodes.find((node) => {
      return (
        node.type === "poem" &&
        node.encounter &&
        node.encounter.poem
      );
    }) || null
  );
}

function isMapScreenVisible() {
  return !boardSection.classList.contains("hidden");
}

function useProphecy() {
  const nextPoemNode = getNextProphecyPoemNode();

  if (!isMapScreenVisible() || !nextPoemNode) {
    return;
  }

  hideInventoryTooltip();

  const poem = nextPoemNode.encounter.poem;

  prophecyTitle.textContent = poem.title;
  prophecyMeta.textContent = poem.author;
  prophecyPoemText.innerHTML = "";

  poem.lines.forEach((line) => {
    const lineElement = document.createElement("div");
    lineElement.classList.add("prophecy-poem-line");
    lineElement.textContent = line;
    prophecyPoemText.appendChild(lineElement);
  });

  gameState.prophecyUsedThisFloor = true;
  prophecyModal.classList.remove("hidden");
  renderInventory();
}

function closeProphecyModal() {
  prophecyModal.classList.add("hidden");
}

function useReply(itemIndex) {
  hideInventoryTooltip();

  prophecyTitle.textContent = "Reply";
  prophecyMeta.textContent = "(crumped on her desk)";
  prophecyPoemText.innerHTML = "";

  const replyLines = [
"Dear Bill: I've made a",
"couple of sandwiches for you.",
"In the ice-box you'll find",
"blue-berries--a cup of grapefruit",
"a glass of cold coffee.",
"",
"On the stove is the tea-pot",
"with enough tea leaves",
"for you to make tea if you",
"prefer--Just light the gas--",
"boil the water and put it in the tea",
"",
"Plenty of bread in the bread-box",
"and butter and eggs--",
"I didn't know just what to",
"make for you. Several people",
"called up about office hours--",
"",
"See you later. Love. Floss.",
"",
"Please switch off the telephone."
  ];

  replyLines.forEach((line) => {
    const lineElement = document.createElement("div");
    lineElement.classList.add("prophecy-poem-line");

    if (line === "") {
      lineElement.classList.add("stanza-break");
    }

    lineElement.textContent = line;
    prophecyPoemText.appendChild(lineElement);
  });

  gameState.inventory.splice(itemIndex, 1);
  prophecyModal.classList.remove("hidden");
  renderInventory();
}

function startTrinketRewardPhase(trinket = getRandomTrinket()) {

  gameState.currentPuzzle = null;
  gameState.currentPuzzleMode = null;
  gameState.firstDraftUsedThisPuzzle = false;
  gameState.currentRewardOffers = [];
  gameState.rewardTilePurchased = false;

  gameState.inventory.push({
    type: "trinket",
    trinketId: trinket.id
  });

  goldRewardMessage.textContent = `You found ${trinket.icon} ${trinket.name}.`;
  rewardMessage.textContent = "";

  tileOfferContainer.innerHTML = "";
  tileOffersSection.classList.add("hidden");

  renderStats();
  renderInventory();

  showSection("reward");
}
function positionInventoryTooltip(event) {
  const offset = 14;

  inventoryTooltip.style.left = `${event.clientX + offset}px`;
  inventoryTooltip.style.top = `${event.clientY + offset}px`;
}

function hideInventoryTooltip() {
  inventoryTooltip.classList.add("hidden");
}
