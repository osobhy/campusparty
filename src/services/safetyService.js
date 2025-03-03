import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  getDoc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp,
  increment,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { Alert, Linking } from 'react-native';

// Helper function to check if Firestore is initialized
const checkFirestore = () => {
  if (!db) {
    throw new Error('Firestore is not initialized');
  }
  return true;
};

// Helper function to ensure collections exist
const ensureCollectionExists = async (collectionName) => {
  try {
    checkFirestore();
    // Just query the collection to see if it exists
    await getDocs(query(collection(db, collectionName), where('__dummy__', '==', true)));
    return true;
  } catch (error) {
    console.error(`Error checking collection ${collectionName}:`, error);
    // If the error is about permissions, the collection likely exists
    if (error.code === 'permission-denied') {
      return true;
    }
    // For other errors, we'll create the collection by adding and immediately deleting a dummy document
    try {
      const dummyRef = await addDoc(collection(db, collectionName), { 
        __dummy__: true,
        createdAt: serverTimestamp()
      });
      await deleteDoc(dummyRef);
      return true;
    } catch (innerError) {
      console.error(`Failed to create collection ${collectionName}:`, innerError);
      throw innerError;
    }
  }
};

// Register as a designated driver for a party
export const registerAsDD = async (partyId, userId, userInfo) => {
  try {
    checkFirestore();
    await ensureCollectionExists('designated_drivers');
    
    // Check if user is already registered as DD
    const ddQuery = query(
      collection(db, 'designated_drivers'),
      where('partyId', '==', partyId),
      where('userId', '==', userId)
    );
    
    const querySnapshot = await getDocs(ddQuery);
    
    if (!querySnapshot.empty) {
      // User is already registered as DD
      return { success: true, message: 'You are already registered as a designated driver' };
    }
    
    // Add user as DD
    const ddRef = await addDoc(collection(db, 'designated_drivers'), {
      partyId,
      userId,
      name: userInfo.name || 'Anonymous',
      phone: userInfo.phone || '',
      vehicle: userInfo.vehicle || '',
      seats: userInfo.seats || 4,
      departureTime: userInfo.departureTime || null,
      destination: userInfo.destination || '',
      createdAt: serverTimestamp(),
      active: true
    });
    
    // Update party with DD info
    const partyRef = doc(db, 'parties', partyId);
    await updateDoc(partyRef, {
      designatedDrivers: arrayUnion(userId)
    });
    
    return { success: true, ddId: ddRef.id };
  } catch (error) {
    console.error('Error registering as DD:', error);
    throw error;
  }
};

