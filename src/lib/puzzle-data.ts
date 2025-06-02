import type { PuzzleData } from '@/lib/database.types';

const puzzleDatabase: Record<string, PuzzleData> = {
  word_001: {
    id: 'word_001', name: 'Anagram Hunt (Science)',
    description: 'Unscramble these NEET-related terms.', type: 'anagram',
    data: { words: [ { scrambled: 'HPOYSCIT', category: 'Physics' }, { scrambled: 'GEBYOOLI', category: 'Biology' }, { scrambled: 'HRTYSMICE', category: 'Chemistry' } ] },
    solution: { HPOYSCIT: 'PHYSICS', GEBYOOLI: 'BIOLOGY', HRTYSMICE: 'CHEMISTRY' },
    xpAward: 15,
  },
  logic_004: {
    id: 'logic_004', name: 'The Missing Symbol',
    description: 'Find the logical operator that completes the equation: 10 ? 2 = 5', type: 'missing_symbol',
    data: { equationParts: ['10', '2', '5'], operators: ['+', '-', '*', '/'] },
    solution: '/',
    xpAward: 10,
  },
  math_001: {
    id: 'math_001', name: 'The Sequence Solver',
    description: 'Find the next number in this sequence: 1, 1, 2, 3, 5, 8, ?', type: 'sequence_solver',
    data: { sequence: '1, 1, 2, 3, 5, 8', displaySequence: '1, 1, 2, 3, 5, 8, ?' },
    solution: '13',
    xpAward: 10,
  },
  logic_002: {
    id: 'logic_002', name: 'Knights and Knaves',
    description: 'Two islanders, A and B, stand before you. A says, "At least one of us is a Knave." B says nothing. Determine who is a Knight (always tells truth) and who is a Knave (always lies).', type: 'knights_knaves',
    data: { characters: ['A', 'B'], statements: { A: "At least one of us is a Knave."} },
    solution: { A: 'Knight', B: 'Knave' }, // If A is Knight, statement is true. One is knave (B). If A is Knave, statement is false meaning both are Knights (contradiction).
    xpAward: 25,
  },
  creative_001: {
    id: 'creative_001', name: 'Alternative Uses',
    description: 'List as many alternative uses for a common paperclip as you can in 2 minutes (conceptual time limit).', type: 'alternative_uses',
    data: { item: 'a common paperclip' },
    solution: null, // Subjective
    xpAward: 10, // Conceptual award for participation
  },
  conceptual_phy_001: {
    id: 'conceptual_phy_001', name: 'Vector Voyage',
    description: 'A ship sails 3km East, then 4km North. What is its displacement (magnitude and direction)?', type: 'vector_voyage',
    data: {},
    solution: { magnitude: 5, direction: 53.13, directionUnit: 'degrees North of East' }, // Approx 53.13
    xpAward: 15,
  },
  word_004: {
    id: 'word_004', name: 'Missing Vowels (Chemistry)',
    description: 'Fill in the missing vowels for these common chemical compound names.', type: 'missing_vowels',
    data: { words: [ { gapped: 'S_LF_R_C _C_D', category: 'Acid' }, { gapped: 'P_T_SS__M P_RM_NG_N_T_', category: 'Salt' }, { gapped: '_TH_N_L', category: 'Alcohol' } ] },
    solution: { 'S_LF_R_C _C_D': 'SULPHURIC ACID', 'P_T_SS__M P_RM_NG_N_T_': 'POTASSIUM PERMANGANATE', '_TH_N_L': 'ETHANOL' },
    xpAward: 15,
  },
  visual_001: {
    id: 'visual_001', name: 'Spot the Difference',
    description: 'Placeholder images are shown. Imagine finding differences. How many differences are there if there are 3? (Conceptual)', type: 'placeholder_input',
    data: { image1: 'https://placehold.co/400x300/E0E0E0/666666.png?text=Image+A', image2: 'https://placehold.co/400x300/DCDCDC/555555.png?text=Image+B+(Spot+3+Diff)', prompt: "Enter the number of differences you find (Hint: it's 3 for this demo)." },
    solution: '3',
    xpAward: 10,
  },
  logic_001: { id: 'logic_001', name: 'The Bridge Crossing Riddle', description: 'Four people need to cross a bridge at night with one flashlight. Minimum time? Submit your strategy and time.', type: 'placeholder_input', data:{prompt:"Enter your strategy and minimum time."}, solution:"Conceptual", xpAward: 20 },
  logic_003: { id: 'logic_003', name: "Einstein's Riddle (Zebra Puzzle)", description: 'Who owns the zebra? Submit your detailed solution.', type: 'placeholder_input',data:{prompt:"Who owns the zebra and what is their house color, pet, drink, and cigarette brand?"}, solution:"Conceptual", xpAward: 50 },
  logic_005: { id: 'logic_005', name: 'River Crossing Puzzle', description: 'Get the farmer, wolf, goat, and cabbage across the river safely. Describe the steps.', type: 'placeholder_input',data:{prompt:"Describe the sequence of crossings."}, solution:"Conceptual", xpAward: 30 },
  math_002: { id: 'math_002', name: 'Diophantine Dilemma', description: 'Find integer solutions (x,y) for 3x + 5y = 47. Submit one solution.', type: 'placeholder_input',data:{prompt:"Enter an integer (x,y) solution."}, solution:"Conceptual", xpAward: 40 },
  math_003: { id: 'math_003', name: 'The Tower of Hanoi', description: 'What is the minimum number of moves for 5 disks?', type: 'placeholder_input',data:{prompt:"Minimum moves for 5 disks?"}, solution:"31", xpAward: 20 },
  math_004: { id: 'math_004', name: 'Probability Paradox', description: 'Explain the Monty Hall problem: should you switch doors?', type: 'placeholder_input',data:{prompt:"Explain your reasoning for switching or not."}, solution:"Conceptual", xpAward: 25 },
  math_005: { id: 'math_005', name: 'Cryptarithmetic Challenge', description: 'Solve SEND + MORE = MONEY. What digits do S,E,N,D,M,O,R,Y represent?', type: 'placeholder_input',data:{prompt:"Enter the digit for each letter."}, solution:"Conceptual", xpAward: 35 },
  creative_002: { id: 'creative_002', name: 'Story Spark', description: 'Write a short story (max 100 words) using Dragon, Coffee, Starlight.', type: 'placeholder_input',data:{prompt:"Write your short story."}, solution:"Conceptual", xpAward: 15 },
  creative_003: { id: 'creative_003', name: 'Rebus Rally', description: 'What does "MAN BOARD" represent if MAN is standing on the word BOARD? (Conceptual)', type: 'placeholder_input',data:{prompt:"Interpret the rebus."}, solution:"MAN OVERBOARD", xpAward: 10 },
  creative_004: { id: 'creative_004', name: 'Concept Mashup', description: 'Combine "photosynthesis" and "quantum entanglement" into a novel invention idea.', type: 'placeholder_input',data:{prompt:"Describe your invention."}, solution:"Conceptual", xpAward: 30 },
  creative_005: { id: 'creative_005', name: 'Unusual Invention Design', description: 'Design an invention to automatically sort mismatched socks.', type: 'placeholder_input',data:{prompt:"Describe your sock-sorting invention."}, solution:"Conceptual", xpAward: 20 },
  conceptual_chem_001: { id: 'conceptual_chem_001', name: 'Balancing Act', description: 'Balance: CH4 + O2 -> CO2 + H2O. Enter coefficients (e.g., 1,2,1,2).', type: 'placeholder_input',data:{prompt:"Enter coefficients for CH4, O2, CO2, H2O."}, solution:"1,2,1,2", xpAward: 20 },
  conceptual_bio_001: { id: 'conceptual_bio_001', name: 'Genetic Code Cracker', description: 'DNA: TACGGATTCACT. mRNA sequence? (Conceptual)', type: 'placeholder_input',data:{prompt:"Enter the mRNA sequence."}, solution:"AUGCCUAAGUGA", xpAward: 25 },
  conceptual_phy_002: { id: 'conceptual_phy_002', name: 'Energy Transformation', description: 'Describe main energy transformations in a hydroelectric dam.', type: 'placeholder_input',data:{prompt:"List energy transformations."}, solution:"Conceptual", xpAward: 20 },
  conceptual_chem_002: { id: 'conceptual_chem_002', name: 'Ideal Gas Law Scenario', description: 'If pressure of an ideal gas is doubled at constant temperature, what happens to volume?', type: 'placeholder_input',data:{prompt:"What happens to the volume?"}, solution:"HALVED", xpAward: 30 },
  visual_002: { id: 'visual_002', name: 'Optical Illusion Analysis', description: 'Explain the Müller-Lyer illusion (lines with arrowheads).', type: 'placeholder_input',data:{prompt:"Explain the illusion."}, solution:"Conceptual", xpAward: 20 },
  visual_003: { id: 'visual_003', name: 'Pattern Recognition', description: 'Square, Circle, Triangle, Square, Circle, ?', type: 'placeholder_input',data:{prompt:"What's the next shape?"}, solution:"TRIANGLE", xpAward: 15 },
  visual_004: { id: 'visual_004', name: 'Hidden Object Hunt', description: 'Imagine a cluttered room image. List 3 hidden objects. (Conceptual)', type: 'placeholder_input',data:{prompt:"Name 3 objects you conceptually 'find'."}, solution:"Conceptual", xpAward: 10 },
  word_002: { id: 'word_002', name: 'Crossword Challenge (Bio)', description: 'Clue: Green pigment in plants. (11 letters)', type: 'placeholder_input',data:{prompt:"Enter the 11-letter word."}, solution:"CHLOROPHYLL", xpAward: 20 },
  word_003: { id: 'word_003', name: 'Scientific Term Origin', description: 'What is the Greek origin of "Biology"? (Logos + ?)', type: 'placeholder_input',data:{prompt:"What does 'Bios' mean?"}, solution:"LIFE", xpAward: 25 },
};

export default puzzleDatabase;
