/* ---------------- REWARD SYSTEM ---------------- */

function startRewardPhase() {
  gameState.firstDraftUsedThisPuzzle = false;
  skipRewardButton.classList.remove("hidden");

  if (isCompletedPoemPuzzleReward()) {
    incrementBabelBagsForCompletedPoemPuzzle();
  }

  if (gameState.lastEventType === "merchant") {
    gameState.currentPuzzle = null;
    gameState.currentPuzzleMode = null;
    gameState.currentRewardOffers = generateTileOffers();
    gameState.rewardTilePurchased = false;

    tileOffersSection.classList.remove("hidden");
    setTileOfferCopy(false);
    goldRewardMessage.textContent = "The book cart creaks into view.";
    rewardMessage.textContent = "";

    renderStats();
    renderInventory();
    renderTileOffers();

    showSection("reward");
    return;
  }

  if (gameState.lastEventType === "rest") {
    const healAmount = gameState.restHealAmount || 0;

    gameState.hp = Math.min(gameState.maxHp, gameState.hp + healAmount);

    gameState.currentPuzzle = null;
    gameState.currentPuzzleMode = null;
    gameState.currentRewardOffers = [];
    gameState.rewardTilePurchased = false;
    gameState.restHealAmount = 0;

    tileOffersSection.classList.add("hidden");
    tileOfferContainer.innerHTML = "";
    goldRewardMessage.textContent = `You recovered ${healAmount} HP.`;
    rewardMessage.textContent = "";

    if (gameState.pendingReplyReward) {
      gameState.inventory.push({
        type: "trinket",
        trinketId: "reply"
      });

      rewardMessage.textContent = "You found 📄 Reply.";
    }

    gameState.pendingReplyReward = false;

    renderStats();
    renderInventory();

    showSection("reward");
    return;
  }

  if (
    gameState.lastEventType === "kjv" &&
    gameState.currentKjvDifficulty === "sundayBest"
  ) {
    gameState.currentKjvEncounter = null;
    gameState.currentKjvDifficulty = null;
    startTrinketRewardPhase();
    return;
  }

  if (gameState.lastEventType === "boss" && gameState.currentFloor >= 2) {
    gameState.currentPuzzle = null;
    gameState.currentPuzzleMode = null;
    gameState.currentRewardOffers = [];
    gameState.rewardTilePurchased = false;

    tileOffersSection.classList.add("hidden");
    tileOfferContainer.innerHTML = "";
    goldRewardMessage.textContent =
      "Thank you for playing this early release edition. More content to come soon.";
    rewardMessage.textContent = "";
    skipRewardButton.classList.add("hidden");

    renderStats();
    renderInventory();

    showSection("reward");
    return;
  }

  if (
    gameState.lastEventType === "kjv" &&
    gameState.currentKjvDifficulty === "hailMary"
  ) {
    const prophecy = getTrinketById("prophecy");

    gameState.currentKjvEncounter = null;
    gameState.currentKjvDifficulty = null;
    startTrinketRewardPhase(prophecy);
    return;
  }

  const tileOfferDiscount =
    gameState.lastEventType === "kjv" &&
    gameState.currentKjvDifficulty === "sundaySchool"
      ? 1
      : 0;

  let goldGain;

  if (gameState.lastEventType === "boss") {
    goldGain = Math.floor(Math.random() * 3) + 5; // 5-7
  } else if (
    gameState.lastEventType === "midPoem" ||
    gameState.lastEventType === "elite"
  ) {
    goldGain = Math.floor(Math.random() * 3) + 4; // 4-6
  } else {
    goldGain = Math.floor(Math.random() * 3) + 3; // 3-5
  }

  gameState.gold += goldGain;

  gameState.currentPuzzle = null;
  gameState.currentPuzzleMode = null;
  gameState.currentKjvEncounter = null;
  gameState.currentKjvDifficulty = null;
  gameState.currentRewardOffers =
    gameState.lastEventType === "boss"
      ? generateFreeTileOffers(4)
      : generateRewardTileOffers(tileOfferDiscount);
  gameState.rewardTilePurchased = false;
  tileOffersSection.classList.remove("hidden");
  setTileOfferCopy(gameState.lastEventType === "boss");
  goldRewardMessage.textContent = `You gained ${goldGain} gold.`;

  if (gameState.lastEventType === "elite" || gameState.lastEventType === "boss") {
    const artifactReward = getRandomArtifactReward();

    if (artifactReward) {
      gameState.inventory.push({
        type: "artifact",
        artifactId: artifactReward.id
      });

      renderInventory();
      rewardMessage.textContent = `You found an artifact: ${artifactReward.name}.`;
    } else {
      rewardMessage.textContent = "You found no new artifact.";
    }
  } else {
    rewardMessage.textContent = "";
  }

  renderStats();
  renderInventory();
  renderTileOffers();

  showSection("reward");
}

function generateRewardTileOffers(discount = 0) {
  if (isPoemReward()) {
    return generatePoemTileOffers(discount);
  }

  return generateTileOffers(discount);
}

function isPoemReward() {
  return (
    gameState.lastEventType === "poem" ||
    gameState.lastEventType === "midPoem" ||
    gameState.lastEventType === "elite"
  );
}

