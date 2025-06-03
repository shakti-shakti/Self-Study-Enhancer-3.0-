
// src/lib/story-data.ts

export interface Chapter {
  id: string;
  name: string;
  level_hint?: string;
  quest: string;
  locked: boolean; 
  unlock_cost_coins?: number | null;
  is_password_unlockable?: boolean | null; 
  story_summary?: string;
}

export interface SyllabusRealm {
  id: string;
  name: string;
  subject: string;
  icon: React.ReactNode; // Keep as ReactNode for now if icons are complex SVGs/components
  description: string;
  chapters: Chapter[];
  imageUrl: string;
  dataAiHint?: string;
}

// Initial static data for realms and chapters
// Note: Lucide icons cannot be directly serialized in this data structure for server-side components or pure data files.
// For client-side rendering, you might pass icon names and map them to components.
// For simplicity here, I'll remove the direct ReactNode for icons if this data is meant to be more "pure".
// If icons are only used client-side, the previous approach can work if this file is only imported by client components.
// For now, I'm assuming client-side usage where ReactNode is acceptable. If this causes issues with server components,
// we'd need to change `icon` to be a string identifier.

// To make it simple and avoid complex icon imports here, let's use string placeholders for icons
// which can be mapped to actual Lucide components in the rendering component.
// However, the original prompt used actual Lucide components. I'll keep it as is,
// assuming this file is used client-side where React context is available.

import { Zap, Atom, Leaf } from 'lucide-react'; // Example, ideally icons are handled differently for pure data

