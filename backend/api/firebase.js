// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";


// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional


const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "meta-dev-f2fe4.firebaseapp.com",
  projectId: "meta-dev-f2fe4",
  storageBucket: "meta-dev-f2fe4.firebasestorage.app",
  messagingSenderId: "848970558673",
  appId: "1:848970558673:web:73baba9228d9aae5dfe9f0",
  measurementId: "G-LN7K7FQXGZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app)
const analytics = getAnalytics(app);

export {app, auth}
