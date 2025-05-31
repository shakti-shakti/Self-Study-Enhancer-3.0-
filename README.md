# NEET Prep+

This is the Next.js application for NEET Prep+, an AI-powered study companion.

## Getting Started

1.  **Install dependencies:**
    ```bash
    npm install
    ```
2.  **Set up environment variables:**
    Create a `.env.local` file and add your Supabase URL and Anon Key:
    ```
    NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
    ```
3.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:9002`.

4.  **Run Genkit development server (for AI flows):**
    In a separate terminal:
    ```bash
    npm run genkit:dev
    ```

## Project Structure

-   `src/app/`: Next.js App Router pages and layouts.
-   `src/components/`: Reusable UI components.
    -   `src/components/ui/`: ShadCN UI components.
    -   `src/components/auth/`: Authentication related components.
    -   `src/components/games/`: Game specific components.
-   `src/lib/`: Utility functions and Supabase client setup.
-   `src/ai/`: Genkit AI flows and configuration.
-   `src/hooks/`: Custom React hooks.
-   `public/`: Static assets.
