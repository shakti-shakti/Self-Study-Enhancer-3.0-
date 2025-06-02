INSERT INTO puzzles (id, name, description, type, data, solution, xpAward, category, subject) VALUES
ON CONFLICT (id) DO NOTHING;
