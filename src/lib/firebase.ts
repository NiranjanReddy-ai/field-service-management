import { initializeApp } from "firebase/app";

// Your web app's Firebase configuration
// For now, these are placeholders. Replace with your actual Firebase config keys.
const firebaseConfig = {
    apiKey: "API_KEY",
    authDomain: "PROJECT_ID.firebaseapp.com",
    projectId: "PROJECT_ID",
    storageBucket: "PROJECT_ID.appspot.com",
    messagingSenderId: "SENDER_ID",
    appId: "APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export default app;
