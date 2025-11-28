# 🔐 Vos informations de connexion

## Compte Super Administrateur

```
Nom:        ybdn
Email:      baudrin.yoann@gmail.com
Mot de passe: Ibanez_347498*
Rôle:       Administrateur
```

---

## 🚀 Démarrage rapide (3 étapes)

### 1️⃣ Installer et démarrer (5 min)

```bash
cd /opt/LRPP

# Installer les dépendances frontend
cd apps/lrpp-web
pnpm add @supabase/supabase-js

# Installer les dépendances backend
cd ../lrpp-api
pnpm add @supabase/supabase-js @nestjs/passport passport passport-custom
pnpm add -D @types/passport

# Retour à la racine et démarrer
cd /opt/LRPP
pnpm dev
```

**Attendez que les serveurs démarrent** (vous verrez "ready" dans les logs)

---

### 2️⃣ Créer votre compte (2 min)

1. **Ouvrez votre navigateur**: http://localhost:3000/signup

2. **Inscrivez-vous**:
   - Nom: `ybdn`
   - Email: `baudrin.yoann@gmail.com`
   - Mot de passe: `Ibanez_347498*`
   - Confirmer: `Ibanez_347498*`

3. **Cliquez sur "S'inscrire"**

Vous serez automatiquement connecté!

---

### 3️⃣ Devenir administrateur (1 min)

**Ouvrez un nouveau terminal** et exécutez:

```bash
cd /opt/LRPP
chmod +x setup-admin-ybdn.sh
./setup-admin-ybdn.sh
```

Suivez les instructions du script, puis:

1. **Déconnectez-vous** de l'application
2. **Reconnectez-vous** sur http://localhost:3000/login
3. **Vérifiez** que vous voyez "Administration" dans le menu

---

## ✅ C'est prêt!

Vous pouvez maintenant:

### Pages utilisateur
- 📊 **Profil**: http://localhost:3000/profile
- 📈 **Dashboard**: http://localhost:3000/dashboard
- 📜 **Historique**: http://localhost:3000/history
- ⚙️ **Paramètres**: http://localhost:3000/settings

### Pages admin (réservé aux administrateurs)
- 🎛️ **Panneau admin**: http://localhost:3000/admin
- 📝 **Gestion des PV**: http://localhost:3000/admin/pvs
- ✏️ **Édition de contenu**: http://localhost:3000/admin/content
- ⚖️ **Frameworks légaux**: http://localhost:3000/admin/frameworks
- 🔀 **Réorganisation**: http://localhost:3000/admin/reorder

---

## 📚 Documentation complète

Pour plus de détails, consultez:

- `ADMIN_SETUP.md` - Guide complet de configuration de votre compte
- `QUICKSTART.md` - Guide de démarrage rapide général
- `SETUP_AUTH.md` - Guide détaillé d'installation
- `IMPLEMENTATION_COMPLETE.md` - Récapitulatif de l'implémentation

---

## 🆘 Aide rapide

### Démarrer l'application
```bash
cd /opt/LRPP
pnpm dev
```

### Promouvoir en admin (si nécessaire)
```bash
./promote-admin.sh baudrin.yoann@gmail.com
```

### Vérifier que tout fonctionne
```bash
# Tester le backend
curl http://localhost:3001

# Tester l'API
curl http://localhost:3001/api/pvs
```

---

## 🔑 Rappel de vos identifiants

**Pour vous connecter**: http://localhost:3000/login

```
Email: baudrin.yoann@gmail.com
Mot de passe: Ibanez_347498*
```

**⚠️ Important**: Gardez ces informations en sécurité!

---

**Date de création**: 2025-01-28
**Statut**: ✅ Prêt à configurer
