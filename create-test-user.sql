-- Create a test user with password "password"
INSERT INTO users (username, email, password_hash, display_name)
VALUES ('testuser', 'test@example.com', '$2a$10$zH7.4s2AbH.R9bW9EXAhOemyZ9HwMwNI5HCr1UrOBn1OlbYY1T3vy', 'Test User')
ON CONFLICT (username) DO NOTHING;
