#!/bin/bash

# Script de configuration automatique pour le super utilisateur ybdn
# Email: baudrin.yoann@gmail.com

echo "================================================"
echo "Configuration du compte administrateur LRPP"
echo "================================================"
echo ""
echo "Utilisateur: ybdn"
echo "Email: baudrin.yoann@gmail.com"
echo ""

# Vérifier que le backend est accessible
echo "Vérification du backend..."
if ! curl -s http://localhost:3001 > /dev/null 2>&1; then
    echo "❌ ERREUR: Le backend n'est pas accessible sur http://localhost:3001"
    echo ""
    echo "Veuillez démarrer l'application avec:"
    echo "  cd /opt/LRPP"
    echo "  pnpm dev"
    echo ""
    exit 1
fi

echo "✅ Backend accessible"
echo ""

# Attendre un peu que l'utilisateur se soit inscrit
echo "📝 INSTRUCTIONS:"
echo ""
echo "1. Ouvrez votre navigateur sur: http://localhost:3000/signup"
echo "2. Inscrivez-vous avec:"
echo "   - Nom: ybdn"
echo "   - Email: baudrin.yoann@gmail.com"
echo "   - Mot de passe: Ibanez_347498*"
echo ""
read -p "Appuyez sur ENTRÉE une fois que vous vous êtes inscrit et connecté au moins une fois..."
echo ""

# Promouvoir en admin
echo "🔄 Promotion en administrateur..."
echo ""

response=$(curl -s -X POST http://localhost:3001/api/auth/promote-admin \
  -H "Content-Type: application/json" \
  -d '{"email": "baudrin.yoann@gmail.com"}')

echo "Réponse du serveur:"
echo "$response" | jq '.' 2>/dev/null || echo "$response"
echo ""

if echo "$response" | grep -q "has been promoted to admin"; then
    echo "✅ SUCCÈS! Votre compte est maintenant administrateur."
    echo ""
    echo "📋 Prochaines étapes:"
    echo "1. Déconnectez-vous de l'application"
    echo "2. Reconnectez-vous sur http://localhost:3000/login"
    echo "3. Vérifiez que vous voyez le lien 'Administration' dans le menu"
    echo ""
    echo "🎉 Configuration terminée!"
else
    echo "⚠️  Erreur lors de la promotion"
    echo ""
    echo "Causes possibles:"
    echo "- Vous ne vous êtes pas encore inscrit"
    echo "- Vous n'avez pas confirmé votre email dans Supabase"
    echo "- L'email est incorrect"
    echo ""
    echo "Solutions:"
    echo "1. Vérifiez que vous vous êtes bien inscrit avec: baudrin.yoann@gmail.com"
    echo "2. Connectez-vous au moins une fois sur l'application"
    echo "3. Réessayez ce script"
    echo ""
    echo "Ou utilisez la commande manuelle:"
    echo "  ./promote-admin.sh baudrin.yoann@gmail.com"
fi

echo ""
echo "================================================"
