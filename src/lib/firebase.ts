import { initializeApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyCG0czeejv8XRIxfpJvRURP5-eS5SAEpqc",
    authDomain: "hivedata-22a45.firebaseapp.com",
    projectId: "hivedata-22a45",
    storageBucket: "hivedata-22a45.appspot.com",
    messagingSenderId: "833759033269",
    appId: "1:833759033269:web:1f399a657085e24a1f4bfc",
    measurementId: "G-9FP6V2816L"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };