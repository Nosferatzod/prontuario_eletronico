// src\firebase.js
import { initializeApp } from "firebase/app";
//import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth"; // Import getAuth
import { getFirestore } from "firebase/firestore";
// Certifique-se de importar o Firestore se for usar para salvar CPF/outros dados
// import { getFirestore } from "firebase/firestore"; // <-- Adicione esta linha se for usar Firestore

const firebaseConfig = {
  apiKey: "AIzaSyBNE7OMujXoLj0cGvePv7WW8sp7fOnhNpI",
  authDomain: "prontuario-clinica-dc277.firebaseapp.com",
  projectId: "prontuario-clinica-dc277",
  storageBucket: "prontuario-clinica-dc277.firebasestorage.app",
  messagingSenderId: "253214776217",
  appId: "1:253214776217:web:adaacf79f9547209595108",
  measurementId: "G-Q1GPCG60M8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
//const analytics = getAnalytics(app);
const auth = getAuth(app); // Obter a instância do serviço de autenticação
// const db = getFirestore(app); // <-- Obter a instância do Firestore, se for usar
export const db = getFirestore(app);
// Exportar 'auth' para uso em outros componentes
export { auth };
//export { auth, db }; // <-- Se você também exportar 'db'



