const letterCostMap = {
  E: 7, T: 7, A: 7, O: 7, N: 7, R: 7, S: 7,
  I: 5, H: 5, D: 5, L: 5,
  C: 3, U: 3, M: 3, W: 3, F: 3, G: 3, Y: 3,
  P: 2, B: 2, V: 2, K: 2,
  J: 1, X: 1, Q: 1, Z: 1
};

const alphabet = Object.keys(letterCostMap);

const gameState = {
  currentFloor: 1,
  hp: 100,
  maxHp: 100,
  gold: 3,
  inventory: [],
  currentNodeId: "start",
  completedNodeIds: [],
  availableNodeIds: [],
  runPath: [],
  currentFloorSeedSignature: "",
  floorPoemSeedIdsByFloor: {},
  currentPuzzle: null,
  currentPuzzleMode: null,
  lastEventType: null,
  echoTileUsedThisPuzzle: false,
  penNibUsedThisPuzzle: false,
  currentAuthorDateEvent: null,
  currentDetectiveEvent: null,
  currentFanficEvent: null,
  currentPhoneticQuote: null,
  currentLitcanonEvent: null,
  currentKjvEncounter: null,
  currentKjvDifficulty: null,
  currentRewardOffers: [],
  prophecyUsedThisFloor: false,
  firstDraftUsedThisPuzzle: false,
  pendingReplyReward: false,
  usedPoemIds: [],
  usedPhoneticQuoteIds: [],
  developerMode: false,
};

const pathSpaces = [
  { id: "start", column: 0, lane: 1, type: "start", icon: "◆", connections: ["c1-top", "c1-mid", "c1-bot"] },

  { id: "c1-top", column: 1, lane: 0, type: "poem", icon: "✒️", connections: ["c2-top"] },
  { id: "c1-mid", column: 1, lane: 1, type: "poem", icon: "✒️", connections: ["c2-top", "c2-mid"] },
  { id: "c1-bot", column: 1, lane: 2, type: "trivia", icon: "?", connections: ["c2-mid", "c2-bot"] },

  { id: "c2-top", column: 2, lane: 0, type: "trivia", icon: "?", connections: ["c3-top", "c3-mid"] },
  { id: "c2-mid", column: 2, lane: 1, type: "kjv", icon: "KJV", connections: ["c3-mid"] },
  { id: "c2-bot", column: 2, lane: 2, type: "rest", icon: "❤️", connections: ["c3-mid", "c3-bot"] },

  { id: "c3-top", column: 3, lane: 0, type: "poem", icon: "✒️", connections: ["c4-top"] },
  { id: "c3-mid", column: 3, lane: 1, type: "merchant", icon: "🧳", connections: ["c4-top", "c4-mid", "c4-bot"] },
  { id: "c3-bot", column: 3, lane: 2, type: "trivia", icon: "?", connections: ["c4-bot"] },

  { id: "c4-top", column: 4, lane: 0, type: "elite", icon: "⚔️", connections: ["c5-top", "c5-mid"] },
  { id: "c4-mid", column: 4, lane: 1, type: "poem", icon: "✒️", connections: ["c5-mid"] },
  { id: "c4-bot", column: 4, lane: 2, type: "poem", icon: "✒️", connections: ["c5-mid", "c5-bot"] },

  { id: "c5-top", column: 5, lane: 0, type: "trivia", icon: "?", connections: ["c6-top"] },
  { id: "c5-mid", column: 5, lane: 1, type: "rest", icon: "❤️", connections: ["c6-top", "c6-mid"] },
  { id: "c5-bot", column: 5, lane: 2, type: "elite", icon: "⚔️", connections: ["c6-mid", "c6-bot"] },

  { id: "c6-top", column: 6, lane: 0, type: "poem", icon: "✒️", connections: ["c7-top", "c7-mid"] },
  { id: "c6-mid", column: 6, lane: 1, type: "kjv", icon: "KJV", connections: ["c7-mid"] },
  { id: "c6-bot", column: 6, lane: 2, type: "poem", icon: "✒️", connections: ["c7-mid", "c7-bot"] },

  { id: "c7-top", column: 7, lane: 0, type: "rest", icon: "❤️", connections: ["c8-top"] },
  { id: "c7-mid", column: 7, lane: 1, type: "poem", icon: "✒️", connections: ["c8-top", "c8-mid", "c8-bot"] },
  { id: "c7-bot", column: 7, lane: 2, type: "trivia", icon: "?", connections: ["c8-bot"] },

  { id: "c8-top", column: 8, lane: 0, type: "elite", icon: "⚔️", connections: ["c9-top", "c9-mid"] },
  { id: "c8-mid", column: 8, lane: 1, type: "merchant", icon: "🧳", connections: ["c9-mid"] },
  { id: "c8-bot", column: 8, lane: 2, type: "poem", icon: "✒️", connections: ["c9-mid", "c9-bot"] },

  { id: "c9-top", column: 9, lane: 0, type: "poem", icon: "✒️", connections: ["c10-top"] },
  { id: "c9-mid", column: 9, lane: 1, type: "rest", icon: "❤️", connections: ["c10-top", "c10-mid", "c10-bot"] },
  { id: "c9-bot", column: 9, lane: 2, type: "trivia", icon: "?", connections: ["c10-bot"] },

  { id: "c10-top", column: 10, lane: 0, type: "poem", icon: "✒️", connections: ["boss"] },
  { id: "c10-mid", column: 10, lane: 1, type: "elite", icon: "⚔️", connections: ["boss"] },
  { id: "c10-bot", column: 10, lane: 2, type: "rest", icon: "❤️", connections: ["boss"] },

  { id: "boss", column: 11, lane: 1, type: "boss", icon: "👑", connections: [] }
];

