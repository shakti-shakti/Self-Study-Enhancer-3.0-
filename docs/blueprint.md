# **App Name**: NEET Prep+

## Core Features:

- Secure Login: Login system for students to create accounts and securely save data, syncing it across devices via Supabase.
- Alarm Task Reminder: Alarm-based task reminders that ring and prominently display the task title (in bold UI) at the scheduled time. Students can upload custom alarm tones.
- AI Study Assistant: AI assistant (powered by Gemini API) for explaining concepts, answering questions, and providing personalized study tips, saving the whole history and the options for each chat.
- Customizable Quiz: Random question generator for customized knowledge testing. Users select class, subject, and optional topics/sources (NCERT, PYQ, etc.). Accuracy/scores are shown with access to all the questions with a viewable dashboard where the questions will be shown and scores after quiz, with an option to explain questions using AI. The whole result history is saved by dates.
- Comprehensive Planner: Day, Month, and Year Planners to schedule tasks. Completed tasks can be checked off. Incomplete tasks are saved, with timing for each. All type of tasks are date filtered and date can be saved.
- NEET Guidelines Dashboard: Dashboard for saving important NEET guidelines and tips, with custom tabs for organization, the exam countdown date and each tab includes the tips which the students can save and edit anytime they want .
- Central Dashboard: A fully customizable main dashboard with 5 tabs at the bottom, history in each dashboard/tab with delete option and enable filters, a built-in Spotify URL (fixed) music player, file and image uploads, saved history and a random syllabus fact upon opening.
- Customization Tool: An AI tool to customize the app by voice or written command by students for customize specific dashboards, or anything with help of LLM agentic feature
- Real-Time Group Study Rooms (AI Moderated): Create or join virtual study rooms by topic or chapter. Each room can have a shared whiteboard, chat, and Pomodoro timer. Optional AI moderator to ask quiz questions, keep time, and suggest what to study next.
- Animated 3D Concept Visualizer: Use simple 3D models/animations to explain human anatomy, physics laws (e.g., circular motion), and molecular biology, powered by WebGL or Unity integration.
- Smart Notes Generator (via AI): After solving a test or reading a chapter, AI creates summarized notes, key formulas, or mnemonics. You can edit and save these notes in your custom notebook.
- Career & College Predictor (Post-NEET): Based on NEET score prediction or mock performance, AI suggests suitable medical colleges, shows cutoffs, ranking, and counseling process. Customizable by state/category/reservation
- Gamified Challenges & NEET Missions: Daily or weekly missions like Solve 10 NCERT-based questions in 10 mins or Complete 2 hours of Physics today. Earn badges, streaks, and ranks on the leaderboard
- Mental Health & Focus Tracker: Simple tools to log Mood (before/after study) and Focus level (1-10). AI gives suggestions (e.g., rest, breathing, motivation). Optional guided meditation audio or 5-minute focus resets
- Smart Doubt Resolver (with Snap & AI): Student can click a photo of a tough question or handwritten doubt. AI reads & explains it step-by-step, or fetches a matching solution from NCERT or previous years.
- Searchable NCERT Explorer with AI Highlights: AI highlights important lines, key diagrams, and likely questions in NCERT chapters. Students can search any term inside books (like Google Books).
- Text-to-Speech Mode for Notes, Books & Questions: Turn any content into audio (study while walking, resting). Choose voice, speed, and language (Hindi/English).
- Offline Mode with Auto-Sync: Allow download of Planners, NCERT books, and Saved questions & notes. All changes sync automatically when online again.
- Developer/Community Plugin System: Allow mini tools, like Custom calculators (Molarity, Kinetics, etc.) and Flashcard sets. Create a plugin store for students or educators to share utilities.

## Style Guidelines:

- The color scheme (backgrounds, text colors, primary/accent colors, borders, etc.) should be defined using HSL-based CSS variables. The base theme uses light backgrounds with darker text for good readability.
- Primary color: Saturated purple (#A758A9) for a sense of focus and determination. The hex color value is derived from HSL 275, 58%, 63%.
- Background color: Very light pinkish-purple (#F2EEF4) provides a gentle backdrop that isn't distracting.  The hex color value is derived from HSL 240, 17%, 94%.
- Accent color: A vibrant, but softer blue (#559BBA) is used sparingly for interactive elements and highlights to draw the user's eye. The hex color value is derived from HSL 209, 58%, 63%.
- Body and headline font: 'Space Grotesk' (sans-serif) for headlines and short body amounts of text; if longer text is anticipated, use 'Inter' for body
- Code font: 'Source Code Pro' (monospace) for displaying code snippets and file paths.
- Lucide React icons for a comprehensive set of clean and consistent SVG icons throughout the application.
- ShadCN UI components are pre-configured to use CSS variables for theming, with rounded corners, subtle shadows and smooth transitions.
- Subtle animations and transitions on hover and focus states will be included to add polish.