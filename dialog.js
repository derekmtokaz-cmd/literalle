function getRandomDialogLine(dialogOptions) {
  if (!Array.isArray(dialogOptions) || dialogOptions.length === 0) {
    return "";
  }

  const randomIndex = Math.floor(Math.random() * dialogOptions.length);
  return dialogOptions[randomIndex];
}

function showDialog(dialogSource) {
  if (!dialogSource) {
    hideDialog();
    return;
  }

  const dialogLine = getRandomDialogLine(dialogSource.dialog);

  if (!dialogLine) {
    hideDialog();
    return;
  }

  dialogCard.classList.add("active");

  dialogText.textContent = dialogLine;
  dialogImage.src = dialogSource.dialogImage || "images/lib.png";
  dialogImage.classList.remove("hidden");
}

function hideDialog() {
  dialogCard.classList.remove("active");
  dialogText.textContent = "";
  dialogImage.src = "";
  dialogImage.classList.add("hidden");
}
