// firebaseConfig.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

// Configurações do Firebase (obtidas do seu exemplo)
const firebaseConfig = {
  apiKey: "AIzaSyDBWIcjeKT85m3fs5AyX2biFYSXNqgrJ7E",
  authDomain: "mayapostas.firebaseapp.com",
  projectId: "mayapostas",
  storageBucket: "mayapostas.firebasestorage.app",
  messagingSenderId: "32246507754",
  appId: "1:32246507754:web:d91d97b2cadb816c0bcf93",
  measurementId: "G-90JJEYH4MS"
};

// Inicializando o Firebase (evitando inicialização duplicada)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

// Inicializando o Analytics de forma segura
let analytics;
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

export { db, analytics };
