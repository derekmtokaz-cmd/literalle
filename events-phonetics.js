function buildPhoneticEncounter() {
  return {
    triviaType: "phonetic",
    quote: getRandomPhoneticQuote()
  };
}

function startPhoneticEvent(encounter = buildPhoneticEncounter()) {
  const quote = encounter.quote;

  gameState.currentPhoneticQuote = quote;
  gameState.firstDraftUsedThisPuzzle = false;
  showDialog({
    dialog: ["ɪts ɔl ɡrik tu mi."],
    dialogImage: "images/lib.png"
  });
  phoneticClue.textContent = quote.ipa;
  phoneticMessage.textContent = "";
  resetSubmitButtonAfterRewardProceed(submitPhoneticButton);
  submitPhoneticButton.disabled = false;

  renderPhoneticQuote();
  showSection("phonetic");
}

function getRandomPhoneticQuote() {
  let eligibleQuotes = PHONETIC_QUOTES.filter((quote) => {
    return !gameState.usedPhoneticQuoteIds.includes(quote.id);
  });

  if (eligibleQuotes.length === 0) {
    // If we run out of unused quotes, allow repeats rather than crashing.
    eligibleQuotes = PHONETIC_QUOTES;
  }

  if (eligibleQuotes.length === 0) {
    throw new Error("No phonetic quotes found.");
  }

  const randomIndex = Math.floor(Math.random() * eligibleQuotes.length);
  const selectedQuote = eligibleQuotes[randomIndex];

  if (selectedQuote.id && !gameState.usedPhoneticQuoteIds.includes(selectedQuote.id)) {
    gameState.usedPhoneticQuoteIds.push(selectedQuote.id);
  }

  return selectedQuote;
}


function renderPhoneticQuote() {
  phoneticQuoteContainer.innerHTML = "";

  const quote = gameState.currentPhoneticQuote;

  if (!quote) {
    return;
  }

  const text = quote.answerText || quote.quote;
  let firstInput = null;
  let currentWordSpan = null;

  function startNewWord() {
    currentWordSpan = document.createElement("span");
    currentWordSpan.className = "blank-word";
    phoneticQuoteContainer.appendChild(currentWordSpan);
  }

  startNewWord();

  for (let i = 0; i < text.length; i++) {
    const character = text[i];

    if (/[a-z]/i.test(character)) {
      const input = document.createElement("input");

      input.className = "letter-slot";
      input.maxLength = 1;
      input.dataset.answer = character.toUpperCase();

      input.addEventListener("input", () => {
        input.value = input.value.toUpperCase();

        if (input.value.length === 1) {
          const allInputs = Array.from(
            phoneticQuoteContainer.querySelectorAll(".letter-slot")
          );

          const currentIndex = allInputs.indexOf(input);
          const nextInput = allInputs[currentIndex + 1];

          if (nextInput) {
            nextInput.focus();
          }
        }
      });

      input.addEventListener("keydown", (event) => {
        if (event.key !== "Backspace") {
          return;
        }

        const allInputs = Array.from(
          phoneticQuoteContainer.querySelectorAll(".letter-slot")
        );

        const currentIndex = allInputs.indexOf(input);
        const previousInput = allInputs[currentIndex - 1];

        if (input.value === "" && previousInput && !previousInput.disabled) {
          previousInput.focus();
          previousInput.value = "";
          event.preventDefault();
        }
      });

      if (!firstInput) {
        firstInput = input;
      }

      currentWordSpan.appendChild(input);
    } else if (character === " ") {
      phoneticQuoteContainer.appendChild(document.createTextNode(" "));
      startNewWord();
    } else {
      phoneticQuoteContainer.appendChild(document.createTextNode(character));
    }
  }

  if (firstInput) {
    setTimeout(() => {
      firstInput.focus();
    }, 0);
  }
}

function submitPhoneticAttempt() {
  if (handleSubmitButtonRewardProceed(submitPhoneticButton)) {
    return;
  }

  const inputs = Array.from(
    phoneticQuoteContainer.querySelectorAll(".letter-slot")
  );

  let correct = true;

  inputs.forEach((input) => {
    const guess = input.value.trim().toUpperCase();
    const answer = input.dataset.answer;

    if (guess !== answer) {
      correct = false;
    }
  });

  if (!correct) {
  inputs.forEach((input) => {
    const guess = input.value.trim().toUpperCase();
    const answer = input.dataset.answer;

    if (guess !== answer && !input.disabled) {
      input.value = "";
      input.classList.remove("locked");
    }
  });

  takePuzzleDamage(3);
  renderStats();

  if (handlePlayerDeath()) {
    return;
  }

  phoneticMessage.textContent = "";

  return;
}

  inputs.forEach((input) => {
    input.classList.add("locked");
    input.disabled = true;
  });

phoneticMessage.textContent = "Correct!";
armSubmitButtonForRewardProceed(submitPhoneticButton, () => {
  gameState.currentPhoneticQuote = null;
  startTrinketRewardPhase();
});
}