function isCompletedPoemPuzzleReward() {
  return (
    gameState.lastEventType === "poem" ||
    gameState.lastEventType === "midPoem" ||
    gameState.lastEventType === "elite" ||
    gameState.lastEventType === "boss"
  );
}

function generatePoemTileOffers(discount = 0) {
  return [
    ...generateSingleLetterTileOffers(2, discount),
    ...generateDoubleLetterTileOffers(2, discount)
  ];
}

function generateTileOffers(discount = 0) {
  return generateSingleLetterTileOffers(3, discount);
}

function generateSingleLetterTileOffers(count = 3, discount = 0) {
  const offers = [];

  while (offers.length < count) {
    const randomLetter = alphabet[Math.floor(Math.random() * alphabet.length)];

    if (!offers.includes(randomLetter)) {
      offers.push(randomLetter);
    }
  }

  return offers.map((letter) => ({
    letters: [letter],
    letter,
    tier: 1,
    cost: getBabelTileCost([letter], discount)
  }));
}

function generateDoubleLetterTileOffers(count = 2, discount = 0) {
  const offers = [];
  const seenPairKeys = new Set();

  while (offers.length < count) {
    const letters = getRandomTileLetterPair();
    const pairKey = [...letters].sort().join("|");

    if (seenPairKeys.has(pairKey)) {
      continue;
    }

    seenPairKeys.add(pairKey);
    offers.push({
      letters,
      letter: letters[0],
      tier: 2,
      cost: getBabelTileCost(letters, discount)
    });
  }

  return offers;
}

function getRandomTileLetterPair() {
  const firstLetter = alphabet[Math.floor(Math.random() * alphabet.length)];
  let secondLetter = alphabet[Math.floor(Math.random() * alphabet.length)];

  while (secondLetter === firstLetter) {
    secondLetter = alphabet[Math.floor(Math.random() * alphabet.length)];
  }

  return [firstLetter, secondLetter];
}

function generateFreeTileOffers(count = 3) {
  return generateSingleLetterTileOffers(count)
    .slice(0, count)
    .map((offer) => ({
      ...offer,
      cost: 0,
      free: true,
      claimed: false
    }));
}

function setTileOfferCopy(isBossReward) {
  if (isBossReward) {
    tileOfferTitle.textContent = "These letters just fell out of the poem.";
    tileOfferInstruction.textContent = "";
    return;
  }

  tileOfferTitle.textContent = "Optional Babel Tile Purchase";
  tileOfferInstruction.textContent =
    "You may buy one tile, or skip and save your gold.";
}

function renderTileOffers() {
  tileOfferContainer.innerHTML = "";

  gameState.currentRewardOffers.forEach((offer) => {
    const offerButton = document.createElement("button");
    offerButton.classList.add("tile-offer");
    const offerLabel = offer.letters ? offer.letters.join("|") : offer.letter;
    offerButton.textContent = offer.free
      ? offerLabel
      : `${offerLabel} — ${offer.cost} gold`;

    if (offer.claimed) {
      offerButton.disabled = true;
    } else if (!offer.free && gameState.rewardTilePurchased) {
      offerButton.disabled = true;
    } else if (!offer.free && gameState.gold < offer.cost) {
      offerButton.disabled = true;
    }

    offerButton.addEventListener("click", () => {
      buyRewardTile(offer);
    });

    tileOfferContainer.appendChild(offerButton);
  });
}

function buyRewardTile(offer) {
  if (offer.claimed || (!offer.free && gameState.rewardTilePurchased)) {
    return;
  }

  if (!offer.free && gameState.gold < offer.cost) {
    rewardMessage.textContent = "You don't have enough gold.";
    return;
  }

  if (!offer.free) {
    gameState.gold -= offer.cost;
  }

  const rewardTile = createBabelTile(offer.letters || offer.letter);

  gameState.inventory.push(rewardTile);

  if (offer.free) {
    offer.claimed = true;
  } else {
    gameState.rewardTilePurchased = true;
  }

  rewardMessage.textContent = offer.free
    ? `You claimed a ${getBabelTileLabel(rewardTile)} Babel Tile.`
    : `You bought a ${getBabelTileLabel(rewardTile)} Babel Tile.`;

  renderStats();
  renderInventory();
  renderTileOffers();
}

function endRewardPhase() {
  const completedBoss = gameState.lastEventType === "boss";

  gameState.currentRewardOffers = [];

  if (completedBoss) {
    startNextFloor();
    return;
  }

  completeCurrentMapNode();

  if (shouldShowEraserChoiceAfterReward()) {
    markEraserOfferedThisFloor();
    showEraserChoiceScreen();
    return;
  }

  renderGame();
  showSection("board");
}

function startEmptyRewardPhase() {
  gameState.currentLitcanonEvent = null;
  gameState.currentRewardOffers = [];
  gameState.rewardTilePurchased = false;

  tileOffersSection.classList.add("hidden");
  tileOfferContainer.innerHTML = "";
  goldRewardMessage.textContent = "";
  rewardMessage.textContent = "";
  skipRewardButton.classList.remove("hidden");

  renderStats();
  renderInventory();

  showSection("reward");
}

function startMerchantEvent() {
  startRewardPhase();
}


