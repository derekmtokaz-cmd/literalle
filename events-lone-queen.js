const LONE_QUEEN_FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];
const LONE_QUEEN_RANKS = [8, 7, 6, 5, 4, 3, 2, 1];
const LONE_QUEEN_MOVE_TYPES = ["pawn", "knight", "bishop"];
const LONE_QUEEN_PROMOTION_ORDER = ["knight", "bishop", "rook", "queen"];
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
  const pawnFiles = shuffleArray(LONE_QUEEN_FILES).slice(0, 4);

  pawnFiles.forEach((file) => {
    pieces.push(createLoneQueenPiece(`black-pawn-${file}7`, "pawn", `${file}7`));
  });

  return pieces;
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
    button.disabled = !eventData || eventData.status !== "playing";
  });
}

function selectLoneQueenMoveType(moveType) {
  const eventData = gameState.currentLoneQueenEvent;

  if (!eventData || eventData.status !== "playing" || !LONE_QUEEN_MOVE_TYPES.includes(moveType)) {
    return;
  }

  eventData.selectedMoveType = moveType;
  eventData.legalPlayerMoves = getLoneQueenPlayerLegalMoves(moveType);
  eventData.message = `Moving as ${moveType}.`;
  renderLoneQueenEvent();
}

function moveLoneQueenPlayerTo(square) {
  const eventData = gameState.currentLoneQueenEvent;

  if (
    !eventData ||
    eventData.status !== "playing" ||
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
  eventData.legalPlayerMoves = [];
  eventData.message = `Black ${eventData.announcedType}s move.`;
  renderLoneQueenEvent();

  runLoneQueenBlackTurn();
}

function runLoneQueenBlackTurn() {
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

  for (const piece of activatedPieces) {
    if (!eventData.pieces.includes(piece)) {
      continue;
    }

    if (canLoneQueenBlackPieceCapturePlayer(piece)) {
      finishLoneQueenEvent("loss");
      return;
    }

    moveLoneQueenBlackPiece(piece, rookMoveState);
  }

  eventData.message = "Choose how the queen moves this turn.";
  announceNextLoneQueenType();
  renderLoneQueenEvent();
}

function moveLoneQueenBlackPiece(piece, rookMoveState) {
  if (piece.type === "pawn") {
    moveLoneQueenBlackPawn(piece);
    return;
  }

  if (piece.type === "knight") {
    moveLoneQueenPieceToRandomSquare(piece, getLoneQueenKnightMoves(piece.square).filter((square) => {
      const position = parseLoneQueenSquare(square);
      return (
        !isLoneQueenRimSquare(square) &&
        !getLoneQueenPieceAt(square) &&
        position.rank >= 2 &&
        position.rank <= 7
      );
    }));
    return;
  }

  if (piece.type === "bishop") {
    moveLoneQueenPieceToRandomSquare(piece, getLoneQueenSlidingMoves(piece.square, getLoneQueenBishopDirections()));
    return;
  }

  if (piece.type === "rook") {
    moveLoneQueenBlackRook(piece, rookMoveState);
    return;
  }

  if (piece.type === "queen") {
    moveLoneQueenBlackQueen(piece);
    return;
  }

  if (piece.type === "king") {
    moveLoneQueenBlackKing(piece);
  }
}

function moveLoneQueenBlackPawn(piece) {
  const position = parseLoneQueenSquare(piece.square);
  const oneStep = makeLoneQueenSquare(position.fileIndex, position.rank - 1);

  if (!oneStep || getLoneQueenPieceAt(oneStep)) {
    return;
  }

  if (position.rank === 7) {
    const twoStep = makeLoneQueenSquare(position.fileIndex, position.rank - 2);

    if (twoStep && !getLoneQueenPieceAt(twoStep)) {
      piece.square = twoStep;
      maybePromoteLoneQueenPawn(piece);
      return;
    }
  }

  piece.square = oneStep;
  maybePromoteLoneQueenPawn(piece);
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

function moveLoneQueenBlackRook(piece, rookMoveState) {
  const allMoves = getLoneQueenSlidingMoves(piece.square, getLoneQueenRookDirections());
  let candidateMoves = allMoves;

  if (rookMoveState.processedRooks === 1 && rookMoveState.firstAxis) {
    const oppositeAxis = rookMoveState.firstAxis === "file" ? "rank" : "file";
    candidateMoves = allMoves.filter((square) => {
      return getLoneQueenMoveAxis(piece.square, square) === oppositeAxis;
    });
  }

  const moved = moveLoneQueenPieceToRandomSquare(piece, candidateMoves);

  if (moved && rookMoveState.processedRooks === 0) {
    rookMoveState.firstAxis = getLoneQueenMoveAxis(moved.from, moved.to);
  }

  rookMoveState.processedRooks += 1;
}

function moveLoneQueenBlackQueen(piece) {
  const player = getLoneQueenPlayerPiece();

  if (!player) {
    return;
  }

  const legalMoves = getLoneQueenSlidingMoves(piece.square, [
    ...getLoneQueenBishopDirections(),
    ...getLoneQueenRookDirections()
  ]);

  if (legalMoves.length === 0) {
    return;
  }

  const bestDistance = Math.min(...legalMoves.map((square) => {
    return getLoneQueenDistance(square, player.square);
  }));
  piece.square = getRandomItem(legalMoves.filter((square) => {
    return getLoneQueenDistance(square, player.square) === bestDistance;
  }));
}

function moveLoneQueenBlackKing(piece) {
  const castleMove = getBestLoneQueenCastleMove(piece);

  if (castleMove) {
    piece.square = castleMove.kingTo;
    castleMove.rook.square = castleMove.rookTo;
    return;
  }

  const player = getLoneQueenPlayerPiece();

  if (!player) {
    return;
  }

  const adjacentMoves = getLoneQueenKingMoves(piece.square).filter((square) => {
    return !getLoneQueenPieceAt(square) && isLoneQueenOrthogonallyAdjacent(square, player.square);
  });

  if (adjacentMoves.length > 0) {
    piece.square = getRandomItem(adjacentMoves);
    return;
  }

  const currentDistance = getLoneQueenDistance(piece.square, player.square);
  const awayMoves = getLoneQueenKingMoves(piece.square).filter((square) => {
    return !getLoneQueenPieceAt(square) && getLoneQueenDistance(square, player.square) > currentDistance;
  });

  if (awayMoves.length === 0) {
    return;
  }

  const bestDistance = Math.max(...awayMoves.map((square) => {
    return getLoneQueenDistance(square, player.square);
  }));
  piece.square = getRandomItem(awayMoves.filter((square) => {
    return getLoneQueenDistance(square, player.square) === bestDistance;
  }));
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

function moveLoneQueenPieceToRandomSquare(piece, legalMoves) {
  if (legalMoves.length === 0) {
    return null;
  }

  const from = piece.square;
  const to = getRandomItem(legalMoves);
  piece.square = to;

  return { from, to };
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
  goldRewardMessage.textContent =
    result === "win" ? "You captured the king." : "Your queen was captured.";
  rewardMessage.textContent = "";
  skipRewardButton.classList.remove("hidden");

  renderStats();
  renderInventory();

  showSection("reward");
}
