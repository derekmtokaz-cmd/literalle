const LONE_QUEEN_FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];
const LONE_QUEEN_RANKS = [8, 7, 6, 5, 4, 3, 2, 1];
const LONE_QUEEN_MOVE_TYPES = ["pawn", "knight", "bishop"];
const LONE_QUEEN_PROMOTION_ORDER = ["knight", "bishop", "rook", "queen"];
const LONE_QUEEN_MOVE_ANIMATION_MS = 320;
const LONE_QUEEN_SYMBOLS = {
  player: "♕",
  king: "♚",
  queen: "♛",
  rook: "♜",
  bishop: "♝",
  knight: "♞",
  pawn: "♟"
};

function buildLoneQueenEncounter() {
  return {
    triviaType: "loneQueen"
  };
}

function startLoneQueenEvent() {
  gameState.firstDraftUsedThisPuzzle = false;

  gameState.currentLoneQueenEvent = {
    pieces: createLoneQueenPieces(),
    selectedMoveType: null,
    legalPlayerMoves: [],
    announcedType: null,
    playerPawnDoubleAvailable: true,
    promotionCount: 0,
    status: "playing",
    animating: false,
    message: "Choose how the queen moves this turn."
  };

  announceNextLoneQueenType();

  showDialog({
    dialog: ["dialog goes here."],
    dialogImage: "images/lib.png"
  });

  renderLoneQueenEvent();
  showSection("loneQueen");
}

function createLoneQueenPieces() {
  const pieces = [
    createLoneQueenPiece("player", "player", "d1"),
    createLoneQueenPiece("black-rook-a8", "rook", "a8"),
    createLoneQueenPiece("black-knight-b8", "knight", "b8"),
    createLoneQueenPiece("black-bishop-c8", "bishop", "c8"),
    createLoneQueenPiece("black-king-e8", "king", "e8"),
    createLoneQueenPiece("black-bishop-f8", "bishop", "f8"),
    createLoneQueenPiece("black-knight-g8", "knight", "g8"),
    createLoneQueenPiece("black-rook-h8", "rook", "h8")
  ];
  const pawnFiles = getLoneQueenStartingPawnFiles();

  pawnFiles.forEach((file) => {
    pieces.push(createLoneQueenPiece(`black-pawn-${file}7`, "pawn", `${file}7`));
  });

  return pieces;
}

function getLoneQueenStartingPawnFiles() {
  let pawnFiles = [];

  do {
    pawnFiles = shuffleArray(LONE_QUEEN_FILES).slice(0, 4);
  } while (pawnFiles.includes("a") && pawnFiles.includes("h"));

  return pawnFiles;
}

function createLoneQueenPiece(id, type, square) {
  return {
    id,
    type,
    square
  };
}

function announceNextLoneQueenType() {
  const eventData = gameState.currentLoneQueenEvent;

  if (!eventData || eventData.status !== "playing") {
    return;
  }

  const existingTypes = [...new Set(getLoneQueenBlackPieces().map((piece) => {
    return piece.type;
  }))];

  eventData.announcedType =
    existingTypes[Math.floor(Math.random() * existingTypes.length)] || null;
}

