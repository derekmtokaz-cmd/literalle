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

  renderFloorIndicator();
  queueAssetMapConnectorRedraw();
}

function renderFloorIndicator() {
  const indicator = document.createElement("div");
  indicator.classList.add("floor-indicator");
  indicator.setAttribute("aria-label", `Floor ${gameState.currentFloor}`);
  const floorLabels = ["I", "II", "III", "IV"];

  for (let floorNumber = 1; floorNumber <= 4; floorNumber += 1) {
    const floorFrame = document.createElement("div");
    floorFrame.classList.add("floor-indicator-frame");
    floorFrame.textContent = floorLabels[floorNumber - 1];

    if (floorNumber === gameState.currentFloor) {
      floorFrame.classList.add("active");
    } else {
      floorFrame.classList.add("dimmed");
    }

    indicator.appendChild(floorFrame);
  }

  gameBoard.appendChild(indicator);
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

const ASSET_MAP_CONNECTOR_CLASS = "asset-map-connector";
const MAP_VERTICAL_INSET = {
  top: 22,
  bottom: 86
};

let assetMapConnectorRedrawQueued = false;

function remapMapYPercent(value) {
  return MAP_VERTICAL_INSET.top + (value / 100) * (MAP_VERTICAL_INSET.bottom - MAP_VERTICAL_INSET.top);
}

function getOriginalMapTopPercent(element) {
  if (!element.dataset.originalMapTop) {
    element.dataset.originalMapTop = element.style.top;
  }

  return Number.parseFloat(element.dataset.originalMapTop);
}

function remapNodeVerticalPositions(board) {
  board.querySelectorAll(".board-space").forEach((node) => {
    const originalTop = getOriginalMapTopPercent(node);

    if (Number.isNaN(originalTop)) {
      return;
    }

    node.style.top = `${remapMapYPercent(originalTop)}%`;
  });
}

function applyAssetMapNodeClasses(board) {
  board.querySelectorAll(".board-space").forEach((node) => {
    const nodeId = node.dataset.nodeId;
    const isCurrent = node.classList.contains("current");

    node.classList.remove(
      "preview-easy-poem-icon",
      "preview-later-poem-icon",
      "preview-boss-frame",
      "preview-rest-icon",
      "preview-matchmaker-icon",
      "preview-timed-shakespeare-icon",
      "preview-image-icon",
      "preview-show-player-star"
    );

    if (nodeId === "poem-1" || nodeId === "poem-2" || nodeId === "poem-3") {
      node.classList.add("preview-easy-poem-icon", "preview-image-icon");
    }

    if (nodeId === "poem-4" || nodeId === "poem-5" || nodeId === "boss") {
      node.classList.add("preview-later-poem-icon", "preview-image-icon");
    }

    if (nodeId === "boss") {
      node.classList.add("preview-boss-frame");
    }

    if (node.classList.contains("rest")) {
      node.classList.add("preview-rest-icon", "preview-image-icon");
    }

    if (node.classList.contains("matchmaker")) {
      node.classList.add("preview-matchmaker-icon", "preview-image-icon");
    }

    if (node.classList.contains("timedShakespeare")) {
      node.classList.add("preview-timed-shakespeare-icon", "preview-image-icon");
    }

    if (isCurrent) {
      node.classList.add("preview-show-player-star");
    }
  });
}

function drawAssetMapConnectors() {
  const lineLayer = gameBoard?.querySelector(".map-lines");

  if (!gameBoard || !lineLayer) {
    return;
  }

  gameBoard.querySelectorAll(`.${ASSET_MAP_CONNECTOR_CLASS}`).forEach((connector) => {
    connector.remove();
  });

  applyAssetMapNodeClasses(gameBoard);
  remapNodeVerticalPositions(gameBoard);

  const boardRect = gameBoard.getBoundingClientRect();

  lineLayer.querySelectorAll(".map-line").forEach((line) => {
    const x1 = Number(line.getAttribute("x1"));
    const y1 = Number(line.getAttribute("y1"));
    const x2 = Number(line.getAttribute("x2"));
    const y2 = Number(line.getAttribute("y2"));

    if ([x1, y1, x2, y2].some((value) => Number.isNaN(value))) {
      return;
    }

    const remappedY1 = remapMapYPercent(y1);
    const remappedY2 = remapMapYPercent(y2);
    const dx = ((x2 - x1) / 100) * boardRect.width;
    const dy = ((remappedY2 - remappedY1) / 100) * boardRect.height;
    const distance = Math.hypot(dx, dy);
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    const connector = document.createElement("div");

    connector.classList.add(ASSET_MAP_CONNECTOR_CLASS);

    if (line.classList.contains("available")) {
      connector.classList.add("available");
    } else if (line.classList.contains("chosen")) {
      connector.classList.add("completed");
    } else {
      connector.classList.add("future");
    }

    connector.style.left = `${x1}%`;
    connector.style.top = `${remappedY1}%`;
    connector.style.width = `${Math.max(30, distance)}px`;
    connector.style.transform = `translateY(-50%) rotate(${angle}deg)`;

    gameBoard.appendChild(connector);
  });
}

function queueAssetMapConnectorRedraw() {
  if (assetMapConnectorRedrawQueued) {
    return;
  }

  assetMapConnectorRedrawQueued = true;
  requestAnimationFrame(() => {
    assetMapConnectorRedrawQueued = false;
    drawAssetMapConnectors();
  });
}

window.addEventListener("resize", queueAssetMapConnectorRedraw);
