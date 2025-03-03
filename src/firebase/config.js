import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  initializeAuth, 
  getReactNativePersistence 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  query, 
  limit 
} from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Use the hardcoded config directly
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
let app;
let auth;
let db;

try {
  console.log('Initializing Firebase...');
  console.log('Using Firebase config with project ID:', firebaseConfig.projectId);
  
  app = initializeApp(firebaseConfig);
  
  // Initialize Auth with AsyncStorage persistence
  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    });
    console.log('Firebase Auth initialized with persistence');
  } catch (authError) {
    console.error("Error initializing auth with persistence:", authError);
    // Fallback to standard auth initialization
    auth = getAuth(app);
    console.log('Firebase Auth initialized without persistence');
  }
  
  // Initialize Firestore
  try {
    db = getFirestore(app);
    console.log('Firestore initialized successfully');
  } catch (firestoreError) {
    console.error("Error initializing Firestore:", firestoreError);
    db = null;
  }
} catch (error) {
  console.error("Error initializing Firebase:", error);
  app = null;
  auth = null;
  db = null;
}

// Function to check if database collections exist
export const checkDatabaseCollections = async () => {
  if (!db) {
    console.error("Firestore is not initialized");
    return false;
  }
  
  try {
    console.log('Checking database collections...');
    
    // Check if users collection exists
    try {
      const usersQuery = query(collection(db, 'users'), limit(1));
      await getDocs(usersQuery);
      console.log('Users collection exists');
    } catch (error) {
      console.warn('Error checking users collection:', error);
    }
    
    // Check if parties collection exists
    try {
      const partiesQuery = query(collection(db, 'parties'), limit(1));
      await getDocs(partiesQuery);
      console.log('Parties collection exists');
    } catch (error) {
      console.warn('Error checking parties collection:', error);
    }
    
    // Check if safety-related collections exist
    const collectionsToCheck = [
      'designated_drivers',
      'drink_tracking',
      'ride_requests'
    ];
    
    for (const collectionName of collectionsToCheck) {
      try {
        const collectionQuery = query(collection(db, collectionName), limit(1));
        await getDocs(collectionQuery);
        console.log(`Collection ${collectionName} exists`);
      } catch (error) {
        // If error is not permission-denied, the collection might not exist
        if (error.code !== 'permission-denied') {
          console.warn(`Collection ${collectionName} may not exist:`, error);
        } else {
          console.log(`Collection ${collectionName} exists (permission denied)`);
        }
      }
    }
    
    return true;
  } catch (error) {
    console.error("Error checking database collections:", error);
    // If error is permission-denied, the collections exist but user doesn't have access
    if (error.code === 'permission-denied') {
      console.warn("Permission denied when checking collections. This is expected if not authenticated.");
      return true;
    }
    return false;
  }
};

// Initialize database check
setTimeout(() => {
  checkDatabaseCollections().catch(error => {
    console.warn("Initial database check failed:", error);
  });
}, 2000);

export { app, auth, db }; 