const currentPathSpaces = [
  { id: "start", column: 0, lane: 1, type: "start", icon: "◆", connections: ["poem-1"] },

  { id: "poem-1", column: 1, lane: 1, type: "poem", icon: "📖", connections: ["poem-2"] },
  { id: "poem-2", column: 2, lane: 1, type: "poem", icon: "📖", connections: ["poem-3"] },
  { id: "poem-3", column: 3, lane: 1, type: "poem", icon: "📖", connections: ["option-1-trivia", "option-1-special"] },

  { id: "option-1-trivia", column: 4, lane: 0, type: "trivia", icon: "?", connections: ["poem-4"] },
  { id: "option-1-special", column: 4, lane: 2, type: "option1Special", icon: "", connections: ["poem-4"] },

  { id: "poem-4", column: 5, lane: 1, type: "poem", icon: "📖", connections: ["poem-5"] },
  { id: "poem-5", column: 6, lane: 1, type: "poem", icon: "📖", connections: ["option-2-special", "option-2-rest"] },

  { id: "option-2-special", column: 7, lane: 0, type: "option2Special", icon: "", connections: ["boss"] },
  { id: "option-2-rest", column: 7, lane: 2, type: "rest", icon: "❤️", connections: ["boss"] },

  { id: "boss", column: 8, lane: 1, type: "boss", icon: "📖", connections: [] }
];

const startPuzzleData = {
  title: "Opening Trial",
  author: "Ezra Pound",
  work: "Hugh Selwyn Mauberley (Part I)",
  lines: [
    "For three years, out of key with his time,",
    "He strove to resuscitate the dead art",
    "Of poetry; to maintain “the sublime”",
    "In the old sense. Wrong from the start—"
  ],
  missingWords: [
    { lineIndex: 3, wordIndex: 7 }
  ]
};

const floorStartPuzzleData = {
  1: startPuzzleData,
  2: {
    title: "Opening Trial",
    author: "Edgar Allan Poe",
    work: "The Raven",
    lines: [
      "Once upon a midnight dreary, while I pondered, weak and weary,",
      "Over many a quaint and curious volume of forgotten lore—",
      "    While I nodded, nearly napping, suddenly there came a tapping,",
      "As of some one gently rapping, rapping at my chamber door.",
      "“’Tis some visitor,” I muttered, “tapping at my chamber door—",
      "            Only this and nothing more.”"
    ],
    missingWords: [
      { lineIndex: 5, wordIndex: 4 }
    ]
  }
};

const deathPuzzleData = {
  title: "Death",
  author: "Emily Dickinson",
  work: "479 (Franklin edition), 712 (Johnson edition)",
  lines: [
    "Because I could not stop for Death –",
    "He kindly stopped for me –",
    "The Carriage held but just Ourselves –",
    "And Immortality."
  ],
  missingWords: [
    { lineIndex: 0, wordIndex: 6 }
  ]
};
