-- Update password hashes for all users
-- Password: Password123!
UPDATE users SET password_hash = '$2b$10$H5JRbceonCBgMbBbqm6Gfuj2eqa3No1godPiVhGwOlRlcvy09jiUS';
SELECT email, 'Password updated' as status FROM users;