function renderLoneQueenEvent() {
  const eventData = gameState.currentLoneQueenEvent;
  loneQueenBoard.innerHTML = "";

  if (!eventData) {
    return;
  }

  loneQueenAnnouncement.textContent = eventData.announcedType
    ? `Black will move: ${capitalizeLoneQueenText(eventData.announcedType)}`
    : "Black has no pieces to move.";
  loneQueenMessage.textContent = eventData.message || "";

  updateLoneQueenMoveButtons();

  LONE_QUEEN_RANKS.forEach((rank) => {
    LONE_QUEEN_FILES.forEach((file) => {
      const square = `${file}${rank}`;
      const squareButton = document.createElement("button");
      const piece = getLoneQueenPieceAt(square);

      squareButton.type = "button";
      squareButton.classList.add("lone-queen-square");
      squareButton.classList.add((LONE_QUEEN_FILES.indexOf(file) + rank) % 2 === 0 ? "dark" : "light");
      squareButton.dataset.square = square;
      squareButton.setAttribute("aria-label", getLoneQueenSquareLabel(square, piece));

      if (eventData.legalPlayerMoves.includes(square)) {
        squareButton.classList.add("legal-destination");
      }

      if (piece) {
        squareButton.classList.add(piece.id === "player" ? "player-piece" : "black-piece");
        squareButton.textContent = LONE_QUEEN_SYMBOLS[piece.type];

        if (
          piece.id !== "player" &&
          piece.type === eventData.announcedType &&
          eventData.status === "playing"
        ) {
          squareButton.classList.add("announced-piece");
        }
      }

      squareButton.addEventListener("click", () => {
        moveLoneQueenPlayerTo(square);
      });

      loneQueenBoard.appendChild(squareButton);
    });
  });
}

function updateLoneQueenMoveButtons() {
  const eventData = gameState.currentLoneQueenEvent;
  const buttons = [
    { type: "pawn", button: loneQueenPawnButton },
    { type: "knight", button: loneQueenKnightButton },
    { type: "bishop", button: loneQueenBishopButton }
  ];

  buttons.forEach(({ type, button }) => {
    button.classList.toggle("selected", eventData?.selectedMoveType === type);
    button.disabled = !eventData || eventData.status !== "playing" || eventData.animating;
  });
}

function selectLoneQueenMoveType(moveType) {
  const eventData = gameState.currentLoneQueenEvent;

  if (
    !eventData ||
    eventData.status !== "playing" ||
    eventData.animating ||
    !LONE_QUEEN_MOVE_TYPES.includes(moveType)
  ) {
    return;
  }

  eventData.selectedMoveType = moveType;
  eventData.legalPlayerMoves = getLoneQueenPlayerLegalMoves(moveType);

  if (eventData.legalPlayerMoves.length === 0) {
    finishLoneQueenEvent("stalemate");
    return;
  }

  eventData.message = `Moving as ${moveType}.`;
  renderLoneQueenEvent();
}

async function moveLoneQueenPlayerTo(square) {
  const eventData = gameState.currentLoneQueenEvent;

  if (
    !eventData ||
    eventData.status !== "playing" ||
    eventData.animating ||
    !eventData.legalPlayerMoves.includes(square)
  ) {
    return;
  }

  const targetPiece = getLoneQueenPieceAt(square);
  const player = getLoneQueenPlayerPiece();

  if (!player) {
    return;
  }

  if (eventData.selectedMoveType === "pawn") {
    eventData.playerPawnDoubleAvailable = false;
  }

  eventData.animating = true;
  eventData.legalPlayerMoves = [];
  eventData.message = eventData.announcedType
    ? `Black ${eventData.announcedType}s move next.`
    : "";
  renderLoneQueenEvent();
  await animateLoneQueenPieceMove(player, player.square, square);

  if (targetPiece?.type === "king") {
    player.square = square;
    eventData.pieces = eventData.pieces.filter((piece) => {
      return piece.id !== targetPiece.id;
    });
    finishLoneQueenEvent("win");
    return;
  }

  player.square = square;
  eventData.selectedMoveType = null;
  eventData.message = `Black ${eventData.announcedType}s move.`;
  renderLoneQueenEvent();

  await runLoneQueenBlackTurn();
}

async function runLoneQueenBlackTurn() {
  const eventData = gameState.currentLoneQueenEvent;

  if (!eventData || eventData.status !== "playing" || !eventData.announcedType) {
    return;
  }

  const activatedPieces = getLoneQueenBlackPieces()
    .filter((piece) => piece.type === eventData.announcedType)
    .sort(compareLoneQueenPiecesBySquare);
  const rookMoveState = {
    firstAxis: null,
    processedRooks: 0
  };
  let blackMoved = false;

  for (const piece of activatedPieces) {
    if (!eventData.pieces.includes(piece)) {
      continue;
    }

    if (canLoneQueenBlackPieceCapturePlayer(piece)) {
      await animateLoneQueenPieceMove(piece, piece.square, getLoneQueenPlayerPiece().square);
      finishLoneQueenEvent("loss");
      return;
    }

    const moved = await moveLoneQueenBlackPiece(piece, rookMoveState);

    if (moved) {
      blackMoved = true;
    }
  }

  if (!blackMoved) {
    finishLoneQueenEvent("stalemate");
    return;
  }

  eventData.animating = false;
  eventData.message = "Choose how the queen moves this turn.";
  announceNextLoneQueenType();
  renderLoneQueenEvent();
}