export const initialSyllabusRealms: SyllabusRealm[] = [
  {
    id: 'physics_realm',
    name: 'The Realm of Motion & Energy',
    subject: 'Physics',
    icon: '<Zap />', // Placeholder string, or keep as ReactNode if client-only
    description: "Unravel the fundamental forces that govern the cosmos. From the smallest particles to the grandest galaxies, master the laws of motion, energy, and light.",
    chapters: [
      { id: 'phy_ch1', name: 'The Oracle of Kinematics', level_hint: "Foundational", quest: 'Chart the Path of Falling Stars', locked: false, story_summary: "Ancient scrolls speak of a celestial event where stars fall. Your quest is to predict their trajectory using the laws of kinematics before they impact the Chronos Temple." },
      { id: 'phy_ch2', name: 'The Labyrinth of Forces', level_hint: "Foundational", quest: 'Balance the Scales of Newton', locked: false, story_summary: "A mystical labyrinth shifts its walls based on unbalanced forces. Master Newton's Laws to navigate its treacherous paths and find the Amulet of Equilibrium." },
      { id: 'phy_ch3', name: 'The Sunstone of Power', level_hint: "Intermediate", quest: 'Harness the Work-Energy Theorem', locked: true, unlock_cost_coins: 100, story_summary: "The legendary Sunstone can power the entire realm, but its energy is chaotic. Apply the Work-Energy Theorem to channel its power safely." },
      { id: 'phy_ch4', name: 'Graviton\'s Peak', level_hint: "Advanced", quest: 'Ascend to the Summit of Gravity', locked: true, unlock_cost_coins: 150, is_password_unlockable: true, story_summary: "Only by understanding the nuances of gravitational fields can one hope to reach the summit of Graviton's Peak, where the Sage of Universal Laws resides." },
      { id: 'phy_ch5', name: 'Thermal Tides', level_hint: "Intermediate", quest: 'Navigate the Currents of Thermodynamics', locked: true, unlock_cost_coins: 120, story_summary: "The Thermal Tides are rising, threatening to plunge the land into an ice age or scorch it with fire. Master thermodynamic principles to restore balance." },
      { id: 'phy_ch6', name: 'Electromagnetism Enigma', level_hint: "Advanced", quest: 'Solve the riddles of charged fields', locked: true, unlock_cost_coins: 180, is_password_unlockable: true, story_summary: "Ancient machines powered by electromagnetism are malfunctioning. Decipher their circuits and fields to prevent a realm-wide blackout." },
      { id: 'phy_ch7', name: 'Optics Obscura', level_hint: "Intermediate", quest: 'Manipulate light to reveal hidden paths', locked: true, unlock_cost_coins: 130, story_summary: "A chamber of illusions hides the path forward. Use your knowledge of mirrors and lenses to see through the deception." },
    ],
    imageUrl: 'https://placehold.co/600x300/1A237E/FFFFFF.png?text=Physics+Realm',
    dataAiHint: 'fantasy landscape energy'
  },
  {
    id: 'chemistry_realm',
    name: 'The Alchemist\'s Code',
    subject: 'Chemistry',
    icon: '<Atom />', // Placeholder
    description: "Delve into the secrets of matter. Transmute elements, understand reactions, and become a master of the molecular world.",
    chapters: [
      { id: 'chem_ch1', name: 'The Scroll of Basic Concepts', level_hint: "Foundational", quest: 'Decipher the Mole & Molar Mass', locked: false, story_summary: "An ancient scroll, written in the language of moles and molar masses, holds the key to understanding the basic building blocks of the Alchemist's world." },
      { id: 'chem_ch2', name: 'The Atomic Sanctuary', level_hint: "Intermediate", quest: 'Visualize the Quantum Orbits', locked: true, unlock_cost_coins: 120, story_summary: "Within the Atomic Sanctuary, spirits of electrons dance in quantum orbitals. Map their paths to unlock the sanctuary's secrets." },
      { id: 'chem_ch3', name: 'Bonding Bay', level_hint: "Intermediate", quest: 'Forge the Covalent Chains', locked: true, unlock_cost_coins: 120, is_password_unlockable: true, story_summary: "The islands of Bonding Bay are connected by weak bridges. Forge strong covalent chains to create stable pathways between them." },
      { id: 'chem_ch4', name: 'Equilibrium Estuary', level_hint: "Advanced", quest: "Restore Balance to the Reaction Reeds", locked: true, unlock_cost_coins: 180, story_summary: "The Reaction Reeds in Equilibrium Estuary are wildly fluctuating, causing chaotic magical surges. Apply Le Chatelier's Principle to stabilize them." },
      { id: 'chem_ch5', name: 'Organic Synthesis Chambers', level_hint: "Advanced", quest: 'Craft complex molecules', locked: true, unlock_cost_coins: 200, is_password_unlockable: true, story_summary: "The Elixir of Life requires a multi-step organic synthesis. Navigate the reaction chambers and choose the correct reagents." },
    ],
    imageUrl: 'https://placehold.co/600x300/004D40/FFFFFF.png?text=Chemistry+Realm',
    dataAiHint: 'mystical laboratory potions'
  },
  {
    id: 'biology_realm',
    name: 'The Living Labyrinth',
    subject: 'Biology',
    icon: '<Leaf />', // Placeholder
    description: "Explore the intricate tapestry of life. From the cellular level to vast ecosystems, understand the wonders of the biological domain.",
    chapters: [
      { id: 'bio_ch1', name: 'The Seed of Diversity', level_hint: "Foundational", quest: 'Classify the Kingdoms of Life', locked: false, story_summary: "The Seed of Diversity is fracturing, and life forms are mixing chaotically. Restore order by correctly classifying them into their respective kingdoms." },
      { id: 'bio_ch2', name: 'Cellular Citadel', level_hint: "Intermediate", quest: 'Defend the Organelles', locked: true, unlock_cost_coins: 100, is_password_unlockable: true, story_summary: "The Cellular Citadel is under attack by rogue phages! Understand the function of each organelle to mount a successful defense." },
      { id: 'bio_ch3', name: 'The Genetic Spires', level_hint: "Advanced", quest: 'Unravel the Double Helix', locked: true, unlock_cost_coins: 200, story_summary: "Atop the Genetic Spires, the code of life is encoded. Master DNA replication and protein synthesis to decipher its mysteries." },
      { id: 'bio_ch4', name: 'The Ecosystem Enigma', level_hint: "Intermediate", quest: 'Trace the Energy Flow', locked: true, unlock_cost_coins: 130, story_summary: "A blight is causing the ecosystem to collapse. Trace the flow of energy through its trophic levels to find the source of the imbalance." },
      { id: 'bio_ch5', name: 'Human Physiology Peaks', level_hint: "Advanced", quest: 'Navigate the systems of the human body', locked: true, unlock_cost_coins: 190, is_password_unlockable: true, story_summary: "Ascend the treacherous peaks representing human organ systems, solving challenges related to digestion, respiration, circulation, and neural control." },
    ],
    imageUrl: 'https://placehold.co/600x300/1B5E20/FFFFFF.png?text=Biology+Realm',
    dataAiHint: 'enchanted forest creatures'
  },
];
