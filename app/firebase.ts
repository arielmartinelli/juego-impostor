import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  // ... TUS CLAVES QUE COPIASTE DE FIREBASE ...
  apiKey: "AIzaSyBkCHub4M_EjwgHJyy2HNKhCekpwykwinw",
  authDomain: "juego-impostor-b1abc.firebaseapp.com",
  databaseURL: "https://juego-impostor-b1abc-default-rtdb.firebaseio.com",
  projectId: "juego-impostor-b1abc",
  storageBucket: "juego-impostor-b1abc.firebasestorage.app",
  messagingSenderId: "856484877216",
  appId: "1:856484877216:web:61fa591251437a0ad0cac5"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);