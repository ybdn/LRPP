# 🚀 Démarrage rapide - Authentification LRPP

## Installation (5 minutes)

### 1. Installer les dépendances

```bash
# À la racine du projet
pnpm install

# Frontend
cd apps/lrpp-web
pnpm add @supabase/supabase-js

# Backend
cd ../lrpp-api
pnpm add @supabase/supabase-js @nestjs/passport passport passport-custom
pnpm add -D @types/passport

# Retour à la racine
cd ../..
```

### 2. Démarrer l'application

```bash
pnpm dev
```

✅ Frontend: http://localhost:3000
✅ Backend: http://localhost:3001

## Créer le super utilisateur (2 minutes)

### Méthode simple (recommandée)

1. **S'inscrire**
   Allez sur http://localhost:3000/signup et créez un compte avec :
   - Email: `ybdn@example.com`
   - Mot de passe: `Ibanez_347498*`
   - Nom: `YBDN Admin`

2. **Promouvoir en admin**
   ```bash
   chmod +x promote-admin.sh
   ./promote-admin.sh ybdn@example.com
   ```

3. **Se reconnecter**
   Allez sur http://localhost:3000/login et connectez-vous

4. **Vérifier**
   Vous devriez voir "Administration" dans le menu utilisateur

## ✅ C'est tout!

Vous pouvez maintenant :
- ✅ Vous connecter/déconnecter
- ✅ Voir votre profil
- ✅ Accéder au menu admin (quand il sera créé)

## 📚 Documentation complète

- `SETUP_AUTH.md` - Guide complet d'installation
- `IMPLEMENTATION_SUMMARY.md` - Récapitulatif détaillé de l'implémentation
- `create-admin-user.sql` - Script SQL alternatif

## 🐛 Problème?

### Le backend ne démarre pas
```bash
cd apps/lrpp-api
rm ../../lrpp-dev.sqlite  # Réinitialiser la BDD
pnpm start:dev
```

### Promouvoir en admin ne fonctionne pas
Vérifiez que :
1. Le backend tourne sur http://localhost:3001
2. L'utilisateur s'est connecté au moins une fois
3. Vous avez bien l'email exact

```bash
# Alternative : utiliser curl directement
curl -X POST http://localhost:3001/api/auth/promote-admin \
  -H "Content-Type: application/json" \
  -d '{"email": "ybdn@example.com"}'
```

---

**Prochaines étapes** : Voir `IMPLEMENTATION_SUMMARY.md` section "Ce qu'il reste à faire"
