function createBabelTile(letters) {
  const normalizedLetters = Array.isArray(letters) ? letters : [letters];
  const tileLetters = normalizedLetters
    .flatMap((letter) => String(letter).split("|"))
    .map((letter) => String(letter).toUpperCase())
    .map((letter) => letter.trim())
    .filter((letter) => letter.length > 0);

  return {
    type: "babelTile",
    tier: tileLetters.length,
    letters: tileLetters,
    letter: tileLetters[0] || ""
  };
}

function isBabelTile(item) {
  return item && item.type === "babelTile";
}

function getBabelTileLetters(tile) {
  if (!isBabelTile(tile)) {
    return [];
  }

  if (Array.isArray(tile.letters) && tile.letters.length > 0) {
    return tile.letters;
  }

  return tile.letter ? [tile.letter] : [];
}

function getBabelTileTier(tile) {
  return getBabelTileLetters(tile).length;
}

function getBabelTileName(tile) {
  return "Babel Tile";
}

function getBabelTileLabel(tile) {
  return getBabelTileLetters(tile).join("|");
}

function getBabelTileLetterList(tile) {
  return getBabelTileLetters(tile)
    .map((letter) => `${letter}s`)
    .join(" and ");
}

function getBabelTileCost(letters, discount = 0) {
  const tileLetters = createBabelTile(letters).letters;
  const letterCosts = tileLetters
    .map((letter) => letterCostMap[letter])
    .filter((cost) => typeof cost === "number")
    .sort((a, b) => b - a);

  if (letterCosts.length === 0) {
    return 0;
  }

  const baseCost =
    letterCosts.length === 1
      ? letterCosts[0]
      : letterCosts[0] + Math.floor(letterCosts[1] / 2);

  return Math.max(0, baseCost - discount);
}
