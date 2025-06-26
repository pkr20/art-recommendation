// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional



const firebaseConfig = {
  apiKey: "AIzaSyCxpltc1E46jwnF9JKoG0j_jd_epjs1PFQ",
  authDomain: "meta-dev-ad98e.firebaseapp.com",
  projectId: "meta-dev-ad98e",
  storageBucket: "meta-dev-ad98e.firebasestorage.app",
  messagingSenderId: "195311860726",
  appId: "1:195311860726:web:1529a37d211e9dd53fe5d7",
  measurementId: "G-BZTPX1LWHY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app)
const analytics = getAnalytics(app);

export {app, auth}
