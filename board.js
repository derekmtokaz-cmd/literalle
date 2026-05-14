/* ---------------- BOARD ---------------- */

function getMapNodeById(nodeId) {
  return gameState.runPath.find((node) => node.id === nodeId) || null;
}

function getNodePosition(node) {
  const maxColumn = Math.max(...gameState.runPath.map((item) => item.column));
  const lanePercents = [18, 50, 82];

  return {
    x: 5 + (node.column / maxColumn) * 90,
    y: lanePercents[node.lane]
  };
}

function renderBoard() {
  gameBoard.innerHTML = "";

  const lineLayer = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  lineLayer.classList.add("map-lines");
  lineLayer.setAttribute("viewBox", "0 0 100 100");
  lineLayer.setAttribute("preserveAspectRatio", "none");
  gameBoard.appendChild(lineLayer);

  gameState.runPath.forEach((node) => {
    renderMapConnections(node, lineLayer);
  });

  gameState.runPath.forEach((node) => {
    renderMapNode(node);
  });
}

function renderMapConnections(node, lineLayer) {
  const from = getNodePosition(node);

  node.connections.forEach((targetNodeId) => {
    const targetNode = getMapNodeById(targetNodeId);

    if (!targetNode) {
      return;
    }

    const to = getNodePosition(targetNode);
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");

    line.classList.add("map-line");

    if (
      gameState.completedNodeIds.includes(node.id) &&
      (gameState.completedNodeIds.includes(targetNode.id) ||
        gameState.currentNodeId === targetNode.id)
    ) {
      line.classList.add("chosen");
    } else if (
      gameState.currentNodeId === node.id &&
      gameState.availableNodeIds.includes(targetNode.id)
    ) {
      line.classList.add("available");
    }

    line.setAttribute("x1", from.x);
    line.setAttribute("y1", from.y);
    line.setAttribute("x2", to.x);
    line.setAttribute("y2", to.y);

    lineLayer.appendChild(line);
  });
}

function renderMapNode(node) {
  const position = getNodePosition(node);
  const nodeElement = document.createElement("button");

  nodeElement.type = "button";
  nodeElement.classList.add("board-space", node.type);
  addMapDifficultyClass(nodeElement, node);
  nodeElement.style.left = `${position.x}%`;
  nodeElement.style.top = `${position.y}%`;
  nodeElement.dataset.nodeId = node.id;

  const isCompleted = gameState.completedNodeIds.includes(node.id);
  const isCurrent = gameState.currentNodeId === node.id;
  const isAvailable = gameState.availableNodeIds.includes(node.id);
  const isDeveloperSelectable =
    gameState.developerMode &&
    !isCurrent &&
    node.type !== "start";

  if (isCompleted) {
    nodeElement.classList.add("completed");
  }

  if (isAvailable) {
    nodeElement.classList.add("selectable");
  }

  if (isCurrent) {
    nodeElement.classList.add("current");
  } else if (isAvailable) {
    nodeElement.classList.add("active");
  } else if (isDeveloperSelectable) {
    nodeElement.classList.add("developer-selectable");
  } else if (!isCompleted) {
    nodeElement.classList.add("future");
    nodeElement.disabled = true;
  }

  if (isCompleted && !isCurrent && !isDeveloperSelectable) {
    nodeElement.disabled = true;
  }

  const nodeIcon = isCurrent ? "★" : node.icon;
  nodeElement.innerHTML = `<span class="space-icon">${nodeIcon}</span>`;

  if (isCurrent) {
    const marker = document.createElement("div");
    marker.classList.add("player-marker");
    marker.textContent = "★";
    nodeElement.appendChild(marker);
  }

  if (isAvailable || isDeveloperSelectable) {
    nodeElement.addEventListener("click", () => {
      startMapNode(node.id);
    });
  }

  gameBoard.appendChild(nodeElement);
}

function addMapDifficultyClass(nodeElement, node) {
  if (node.id === "poem-1" || node.id === "poem-2" || node.id === "poem-3") {
    nodeElement.classList.add("easy-poem");
  }

  if (node.id === "poem-4" || node.id === "poem-5") {
    nodeElement.classList.add("mid-poem");
  }

  if (node.type === "boss") {
    nodeElement.classList.add("boss-poem");
  }
}
