/**
 * Hand-authored Connections puzzles. Each puzzle is 4 themed groups of
 * 4 words, ordered by `difficulty` 0 (easiest, yellow) → 3 (hardest,
 * purple). The daily rotation picks one deterministically by date hash,
 * so the same day shows the same puzzle to everyone in the world.
 *
 * Add more by appending to PUZZLES — they'll be eligible immediately
 * for the rotation. Removing a puzzle shifts the mapping, so prefer
 * to append.
 */

export interface ConnectionsGroup {
  theme: string;
  difficulty: 0 | 1 | 2 | 3;
  words: [string, string, string, string];
}

export interface ConnectionsPuzzle {
  groups: [
    ConnectionsGroup,
    ConnectionsGroup,
    ConnectionsGroup,
    ConnectionsGroup,
  ];
}

export const PUZZLES: ConnectionsPuzzle[] = [
  {
    groups: [
      {
        theme: "Citrus fruits",
        difficulty: 0,
        words: ["LEMON", "LIME", "ORANGE", "GRAPEFRUIT"],
      },
      {
        theme: "Tennis terms",
        difficulty: 1,
        words: ["ACE", "NET", "LOVE", "SERVE"],
      },
      {
        theme: "Apple ___",
        difficulty: 2,
        words: ["PIE", "CORE", "SAUCE", "JUICE"],
      },
      {
        theme: "Bodies of water",
        difficulty: 3,
        words: ["LAKE", "POND", "BAY", "SEA"],
      },
    ],
  },
  {
    groups: [
      {
        theme: "Coffee drinks",
        difficulty: 0,
        words: ["LATTE", "MOCHA", "ESPRESSO", "AMERICANO"],
      },
      {
        theme: "Pasta shapes",
        difficulty: 1,
        words: ["PENNE", "RIGATONI", "FUSILLI", "FARFALLE"],
      },
      {
        theme: "Card games",
        difficulty: 2,
        words: ["POKER", "BRIDGE", "RUMMY", "SOLITAIRE"],
      },
      {
        theme: "Greek letters",
        difficulty: 3,
        words: ["ALPHA", "BETA", "DELTA", "OMEGA"],
      },
    ],
  },
  {
    groups: [
      {
        theme: "Compass points",
        difficulty: 0,
        words: ["NORTH", "SOUTH", "EAST", "WEST"],
      },
      {
        theme: "Sodas",
        difficulty: 1,
        words: ["COKE", "PEPSI", "SPRITE", "FANTA"],
      },
      {
        theme: "Shades of red",
        difficulty: 2,
        words: ["CRIMSON", "SCARLET", "RUBY", "CHERRY"],
      },
      {
        theme: "Chess pieces",
        difficulty: 3,
        words: ["PAWN", "ROOK", "KNIGHT", "BISHOP"],
      },
    ],
  },
  {
    groups: [
      {
        theme: "Types of bread",
        difficulty: 0,
        words: ["RYE", "NAAN", "PITA", "BAGEL"],
      },
      {
        theme: "Continents",
        difficulty: 1,
        words: ["AFRICA", "ASIA", "EUROPE", "AUSTRALIA"],
      },
      {
        theme: "Punctuation",
        difficulty: 2,
        words: ["COMMA", "COLON", "DASH", "PERIOD"],
      },
      {
        theme: "___ Park",
        difficulty: 3,
        words: ["CENTRAL", "JURASSIC", "NATIONAL", "SOUTH"],
      },
    ],
  },
  {
    groups: [
      {
        theme: "Music genres",
        difficulty: 0,
        words: ["JAZZ", "ROCK", "BLUES", "COUNTRY"],
      },
      {
        theme: "Spices",
        difficulty: 1,
        words: ["CUMIN", "PAPRIKA", "OREGANO", "THYME"],
      },
      {
        theme: "Hand tools",
        difficulty: 2,
        words: ["HAMMER", "WRENCH", "DRILL", "SAW"],
      },
      {
        theme: "___ Out",
        difficulty: 3,
        words: ["BLACK", "KNOCK", "SOLD", "TAKE"],
      },
    ],
  },
  {
    groups: [
      {
        theme: "Balls used in sports",
        difficulty: 0,
        words: ["SOCCER", "TENNIS", "BASKETBALL", "BASEBALL"],
      },
      {
        theme: "Yoga poses",
        difficulty: 1,
        words: ["COBRA", "WARRIOR", "BRIDGE", "CHILD"],
      },
      {
        theme: "Constellations",
        difficulty: 2,
        words: ["ORION", "LEO", "TAURUS", "GEMINI"],
      },
      {
        theme: "___ Board",
        difficulty: 3,
        words: ["KEY", "SURF", "CARD", "SKATE"],
      },
    ],
  },
  {
    groups: [
      {
        theme: "Fruits",
        difficulty: 0,
        words: ["APPLE", "BANANA", "CHERRY", "GRAPE"],
      },
      {
        theme: "Dance styles",
        difficulty: 1,
        words: ["SAMBA", "TANGO", "WALTZ", "SALSA"],
      },
      {
        theme: "Shades that share names",
        difficulty: 2,
        words: ["AMBER", "IVORY", "INDIGO", "CORAL"],
      },
      {
        theme: "Sandwich types",
        difficulty: 3,
        words: ["CLUB", "REUBEN", "BLT", "WRAP"],
      },
    ],
  },
  {
    groups: [
      {
        theme: "Car brands",
        difficulty: 0,
        words: ["BMW", "AUDI", "FORD", "TESLA"],
      },
      {
        theme: "Alcoholic drinks",
        difficulty: 1,
        words: ["WINE", "BEER", "WHISKEY", "RUM"],
      },
      {
        theme: "Card suits",
        difficulty: 2,
        words: ["HEARTS", "SPADES", "CLUBS", "DIAMONDS"],
      },
      {
        theme: "Months that are also names",
        difficulty: 3,
        words: ["APRIL", "MAY", "AUGUST", "JUNE"],
      },
    ],
  },
  {
    groups: [
      {
        theme: "European capitals",
        difficulty: 0,
        words: ["PARIS", "LONDON", "MADRID", "ROME"],
      },
      {
        theme: "Olympic sports",
        difficulty: 1,
        words: ["FENCING", "DIVING", "ROWING", "ARCHERY"],
      },
      {
        theme: "Pokemon starters",
        difficulty: 2,
        words: ["PIKACHU", "CHARIZARD", "BULBASAUR", "SQUIRTLE"],
      },
      {
        theme: "Types of knot",
        difficulty: 3,
        words: ["BOWLINE", "SQUARE", "GRANNY", "HALF"],
      },
    ],
  },
  {
    groups: [
      {
        theme: "Currencies",
        difficulty: 0,
        words: ["DOLLAR", "EURO", "YEN", "POUND"],
      },
      {
        theme: "Types of tea",
        difficulty: 1,
        words: ["GREEN", "BLACK", "OOLONG", "CHAMOMILE"],
      },
      {
        theme: "Classic cocktails",
        difficulty: 2,
        words: ["MOJITO", "MARTINI", "NEGRONI", "MARGARITA"],
      },
      {
        theme: "Mononyms",
        difficulty: 3,
        words: ["BEYONCE", "BANKSY", "MADONNA", "BOWIE"],
      },
    ],
  },
];

/** UTC YYYY-MM-DD for today — same semantics as sudoku + wordle daily. */
export function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Deterministic puzzle pick for `dateIso`. FNV-1a hash, same as Wordle —
 * makes the rotation feel uneven enough that consecutive days don't
 * obviously pull adjacent puzzles.
 */
export function puzzleForDate(dateIso: string): ConnectionsPuzzle {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < dateIso.length; i++) {
    h ^= dateIso.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return PUZZLES[h % PUZZLES.length];
}

/**
 * Deterministic Fisher-Yates seeded by the date hash. Every visitor on
 * the same date sees the same starting board layout — important for
 * sharing solve sequences without ambiguity.
 */
export function shuffleForDate(words: string[], dateIso: string): string[] {
  let seed = 0x811c9dc5;
  for (let i = 0; i < dateIso.length; i++) {
    seed ^= dateIso.charCodeAt(i);
    seed = Math.imul(seed, 0x01000193) >>> 0;
  }
  const out = [...words];
  for (let i = out.length - 1; i > 0; i--) {
    seed = (Math.imul(seed, 1103515245) + 12345) >>> 0;
    const j = seed % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
