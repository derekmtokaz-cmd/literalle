function shuffleArray(array) {
  const shuffled = [...array];

  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const randomIndex = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[i]];
  }

  return shuffled;
}

function hasArtifact(artifactId) {
  return gameState.inventory.some((item) => {
    return item.type === "artifact" && item.artifactId === artifactId;
  });
}

function takePuzzleDamage(damage) {
  let finalDamage = damage;

  if (
    damage > 0 &&
    hasArtifact("first_draft") &&
    !gameState.firstDraftUsedThisPuzzle
  ) {
    finalDamage = Math.ceil(damage / 2);
    gameState.firstDraftUsedThisPuzzle = true;
  }

  gameState.hp = Math.max(0, gameState.hp - finalDamage);

  if (typeof renderInventory === "function") {
    renderInventory();
  }

  return finalDamage;
}