async function moveLoneQueenBlackPiece(piece, rookMoveState) {
  if (piece.type === "pawn") {
    return await moveLoneQueenBlackPawn(piece);
  }

  if (piece.type === "knight") {
    return await moveLoneQueenPieceToRandomSquare(piece, getLoneQueenKnightMoves(piece.square).filter((square) => {
      const position = parseLoneQueenSquare(square);
      return (
        !isLoneQueenRimSquare(square) &&
        !getLoneQueenPieceAt(square) &&
        position.rank >= 2 &&
        position.rank <= 7
      );
    }));
  }

  if (piece.type === "bishop") {
    return await moveLoneQueenPieceToRandomSquare(piece, getLoneQueenSlidingMoves(piece.square, getLoneQueenBishopDirections()));
  }

  if (piece.type === "rook") {
    return await moveLoneQueenBlackRook(piece, rookMoveState);
  }

  if (piece.type === "queen") {
    return await moveLoneQueenBlackQueen(piece);
  }

  if (piece.type === "king") {
    return await moveLoneQueenBlackKing(piece);
  }

  return false;
}

async function moveLoneQueenBlackPawn(piece) {
  const position = parseLoneQueenSquare(piece.square);
  const oneStep = makeLoneQueenSquare(position.fileIndex, position.rank - 1);

  if (!oneStep || getLoneQueenPieceAt(oneStep)) {
    return false;
  }

  if (position.rank === 7) {
    const twoStep = makeLoneQueenSquare(position.fileIndex, position.rank - 2);

    if (twoStep && !getLoneQueenPieceAt(twoStep)) {
      await animateLoneQueenPieceMove(piece, piece.square, twoStep);
      piece.square = twoStep;
      maybePromoteLoneQueenPawn(piece);
      renderLoneQueenEvent();
      return true;
    }
  }

  await animateLoneQueenPieceMove(piece, piece.square, oneStep);
  piece.square = oneStep;
  maybePromoteLoneQueenPawn(piece);
  renderLoneQueenEvent();
  return true;
}

function maybePromoteLoneQueenPawn(piece) {
  const eventData = gameState.currentLoneQueenEvent;

  if (!eventData || piece.type !== "pawn" || parseLoneQueenSquare(piece.square).rank !== 1) {
    return;
  }

  piece.type =
    LONE_QUEEN_PROMOTION_ORDER[eventData.promotionCount] ||
    LONE_QUEEN_PROMOTION_ORDER[LONE_QUEEN_PROMOTION_ORDER.length - 1];
  piece.id = `${piece.id}-promoted-${piece.type}`;
  eventData.promotionCount += 1;
}

async function moveLoneQueenBlackRook(piece, rookMoveState) {
  const allMoves = getLoneQueenSlidingMoves(piece.square, getLoneQueenRookDirections());
  let candidateMoves = allMoves;

  if (rookMoveState.processedRooks === 1 && rookMoveState.firstAxis) {
    const oppositeAxis = rookMoveState.firstAxis === "file" ? "rank" : "file";
    candidateMoves = allMoves.filter((square) => {
      return getLoneQueenMoveAxis(piece.square, square) === oppositeAxis;
    });

    if (candidateMoves.length === 0) {
      candidateMoves = allMoves;
    }
  }

  const moved = await moveLoneQueenPieceToRandomSquare(piece, candidateMoves);

  if (moved && rookMoveState.processedRooks === 0) {
    rookMoveState.firstAxis = getLoneQueenMoveAxis(moved.from, moved.to);
  }

  rookMoveState.processedRooks += 1;
  return Boolean(moved);
}

