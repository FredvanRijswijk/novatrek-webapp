#!/bin/bash
# Restore original firestore rules after creating admin document
cp firestore-backup.rules firestore.rules
firebase deploy --only firestore:rules
echo "Original security rules restored!"