function getLibraryPoems() {
  return [...poemDatabase, ...restPoemDatabase].sort((firstPoem, secondPoem) =>
    firstPoem.title.localeCompare(secondPoem.title)
  );
}

function createLibraryPoemRow(poem) {
  const row = document.createElement("li");
  row.classList.add("library-poem-row");

  const details = document.createElement("div");
  details.classList.add("library-poem-details");

  const title = document.createElement("span");
  title.classList.add("library-poem-title");
  title.textContent = poem.title;

  const author = document.createElement("span");
  author.classList.add("library-poem-author");
  author.textContent = poem.author;

  details.append(title, author);
  row.appendChild(details);

  const linkData = POEM_LIBRARY_LINKS[poem.id] || { url: null, source: null };

  if (linkData.url) {
    const link = document.createElement("a");
    link.classList.add("library-poem-link");
    link.href = linkData.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = linkData.source ? `Read at ${linkData.source}` : "Read text";
    row.appendChild(link);
  } else {
    const missing = document.createElement("span");
    missing.classList.add("library-link-needed");
    missing.textContent = "Link needed";
    row.appendChild(missing);
  }

  return row;
}

function renderLibraryPoemList() {
  libraryPoemList.innerHTML = "";

  const list = document.createElement("ul");
  list.classList.add("library-poem-list");

  getLibraryPoems().forEach((poem) => {
    list.appendChild(createLibraryPoemRow(poem));
  });

  libraryPoemList.appendChild(list);
}

function openLibraryConfirmationModal() {
  libraryConfirmModal.classList.remove("hidden");
}

function closeLibraryConfirmationModal() {
  libraryConfirmModal.classList.add("hidden");
}

function openLibraryModal() {
  renderLibraryPoemList();
  libraryModal.classList.remove("hidden");
}

function startAgainFromLibrary() {
  libraryModal.classList.add("hidden");
  restartGame();
}

function confirmLibraryProceed() {
  closeLibraryConfirmationModal();
  restartGame();
  openLibraryModal();
}

function openHowToPlayModal() {
  howToPlayModal.classList.remove("hidden");
}

function closeHowToPlayModal() {
  howToPlayModal.classList.add("hidden");
}
