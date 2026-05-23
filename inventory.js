/* ---------------- STATS / INVENTORY ---------------- */

let displayedHp = null;
let hpAnimationFrame = null;
const hpPoemText =
  "The art of losing isn't hard to master;\n" +
  "so many things seem filled with the intent\n" +
  "to be lost that their loss is no disaster.";

function renderStats() {
  renderHpDisplay();
}

function renderHpDisplay() {
  if (displayedHp === null) {
    displayedHp = gameState.hp;
    updateHpDisplay();
    return;
  }

  animateHpDisplay(gameState.hp);
}

function resetDisplayedHp() {
  if (hpAnimationFrame !== null) {
    cancelAnimationFrame(hpAnimationFrame);
    hpAnimationFrame = null;
  }

  displayedHp = gameState.hp;
  updateHpDisplay();
}

function updateHpDisplay() {
  const redLetterCount = Math.max(0, gameState.maxHp - displayedHp);
  let eligibleLetterIndex = 0;
  let precedingLetterLost = false;

  hpDisplay.innerHTML = "";

  hpPoemText.split("\n").forEach((line) => {
    const lineElement = document.createElement("div");
    lineElement.classList.add("hp-poem-line");

    [...line].forEach((character) => {
      const characterElement = document.createElement("span");
      characterElement.textContent = character;

      if (/[A-Za-z]/.test(character)) {
        precedingLetterLost = eligibleLetterIndex < redLetterCount;

        if (precedingLetterLost) {
          characterElement.classList.add("hp-poem-lost");
        }

        eligibleLetterIndex += 1;
      } else if (!/\s/.test(character) && precedingLetterLost) {
        characterElement.classList.add("hp-poem-lost");
      }

      lineElement.appendChild(characterElement);
    });

    hpDisplay.appendChild(lineElement);
  });
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
  renderInkInventoryTile();

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

function renderInkInventoryTile() {
  const inkTile = document.createElement("button");
  const inkIcon = document.createElement("img");
  const inkCount = document.createElement("span");

  inkTile.type = "button";
  inkTile.classList.add("inventory-tile", "inventory-ink-tile");
  inkTile.setAttribute("role", "img");
  inkTile.setAttribute("aria-label", `Ink: ${gameState.ink}`);
  inkTile.setAttribute("aria-disabled", "true");

  inkIcon.classList.add("inventory-ink-icon");
  inkIcon.src = "assets/layout/ink%20icon.png";
  inkIcon.alt = "";
  inkCount.classList.add("inventory-ink-count");
  inkCount.textContent = gameState.ink;

  inkTile.appendChild(inkIcon);
  inkTile.appendChild(inkCount);

  inkTile.addEventListener("click", (event) => {
    event.preventDefault();
  });

  inkTile.addEventListener("mouseenter", (event) => {
    showInkTooltip(event);
  });

  inkTile.addEventListener("mousemove", (event) => {
    positionInventoryTooltip(event);
  });

  inkTile.addEventListener("mouseleave", () => {
    hideInventoryTooltip();
  });

  inventoryDisplay.appendChild(inkTile);
}

function renderInventoryItem(item, index) {
  const itemButton = document.createElement("button");
  itemButton.classList.add("inventory-tile");

  if (isBabelTile(item)) {
    itemButton.classList.add("inventory-babel-tile");
    if (isWordBabelTile(item)) {
      itemButton.classList.add("word-babel-tile");
      renderNoteToSelfTile(itemButton, item);
    } else {
      itemButton.textContent = getBabelTileLabel(item);
    }
    itemButton.disabled =
      gameState.currentPuzzleMode !== "event" ||
      isLineOrderCurrentPuzzle() ||
      isPhasedPuzzleAwaitingContinue();

    itemButton.addEventListener("click", () => {
      useBabelTile(index);
    });
  }

  if (item.type === "trinket") {
    const trinket = getTrinketById(item.trinketId);

    itemButton.classList.add("inventory-trinket-tile");

    if (item.trinketId === "easyA") {
      itemButton.classList.add("easy-a-trinket");
    }

    renderInventoryItemIcon(itemButton, trinket);

    if (item.trinketId === "babelBag") {
      const babelBagCount = document.createElement("span");
      babelBagCount.classList.add("inventory-item-count");
      babelBagCount.textContent = getBabelBagTileCount(item);
      itemButton.appendChild(babelBagCount);
    }

    itemButton.disabled = !canUseTrinket(item);

    itemButton.addEventListener("click", () => {
      useTrinket(index);
    });
  }

  if (item.type === "artifact") {
    const artifact = getArtifactById(item.artifactId);

    itemButton.classList.add("inventory-artifact-tile");

    renderInventoryItemIcon(itemButton, artifact);

    const isEchoTile = item.artifactId === "echo_tile";
    const isPenNib = item.artifactId === "pen_nib";
    const isFirstDraft = item.artifactId === "first_draft";

    let canUse = false;

    if (isEchoTile) {
      const hasBabelTiles = gameState.inventory.some((inventoryItem) => {
        return isBabelTileEchoEligible(inventoryItem);
      });

      const inPoemPuzzle =
        gameState.currentPuzzle !== null &&
        !isLineOrderCurrentPuzzle() &&
        !isPhasedPuzzleAwaitingContinue();

      canUse =
        inPoemPuzzle &&
        !gameState.echoTileUsedThisPuzzle &&
        hasBabelTiles;
    }

    if (isPenNib) {
      const inPoemPuzzle =
        gameState.currentPuzzleMode === "event" &&
        gameState.currentPuzzle !== null &&
        !isLineOrderCurrentPuzzle() &&
        !isPhasedPuzzleAwaitingContinue();

      const hasBlankLetters =
        inPoemPuzzle &&
        gameState.currentPuzzle.selectedWords &&
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

function renderNoteToSelfTile(itemButton, item) {
  const iconImage = document.createElement("img");
  iconImage.classList.add("inventory-note-to-self-icon");
  iconImage.src = "assets/layout/note%20to%20self%20icon.png";
  iconImage.alt = "";
  itemButton.appendChild(iconImage);

  const firstLetter = document.createElement("span");
  firstLetter.classList.add("inventory-note-to-self-letter");
  firstLetter.textContent = getNoteToSelfDisplayLetter(item);
  itemButton.appendChild(firstLetter);
}

function getNoteToSelfDisplayLetter(item) {
  const label = getBabelTileLabel(item).trim();
  return label ? label[0].toUpperCase() : "?";
}

function renderInventoryItemIcon(itemButton, itemDefinition) {
  if (itemDefinition?.iconImage) {
    const iconImage = document.createElement("img");
    iconImage.classList.add("inventory-item-icon");
    iconImage.src = itemDefinition.iconImage;
    iconImage.alt = "";
    itemButton.appendChild(iconImage);
    return;
  }

  itemButton.textContent = itemDefinition ? itemDefinition.icon : "?";
}

function setRewardMessageWithItemIcon(messageElement, itemDefinition, messageText) {
  messageElement.innerHTML = "";

  if (itemDefinition?.iconImage) {
    const iconImage = document.createElement("img");
    iconImage.classList.add("reward-item-icon");
    iconImage.src = itemDefinition.iconImage;
    iconImage.alt = "";
    messageElement.appendChild(iconImage);
  } else if (itemDefinition?.icon) {
    const fallbackIcon = document.createElement("span");
    fallbackIcon.classList.add("reward-item-icon-fallback");
    fallbackIcon.textContent = itemDefinition.icon;
    messageElement.appendChild(fallbackIcon);
  }

  const textElement = document.createElement("span");
  textElement.textContent = messageText;
  messageElement.appendChild(textElement);
}

function showInventoryTooltip(event, item) {
  if (isBabelTile(item)) {
    const tileLabel = getBabelTileLabel(item);
    const safeTileLabel = escapeInventoryTooltipText(tileLabel);

    inventoryTooltip.innerHTML = isWordBabelTile(item)
      ? `
        <strong>Note to self</strong><br>
        Spend this Note to self to reveal all letters from "${safeTileLabel}" in the current poem puzzle.
      `
      : `
        <strong>Babel Tile: ${safeTileLabel}</strong><br>
        Spend this Babel Tile to reveal all matching ${getBabelTileLetterList(item)} in the current poem puzzle.
      `;
  }

  if (item.type === "trinket") {
    const trinket = getTrinketById(item.trinketId);
    const extraDescription =
      item.trinketId === "babelBag"
        ? `<br>Currently holds ${getBabelBagTileCount(item)} hidden Babel Tile${getBabelBagTileCount(item) === 1 ? "" : "s"}.`
        : "";

    inventoryTooltip.innerHTML = `
      <strong>${trinket.name}</strong><br>
      ${trinket.description}${extraDescription}
    `;
  }

  if (item.type === "artifact") {
    const artifact = getArtifactById(item.artifactId);

    inventoryTooltip.innerHTML = `
      <strong>${artifact ? artifact.name : "Artifact"}</strong><br>
      ${artifact ? artifact.description : ""}
    `;
  }

  inventoryTooltip.classList.remove("hidden");
  positionInventoryTooltip(event);
}

function showInkTooltip(event) {
  inventoryTooltip.innerHTML = `
    <strong>Ink</strong><br>
    Spend ink to buy rewards.
  `;
  inventoryTooltip.classList.remove("hidden");
  positionInventoryTooltip(event);
}

function escapeInventoryTooltipText(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
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
    return (
      gameState.currentPuzzleMode === "event" &&
      gameState.currentPuzzle &&
      !isLineOrderCurrentPuzzle() &&
      !isPhasedPuzzleAwaitingContinue()
    );
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

  if (item.trinketId === "babelBag") {
    return getBabelBagTileCount(item) > 0;
  }

  if (item.trinketId === "easyA") {
    return isMapScreenVisible() && getNextEasyAPoemNode() !== null;
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

  if (item.trinketId === "babelBag") {
    useBabelBag(itemIndex);
  }

  if (item.trinketId === "easyA") {
    useEasyA(itemIndex);
  }
}

function useLeakyPen(itemIndex) {
  if (
    gameState.currentPuzzleMode !== "event" ||
    !gameState.currentPuzzle ||
    isLineOrderCurrentPuzzle() ||
    isPhasedPuzzleAwaitingContinue()
  ) {
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
  if (
    gameState.currentPuzzleMode !== "event" ||
    !gameState.currentPuzzle ||
    isLineOrderCurrentPuzzle() ||
    isPhasedPuzzleAwaitingContinue()
  ) {
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

  const bestLetters = missingLetters
    .map((letter, index) => {
      return {
        letter,
        index,
        score: missingLetterCounts[letter] * scrabbleValues[letter]
      };
    })
    .sort((firstLetter, secondLetter) => {
      if (secondLetter.score !== firstLetter.score) {
        return secondLetter.score - firstLetter.score;
      }

      return firstLetter.index - secondLetter.index;
    })
    .slice(0, 2)
    .map((rankedLetter) => `${rankedLetter.letter}.`)
    .join(" ");

  gameState.inventory.splice(itemIndex, 1);

  renderInventory();

  stickyNoteDisplay.innerHTML = `Call me.<br>- ${bestLetters}`;
  stickyNoteDisplay.classList.remove("hidden");
  positionStickyNoteDisplay();
}

function positionStickyNoteDisplay() {
  if (
    !poemContainer ||
    !stickyNoteDisplay ||
    stickyNoteDisplay.classList.contains("hidden")
  ) {
    return;
  }

  const stickyNoteGap = 12;

  stickyNoteDisplay.style.left = `${poemContainer.offsetLeft}px`;
  stickyNoteDisplay.style.top = `${poemContainer.offsetTop + poemContainer.offsetHeight + stickyNoteGap}px`;
}

function initializeStickyNotePositioning() {
  if (!poemContainer || !stickyNoteDisplay) {
    return;
  }

  const repositionStickyNote = () => {
    positionStickyNoteDisplay();
  };
  const stickyNoteObserver = new MutationObserver(repositionStickyNote);
  const poemObserver = new MutationObserver(repositionStickyNote);

  stickyNoteObserver.observe(stickyNoteDisplay, {
    attributes: true,
    attributeFilter: ["class"],
    childList: true,
    subtree: true
  });

  poemObserver.observe(poemContainer, {
    childList: true,
    subtree: true
  });

  window.addEventListener("resize", repositionStickyNote);
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

function getNextEasyAPoemNode() {
  const availableNodes = gameState.availableNodeIds
    .map((nodeId) => getMapNodeById(nodeId))
    .filter((node) => node !== null);

  return (
    availableNodes.find((node) => {
      return (
        isEasyATargetPoemNode(node) &&
        getNextEasyAMissingWord(node.encounter.poemEvent) !== null
      );
    }) || null
  );
}

function isEasyATargetPoemNode(node) {
  return (
    (node.id === "poem-4" || node.id === "poem-5" || node.type === "boss") &&
    node.encounter &&
    node.encounter.poemEvent &&
    (
      Array.isArray(node.encounter.poemEvent.missingWords) ||
      Array.isArray(node.encounter.poemEvent.phases)
    )
  );
}

function getNextEasyAMissingWord(poemEvent) {
  if (!poemEvent) {
    return null;
  }

  const prefilledWordKeys = new Set(
    (poemEvent.easyAPrefilledWords || []).map((word) => getMissingWordKey(word))
  );

  if (poemEvent.puzzleType === "phasedMissingWords" && Array.isArray(poemEvent.phases)) {
    const phasedMissingWords = poemEvent.phases
      .flatMap((phase) => phase.missingWords || [])
      .filter((missingWord) => {
        return !prefilledWordKeys.has(getMissingWordKey(missingWord));
      })
      .sort((firstWord, secondWord) => {
        if (firstWord.lineIndex !== secondWord.lineIndex) {
          return firstWord.lineIndex - secondWord.lineIndex;
        }

        return firstWord.wordIndex - secondWord.wordIndex;
      });

    return phasedMissingWords[0] || null;
  }

  if (!Array.isArray(poemEvent.missingWords)) {
    return null;
  }

  const activeMissingWords = poemEvent.missingWords
    .filter((missingWord) => {
      return !prefilledWordKeys.has(getMissingWordKey(missingWord));
    })
    .sort((firstWord, secondWord) => {
      if (firstWord.lineIndex !== secondWord.lineIndex) {
        return firstWord.lineIndex - secondWord.lineIndex;
      }

      return firstWord.wordIndex - secondWord.wordIndex;
    });

  return activeMissingWords[activeMissingWords.length - 1] || null;
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

function getBabelBagTileCount(item) {
  return item && Number.isInteger(item.babelTileCount)
    ? item.babelTileCount
    : 0;
}

function incrementBabelBagsForCompletedPoemPuzzle() {
  gameState.inventory.forEach((item) => {
    if (item.type === "trinket" && item.trinketId === "babelBag") {
      item.babelTileCount = getBabelBagTileCount(item) + 1;
    }
  });
}

function useBabelBag(itemIndex) {
  const item = gameState.inventory[itemIndex];
  const tileCount = getBabelBagTileCount(item);

  if (!item || item.trinketId !== "babelBag" || tileCount <= 0) {
    return;
  }

  hideInventoryTooltip();

  const newTiles = [];

  for (let i = 0; i < tileCount; i += 1) {
    const randomLetter = alphabet[Math.floor(Math.random() * alphabet.length)];
    newTiles.push(createBabelTile(randomLetter));
  }

  gameState.inventory.splice(itemIndex, 1, ...newTiles);
  renderInventory();
}

function useEasyA(itemIndex) {
  const targetNode = getNextEasyAPoemNode();

  if (!isMapScreenVisible() || !targetNode) {
    return;
  }

  const poemEvent = targetNode.encounter.poemEvent;
  const missingWord = getNextEasyAMissingWord(poemEvent);

  if (!missingWord) {
    return;
  }

  hideInventoryTooltip();

  if (!Array.isArray(poemEvent.easyAPrefilledWords)) {
    poemEvent.easyAPrefilledWords = [];
  }

  poemEvent.easyAPrefilledWords.push({
    lineIndex: missingWord.lineIndex,
    wordIndex: missingWord.wordIndex
  });

  gameState.inventory.splice(itemIndex, 1);
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
    trinketId: trinket.id,
    ...(trinket.id === "babelBag" ? { babelTileCount: 0 } : {})
  });

  setRewardMessageWithItemIcon(
    inkRewardMessage,
    trinket,
    `You found ${trinket.name}.`
  );
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
