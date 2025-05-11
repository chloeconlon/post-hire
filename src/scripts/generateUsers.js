const admin = require('firebase-admin');

const serviceAccount = require('./serviceAccountKey.json');
// Initialize Firebase sdk
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'ionic-app-4b586',
  databaseURL: 'https://ionic-app-4b586-default-rtdb.europe-west1.firebasedatabase.app/'
});
