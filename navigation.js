/* ---------------- NAVIGATION ---------------- */

function showSection(sectionName) {
  if (sectionName !== "event") {
    eventSection.classList.remove("rest-mode");
  }

  startSection.classList.add("hidden");
  boardSection.classList.add("hidden");
  eventSection.classList.add("hidden");
  easyASection.classList.add("hidden");
  rewardSection.classList.add("hidden");
  eraserSection.classList.add("hidden");
  authorDateSection.classList.add("hidden");
  detectiveSection.classList.add("hidden");
  fanficSection.classList.add("hidden");
  shakespeareSection.classList.add("hidden");
  timedShakespeareSection.classList.add("hidden");
  loquaciousSection.classList.add("hidden");
  matchmakerSection.classList.add("hidden");
  rhymeSection.classList.add("hidden");
  authorleSection.classList.add("hidden");
  murdleSection.classList.add("hidden");
  loneQueenSection.classList.add("hidden");
  phoneticSection.classList.add("hidden");
  litcanonSection.classList.add("hidden");

  if (sectionName === "start") {
    startSection.classList.remove("hidden");
  }

  if (sectionName === "board") {
    boardSection.classList.remove("hidden");
  }

  if (sectionName === "event") {
    eventSection.classList.remove("hidden");
  }

  if (sectionName === "easyA") {
    easyASection.classList.remove("hidden");
  }

  if (sectionName === "reward") {
    rewardSection.classList.remove("hidden");
  }

  if (sectionName === "eraser") {
    eraserSection.classList.remove("hidden");
  }

  if (sectionName === "authorDate") {
    authorDateSection.classList.remove("hidden");
  }

  if (sectionName === "detective") {
    detectiveSection.classList.remove("hidden");
  }

  if (sectionName === "fanfic") {
    fanficSection.classList.remove("hidden");
  }

  if (sectionName === "shakespeare") {
    shakespeareSection.classList.remove("hidden");
  }

  if (sectionName === "timedShakespeare") {
    timedShakespeareSection.classList.remove("hidden");
  }

  if (sectionName === "loquacious") {
    loquaciousSection.classList.remove("hidden");
  }

  if (sectionName === "matchmaker") {
    matchmakerSection.classList.remove("hidden");
  }

  if (sectionName === "rhyme") {
    rhymeSection.classList.remove("hidden");
  }

  if (sectionName === "authorle") {
    authorleSection.classList.remove("hidden");
  }

  if (sectionName === "murdle") {
    murdleSection.classList.remove("hidden");
  }

  if (sectionName === "loneQueen") {
    loneQueenSection.classList.remove("hidden");
  }

  if (sectionName === "phonetic") {
    phoneticSection.classList.remove("hidden");
  }

  if (sectionName === "litcanon") {
    litcanonSection.classList.remove("hidden");
  }

  if (
    sectionName === "board" ||
    (sectionName === "start" && gameState.currentPuzzleMode !== "death")
  ) {
    hideDialog();
  }

  renderInventory();
}