async function moveLoneQueenBlackQueen(piece) {
  const player = getLoneQueenPlayerPiece();

  if (!player) {
    return false;
  }

  const legalMoves = getLoneQueenSlidingMoves(piece.square, [
    ...getLoneQueenBishopDirections(),
    ...getLoneQueenRookDirections()
  ]);

  if (legalMoves.length === 0) {
    return false;
  }

  const bestDistance = Math.min(...legalMoves.map((square) => {
    return getLoneQueenDistance(square, player.square);
  }));
  const destination = getRandomItem(legalMoves.filter((square) => {
    return getLoneQueenDistance(square, player.square) === bestDistance;
  }));
  await animateLoneQueenPieceMove(piece, piece.square, destination);
  piece.square = destination;
  renderLoneQueenEvent();
  return true;
}

async function moveLoneQueenBlackKing(piece) {
  const castleMove = getBestLoneQueenCastleMove(piece);

  if (castleMove) {
    await animateLoneQueenPieceMove(piece, piece.square, castleMove.kingTo);
    piece.square = castleMove.kingTo;
    renderLoneQueenEvent();
    await animateLoneQueenPieceMove(castleMove.rook, castleMove.rook.square, castleMove.rookTo);
    castleMove.rook.square = castleMove.rookTo;
    renderLoneQueenEvent();
    return true;
  }

  const player = getLoneQueenPlayerPiece();

  if (!player) {
    return false;
  }

  const legalMoves = getLoneQueenKingMoves(piece.square).filter((square) => {
    return !getLoneQueenPieceAt(square);
  });

  const adjacentMoves = legalMoves.filter((square) => {
    return isLoneQueenOrthogonallyAdjacent(square, player.square);
  });

  if (adjacentMoves.length > 0) {
    const destination = getRandomItem(adjacentMoves);
    await animateLoneQueenPieceMove(piece, piece.square, destination);
    piece.square = destination;
    renderLoneQueenEvent();
    return true;
  }

  const currentDistance = getLoneQueenDistance(piece.square, player.square);
  const awayMoves = legalMoves.filter((square) => {
    return getLoneQueenDistance(square, player.square) > currentDistance;
  });

  if (awayMoves.length > 0) {
    const bestDistance = Math.max(...awayMoves.map((square) => {
      return getLoneQueenDistance(square, player.square);
    }));
    const destination = getRandomItem(awayMoves.filter((square) => {
      return getLoneQueenDistance(square, player.square) === bestDistance;
    }));
    await animateLoneQueenPieceMove(piece, piece.square, destination);
    piece.square = destination;
    renderLoneQueenEvent();
    return true;
  }

  const sameDistanceMoves = legalMoves.filter((square) => {
    return getLoneQueenDistance(square, player.square) === currentDistance;
  });

  if (sameDistanceMoves.length > 0) {
    const destination = getRandomItem(sameDistanceMoves);
    await animateLoneQueenPieceMove(piece, piece.square, destination);
    piece.square = destination;
    renderLoneQueenEvent();
    return true;
  }

  const closerMoves = legalMoves.filter((square) => {
    return getLoneQueenDistance(square, player.square) < currentDistance;
  });

  if (closerMoves.length === 0) {
    return false;
  }

  const leastBadDistance = Math.max(...closerMoves.map((square) => {
    return getLoneQueenDistance(square, player.square);
  }));
  const destination = getRandomItem(closerMoves.filter((square) => {
    return getLoneQueenDistance(square, player.square) === leastBadDistance;
  }));
  await animateLoneQueenPieceMove(piece, piece.square, destination);
  piece.square = destination;
  renderLoneQueenEvent();
  return true;
}

