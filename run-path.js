/* ---------------- EVENT START ---------------- */
function startMapNode(nodeId) {
  if (!gameState.developerMode && !gameState.availableNodeIds.includes(nodeId)) {
    return;
  }

  const nextSpace = getMapNodeById(nodeId);

  if (!nextSpace) {
    return;
  }

  gameState.currentNodeId = nodeId;
  if (!gameState.developerMode) {
    gameState.availableNodeIds = [];
  }

  renderBoard();

  if (nextSpace.type === "trivia") {
    gameState.lastEventType = "trivia";

    const type = nextSpace.encounter?.triviaType;

    if (type === "authorDate") return startAuthorDateEvent(nextSpace.encounter);
    if (type === "detective") return startDetectiveEvent(nextSpace.encounter);
    if (type === "fanfic") return startFanficEvent(nextSpace.encounter);

    return startFanficEvent(nextSpace.encounter);
  }

  if (nextSpace.type === "rest") {
    gameState.lastEventType = "rest";
    gameState.currentPuzzleMode = "rest";
    return startPoemEvent(nextSpace.encounter.poemEvent);
  }

  if (nextSpace.type === "poem" || nextSpace.type === "elite" || nextSpace.type === "boss") {
    gameState.lastEventType =
      nextSpace.id === "poem-4" || nextSpace.id === "poem-5"
        ? "midPoem"
        : nextSpace.type;
    return startPoemEvent(nextSpace.encounter.poemEvent);
  }

  if (nextSpace.type === "merchant") {
    gameState.lastEventType = "merchant";
    return startMerchantEvent();
  }

  if (nextSpace.type === "kjv") {
    gameState.lastEventType = "kjv";
    return startKjvEvent(nextSpace.encounter);
  }

  if (nextSpace.type === "phonetic") {
    gameState.lastEventType = "phonetic";
    return startPhoneticEvent(nextSpace.encounter);
  }

  if (nextSpace.type === "litcanon") {
    gameState.lastEventType = "litcanon";
    return startLitcanonEvent(nextSpace.encounter);
  }

  gameState.lastEventType = nextSpace.type;

  eventTitle.textContent = nextSpace.type.toUpperCase();
  eventMeta.textContent = "";
  poemContainer.innerHTML = "";
  eventMessage.textContent = `${nextSpace.type} space is not built yet.`;

  showSection("event");
}

function completeCurrentMapNode() {
  const currentNode = getMapNodeById(gameState.currentNodeId);

  if (!currentNode) {
    return;
  }

  if (!gameState.completedNodeIds.includes(currentNode.id)) {
    gameState.completedNodeIds.push(currentNode.id);
  }

  gameState.availableNodeIds = currentNode.connections.filter((nodeId) => {
    return !gameState.completedNodeIds.includes(nodeId);
  });
}

function getRandomPoem() {
  let eligiblePoems = poemDatabase.filter((poem) => {
    return !gameState.usedPoemIds.includes(poem.id);
  });

  if (eligiblePoems.length === 0) {
    // If we run out of unused poems, allow repeats rather than crashing.
    eligiblePoems = poemDatabase;
  }

  if (eligiblePoems.length === 0) {
    throw new Error("No poems found.");
  }

  const randomIndex = Math.floor(Math.random() * eligiblePoems.length);
  const selectedPoem = eligiblePoems[randomIndex];

  if (selectedPoem.id && !gameState.usedPoemIds.includes(selectedPoem.id)) {
    gameState.usedPoemIds.push(selectedPoem.id);
  }

  return selectedPoem;
}

function getRandomRestPoem() {
  if (restPoemDatabase.length === 0) {
    throw new Error("No rest poems found.");
  }

  const randomIndex = Math.floor(Math.random() * restPoemDatabase.length);
  return restPoemDatabase[randomIndex];
}

