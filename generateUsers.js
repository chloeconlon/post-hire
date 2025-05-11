const admin = require('firebase-admin');

// *** IMPORTANT: Replace with the actual path to your service account key ***
const serviceAccount = require('./serviceAccountKey.json'); // Keep this file secure!

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'ionic-app-4b586' // Your project ID
});

// ... and continues down to the end of the `generateUsers()` function call.