function getBestLoneQueenCastleMove(king) {
  const player = getLoneQueenPlayerPiece();

  if (!player) {
    return null;
  }

  const currentDistance = getLoneQueenDistance(king.square, player.square);
  const options = getLoneQueenBlackPieces()
    .filter((piece) => piece.type === "rook")
    .map((rook) => getLoneQueenCastleMove(king, rook))
    .filter(Boolean)
    .filter((move) => {
      return getLoneQueenDistance(move.kingTo, player.square) >= currentDistance;
    });

  if (options.length === 0) {
    return null;
  }

  const greatestDistanceGain = Math.max(...options.map((move) => {
    return getLoneQueenDistance(move.kingTo, player.square) - currentDistance;
  }));

  return getRandomItem(options.filter((move) => {
    return getLoneQueenDistance(move.kingTo, player.square) - currentDistance === greatestDistanceGain;
  }));
}

function getLoneQueenCastleMove(king, rook) {
  const kingPosition = parseLoneQueenSquare(king.square);
  const rookPosition = parseLoneQueenSquare(rook.square);
  const sameFile = kingPosition.fileIndex === rookPosition.fileIndex;
  const sameRank = kingPosition.rank === rookPosition.rank;

  if (!sameFile && !sameRank) {
    return null;
  }

  const lineDistance = sameFile
    ? Math.abs(rookPosition.rank - kingPosition.rank)
    : Math.abs(rookPosition.fileIndex - kingPosition.fileIndex);

  if (lineDistance < 3) {
    return null;
  }

  if (hasLoneQueenPiecesBetween(king.square, rook.square)) {
    return null;
  }

  const fileStep = Math.sign(rookPosition.fileIndex - kingPosition.fileIndex);
  const rankStep = Math.sign(rookPosition.rank - kingPosition.rank);
  const kingTo = makeLoneQueenSquare(
    kingPosition.fileIndex + fileStep * 2,
    kingPosition.rank + rankStep * 2
  );
  const rookTo = makeLoneQueenSquare(
    kingPosition.fileIndex + fileStep,
    kingPosition.rank + rankStep
  );

  if (!kingTo || !rookTo) {
    return null;
  }

  if (
    getLoneQueenPieceAtIgnoring(kingTo, [king.id, rook.id]) ||
    getLoneQueenPieceAtIgnoring(rookTo, [king.id, rook.id])
  ) {
    return null;
  }

  return {
    kingTo,
    rookTo,
    rook
  };
}

function getLoneQueenPlayerLegalMoves(moveType) {
  const player = getLoneQueenPlayerPiece();

  if (!player) {
    return [];
  }

  if (moveType === "pawn") {
    return getLoneQueenPlayerPawnMoves(player.square);
  }

  if (moveType === "knight") {
    return getLoneQueenKnightMoves(player.square).filter(isLoneQueenPlayerDestinationLegal);
  }

  if (moveType === "bishop") {
    return getLoneQueenPlayerSlidingMoves(player.square, getLoneQueenBishopDirections());
  }

  return [];
}

function getLoneQueenPlayerPawnMoves(square) {
  const position = parseLoneQueenSquare(square);
  const moves = [];
  const oneStep = makeLoneQueenSquare(position.fileIndex, position.rank + 1);

  if (oneStep && !getLoneQueenPieceAt(oneStep)) {
    moves.push(oneStep);

    if (gameState.currentLoneQueenEvent?.playerPawnDoubleAvailable) {
      const twoStep = makeLoneQueenSquare(position.fileIndex, position.rank + 2);

      if (twoStep && !getLoneQueenPieceAt(twoStep)) {
        moves.push(twoStep);
      }
    }
  }

  [-1, 1].forEach((fileDelta) => {
    const captureSquare = makeLoneQueenSquare(position.fileIndex + fileDelta, position.rank + 1);
    const captureTarget = captureSquare ? getLoneQueenPieceAt(captureSquare) : null;

    if (captureTarget?.type === "king") {
      moves.push(captureSquare);
    }
  });

  return moves;
}