/* ---------------- START ---------------- */
function resolveOptionNodes() {
  const option1Special = gameState.runPath.find((space) => {
    return space.type === "option1Special";
  });
  const option2Special = gameState.runPath.find((space) => {
    return space.type === "option2Special";
  });

  if (!option1Special || !option2Special) {
    return;
  }

  const specialEventTypes = getSpecialEventTypesForCurrentFloor();
  const option1Type = getRandomItem(specialEventTypes);
  const option2Type = getRandomItem(
    specialEventTypes.filter((type) => type !== option1Type)
  );

  applyResolvedOptionType(option1Special, option1Type);
  applyResolvedOptionType(option2Special, option2Type);
}

function getSpecialEventTypesForCurrentFloor() {
  if (gameState.currentFloor >= 2) {
    return ["phonetic", "litcanon"];
  }

  return ["phonetic", "kjv"];
}

function applyResolvedOptionType(space, type) {
  space.type = type;
  space.icon = getMapIconForType(type);
}

function getRandomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function getMapIconForType(type) {
  if (type === "trivia") {
    return "?";
  }

  if (type === "phonetic") {
    return "fə";
  }

  if (type === "kjv") {
    return "KJV";
  }

  if (type === "litcanon") {
    return "Lit";
  }

  return "";
}

function buildPoemSeedPlan() {
  if (poemDatabase.length < 3) {
    throw new Error(`Not enough poems. Need 3, but only found ${poemDatabase.length}.`);
  }

  const previousFloorPoemIds = getPreviousFloorPoemSeedIds();
  let eligiblePoems = poemDatabase.filter((poem) => {
    return !previousFloorPoemIds.includes(poem.id);
  });

  if (eligiblePoems.length < 3) {
    eligiblePoems = poemDatabase;
  }

  const openingPoems = shuffleArray([...eligiblePoems]).slice(0, 3);
  const laterPoems = shuffleArray([...openingPoems]).slice(0, 2);
  const bossPoem = getRandomItem(laterPoems);

  return {
    openingPoems,
    laterPoems,
    bossPoem
  };
}

function getPreviousFloorPoemSeedIds() {
  return Object.entries(gameState.floorPoemSeedIdsByFloor)
    .filter(([floorNumber]) => Number(floorNumber) < gameState.currentFloor)
    .flatMap(([, poemIds]) => poemIds);
}

function recordFloorPoemSeedPlan(poemSeedPlan) {
  gameState.floorPoemSeedIdsByFloor[gameState.currentFloor] =
    poemSeedPlan.openingPoems.map((poem) => poem.id);
}

function getSeededPoemForNode(nodeId, poemSeedPlan) {
  const openingPoemIndexes = {
    "poem-1": 0,
    "poem-2": 1,
    "poem-3": 2
  };

  const laterPoemIndexes = {
    "poem-4": 0,
    "poem-5": 1
  };

  if (Object.prototype.hasOwnProperty.call(openingPoemIndexes, nodeId)) {
    return poemSeedPlan.openingPoems[openingPoemIndexes[nodeId]];
  }

  if (Object.prototype.hasOwnProperty.call(laterPoemIndexes, nodeId)) {
    return poemSeedPlan.laterPoems[laterPoemIndexes[nodeId]];
  }

  if (nodeId === "boss") {
    return poemSeedPlan.bossPoem;
  }

  return null;
}

function assignPoemEncounter(space, poem, blankCount) {
  space.encounter = {
    poem,
    blankCount,
    poemEvent: preparePoemEvent(poem, blankCount)
  };
}

function getPoemBlankCountForNode(space) {
  const floorBlankCounts =
    gameState.currentFloor >= 2
      ? { easy: 3, mid: 6, boss: 9 }
      : { easy: 2, mid: 4, boss: 8 };

  if (space.type === "boss") {
    return floorBlankCounts.boss;
  }

  if (space.id === "poem-4" || space.id === "poem-5") {
    return floorBlankCounts.mid;
  }

  return floorBlankCounts.easy;
}

