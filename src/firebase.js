import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDu0PPh6maUIf3VLeLUgFqtXxesnKa5Udc",
  authDomain: "pureflat-simulator.firebaseapp.com",
  projectId: "pureflat-simulator",
  storageBucket: "pureflat-simulator.firebasestorage.app",
  messagingSenderId: "302151882576",
  appId: "1:302151882576:web:4081a4027aaf23f40c3e55",
  measurementId: "G-P6XR3Y0JL7"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
