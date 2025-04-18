-- Ensure users table has the correct structure
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(255),
  avatar_url VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create a test user with password "password"
INSERT INTO users (username, email, password_hash, display_name)
VALUES 
  ('testuser', 'test@example.com', '$2a$10$zH7.4s2AbH.R9bW9EXAhOemyZ9HwMwNI5HCr1UrOBn1OlbYY1T3vy', 'Test User'),
  ('demo', 'demo@example.com', '$2a$10$zH7.4s2AbH.R9bW9EXAhOemyZ9HwMwNI5HCr1UrOBn1OlbYY1T3vy', 'Demo User')
ON CONFLICT (username) DO NOTHING;
