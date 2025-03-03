import React, { createContext, useState, useEffect, useContext } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile,
  getAuth
} from 'firebase/auth';
import { doc, setDoc, getDoc, collection } from 'firebase/firestore';
import { auth, db, app } from '../firebase/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  // Function to check if Firebase Auth is initialized
  const getAuthInstance = () => {
    if (!auth && app) {
      console.log('Auth is null, getting new auth instance');
      return getAuth(app);
    }
    return auth;
  };

  // Register a new user
  const register = async (email, password, username, university) => {
    setAuthError(null);
    const authInstance = getAuthInstance();
    
    if (!authInstance) {
      const errorMsg = 'Authentication service is not available';
      console.error(errorMsg);
      setAuthError(errorMsg);
      throw new Error(errorMsg);
    }
    
    try {
      console.log('Starting user registration process');
      console.log('Registration data:', { email, username, university });
      
      // Create user in Firebase Auth
      console.log('Creating user in Firebase Auth');
      const userCredential = await createUserWithEmailAndPassword(authInstance, email, password);
      console.log('User created in Firebase Auth:', userCredential.user.uid);
      
      // Update profile with username
      console.log('Updating user profile with username');
      await updateProfile(userCredential.user, {
        displayName: username
      });
      console.log('User profile updated with username');
      
      // Create user document in Firestore
      if (db) {
        console.log('Creating user document in Firestore');
        const userData = {
          username,
          email,
          university,
          createdAt: new Date().toISOString(),
          parties: [],
          friends: []
        };
        
        console.log('User data to save:', userData);
        
        const userDocRef = doc(db, 'users', userCredential.user.uid);
        await setDoc(userDocRef, userData);
        
        // Store the user profile in state
        setUserProfile(userData);
        
        // Also store in AsyncStorage for persistence
        await AsyncStorage.setItem('userProfile', JSON.stringify(userData));
        
        console.log('User document created in Firestore');
      } else {
        console.warn('Firestore not available, skipping user document creation');
      }
      
      return userCredential.user;
    } catch (error) {
      console.error('Registration error:', error);
      const formattedError = formatErrorMessage(error);
      setAuthError(formattedError);
      throw error;
    }
  };

  // Login user
  const login = async (email, password) => {
    setAuthError(null);
    const authInstance = getAuthInstance();
    
    if (!authInstance) {
      const errorMsg = 'Authentication service is not available';
      console.error(errorMsg);
      setAuthError(errorMsg);
      throw new Error(errorMsg);
    }
    
    try {
      const userCredential = await signInWithEmailAndPassword(authInstance, email, password);
      
      // Get user profile after login
      const profile = await getUserProfile(userCredential.user.uid);
      setUserProfile(profile);
      
      // Store in AsyncStorage
      if (profile) {
        await AsyncStorage.setItem('userProfile', JSON.stringify(profile));
      }
      
      return userCredential.user;
    } catch (error) {
      console.error('Login error:', error);
      const formattedError = formatErrorMessage(error);
      setAuthError(formattedError);
      throw error;
    }
  };

  // Logout user
  const logout = async () => {
    setAuthError(null);
    const authInstance = getAuthInstance();
    
    if (!authInstance) {
      const errorMsg = 'Authentication service is not available';
      console.error(errorMsg);
      setAuthError(errorMsg);
      throw new Error(errorMsg);
    }
    
    try {
      await signOut(authInstance);
      setUserProfile(null);
      await AsyncStorage.removeItem('userProfile');
    } catch (error) {
      console.error('Logout error:', error);
      const formattedError = formatErrorMessage(error);
      setAuthError(formattedError);
      throw error;
    }
  };

  // Get user profile
  const getUserProfile = async (uid) => {
    if (!db) {
      console.warn('Firestore not available, cannot get user profile');
      return null;
    }
    
    try {
      const userDocRef = doc(db, 'users', uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = { id: uid, ...userDoc.data() };
        return userData;
      } else {
        console.warn(`User document not found for uid: ${uid}`);
        
        // Create user document if it doesn't exist and we have a current user
        if (currentUser) {
          try {
            const newUserData = {
              username: currentUser.displayName || 'User',
              email: currentUser.email,
              university: 'Unknown University',
              createdAt: new Date().toISOString(),
              parties: [],
              friends: []
            };
            
            await setDoc(userDocRef, newUserData);
            console.log('Created missing user document');
            return { id: uid, ...newUserData };
          } catch (createError) {
            console.error('Error creating missing user document:', createError);
          }
        }
        
        return null;
      }
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  };

  // Format error messages for user display
  const formatErrorMessage = (error) => {
    let message = 'An error occurred. Please try again.';
    
    if (error.code) {
      switch (error.code) {
        case 'auth/email-already-in-use':
          message = 'This email is already in use.';
          break;
        case 'auth/invalid-email':
          message = 'Invalid email address.';
          break;
        case 'auth/weak-password':
          message = 'Password is too weak. Use at least 6 characters.';
          break;
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          message = 'Invalid email or password.';
          break;
        case 'auth/too-many-requests':
          message = 'Too many failed login attempts. Please try again later.';
          break;
        case 'auth/network-request-failed':
          message = 'Network error. Please check your internet connection.';
          break;
        case 'auth/api-key-not-valid':
          message = 'Authentication configuration error. Please contact support.';
          break;
        default:
          message = `Error: ${error.message}`;
      }
    }
    
    return message;
  };

  useEffect(() => {
    const authInstance = getAuthInstance();
    
    if (!authInstance) {
      console.warn('Auth is not initialized, skipping auth state listener');
      setLoading(false);
      return;
    }
    
    console.log('Setting up auth state listener');
    const unsubscribe = onAuthStateChanged(authInstance, async (user) => {
      console.log('Auth state changed:', user ? `User ${user.uid}` : 'No user');
      setCurrentUser(user);
      
      if (user) {
        // Try to get user profile from AsyncStorage first (faster)
        try {
          const storedProfile = await AsyncStorage.getItem('userProfile');
          if (storedProfile) {
            setUserProfile(JSON.parse(storedProfile));
          }
        } catch (error) {
          console.error('Error getting stored profile:', error);
        }
        
        // Then get fresh data from Firestore
        try {
          const profile = await getUserProfile(user.uid);
          if (profile) {
            setUserProfile(profile);
            await AsyncStorage.setItem('userProfile', JSON.stringify(profile));
          }
        } catch (error) {
          console.error('Error getting user profile on auth state change:', error);
        }
      } else {
        setUserProfile(null);
        await AsyncStorage.removeItem('userProfile');
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userProfile,
    loading,
    authError,
    register,
    login,
    logout,
    getUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 