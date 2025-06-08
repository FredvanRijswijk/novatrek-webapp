#!/bin/bash

echo "🔥 Deploying Firestore Rules..."
echo ""
echo "This will deploy the firestore.rules file to Firebase"
echo ""

# Deploy only firestore rules
firebase deploy --only firestore:rules

echo ""
echo "✅ Rules deployment complete!"
echo "🌦️  Weather feature should now work properly"