function getLoneQueenPlayerSlidingMoves(square, directions) {
  const moves = [];
  const position = parseLoneQueenSquare(square);

  directions.forEach(([fileDelta, rankDelta]) => {
    let fileIndex = position.fileIndex + fileDelta;
    let rank = position.rank + rankDelta;

    while (isLoneQueenOnBoard(fileIndex, rank)) {
      const nextSquare = makeLoneQueenSquare(fileIndex, rank);
      const piece = getLoneQueenPieceAt(nextSquare);

      if (piece) {
        if (piece.type === "king") {
          moves.push(nextSquare);
        }
        break;
      }

      moves.push(nextSquare);
      fileIndex += fileDelta;
      rank += rankDelta;
    }
  });

  return moves;
}

function isLoneQueenPlayerDestinationLegal(square) {
  const piece = getLoneQueenPieceAt(square);
  return !piece || piece.type === "king";
}

function canLoneQueenBlackPieceCapturePlayer(piece) {
  const player = getLoneQueenPlayerPiece();

  if (!player) {
    return false;
  }

  if (piece.type === "pawn") {
    const position = parseLoneQueenSquare(piece.square);
    const captureSquares = [
      makeLoneQueenSquare(position.fileIndex - 1, position.rank - 1),
      makeLoneQueenSquare(position.fileIndex + 1, position.rank - 1)
    ];

    return captureSquares.includes(player.square);
  }

  if (piece.type === "knight") {
    return getLoneQueenKnightMoves(piece.square).includes(player.square);
  }

  if (piece.type === "bishop") {
    return canLoneQueenSlidingPieceReach(piece.square, player.square, getLoneQueenBishopDirections());
  }

  if (piece.type === "rook") {
    return canLoneQueenSlidingPieceReach(piece.square, player.square, getLoneQueenRookDirections());
  }

  if (piece.type === "queen") {
    return canLoneQueenSlidingPieceReach(piece.square, player.square, [
      ...getLoneQueenBishopDirections(),
      ...getLoneQueenRookDirections()
    ]);
  }

  if (piece.type === "king") {
    return getLoneQueenKingMoves(piece.square).includes(player.square);
  }

  return false;
}

function canLoneQueenSlidingPieceReach(fromSquare, targetSquare, directions) {
  const fromPosition = parseLoneQueenSquare(fromSquare);

  return directions.some(([fileDelta, rankDelta]) => {
    let fileIndex = fromPosition.fileIndex + fileDelta;
    let rank = fromPosition.rank + rankDelta;

    while (isLoneQueenOnBoard(fileIndex, rank)) {
      const square = makeLoneQueenSquare(fileIndex, rank);

      if (square === targetSquare) {
        return true;
      }

      if (getLoneQueenPieceAt(square)) {
        return false;
      }

      fileIndex += fileDelta;
      rank += rankDelta;
    }

    return false;
  });
}

function getLoneQueenSlidingMoves(square, directions) {
  const moves = [];
  const position = parseLoneQueenSquare(square);

  directions.forEach(([fileDelta, rankDelta]) => {
    let fileIndex = position.fileIndex + fileDelta;
    let rank = position.rank + rankDelta;

    while (isLoneQueenOnBoard(fileIndex, rank)) {
      const nextSquare = makeLoneQueenSquare(fileIndex, rank);

      if (getLoneQueenPieceAt(nextSquare)) {
        break;
      }

      moves.push(nextSquare);
      fileIndex += fileDelta;
      rank += rankDelta;
    }
  });

  return moves;
}

async function moveLoneQueenPieceToRandomSquare(piece, legalMoves) {
  if (legalMoves.length === 0) {
    return null;
  }

  const from = piece.square;
  const to = getRandomItem(legalMoves);
  await animateLoneQueenPieceMove(piece, from, to);
  piece.square = to;
  renderLoneQueenEvent();

  return { from, to };
}

