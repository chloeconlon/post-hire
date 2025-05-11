
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

//firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDOw3pDySMFgyauAn5im0K3NWh8xvbn5Q4",
  authDomain: "ionic-app-4b586.firebaseapp.com",
  projectId: "ionic-app-4b586",
  storageBucket: "ionic-app-4b586.firebasestorage.app",
  messagingSenderId: "453454832882",
  appId: "1:453454832882:web:0d2cbed2ee2473f2979c6b",
  measurementId: "G-9K7CWXF4QM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);