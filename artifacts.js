const ARTIFACTS = [
  {
    id: "echo_tile",
    name: "Echo Tile",
    icon: "◌",
    description: "Once per poem puzzle, copy the effect of a random Babel Tile without spending it."
  },
  {
    id: "pen_nib",
    name: "Pen Nib",
    icon: "✒️",
    description: "Once per poem puzzle, reveal the first blank letter."
  },
  {
    id: "first_draft",
    name: "First Draft",
    icon: "🗑️",
    description: "Halves the damage from your first incorrect answer each puzzle."
  }
];

function getArtifactById(artifactId) {
  if (typeof ARTIFACTS === "undefined") {
    return null;
  }

  return ARTIFACTS.find((artifact) => artifact.id === artifactId) || null;
}
