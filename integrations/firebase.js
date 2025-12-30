const { initializeApp } = require("firebase/app");
const { getAnalytics } = require("firebase/analytics");

const firebaseConfig = {
  apiKey: "AIzaSyD-jQDu7rl8bX4pqgOrCsl250pruEniFnM",
  authDomain: "cloth-backend.firebaseapp.com",
  projectId: "cloth-backend",
  storageBucket: "cloth-backend.firebasestorage.app",
  messagingSenderId: "872257327390",
  appId: "1:872257327390:web:475e573b26fa00b677390f",
  measurementId: "G-0QTWM8CMPN"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);