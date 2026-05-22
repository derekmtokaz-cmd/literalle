const ARTIFACTS = [
  {
    id: "echo_tile",
    name: "Echo Tile",
    icon: "◌",
    iconImage: "assets/layout/echo%20tile%20icon.png",
    description: "Once per poem puzzle, copy the effect of a random Babel Tile without spending it."
  },
  {
    id: "pen_nib",
    name: "Pen Nib",
    icon: "✒️",
    iconImage: "assets/layout/pen%20nib%20icon.png",
    description: "Once per poem puzzle, reveal the first blank letter."
  },
  {
    id: "first_draft",
    name: "First Draft",
    icon: "🗑️",
    iconImage: "assets/layout/first%20draft%20icon.png",
    description: "Halves the damage from your first incorrect answer each puzzle."
  }
];

function getArtifactById(artifactId) {
  if (typeof ARTIFACTS === "undefined") {
    return null;
  }

  return ARTIFACTS.find((artifact) => artifact.id === artifactId) || null;
}
