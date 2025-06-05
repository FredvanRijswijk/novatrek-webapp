#!/bin/bash

# Deploy Firestore rules
echo "Deploying Firestore rules..."

# Make sure we're in the frontend directory
cd "$(dirname "$0")"

# Deploy rules using Firebase CLI
firebase deploy --only firestore:rules

echo "Firestore rules deployed!"