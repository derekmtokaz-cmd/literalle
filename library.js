function getLibraryPoemSections() {
  return [
    {
      title: "Poems",
      poems: poemDatabase
    },
    {
      title: "Rest Poems",
      poems: restPoemDatabase
    }
  ];
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

  getLibraryPoemSections().forEach((section) => {
    const sectionElement = document.createElement("section");
    sectionElement.classList.add("library-section");

    const heading = document.createElement("h3");
    heading.textContent = section.title;
    sectionElement.appendChild(heading);

    const list = document.createElement("ul");
    list.classList.add("library-poem-list");

    section.poems.forEach((poem) => {
      list.appendChild(createLibraryPoemRow(poem));
    });

    sectionElement.appendChild(list);
    libraryPoemList.appendChild(sectionElement);
  });
}

function openLibraryModal() {
  renderLibraryPoemList();
  libraryModal.classList.remove("hidden");
}

function closeLibraryModal() {
  libraryModal.classList.add("hidden");
}
