-- Script SQL pour créer le super utilisateur admin dans LRPP
-- À exécuter dans le SQL Editor de Supabase

-- 1. D'abord, créez l'utilisateur via l'interface Supabase (Authentication > Users)
--    Email: ybdn@example.com
--    Password: Ibanez_347498*

-- 2. Ensuite, récupérez l'ID Supabase de l'utilisateur
SELECT id as supabase_id, email, created_at
FROM auth.users
WHERE email = 'ybdn@example.com';

-- 3. Copiez le supabase_id retourné ci-dessus

-- 4. Si vous utilisez PostgreSQL, exécutez cette requête pour mettre à jour le rôle:
-- Remplacez 'VOTRE_SUPABASE_ID' par l'ID récupéré à l'étape 2
/*
UPDATE users
SET role = 'admin'
WHERE supabase_id = 'VOTRE_SUPABASE_ID';
*/

-- 5. Vérifiez que l'utilisateur est bien admin:
/*
SELECT id, email, name, role, supabase_id, created_at
FROM users
WHERE supabase_id = 'VOTRE_SUPABASE_ID';
*/

-- Note: Si l'utilisateur n'existe pas encore dans la table users (car il ne s'est pas encore connecté),
-- il sera créé automatiquement lors de sa première connexion grâce à la méthode findOrCreateFromSupabase.
-- Vous devrez alors exécuter la requête UPDATE ci-dessus après sa première connexion.

-- Alternative: Créer directement l'utilisateur dans la table users (si vous connaissez déjà son supabase_id)
/*
INSERT INTO users (id, supabase_id, email, name, role, created_at)
VALUES (
  gen_random_uuid(),
  'VOTRE_SUPABASE_ID',
  'ybdn@example.com',
  'YBDN Admin',
  'admin',
  NOW()
);
*/
