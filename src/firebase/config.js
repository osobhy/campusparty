import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Your web app's Firebase configuration
// IMPORTANT: Replace these placeholder values with your actual Firebase config
// You can find these values in your Firebase project settings
const firebaseConfig = {
  apiKey: "AIzaSyAc4vENcukKGSMNy5JnpfIyiDikI3YGUHc",
  authDomain: "campusparty-9c4fd.firebaseapp.com",
  projectId: "campusparty-9c4fd",
  storageBucket: "campusparty-9c4fd.firebasestorage.app",
  messagingSenderId: "1047735393331",
  appId: "1:1047735393331:web:4e9a6e8ab64880bccd5746",
  measurementId: "G-Y70CPENG46"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with AsyncStorage persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

const db = getFirestore(app);

// Initialize database collections
const initializeDatabase = async () => {
  try {
    console.log('Checking if database collections exist...');
    
    // Only check collections if user is authenticated
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.log('User not authenticated. Collections will be checked after login.');
      return false;
    }
    
    // Check if users collection exists by trying to get documents
    const usersSnapshot = await getDocs(collection(db, 'users'));
    console.log(`Users collection exists with ${usersSnapshot.size} documents`);
    
    // Check if parties collection exists
    const partiesSnapshot = await getDocs(collection(db, 'parties'));
    console.log(`Parties collection exists with ${partiesSnapshot.size} documents`);
    
    console.log('Database collections initialized successfully');
    return true;
  } catch (error) {
    if (error.code === 'permission-denied') {
      console.log('Permission denied. User may need to authenticate first.');
    } else {
      console.error('Error initializing database collections:', error);
    }
    // Collections will be created automatically when documents are added
    return false;
  }
};

// Call the initialization function after a short delay to allow auth to initialize
setTimeout(() => {
  initializeDatabase().catch(console.error);
}, 2000);

export { auth, db }; 