function buildRunPath() {
  gameState.runPath = currentPathSpaces.map((space) => ({
    ...space,
    connections: [...space.connections],
    encounter: null
  }));
  gameState.currentNodeId = "start";
  gameState.completedNodeIds = [];
  gameState.availableNodeIds = [];
  gameState.prophecyUsedThisFloor = false;
  resolveOptionNodes();
  const poemSeedPlan = buildPoemSeedPlan();
  recordFloorPoemSeedPlan(poemSeedPlan);

  gameState.runPath.forEach((space, index) => {
    if (space.type === "poem") {
      const poem = getSeededPoemForNode(space.id, poemSeedPlan);

      if (poem) {
        const blankCount = getPoemBlankCountForNode(space);
        assignPoemEncounter(space, poem, blankCount);
      }
    }

    if (space.type === "rest") {
      const poem = getRandomRestPoem();

      assignPoemEncounter(space, poem, 6);
    }

    if (space.type === "boss") {
      const poem = getSeededPoemForNode(space.id, poemSeedPlan);
      assignPoemEncounter(space, poem, getPoemBlankCountForNode(space));
    }

    if (space.type === "trivia") {
      const triviaTypes = ["authorDate", "detective", "fanfic"];
      const randomTriviaType =
        triviaTypes[Math.floor(Math.random() * triviaTypes.length)];

      if (randomTriviaType === "authorDate") {
        space.encounter = buildAuthorDateEncounter();
      }

      if (randomTriviaType === "detective") {
        space.encounter = buildDetectiveEncounter();
      }

      if (randomTriviaType === "fanfic") {
        space.encounter = buildFanficEncounter();
      }

    }

    if (space.type === "kjv") {
      space.encounter = buildKjvEncounter();
    }

    if (space.type === "phonetic") {
      space.encounter = buildPhoneticEncounter();
    }

    if (space.type === "litcanon") {
      space.encounter = buildLitcanonEncounter();
    }

    if (space.type === "elite") {
      const previousPoemSpaces = gameState.runPath
        .slice(0, index)
        .filter((previousSpace) => {
          return previousSpace.type === "poem" && previousSpace.encounter;
        });

      const randomPreviousPoemSpace =
        previousPoemSpaces[Math.floor(Math.random() * previousPoemSpaces.length)];
      const poem = randomPreviousPoemSpace.encounter.poem;

      space.encounter = {
        poem,
        blankCount: 6,
        poemEvent: preparePoemEvent(poem, 6)
      };
    }
  });

  gameState.currentFloorSeedSignature = getRunPathSeedSignature();
}

function getRunPathSeedSignature() {
  return gameState.runPath
    .map((space) => {
      const poemId =
        space.encounter?.poem?.id ||
        space.encounter?.poemEvent?.id ||
        "";
      const triviaType = space.encounter?.triviaType || "";
      const encounterId =
        space.encounter?.id ||
        space.encounter?.passage?.id ||
        space.encounter?.clue?.id ||
        "";
      const missingWords = space.encounter?.poemEvent?.missingWords || [];
      const blankSignature = missingWords
        .map((word) => `${word.lineIndex}-${word.wordIndex}`)
        .join(",");

      return [
        space.id,
        space.type,
        poemId,
        triviaType,
        encounterId,
        blankSignature
      ].join(":");
    })
    .join("|");
}

function startNextFloor() {
  const previousFloorSeedSignature = gameState.currentFloorSeedSignature;
  let buildAttempts = 0;

  gameState.currentFloor += 1;
  syncMusicToCurrentFloor();
  gameState.currentRewardOffers = [];
  gameState.rewardTilePurchased = false;
  gameState.currentPuzzle = null;
  gameState.currentPuzzleMode = null;
  gameState.currentKjvEncounter = null;
  gameState.currentKjvDifficulty = null;
  gameState.lastEventType = null;

  do {
    buildRunPath();
    buildAttempts += 1;
  } while (
    gameState.currentFloorSeedSignature === previousFloorSeedSignature &&
    buildAttempts < 20
  );

  renderGame();
  startOpeningPuzzle();
}
