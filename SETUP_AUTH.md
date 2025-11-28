# Guide de configuration de l'authentification LRPP

Ce guide vous aidera à configurer le système d'authentification Supabase pour l'application LRPP.

## 1. Installation des dépendances

### Frontend (lrpp-web)
```bash
cd apps/lrpp-web
pnpm add @supabase/supabase-js
```

### Backend (lrpp-api)
```bash
cd apps/lrpp-api
pnpm add @supabase/supabase-js @nestjs/passport passport passport-custom
pnpm add -D @types/passport
```

## 2. Configuration de l'environnement

Les fichiers `.env` et `.env.example` ont été mis à jour avec vos clés Supabase :

```env
# Supabase
SUPABASE_URL=https://lqqgboxlrvvjxhpcgxhq.supabase.co
SUPABASE_ANON_KEY=votre_anon_key
SUPABASE_SERVICE_ROLE_KEY=votre_service_role_key
NEXT_PUBLIC_SUPABASE_URL=https://lqqgboxlrvvjxhpcgxhq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_anon_key
```

## 3. Créer le super utilisateur dans Supabase

### Méthode 1 : Via l'interface Supabase (Recommandée)

1. Connectez-vous à https://supabase.com/dashboard
2. Sélectionnez votre projet LRPP
3. Allez dans **Authentication** > **Users**
4. Cliquez sur **Add user** > **Create new user**
5. Remplissez :
   - Email: `ybdn@example.com` (ou votre email)
   - Password: `Ibanez_347498*`
   - Auto-confirm user: **Coché**
6. Cliquez sur **Create user**

### Méthode 2 : Via SQL (Alternative)

1. Allez dans **SQL Editor** dans le dashboard Supabase
2. Exécutez cette requête :

```sql
-- Créer l'utilisateur dans Supabase Auth
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'ybdn@example.com',
  crypt('Ibanez_347498*', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);
```

### Méthode 3 : Via l'application (Plus simple)

1. Démarrez l'application frontend et backend
2. Allez sur http://localhost:3000/signup
3. Inscrivez-vous avec :
   - Email: `ybdn@example.com`
   - Mot de passe: `Ibanez_347498*`
   - Nom: `YBDN Admin`

## 4. Promouvoir l'utilisateur en admin

Après avoir créé l'utilisateur, vous devez le promouvoir en administrateur :

### Via SQL (Dans Supabase SQL Editor):

```sql
-- Récupérer l'ID Supabase de l'utilisateur
SELECT id, email FROM auth.users WHERE email = 'ybdn@example.com';

-- Mettre à jour le rôle dans votre base de données LRPP
-- Remplacez 'SUPABASE_USER_ID' par l'ID récupéré ci-dessus
UPDATE users
SET role = 'admin'
WHERE supabase_id = 'SUPABASE_USER_ID';
```

### Via l'API Backend (Alternative):

Créez un endpoint temporaire dans `auth.controller.ts` :

```typescript
@Post('promote-admin')
async promoteToAdmin(@Body() body: { email: string }) {
  const user = await this.userService.findByEmail(body.email);
  if (user) {
    return await this.userService.updateRole(user.id, UserRole.ADMIN);
  }
  throw new NotFoundException('User not found');
}
```

Puis appelez-le avec :
```bash
curl -X POST http://localhost:3001/api/auth/promote-admin \
  -H "Content-Type: application/json" \
  -d '{"email": "ybdn@example.com"}'
```

## 5. Structure de la base de données

L'entité User a été mise à jour avec :
- `supabaseId`: Lien vers l'utilisateur Supabase Auth
- `role`: 'user' ou 'admin'

## 6. Démarrer l'application

```bash
# Dans le répertoire racine
pnpm install
pnpm dev
```

L'application sera disponible sur :
- Frontend: http://localhost:3000
- Backend: http://localhost:3001

## 7. Test de l'authentification

1. Allez sur http://localhost:3000/login
2. Connectez-vous avec :
   - Email: `ybdn@example.com`
   - Mot de passe: `Ibanez_347498*`
3. Vous devriez voir votre profil dans le menu utilisateur en haut à droite
4. Le lien "Administration" devrait être visible car vous êtes admin

## Fonctionnalités implémentées

### Backend (NestJS)
- ✅ Client Supabase pour le backend
- ✅ Stratégie d'authentification Supabase/Passport
- ✅ Guards JWT et Admin
- ✅ Décorateur CurrentUser
- ✅ Endpoints `/api/auth/profile` et `/api/auth/validate`
- ✅ Module Auth complet

### Frontend (Next.js)
- ✅ Client Supabase (browser et server)
- ✅ Store Zustand pour l'authentification
- ✅ Pages Login et Signup
- ✅ Menu utilisateur dans le Header
- ✅ Protection des routes (à compléter)
- ✅ Gestion de session automatique

## Prochaines étapes

1. **Créer le super utilisateur** (suivre les étapes ci-dessus)
2. **Créer les pages utilisateur** :
   - Page Profil
   - Tableau de bord progression
   - Historique des révisions
   - Paramètres de compte

3. **Créer le panneau d'administration** :
   - Gestion des PV
   - Édition des contenus
   - Gestion des frameworks légaux
   - Réorganisation des sections

4. **Protéger les endpoints** :
   - Ajouter les guards aux endpoints sensibles
   - Implémenter les permissions

## Dépannage

### Erreur "Invalid token"
- Vérifiez que les clés Supabase sont correctement configurées dans `.env`
- Vérifiez que le token JWT est bien envoyé dans le header `Authorization: Bearer <token>`

### L'utilisateur n'apparaît pas comme admin
- Vérifiez que le champ `role` a bien été mis à jour dans la base de données
- Vérifiez que le `supabaseId` correspond bien à l'ID dans Supabase Auth

### Problème de connexion
- Vérifiez que Supabase Auth est activé dans votre projet
- Vérifiez que l'email est confirmé (email_confirmed_at n'est pas null)
- Vérifiez les logs dans le dashboard Supabase > Logs > Auth

## Support

Pour toute question ou problème, consultez :
- Documentation Supabase: https://supabase.com/docs
- Documentation NestJS: https://docs.nestjs.com
- Documentation Next.js: https://nextjs.org/docs
