const MURDLE_WORD_LENGTH = 5;
const MURDLE_MAX_GUESSES = 6;
const MURDLE_FAILURE_DAMAGE = 5;

function buildMurdleEncounter() {
  const prompt = MURDLE_PROMPTS[Math.floor(Math.random() * MURDLE_PROMPTS.length)];

  return {
    triviaType: "murdle",
    prompt
  };
}

function startMurdleEvent(encounter = buildMurdleEncounter()) {
  gameState.currentMurdleEvent = {
    prompt: encounter.prompt,
    answer: normalizeMurdleGuess(encounter.prompt.answer),
    guesses: [],
    complete: false
  };
  gameState.lastEventType = "murdle";
  gameState.firstDraftUsedThisPuzzle = false;

  showDialog({
    dialog: ["I never slur my speech. I only have a great vowel shift."],
    dialogImage: "images/libchaucer.png"
  });

  murdlePromptLine.textContent = encounter.prompt.displayLine;
  murdleAnswerInput.value = "";
  murdleAnswerInput.maxLength = MURDLE_WORD_LENGTH;
  murdleAnswerInput.disabled = false;
  submitMurdleButton.disabled = false;
  murdleMessage.textContent = "";

  renderMurdleGrid();
  showSection("murdle");
  murdleAnswerInput.focus();
}

function renderMurdleGrid() {
  const eventData = gameState.currentMurdleEvent;
  murdleGrid.innerHTML = "";

  for (let rowIndex = 0; rowIndex < MURDLE_MAX_GUESSES; rowIndex += 1) {
    const row = document.createElement("div");
    row.classList.add("murdle-row");

    const guessData = eventData?.guesses[rowIndex] || null;

    for (let cellIndex = 0; cellIndex < MURDLE_WORD_LENGTH; cellIndex += 1) {
      const cell = document.createElement("div");
      cell.classList.add("murdle-cell");

      if (guessData) {
        cell.textContent = guessData.guess[cellIndex].toUpperCase();
        cell.classList.add(`murdle-cell-${guessData.feedback[cellIndex]}`);
      }

      row.appendChild(cell);
    }

    murdleGrid.appendChild(row);
  }
}

function submitMurdleGuess() {
  const eventData = gameState.currentMurdleEvent;

  if (!eventData || eventData.complete) {
    return;
  }

  const guess = normalizeMurdleGuess(murdleAnswerInput.value);

  if (guess.length !== MURDLE_WORD_LENGTH) {
    murdleMessage.textContent = "Enter a five-letter word.";
    murdleAnswerInput.value = "";
    murdleAnswerInput.focus();
    return;
  }

  if (!isMurdleAcceptedWord(guess)) {
    murdleMessage.textContent = "That word is not in the Murdle word list.";
    murdleAnswerInput.value = "";
    murdleAnswerInput.focus();
    return;
  }

  const feedback = getMurdleFeedback(guess, eventData.answer);
  eventData.guesses.push({ guess, feedback });
  murdleAnswerInput.value = "";
  murdleMessage.textContent = "";
  renderMurdleGrid();

  if (guess === eventData.answer) {
    completeMurdleSuccess();
    return;
  }

  if (eventData.guesses.length >= MURDLE_MAX_GUESSES) {
    completeMurdleFailure();
    return;
  }

  murdleAnswerInput.focus();
}

function getMurdleFeedback(guess, answer) {
  const feedback = Array(MURDLE_WORD_LENGTH).fill("absent");
  const remainingLetters = {};

  for (let index = 0; index < MURDLE_WORD_LENGTH; index += 1) {
    if (guess[index] === answer[index]) {
      feedback[index] = "correct";
    } else {
      remainingLetters[answer[index]] = (remainingLetters[answer[index]] || 0) + 1;
    }
  }

  for (let index = 0; index < MURDLE_WORD_LENGTH; index += 1) {
    if (feedback[index] === "correct") {
      continue;
    }

    const letter = guess[index];

    if (remainingLetters[letter] > 0) {
      feedback[index] = "present";
      remainingLetters[letter] -= 1;
    }
  }

  return feedback;
}

function completeMurdleSuccess() {
  gameState.currentMurdleEvent = null;
  startTrinketRewardPhase();
}

function completeMurdleFailure() {
  const eventData = gameState.currentMurdleEvent;
  const answer = eventData.answer;

  gameState.currentMurdleEvent = null;
  gameState.hp = Math.max(0, gameState.hp - MURDLE_FAILURE_DAMAGE);
  renderStats();

  if (handlePlayerDeath()) {
    return;
  }

  gameState.currentRewardOffers = [];
  gameState.rewardTilePurchased = false;
  tileOffersSection.classList.add("hidden");
  tileOfferContainer.innerHTML = "";
  goldRewardMessage.textContent = `The answer was ${answer}.`;
  rewardMessage.textContent = `You lost ${MURDLE_FAILURE_DAMAGE} HP.`;
  skipRewardButton.classList.remove("hidden");

  renderInventory();
  showSection("reward");
}

function normalizeMurdleGuess(guess) {
  return String(guess)
    .toLowerCase()
    .replace(/[^a-z]/g, "");
}

function isMurdleAcceptedWord(word) {
  return MURDLE_ACCEPTED_WORDS_SET.has(normalizeMurdleGuess(word));
}
