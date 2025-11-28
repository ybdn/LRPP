#!/bin/bash

# Script pour promouvoir un utilisateur en administrateur
# Usage: ./promote-admin.sh <email>

if [ -z "$1" ]; then
  echo "Usage: ./promote-admin.sh <email>"
  echo "Exemple: ./promote-admin.sh ybdn@example.com"
  exit 1
fi

EMAIL=$1
API_URL=${API_URL:-http://localhost:3001}

echo "Promotion de l'utilisateur $EMAIL en administrateur..."

response=$(curl -s -X POST "$API_URL/api/auth/promote-admin" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL\"}")

echo ""
echo "Réponse du serveur:"
echo "$response" | jq '.' 2>/dev/null || echo "$response"
echo ""

if echo "$response" | grep -q "has been promoted to admin"; then
  echo "✅ Succès! L'utilisateur $EMAIL est maintenant administrateur."
else
  echo "❌ Erreur lors de la promotion de l'utilisateur."
  echo "Assurez-vous que:"
  echo "  1. Le backend est démarré (http://localhost:3001)"
  echo "  2. L'utilisateur existe dans la base de données"
  echo "  3. L'utilisateur s'est connecté au moins une fois"
fi