function animateLoneQueenPieceMove(piece, fromSquare, toSquare) {
  if (!piece || !fromSquare || !toSquare || fromSquare === toSquare) {
    return Promise.resolve();
  }

  const fromElement = getLoneQueenSquareElement(fromSquare);
  const toElement = getLoneQueenSquareElement(toSquare);

  if (!fromElement || !toElement || !fromElement.getBoundingClientRect) {
    return Promise.resolve();
  }

  const fromRect = fromElement.getBoundingClientRect();
  const toRect = toElement.getBoundingClientRect();
  const movingPiece = document.createElement("div");

  movingPiece.classList.add("lone-queen-moving-piece");
  movingPiece.classList.add(piece.id === "player" ? "player-piece" : "black-piece");
  movingPiece.textContent = LONE_QUEEN_SYMBOLS[piece.type];
  movingPiece.style.left = `${fromRect.left}px`;
  movingPiece.style.top = `${fromRect.top}px`;
  movingPiece.style.width = `${fromRect.width}px`;
  movingPiece.style.height = `${fromRect.height}px`;

  fromElement.classList.add("moving-origin");
  document.body.appendChild(movingPiece);

  return new Promise((resolve) => {
    const animation = movingPiece.animate(
      [
        { transform: "translate(0, 0)" },
        { transform: `translate(${toRect.left - fromRect.left}px, ${toRect.top - fromRect.top}px)` }
      ],
      {
        duration: LONE_QUEEN_MOVE_ANIMATION_MS,
        easing: "ease-in-out",
        fill: "forwards"
      }
    );

    animation.addEventListener("finish", () => {
      fromElement.classList.remove("moving-origin");
      movingPiece.remove();
      resolve();
    }, { once: true });
  });
}

function getLoneQueenSquareElement(square) {
  return loneQueenBoard.querySelector(`[data-square="${square}"]`);
}

function getLoneQueenKnightMoves(square) {
  const position = parseLoneQueenSquare(square);
  const deltas = [
    [1, 2],
    [2, 1],
    [2, -1],
    [1, -2],
    [-1, -2],
    [-2, -1],
    [-2, 1],
    [-1, 2]
  ];

  return deltas
    .map(([fileDelta, rankDelta]) => {
      return makeLoneQueenSquare(position.fileIndex + fileDelta, position.rank + rankDelta);
    })
    .filter(Boolean);
}

function getLoneQueenKingMoves(square) {
  const position = parseLoneQueenSquare(square);
  const moves = [];

  for (let fileDelta = -1; fileDelta <= 1; fileDelta += 1) {
    for (let rankDelta = -1; rankDelta <= 1; rankDelta += 1) {
      if (fileDelta === 0 && rankDelta === 0) {
        continue;
      }

      const targetSquare = makeLoneQueenSquare(
        position.fileIndex + fileDelta,
        position.rank + rankDelta
      );

      if (targetSquare) {
        moves.push(targetSquare);
      }
    }
  }

  return moves;
}

function getLoneQueenBishopDirections() {
  return [
    [1, 1],
    [1, -1],
    [-1, -1],
    [-1, 1]
  ];
}

function getLoneQueenRookDirections() {
  return [
    [0, 1],
    [1, 0],
    [0, -1],
    [-1, 0]
  ];
}

function hasLoneQueenPiecesBetween(fromSquare, toSquare) {
  const fromPosition = parseLoneQueenSquare(fromSquare);
  const toPosition = parseLoneQueenSquare(toSquare);
  const fileStep = Math.sign(toPosition.fileIndex - fromPosition.fileIndex);
  const rankStep = Math.sign(toPosition.rank - fromPosition.rank);
  let fileIndex = fromPosition.fileIndex + fileStep;
  let rank = fromPosition.rank + rankStep;

  while (fileIndex !== toPosition.fileIndex || rank !== toPosition.rank) {
    if (getLoneQueenPieceAt(makeLoneQueenSquare(fileIndex, rank))) {
      return true;
    }

    fileIndex += fileStep;
    rank += rankStep;
  }

  return false;
}

function getLoneQueenMoveAxis(fromSquare, toSquare) {
  const fromPosition = parseLoneQueenSquare(fromSquare);
  const toPosition = parseLoneQueenSquare(toSquare);

  return fromPosition.fileIndex === toPosition.fileIndex ? "file" : "rank";
}

