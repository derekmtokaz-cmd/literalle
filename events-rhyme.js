const RHYME_VISIBLE_SECONDS = 60;
const RHYME_GRACE_MS = 5000;

let rhymeGraceTimeoutId = null;
let rhymeCountdownIntervalId = null;

function buildRhymeEncounter() {
  const prompt = RHYME_PROMPTS[Math.floor(Math.random() * RHYME_PROMPTS.length)];

  return {
    triviaType: "rhyme",
    prompt
  };
}

function startRhymeEvent(encounter = buildRhymeEncounter()) {
  gameState.firstDraftUsedThisPuzzle = false;
  clearRhymeTimer();

  gameState.currentRhymeEvent = {
    prompt: encounter.prompt,
    targetWord: getRhymePromptTargetWord(encounter.prompt.line),
    foundAnswers: [],
    remainingSeconds: RHYME_VISIBLE_SECONDS,
    active: true
  };

  renderRhymePromptLine(encounter.prompt.line);
  rhymeTimer.textContent = RHYME_VISIBLE_SECONDS;
  rhymeFoundCount.textContent = "0";
  rhymeAnswerInput.value = "";
  rhymeAnswerInput.disabled = false;
  submitRhymeButton.disabled = false;
  rhymeMessage.textContent = "";
  renderRhymeFoundList();

  showDialog({
    dialog: ["The cat, sat on, the mat."],
    dialogImage: "images/lib.png"
  });

  showSection("rhyme");
  rhymeAnswerInput.focus();

  rhymeGraceTimeoutId = setTimeout(() => {
    rhymeGraceTimeoutId = null;
    startRhymeCountdown();
  }, RHYME_GRACE_MS);
}

function startRhymeCountdown() {
  const eventData = gameState.currentRhymeEvent;

  if (!eventData || !eventData.active) {
    return;
  }

  rhymeCountdownIntervalId = setInterval(() => {
    eventData.remainingSeconds -= 1;
    rhymeTimer.textContent = eventData.remainingSeconds;

    if (eventData.remainingSeconds <= 0) {
      completeRhymeEvent();
    }
  }, 1000);
}

function submitRhymeAnswer() {
  const eventData = gameState.currentRhymeEvent;

  if (!eventData || !eventData.active) {
    return;
  }

  const normalizedAnswer = normalizeRhymeAnswer(rhymeAnswerInput.value);
  const acceptedAnswers = eventData.prompt.acceptedAnswers.map((answer) => {
    return normalizeRhymeAnswer(answer);
  });

  if (
    normalizedAnswer &&
    acceptedAnswers.includes(normalizedAnswer) &&
    !eventData.foundAnswers.includes(normalizedAnswer)
  ) {
    eventData.foundAnswers.push(normalizedAnswer);
    rhymeMessage.textContent = "";
    renderRhymeFoundList();
  }

  rhymeAnswerInput.value = "";
  rhymeAnswerInput.focus();
}

function renderRhymePromptLine(line) {
  rhymePromptWord.innerHTML = "";

  const match = String(line).match(/^(.*?)([A-Za-z']+)([^A-Za-z']*)$/);

  if (!match) {
    rhymePromptWord.textContent = line;
    return;
  }

  const beforeTarget = document.createTextNode(match[1]);
  const targetElement = document.createElement("span");
  const afterTarget = document.createTextNode(match[3]);

  targetElement.classList.add("rhyme-target-word");
  targetElement.textContent = match[2];

  rhymePromptWord.appendChild(beforeTarget);
  rhymePromptWord.appendChild(targetElement);
  rhymePromptWord.appendChild(afterTarget);
}

function renderRhymeFoundList() {
  const eventData = gameState.currentRhymeEvent;
  rhymeFoundList.innerHTML = "";
  rhymeFoundCount.textContent = eventData ? eventData.foundAnswers.length : "0";

  if (!eventData) {
    return;
  }

  eventData.foundAnswers.forEach((answer) => {
    const answerElement = document.createElement("div");
    answerElement.classList.add("rhyme-found-answer");
    answerElement.textContent = answer;
    rhymeFoundList.appendChild(answerElement);
  });
}

function completeRhymeEvent() {
  const eventData = gameState.currentRhymeEvent;

  if (!eventData) {
    return;
  }

  const rhymeCount = eventData.foundAnswers.length;
  const goldReward = getRhymeGoldReward(eventData.foundAnswers);

  clearRhymeTimer();
  gameState.currentRhymeEvent = null;
  gameState.currentRewardOffers = [];
  gameState.rewardTilePurchased = false;
  const trinketRewards = getRhymeTrinketRewards(rhymeCount);
  gameState.gold += goldReward;

  tileOffersSection.classList.add("hidden");
  tileOfferContainer.innerHTML = "";
  goldRewardMessage.textContent =
    `You found ${rhymeCount} rhyme${rhymeCount === 1 ? "" : "s"}.`;
  rewardMessage.innerHTML = buildRhymeRewardSummary(trinketRewards, goldReward);
  skipRewardButton.classList.remove("hidden");

  renderStats();
  renderInventory();

  showSection("reward");
}

function getRhymeTrinketRewards(rhymeCount) {
  const trinketCount = rhymeCount >= 20 ? 2 : rhymeCount >= 10 ? 1 : 0;
  const trinketRewards = [];

  for (let i = 0; i < trinketCount; i += 1) {
    const trinket = getRandomTrinket();

    if (!trinket) {
      continue;
    }

    trinketRewards.push(trinket);
    gameState.inventory.push({
      type: "trinket",
      trinketId: trinket.id,
      ...(trinket.id === "babelBag" ? { babelTileCount: 0 } : {})
    });
  }

  return trinketRewards;
}

function getRhymeGoldReward(foundAnswers) {
  const longestLength = foundAnswers.reduce((longest, answer) => {
    return Math.max(longest, answer.length);
  }, 0);

  return Math.max(0, longestLength - 3);
}

function buildRhymeRewardSummary(trinketRewards, goldReward) {
  const rewardMessages = [];

  if (goldReward > 0) {
    rewardMessages.push(`You gained ${goldReward} gold.`);
  }

  if (trinketRewards.length > 0) {
    rewardMessages.push(`You found ${trinketRewards.map((trinket) => {
      return `${trinket.icon} ${escapeRhymeRewardText(trinket.name)}`;
    }).join(", ")}.`);
  }

  if (rewardMessages.length === 0) {
    return "No prize this time.";
  }

  return rewardMessages.join("<br>");
}

function escapeRhymeRewardText(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function normalizeRhymeAnswer(answer) {
  return String(answer)
    .toLowerCase()
    .replace(/[^a-z]/g, "");
}

function getRhymePromptTargetWord(line) {
  const match = String(line).match(/([A-Za-z']+)[^A-Za-z']*$/);
  return match ? normalizeRhymeAnswer(match[1]) : "";
}

function clearRhymeTimer() {
  if (rhymeGraceTimeoutId !== null) {
    clearTimeout(rhymeGraceTimeoutId);
    rhymeGraceTimeoutId = null;
  }

  if (rhymeCountdownIntervalId !== null) {
    clearInterval(rhymeCountdownIntervalId);
    rhymeCountdownIntervalId = null;
  }
}
