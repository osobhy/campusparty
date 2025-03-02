import React, { createContext, useState, useEffect, useContext } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc, collection } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Register a new user
  const register = async (email, password, username, university) => {
    try {
      console.log('Starting user registration process');
      
      // Create user in Firebase Auth
      console.log('Creating user in Firebase Auth');
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log('User created in Firebase Auth:', userCredential.user.uid);
      
      // Update profile with username
      console.log('Updating user profile with username');
      await updateProfile(userCredential.user, {
        displayName: username
      });
      console.log('User profile updated');
      
      // Ensure the users collection exists
      try {
        console.log('Creating user document in Firestore');
        // Create user document in Firestore
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          uid: userCredential.user.uid,
          email,
          username,
          university,
          createdAt: new Date().toISOString(),
          parties: [],
          joinedParties: []
        });
        console.log('User document created in Firestore');
      } catch (firestoreError) {
        console.error('Error creating user document in Firestore:', firestoreError);
        // Continue even if Firestore document creation fails
        // The user is still created in Firebase Auth
      }
      
      return userCredential.user;
    } catch (error) {
      console.error('Registration error in AuthContext:', error);
      throw error;
    }
  };

  // Login user
  const login = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  // Logout user
  const logout = () => {
    return signOut(auth);
  };

  // Get user profile data
  const getUserProfile = async (uid) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        return userDoc.data();
      }
      
      // If user document doesn't exist, create it
      console.log('User document not found, creating one');
      const user = auth.currentUser;
      if (user) {
        const userData = {
          uid: user.uid,
          email: user.email,
          username: user.displayName || 'User',
          createdAt: new Date().toISOString(),
          parties: [],
          joinedParties: []
        };
        
        await setDoc(doc(db, 'users', uid), userData);
        return userData;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Get additional user data from Firestore
          const userProfile = await getUserProfile(user.uid);
          setCurrentUser({ ...user, ...userProfile });
          
          // Store user data in AsyncStorage
          await AsyncStorage.setItem('user', JSON.stringify({ 
            uid: user.uid, 
            email: user.email,
            displayName: user.displayName
          }));
        } catch (error) {
          console.error('Error in auth state change handler:', error);
          setCurrentUser(user);
        }
      } else {
        setCurrentUser(null);
        await AsyncStorage.removeItem('user');
      }
      setLoading(false);
    });

    // Check for stored user on app start
    const checkStoredUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('user');
        if (storedUser && !currentUser) {
          const userData = JSON.parse(storedUser);
          // This will trigger the onAuthStateChanged listener
          // if the session is still valid
        }
      } catch (error) {
        console.error('Error checking stored user:', error);
      }
    };

    checkStoredUser();

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    loading,
    register,
    login,
    logout,
    getUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}; 