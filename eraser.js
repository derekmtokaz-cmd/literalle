function shouldShowEraserChoiceAfterReward() {
  return (
    gameState.currentNodeId === "poem-3" &&
    !hasEraserBeenOfferedThisFloor() &&
    hasTrinket("eraser") &&
    getEraserSeededPoems().length === 3
  );
}

function hasTrinket(trinketId) {
  return gameState.inventory.some((item) => {
    return item.type === "trinket" && item.trinketId === trinketId;
  });
}

function hasEraserBeenOfferedThisFloor() {
  return gameState.eraserOfferedByFloor[gameState.currentFloor] === true;
}

function markEraserOfferedThisFloor() {
  gameState.eraserOfferedByFloor[gameState.currentFloor] = true;
}

function showEraserChoiceScreen() {
  renderEraserChoices();
  showSection("eraser");
}

function renderEraserChoices() {
  eraserChoiceContainer.innerHTML = "";

  getEraserSeededPoems().forEach((poem) => {
    const choiceButton = document.createElement("button");
    choiceButton.type = "button";
    choiceButton.textContent = `${poem.title} by ${poem.author}`;
    choiceButton.addEventListener("click", () => {
      useEraserOnPoem(poem.id);
    });

    eraserChoiceContainer.appendChild(choiceButton);
  });
}

function getEraserSeededPoems() {
  return ["poem-1", "poem-2", "poem-3"]
    .map((nodeId) => getMapNodeById(nodeId)?.encounter?.poem)
    .filter((poem) => poem);
}

function useEraserOnPoem(erasedPoemId) {
  const eraserIndex = gameState.inventory.findIndex((item) => {
    return item.type === "trinket" && item.trinketId === "eraser";
  });

  if (eraserIndex === -1) {
    return;
  }

  const remainingPoems = getEraserSeededPoems().filter((poem) => {
    return poem.id !== erasedPoemId;
  });

  if (remainingPoems.length !== 2) {
    return;
  }

  gameState.inventory.splice(eraserIndex, 1);
  reseedRemainingPoemEncountersAfterEraser(remainingPoems);
  finishEraserChoice();
}

function skipEraserChoice() {
  finishEraserChoice();
}

function finishEraserChoice() {
  renderGame();
  showSection("board");
}

function reseedRemainingPoemEncountersAfterEraser(remainingPoems) {
  const poemFourNode = getMapNodeById("poem-4");
  const poemFiveNode = getMapNodeById("poem-5");
  const bossNode = getMapNodeById("boss");

  if (poemFourNode) {
    assignPoemEncounter(poemFourNode, remainingPoems[0], getPoemBlankCountForNode(poemFourNode));
  }

  if (poemFiveNode) {
    assignPoemEncounter(poemFiveNode, remainingPoems[1], getPoemBlankCountForNode(poemFiveNode));
  }

  if (bossNode) {
    assignPoemEncounter(
      bossNode,
      getRandomItem(remainingPoems),
      getPoemBlankCountForNode(bossNode)
    );
  }

  gameState.currentFloorSeedSignature = getRunPathSeedSignature();
}