function getLoneQueenDistance(squareA, squareB) {
  const positionA = parseLoneQueenSquare(squareA);
  const positionB = parseLoneQueenSquare(squareB);

  return Math.max(
    Math.abs(positionA.fileIndex - positionB.fileIndex),
    Math.abs(positionA.rank - positionB.rank)
  );
}

function isLoneQueenOrthogonallyAdjacent(squareA, squareB) {
  const positionA = parseLoneQueenSquare(squareA);
  const positionB = parseLoneQueenSquare(squareB);
  const fileDistance = Math.abs(positionA.fileIndex - positionB.fileIndex);
  const rankDistance = Math.abs(positionA.rank - positionB.rank);

  return fileDistance + rankDistance === 1;
}

function isLoneQueenRimSquare(square) {
  const position = parseLoneQueenSquare(square);
  return (
    position.fileIndex === 0 ||
    position.fileIndex === 7 ||
    position.rank === 1 ||
    position.rank === 8
  );
}

function getLoneQueenPlayerPiece() {
  return gameState.currentLoneQueenEvent?.pieces.find((piece) => {
    return piece.id === "player";
  }) || null;
}

function getLoneQueenBlackPieces() {
  return (gameState.currentLoneQueenEvent?.pieces || []).filter((piece) => {
    return piece.id !== "player";
  });
}

function getLoneQueenPieceAt(square) {
  return (gameState.currentLoneQueenEvent?.pieces || []).find((piece) => {
    return piece.square === square;
  }) || null;
}

function getLoneQueenPieceAtIgnoring(square, ignoredPieceIds) {
  return (gameState.currentLoneQueenEvent?.pieces || []).find((piece) => {
    return piece.square === square && !ignoredPieceIds.includes(piece.id);
  }) || null;
}

function compareLoneQueenPiecesBySquare(pieceA, pieceB) {
  const positionA = parseLoneQueenSquare(pieceA.square);
  const positionB = parseLoneQueenSquare(pieceB.square);

  if (positionA.fileIndex !== positionB.fileIndex) {
    return positionA.fileIndex - positionB.fileIndex;
  }

  return positionA.rank - positionB.rank;
}

function parseLoneQueenSquare(square) {
  return {
    file: square[0],
    fileIndex: LONE_QUEEN_FILES.indexOf(square[0]),
    rank: Number(square.slice(1))
  };
}

function makeLoneQueenSquare(fileIndex, rank) {
  if (!isLoneQueenOnBoard(fileIndex, rank)) {
    return null;
  }

  return `${LONE_QUEEN_FILES[fileIndex]}${rank}`;
}

function isLoneQueenOnBoard(fileIndex, rank) {
  return fileIndex >= 0 && fileIndex < 8 && rank >= 1 && rank <= 8;
}

function getLoneQueenSquareLabel(square, piece) {
  if (!piece) {
    return square;
  }

  const pieceName = piece.id === "player" ? "player queen" : `black ${piece.type}`;
  return `${square}, ${pieceName}`;
}

function capitalizeLoneQueenText(text) {
  return `${text.charAt(0).toUpperCase()}${text.slice(1)}`;
}

function finishLoneQueenEvent(result) {
  const eventData = gameState.currentLoneQueenEvent;

  if (!eventData) {
    return;
  }

  eventData.status = result;
  gameState.currentLoneQueenEvent = null;
  gameState.currentRewardOffers = [];
  gameState.rewardTilePurchased = false;

  tileOffersSection.classList.add("hidden");
  tileOfferContainer.innerHTML = "";
  if (result === "win") {
    inkRewardMessage.textContent = "You captured the king.";
  } else if (result === "stalemate") {
    inkRewardMessage.textContent = "Stalemate.";
  } else {
    inkRewardMessage.textContent = "Your queen was captured.";
  }
  rewardMessage.textContent = "";
  skipRewardButton.classList.remove("hidden");

  renderStats();
  renderInventory();

  showSection("reward");
}