// Unregister as a designated driver
export const unregisterAsDD = async (partyId, userId) => {
  try {
    checkFirestore();
    await ensureCollectionExists('designated_drivers');
    
    // Find DD record
    const ddQuery = query(
      collection(db, 'designated_drivers'),
      where('partyId', '==', partyId),
      where('userId', '==', userId)
    );
    
    const querySnapshot = await getDocs(ddQuery);
    
    if (querySnapshot.empty) {
      return { success: false, message: 'You are not registered as a designated driver' };
    }
    
    // Update DD record to inactive
    const ddDoc = querySnapshot.docs[0];
    await updateDoc(doc(db, 'designated_drivers', ddDoc.id), {
      active: false
    });
    
    // Update party
    const partyRef = doc(db, 'parties', partyId);
    await updateDoc(partyRef, {
      designatedDrivers: arrayRemove(userId)
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error unregistering as DD:', error);
    throw error;
  }
};

// Get designated drivers for a party
export const getDesignatedDrivers = async (partyId) => {
  try {
    checkFirestore();
    await ensureCollectionExists('designated_drivers');
    
    const ddQuery = query(
      collection(db, 'designated_drivers'),
      where('partyId', '==', partyId),
      where('active', '==', true)
    );
    
    const querySnapshot = await getDocs(ddQuery);
    const drivers = [];
    
    for (const docSnapshot of querySnapshot.docs) {
      const driverData = docSnapshot.data();
      
      // Get user details
      const userDoc = await getDoc(doc(db, 'users', driverData.userId));
      const userData = userDoc.exists() ? userDoc.data() : {};
      
      drivers.push({
        id: docSnapshot.id,
        ...driverData,
        username: userData.username || 'Anonymous',
        createdAt: driverData.createdAt?.toDate?.() || new Date()
      });
    }
    
    return drivers;
  } catch (error) {
    console.error('Error getting designated drivers:', error);
    return [];
  }
};

// Request a ride from a designated driver
export const requestRide = async (ddId, userId, pickupInfo) => {
  try {
    checkFirestore();
    await ensureCollectionExists('ride_requests');
    
    // Check if user already requested a ride
    const rideQuery = query(
      collection(db, 'ride_requests'),
      where('ddId', '==', ddId),
      where('userId', '==', userId),
      where('status', 'in', ['pending', 'accepted'])
    );
    
    const querySnapshot = await getDocs(rideQuery);
    
    if (!querySnapshot.empty) {
      return { success: false, message: 'You already have a pending ride request' };
    }
    
    // Get DD info
    const ddDoc = await getDoc(doc(db, 'designated_drivers', ddId));
    
    if (!ddDoc.exists() || !ddDoc.data().active) {
      return { success: false, message: 'This designated driver is no longer available' };
    }
    
    // Add ride request
    const requestRef = await addDoc(collection(db, 'ride_requests'), {
      ddId,
      userId,
      driverId: ddDoc.data().userId,
      pickupLocation: pickupInfo.location || '',
      pickupTime: pickupInfo.time || null,
      destination: pickupInfo.destination || '',
      passengers: pickupInfo.passengers || 1,
      status: 'pending',
      createdAt: serverTimestamp()
    });
    
    return { success: true, requestId: requestRef.id };
  } catch (error) {
    console.error('Error requesting ride:', error);
    throw error;
  }
};

// Track drinks for a user
export const trackDrink = async (userId, drinkInfo) => {
  try {
    checkFirestore();
    await ensureCollectionExists('drink_tracking');
    
    // Get current date (without time)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Check if user already has a drink record for today
    const drinkQuery = query(
      collection(db, 'drink_tracking'),
      where('userId', '==', userId),
      where('date', '>=', today)
    );
    
    const querySnapshot = await getDocs(drinkQuery);
    
    if (querySnapshot.empty) {
      // Create new drink record
      await addDoc(collection(db, 'drink_tracking'), {
        userId,
        date: today,
        drinks: [
          {
            type: drinkInfo.type || 'other',
            alcoholContent: drinkInfo.alcoholContent || 5,
            ounces: drinkInfo.ounces || 12,
            timestamp: serverTimestamp()
          }
        ],
        totalDrinks: 1,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } else {
      // Update existing drink record
      const drinkDoc = querySnapshot.docs[0];
      await updateDoc(doc(db, 'drink_tracking', drinkDoc.id), {
        drinks: arrayUnion({
          type: drinkInfo.type || 'other',
          alcoholContent: drinkInfo.alcoholContent || 5,
          ounces: drinkInfo.ounces || 12,
          timestamp: serverTimestamp()
        }),
        totalDrinks: increment(1),
        updatedAt: serverTimestamp()
      });
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error tracking drink:', error);
    throw error;
  }
};

// Get drink history for a user
export const getDrinkHistory = async (userId, date = null) => {
  try {
    checkFirestore();
    await ensureCollectionExists('drink_tracking');
    
    let drinkQuery;
    
    if (date) {
      // Get specific date
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      
      drinkQuery = query(
        collection(db, 'drink_tracking'),
        where('userId', '==', userId),
        where('date', '>=', startDate),
        where('date', '<=', endDate)
      );
    } else {
      // Get all drink history
      drinkQuery = query(
        collection(db, 'drink_tracking'),
        where('userId', '==', userId),
        orderBy('date', 'desc')
      );
    }
    
    const querySnapshot = await getDocs(drinkQuery);
    
    if (querySnapshot.empty) {
      return [];
    }
    
    // Get the most recent drink record
    const drinkDoc = querySnapshot.docs[0];
    const drinkData = drinkDoc.data();
    
    return drinkData.drinks || [];
  } catch (error) {
    console.error('Error getting drink history:', error);
    return [];
  }
};

// Calculate estimated BAC
export const calculateBAC = (gender, weight, drinks, hours) => {
  // BAC = (Standard drinks * 0.6 * 100) / (Weight in kg * r) - (0.015 * hours)
  // r is the gender constant (0.68 for men and 0.55 for women)
  
  try {
    // Convert weight from lbs to kg if needed
    const weightInKg = weight * 0.453592;
    
    // Gender constant
    const r = gender.toLowerCase() === 'female' ? 0.55 : 0.68;
    
    // Calculate BAC
    const bac = ((drinks * 0.6 * 100) / (weightInKg * r)) - (0.015 * hours);
    
    // BAC can't be negative
    return Math.max(0, bac).toFixed(3);
  } catch (error) {
    console.error('Error calculating BAC:', error);
    return 0;
  }
};

// Get rideshare options
export const getRideshareOptions = async (location) => {
  // This would typically integrate with Uber/Lyft APIs
  // For now, we'll return mock data
  
  return [
    {
      service: 'Uber',
      options: [
        { type: 'UberX', price: '$12-15', eta: '3 min' },
        { type: 'Uber Comfort', price: '$18-22', eta: '5 min' },
        { type: 'Uber XL', price: '$22-28', eta: '7 min' }
      ],
      deepLink: 'uber://'
    },
    {
      service: 'Lyft',
      options: [
        { type: 'Lyft', price: '$11-14', eta: '4 min' },
        { type: 'Lyft XL', price: '$20-25', eta: '6 min' },
        { type: 'Lux', price: '$25-30', eta: '8 min' }
      ],
      deepLink: 'lyft://'
    }
  ];
};

// Get campus shuttle information
export const getCampusShuttles = async (university) => {
  // This would typically integrate with university transportation APIs
  // For now, we'll return mock data based on university
  
  const shuttles = {
    'University of Example': [
      { route: 'Red Line', nextArrival: '5 min', stops: ['Student Center', 'Library', 'Dorms'] },
      { route: 'Blue Line', nextArrival: '12 min', stops: ['Student Center', 'Athletic Complex', 'Off-campus Housing'] },
      { route: 'Night Owl', nextArrival: '20 min', stops: ['Student Center', 'Downtown', 'Off-campus Housing'] }
    ],
    'Default University': [
      { route: 'Campus Loop', nextArrival: '10 min', stops: ['Main Building', 'Dorms', 'Dining Hall'] },
      { route: 'Weekend Express', nextArrival: '25 min', stops: ['Campus', 'Shopping Center', 'Apartments'] }
    ]
  };
  
  return shuttles[university] || shuttles['Default University'];
}; 