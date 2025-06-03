
// src/lib/puzzle-data.ts
// Ensures all puzzles have base_definition and max_level.
// The 'data' and 'solution' fields are part of the puzzle definition.
// 'base_definition.original_data' now holds the original static 'data' for Level 1.
// 'solution' remains the static solution for Level 1.

export interface PuzzleData {
  id: string;
  name: string;
  description: string | null;
  type: 'anagram' | 'missing_symbol' | 'sequence_solver' | 'knights_knaves' | 'alternative_uses' | 'vector_voyage' | 'missing_vowels' | 'placeholder_input' | 'placeholder';
  category: string; // Ensure all puzzles have a category
  subject?: string | null;
  data?: any; // This will be the content for Level 1 (original_data)
  solution?: any; // Solution for Level 1
  xpAward?: number;
  max_level: number;
  base_definition: {
    type: PuzzleData['type'];
    original_data: any; // Store the original 'data' here for L1
    // Potentially add more fields here to guide AI for L2+
  };
  unlock_cost_coins?: number | null;
  is_password_unlockable?: boolean | null;
}

const puzzleDatabase: Record<string, PuzzleData> = {
  word_001: {
    id: 'word_001', name: 'Anagram Hunt (Science)', category: "Word Puzzles",
    description: 'Unscramble these NEET-related terms.', type: 'anagram',
    data: { words: [ { scrambled: 'HPOYSCIT', category: 'Physics' }, { scrambled: 'GEBYOOLI', category: 'Biology' }, { scrambled: 'HRTYSMICE', category: 'Chemistry' } ] },
    solution: { HPOYSCIT: 'PHYSICS', GEBYOOLI: 'BIOLOGY', HRTYSMICE: 'CHEMISTRY' },
    xpAward: 15, max_level: 30, base_definition: { type: 'anagram', original_data: { words: [ { scrambled: 'HPOYSCIT', category: 'Physics' }, { scrambled: 'GEBYOOLI', category: 'Biology' }, { scrambled: 'HRTYSMICE', category: 'Chemistry' } ] } }
  },
  logic_004: {
    id: 'logic_004', name: 'The Missing Symbol', category: "Logic Puzzles",
    description: 'Find the logical operator that completes the equation: 10 ? 2 = 5', type: 'missing_symbol',
    data: { equationParts: ['10', '2', '5'], operators: ['+', '-', '*', '/'] },
    solution: '/',
    xpAward: 10, max_level: 30, base_definition: { type: 'missing_symbol', original_data: { equationParts: ['10', '2', '5'], operators: ['+', '-', '*', '/'] } }
  },
  math_001: {
    id: 'math_001', name: 'The Sequence Solver', category: "Mathematical Challenges",
    description: 'Find the next number in this sequence: 1, 1, 2, 3, 5, 8, ?', type: 'sequence_solver',
    data: { sequence: '1, 1, 2, 3, 5, 8', displaySequence: '1, 1, 2, 3, 5, 8, ?' },
    solution: '13',
    xpAward: 10, max_level: 30, base_definition: { type: 'sequence_solver', original_data: { sequence: '1, 1, 2, 3, 5, 8', displaySequence: '1, 1, 2, 3, 5, 8, ?' } }
  },
  logic_002: {
    id: 'logic_002', name: 'Knights and Knaves', category: "Logic Puzzles",
    description: 'Two islanders, A and B, stand before you. A says, "At least one of us is a Knave." B says nothing. Determine who is a Knight (always tells truth) and who is a Knave (always lies).', type: 'knights_knaves',
    data: { characters: ['A', 'B'], statements: { A: "At least one of us is a Knave."} },
    solution: { A: 'Knight', B: 'Knave' },
    xpAward: 25, max_level: 30, base_definition: { type: 'knights_knaves', original_data: { characters: ['A', 'B'], statements: { A: "At least one of us is a Knave."} } }
  },
  creative_001: {
    id: 'creative_001', name: 'Alternative Uses', category: "Creative Conundrums",
    description: 'List as many alternative uses for a common paperclip as you can in 2 minutes (conceptual time limit).', type: 'alternative_uses',
    data: { item: 'a common paperclip' },
    solution: null,
    xpAward: 10, max_level: 30, base_definition: { type: 'alternative_uses', original_data: { item: 'a common paperclip' } }
  },
  conceptual_phy_001: {
    id: 'conceptual_phy_001', name: 'Vector Voyage', category: "Conceptual Puzzles (NEET Focus)", subject: "Physics",
    description: 'A ship sails 3km East, then 4km North. What is its displacement (magnitude and direction)?', type: 'vector_voyage',
    data: {},
    solution: { magnitude: 5, direction: 53.13, directionUnit: 'degrees North of East' },
    xpAward: 15, max_level: 30, base_definition: { type: 'vector_voyage', original_data: {} }
  },
  word_004: {
    id: 'word_004', name: 'Missing Vowels (Chemistry)', category: "Word Puzzles", subject: "Chemistry",
    description: 'Fill in the missing vowels for these common chemical compound names.', type: 'missing_vowels',
    data: { words: [ { gapped: 'S_LF_R_C _C_D', category: 'Acid' }, { gapped: 'P_T_SS__M P_RM_NG_N_T_', category: 'Salt' }, { gapped: '_TH_N_L', category: 'Alcohol' } ] },
    solution: { 'S_LF_R_C _C_D': 'SULPHURIC ACID', 'P_T_SS__M P_RM_NG_N_T_': 'POTASSIUM PERMANGANATE', '_TH_N_L': 'ETHANOL' },
    xpAward: 15, max_level: 30, base_definition: { type: 'missing_vowels', original_data: { words: [ { gapped: 'S_LF_R_C _C_D', category: 'Acid' }, { gapped: 'P_T_SS__M P_RM_NG_N_T_', category: 'Salt' }, { gapped: '_TH_N_L', category: 'Alcohol' } ] } }
  },
  visual_001: {
    id: 'visual_001', name: 'Spot the Difference', category: "Visual Puzzles",
    description: 'Placeholder images are shown. Imagine finding differences. How many differences are there if there are 3? (Conceptual)', type: 'placeholder_input',
    data: { image1: 'https://placehold.co/400x300/E0E0E0/666666.png?text=Image+A', image2: 'https://placehold.co/400x300/DCDCDC/555555.png?text=Image+B+(Spot+3+Diff)', prompt: "Enter the number of differences you find (Hint: it's 3 for this demo)." },
    solution: '3',
    xpAward: 10, max_level: 30, base_definition: { type: 'placeholder_input', original_data: { image1: 'https://placehold.co/400x300/E0E0E0/666666.png?text=Image+A', image2: 'https://placehold.co/400x300/DCDCDC/555555.png?text=Image+B+(Spot+3+Diff)', prompt: "Enter the number of differences you find (Hint: it's 3 for this demo)." } }
  },
  logic_001: { id: 'logic_001', name: 'The Bridge Crossing Riddle', category: "Logic Puzzles", description: 'Four people need to cross a bridge at night with one flashlight. Minimum time? Submit your strategy and time.', type: 'placeholder_input', data:{prompt:"Enter your strategy and minimum time."}, solution:"Conceptual", xpAward: 20, max_level: 30, base_definition: { type: 'placeholder_input', original_data: {prompt:"Enter your strategy and minimum time."} } },
  logic_003: { id: 'logic_003', name: "Einstein's Riddle (Zebra Puzzle)", category: "Logic Puzzles", description: 'Who owns the zebra? Submit your detailed solution.', type: 'placeholder_input', data:{prompt:"Who owns the zebra and what is their house color, pet, drink, and cigarette brand?"}, solution:"Conceptual", xpAward: 50, max_level: 30, base_definition: { type: 'placeholder_input', original_data: {prompt:"Who owns the zebra and what is their house color, pet, drink, and cigarette brand?"} } },
  logic_005: { id: 'logic_005', name: 'River Crossing Puzzle', category: "Logic Puzzles", description: 'Get the farmer, wolf, goat, and cabbage across the river safely. Describe the steps.', type: 'placeholder_input', data:{prompt:"Describe the sequence of crossings."}, solution:"Conceptual", xpAward: 30, max_level: 30, base_definition: { type: 'placeholder_input', original_data: {prompt:"Describe the sequence of crossings."} } },
  math_002: { id: 'math_002', name: 'Diophantine Dilemma', category: "Mathematical Challenges", description: 'Find integer solutions (x,y) for 3x + 5y = 47. Submit one solution.', type: 'placeholder_input', data:{prompt:"Enter an integer (x,y) solution."}, solution:"Conceptual", xpAward: 40, max_level: 30, base_definition: { type: 'placeholder_input', original_data: {prompt:"Enter an integer (x,y) solution."} } },
  math_003: { id: 'math_003', name: 'The Tower of Hanoi', category: "Mathematical Challenges", description: 'What is the minimum number of moves for 5 disks?', type: 'placeholder_input', data:{prompt:"Minimum moves for 5 disks?"}, solution:"31", xpAward: 20, max_level: 30, base_definition: { type: 'placeholder_input', original_data: {prompt:"Minimum moves for 5 disks?"} } },
  math_004: { id: 'math_004', name: 'Probability Paradox', category: "Mathematical Challenges", description: 'Explain the Monty Hall problem: should you switch doors?', type: 'placeholder_input', data:{prompt:"Explain your reasoning for switching or not."}, solution:"Conceptual", xpAward: 25, max_level: 30, base_definition: { type: 'placeholder_input', original_data: {prompt:"Explain your reasoning for switching or not."} } },
  math_005: { id: 'math_005', name: 'Cryptarithmetic Challenge', category: "Mathematical Challenges", description: 'Solve SEND + MORE = MONEY. What digits do S,E,N,D,M,O,R,Y represent?', type: 'placeholder_input', data:{prompt:"Enter the digit for each letter."}, solution:"Conceptual", xpAward: 35, max_level: 30, base_definition: { type: 'placeholder_input', original_data: {prompt:"Enter the digit for each letter."} } },
  creative_002: { id: 'creative_002', name: 'Story Spark', category: "Creative Conundrums", description: 'Write a short story (max 100 words) using Dragon, Coffee, Starlight.', type: 'placeholder_input', data:{prompt:"Write your short story."}, solution:"Conceptual", xpAward: 15, max_level: 30, base_definition: { type: 'placeholder_input', original_data: {prompt:"Write your short story."} } },
  creative_003: { id: 'creative_003', name: 'Rebus Rally', category: "Creative Conundrums", description: 'What does "MAN BOARD" represent if MAN is standing on the word BOARD? (Conceptual)', type: 'placeholder_input', data:{prompt:"Interpret the rebus."}, solution:"MAN OVERBOARD", xpAward: 10, max_level: 30, base_definition: { type: 'placeholder_input', original_data: {prompt:"Interpret the rebus."} } },
  creative_004: { id: 'creative_004', name: 'Concept Mashup', category: "Creative Conundrums", description: 'Combine "photosynthesis" and "quantum entanglement" into a novel invention idea.', type: 'placeholder_input', data:{prompt:"Describe your invention."}, solution:"Conceptual", xpAward: 30, max_level: 30, base_definition: { type: 'placeholder_input', original_data: {prompt:"Describe your invention."} } },
  creative_005: { id: 'creative_005', name: 'Unusual Invention Design', category: "Creative Conundrums", description: 'Design an invention to automatically sort mismatched socks.', type: 'placeholder_input', data:{prompt:"Describe your sock-sorting invention."}, solution:"Conceptual", xpAward: 20, max_level: 30, base_definition: { type: 'placeholder_input', original_data: {prompt:"Describe your sock-sorting invention."} } },
  conceptual_chem_001: { id: 'conceptual_chem_001', name: 'Balancing Act', category: "Conceptual Puzzles (NEET Focus)", subject: "Chemistry", description: 'Balance: CH4 + O2 -> CO2 + H2O. Enter coefficients (e.g., 1,2,1,2).', type: 'placeholder_input', data:{prompt:"Enter coefficients for CH4, O2, CO2, H2O."}, solution:"1,2,1,2", xpAward: 20, max_level: 30, base_definition: { type: 'placeholder_input', original_data: {prompt:"Enter coefficients for CH4, O2, CO2, H2O."} } },
  conceptual_bio_001: { id: 'conceptual_bio_001', name: 'Genetic Code Cracker', category: "Conceptual Puzzles (NEET Focus)", subject: "Biology", description: 'DNA: TACGGATTCACT. mRNA sequence? (Conceptual)', type: 'placeholder_input', data:{prompt:"Enter the mRNA sequence."}, solution:"AUGCCUAAGUGA", xpAward: 25, max_level: 30, base_definition: { type: 'placeholder_input', original_data: {prompt:"Enter the mRNA sequence."} } },
  conceptual_phy_002: { id: 'conceptual_phy_002', name: 'Energy Transformation', category: "Conceptual Puzzles (NEET Focus)", subject: "Physics", description: 'Describe main energy transformations in a hydroelectric dam.', type: 'placeholder_input', data:{prompt:"List energy transformations."}, solution:"Conceptual", xpAward: 20, max_level: 30, base_definition: { type: 'placeholder_input', original_data: {prompt:"List energy transformations."} } },
  conceptual_chem_002: { id: 'conceptual_chem_002', name: 'Ideal Gas Law Scenario', category: "Conceptual Puzzles (NEET Focus)", subject: "Chemistry", description: 'If pressure of an ideal gas is doubled at constant temperature, what happens to volume?', type: 'placeholder_input', data:{prompt:"What happens to the volume?"}, solution:"HALVED", xpAward: 30, max_level: 30, base_definition: { type: 'placeholder_input', original_data: {prompt:"What happens to the volume?"} } },
  visual_002: { id: 'visual_002', name: 'Optical Illusion Analysis', category: "Visual Puzzles", description: 'Explain the Müller-Lyer illusion (lines with arrowheads).', type: 'placeholder_input', data:{prompt:"Explain the illusion."}, solution:"Conceptual", xpAward: 20, max_level: 30, base_definition: { type: 'placeholder_input', original_data: {prompt:"Explain the illusion."} } },
  visual_003: { id: 'visual_003', name: 'Pattern Recognition', category: "Visual Puzzles", description: 'Square, Circle, Triangle, Square, Circle, ?', type: 'placeholder_input', data:{prompt:"What's the next shape?"}, solution:"TRIANGLE", xpAward: 15, max_level: 30, base_definition: { type: 'placeholder_input', original_data: {prompt:"What's the next shape?"} } },
  visual_004: { id: 'visual_004', name: 'Hidden Object Hunt', category: "Visual Puzzles", description: 'Imagine a cluttered room image. List 3 hidden objects. (Conceptual)', type: 'placeholder_input', data:{prompt:"Name 3 objects you conceptually 'find'."}, solution:"Conceptual", xpAward: 10, max_level: 30, base_definition: { type: 'placeholder_input', original_data: {prompt:"Name 3 objects you conceptually 'find'."} } },
  word_002: { id: 'word_002', name: 'Crossword Challenge (Bio)', category: "Word Puzzles", subject: "Biology", description: 'Clue: Green pigment in plants. (11 letters)', type: 'placeholder_input', data:{prompt:"Enter the 11-letter word."}, solution:"CHLOROPHYLL", xpAward: 20, max_level: 30, base_definition: { type: 'placeholder_input', original_data: {prompt:"Enter the 11-letter word."} } },
  word_003: { id: 'word_003', name: 'Scientific Term Origin', category: "Word Puzzles", description: 'What is the Greek origin of "Biology"? (Logos + ?)', type: 'placeholder_input', data:{prompt:"What does 'Bios' mean?"}, solution:"LIFE", xpAward: 25, max_level: 30, base_definition: { type: 'placeholder_input', original_data: {prompt:"What does 'Bios' mean?"} } },
};

export default puzzleDatabase;
