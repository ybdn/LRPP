# Configuration du compte super administrateur

## Vos informations

- **Nom**: ybdn
- **Email**: baudrin.yoann@gmail.com
- **Mot de passe**: Ibanez_347498*
- **Rôle**: Administrateur

---

## Étape 1: Démarrer l'application

```bash
cd /opt/LRPP
pnpm dev
```

L'application sera accessible sur:
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:3001

---

## Étape 2: Créer votre compte

### Option A: Via l'interface web (RECOMMANDÉ)

1. Ouvrez votre navigateur et allez sur: **http://localhost:3000/signup**

2. Remplissez le formulaire d'inscription:
   - **Nom**: `ybdn`
   - **Adresse email**: `baudrin.yoann@gmail.com`
   - **Mot de passe**: `Ibanez_347498*`
   - **Confirmer le mot de passe**: `Ibanez_347498*`

3. Cliquez sur **S'inscrire**

4. Vous serez automatiquement connecté

### Option B: Via Supabase Dashboard

1. Allez sur https://supabase.com/dashboard
2. Sélectionnez votre projet LRPP
3. Allez dans **Authentication** > **Users**
4. Cliquez sur **Add user** > **Create new user**
5. Remplissez:
   - Email: `baudrin.yoann@gmail.com`
   - Password: `Ibanez_347498*`
   - ✅ **Cochez** "Auto-confirm user"
6. Cliquez sur **Create user**

---

## Étape 3: Promouvoir en administrateur

Une fois votre compte créé, vous devez le promouvoir en administrateur.

### Méthode 1: Script bash (RAPIDE)

```bash
cd /opt/LRPP
chmod +x promote-admin.sh
./promote-admin.sh baudrin.yoann@gmail.com
```

Vous devriez voir:
```
✅ Succès! L'utilisateur baudrin.yoann@gmail.com est maintenant administrateur.
```

### Méthode 2: Commande curl

```bash
curl -X POST http://localhost:3001/api/auth/promote-admin \
  -H "Content-Type: application/json" \
  -d '{"email": "baudrin.yoann@gmail.com"}'
```

Réponse attendue:
```json
{
  "id": "...",
  "email": "baudrin.yoann@gmail.com",
  "name": "ybdn",
  "role": "admin",
  "message": "User baudrin.yoann@gmail.com has been promoted to admin"
}
```

### Méthode 3: Via SQL (Supabase Dashboard)

Si les méthodes ci-dessus ne fonctionnent pas:

1. Allez dans **SQL Editor** sur Supabase
2. Récupérez d'abord votre ID Supabase:

```sql
SELECT id, email FROM auth.users WHERE email = 'baudrin.yoann@gmail.com';
```

3. Copiez l'ID retourné, puis exécutez (remplacez `VOTRE_SUPABASE_ID`):

```sql
UPDATE users
SET role = 'admin'
WHERE supabase_id = 'VOTRE_SUPABASE_ID';
```

---

## Étape 4: Vérifier votre accès administrateur

1. **Déconnectez-vous** (si vous étiez connecté avant la promotion)

2. **Connectez-vous** sur http://localhost:3000/login
   - Email: `baudrin.yoann@gmail.com`
   - Mot de passe: `Ibanez_347498*`

3. Une fois connecté, vérifiez:
   - ✅ Votre nom "ybdn" s'affiche en haut à droite
   - ✅ Un badge "Administrateur" sur votre profil
   - ✅ Le lien **"Administration"** est visible dans le menu déroulant

4. Cliquez sur **"Administration"** pour accéder au panneau admin

---

## Étape 5: Explorer le panneau d'administration

Vous avez maintenant accès à:

### Dashboard Admin (`/admin`)
- Vue d'ensemble
- Accès aux 4 sections principales

### Gestion des PV (`/admin/pvs`)
- Liste de tous les PV
- Éditer, supprimer des PV
- Gérer les sections

### Édition de contenu (`/admin/content`)
- Modifier les textes
- Gérer les blocs

### Frameworks légaux (`/admin/frameworks`)
- Modifier EP, EF, CR, etc.
- Éditer les articles de loi

### Réorganisation (`/admin/reorder`)
- Réordonner les sections
- Drag & drop

---

## En cas de problème

### Le compte n'existe pas dans la base de données

**Symptôme**: Le script `promote-admin.sh` retourne "User not found"

**Solution**:
1. Assurez-vous de vous être connecté au moins une fois sur l'application
2. Le compte est créé automatiquement lors de la première connexion
3. Réessayez la promotion après vous être connecté

### Le rôle n'est pas mis à jour

**Symptôme**: Vous ne voyez pas le lien "Administration"

**Solutions**:
1. **Déconnectez-vous** complètement
2. **Reconnectez-vous**
3. Le rôle est chargé lors de la connexion

Si le problème persiste, vérifiez dans Supabase SQL Editor:

```sql
SELECT id, email, name, role, supabase_id
FROM users
WHERE email = 'baudrin.yoann@gmail.com';
```

Le champ `role` doit être `'admin'`.

### Le backend ne répond pas

Vérifiez que le backend est démarré:

```bash
cd /opt/LRPP/apps/lrpp-api
pnpm start:dev
```

Testez l'endpoint:
```bash
curl http://localhost:3001/api/pvs
```

---

## Résumé des commandes

```bash
# 1. Démarrer l'application
cd /opt/LRPP
pnpm dev

# 2. (Dans un autre terminal) Promouvoir en admin après inscription
cd /opt/LRPP
chmod +x promote-admin.sh
./promote-admin.sh baudrin.yoann@gmail.com

# 3. Vérifier que tout fonctionne
curl http://localhost:3001/api/auth/profile \
  -H "Authorization: Bearer VOTRE_TOKEN"
```

---

## Vos accès

Une fois configuré, vous pourrez:

### Espace utilisateur
- ✅ Voir votre profil et statistiques (`/profile`)
- ✅ Consulter votre progression (`/dashboard`)
- ✅ Voir l'historique de vos révisions (`/history`)
- ✅ Modifier vos paramètres (`/settings`)
- ✅ Faire des révisions (`/revision`)

### Espace administrateur
- ✅ Accéder au panneau admin (`/admin`)
- ✅ Gérer tous les PV (`/admin/pvs`)
- ✅ Éditer le contenu
- ✅ Modifier les frameworks légaux
- ✅ Réorganiser les sections
- ✅ Voir les statistiques globales

---

**Compte configuré**: ✅ ybdn (baudrin.yoann@gmail.com)
**Rôle**: Administrateur
**Date**: 2025-01-28
