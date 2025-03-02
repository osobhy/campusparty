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
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { Alert, Linking } from 'react-native';

// Create a new party
export const createParty = async (partyData, userId, university) => {
  try {
    const partyRef = await addDoc(collection(db, 'parties'), {
      ...partyData,
      host: userId,
      university: university,
      createdAt: serverTimestamp(),
      attendees: [userId], // Host is automatically an attendee
      updatedAt: serverTimestamp()
    });

    // Update user's hosted parties
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      parties: arrayUnion(partyRef.id),
      joinedParties: arrayUnion(partyRef.id)
    });

    return partyRef.id;
  } catch (error) {
    console.error('Error creating party:', error);
    throw error;
  }
};

// Get all parties for a specific university
export const getAllParties = async (university) => {
  try {
    let partiesQuery;
    
    if (university) {
      // Filter parties by university
      partiesQuery = query(
        collection(db, 'parties'),
        where('university', '==', university),
        orderBy('date_time', 'asc')
      );
    } else {
      // Get all parties if no university is specified
      partiesQuery = query(
        collection(db, 'parties'),
        orderBy('date_time', 'asc')
      );
    }
    
    try {
      const querySnapshot = await getDocs(partiesQuery);
      const parties = [];
      
      for (const docSnapshot of querySnapshot.docs) {
        const partyData = docSnapshot.data();
        
        // Get host details
        const hostDoc = await getDoc(doc(db, 'users', partyData.host));
        const hostData = hostDoc.exists() ? hostDoc.data() : { username: 'Unknown Host' };
        
        parties.push({
          id: docSnapshot.id,
          ...partyData,
          host: {
            id: partyData.host,
            username: hostData.username
          },
          createdAt: partyData.createdAt?.toDate?.() || new Date(),
          updatedAt: partyData.updatedAt?.toDate?.() || new Date(),
          date_time: partyData.date_time?.toDate?.() || new Date(partyData.date_time)
        });
      }
      
      return parties;
    } catch (indexError) {
      console.error('Index error for parties query:', indexError);
      
      // Check if it's a permission error
      if (indexError.code === 'permission-denied') {
        console.log('Permission denied. Returning empty array.');
        return [];
      }
      
      // If it's an index error, try the fallback
      if (indexError.message && indexError.message.includes('requires an index')) {
        handleMissingIndexError(indexError);
      }
      
      // Fallback to a simpler query without filtering by university
      try {
        const simpleQuery = collection(db, 'parties');
        const querySnapshot = await getDocs(simpleQuery);
        const parties = [];
        
        for (const docSnapshot of querySnapshot.docs) {
          const partyData = docSnapshot.data();
          
          // Filter by university manually if specified
          if (university && partyData.university !== university) {
            continue;
          }
          
          // Get host details
          const hostDoc = await getDoc(doc(db, 'users', partyData.host));
          const hostData = hostDoc.exists() ? hostDoc.data() : { username: 'Unknown Host' };
          
          parties.push({
            id: docSnapshot.id,
            ...partyData,
            host: {
              id: partyData.host,
              username: hostData.username
            },
            createdAt: partyData.createdAt?.toDate?.() || new Date(),
            updatedAt: partyData.updatedAt?.toDate?.() || new Date(),
            date_time: partyData.date_time?.toDate?.() || new Date(partyData.date_time)
          });
        }
        
        // Sort manually
        return parties.sort((a, b) => new Date(a.date_time) - new Date(b.date_time));
      } catch (fallbackError) {
        // If even the fallback fails, return an empty array
        console.error('Fallback query failed:', fallbackError);
        return [];
      }
    }
  } catch (error) {
    console.error('Error getting parties:', error);
    // Return empty array instead of throwing
    return [];
  }
};

// Get a single party by ID
export const getPartyById = async (partyId) => {
  try {
    const partyDoc = await getDoc(doc(db, 'parties', partyId));
    
    if (!partyDoc.exists()) {
      throw new Error('Party not found');
    }
    
    const partyData = partyDoc.data();
    
    // Get host details
    const hostDoc = await getDoc(doc(db, 'users', partyData.host));
    const hostData = hostDoc.exists() ? hostDoc.data() : { username: 'Unknown Host' };
    
    return {
      id: partyDoc.id,
      ...partyData,
      host: {
        id: partyData.host,
        username: hostData.username
      },
      createdAt: partyData.createdAt?.toDate?.() || new Date(),
      updatedAt: partyData.updatedAt?.toDate?.() || new Date(),
      date_time: partyData.date_time?.toDate?.() || new Date(partyData.date_time)
    };
  } catch (error) {
    console.error('Error getting party:', error);
    throw error;
  }
};

// Join a party
export const joinParty = async (partyId, userId) => {
  try {
    const partyRef = doc(db, 'parties', partyId);
    const partyDoc = await getDoc(partyRef);
    
    if (!partyDoc.exists()) {
      throw new Error('Party not found');
    }
    
    const partyData = partyDoc.data();
    
    // Check if party is full
    if (partyData.max_attendees && partyData.attendees.length >= partyData.max_attendees) {
      throw new Error('Party is full');
    }
    
    // Add user to party attendees
    await updateDoc(partyRef, {
      attendees: arrayUnion(userId),
      updatedAt: serverTimestamp()
    });
    
    // Add party to user's joined parties
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      joinedParties: arrayUnion(partyId)
    });
    
    return true;
  } catch (error) {
    console.error('Error joining party:', error);
    throw error;
  }
};

// Leave a party
export const leaveParty = async (partyId, userId) => {
  try {
    const partyRef = doc(db, 'parties', partyId);
    const partyDoc = await getDoc(partyRef);
    
    if (!partyDoc.exists()) {
      throw new Error('Party not found');
    }
    
    const partyData = partyDoc.data();
    
    // Check if user is the host
    if (partyData.host === userId) {
      throw new Error('Host cannot leave their own party');
    }
    
    // Remove user from party attendees
    await updateDoc(partyRef, {
      attendees: arrayRemove(userId),
      updatedAt: serverTimestamp()
    });
    
    // Remove party from user's joined parties
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      joinedParties: arrayRemove(partyId)
    });
    
    return true;
  } catch (error) {
    console.error('Error leaving party:', error);
    throw error;
  }
};

// Helper function to handle missing index errors
const handleMissingIndexError = (error) => {
  if (error.message && error.message.includes('requires an index')) {
    // Extract the URL from the error message
    const urlMatch = error.message.match(/(https:\/\/console\.firebase\.google\.com\/[^\s]+)/);
    if (urlMatch && urlMatch[1]) {
      const indexUrl = urlMatch[1];
      Alert.alert(
        'Index Required',
        'This query requires a Firestore index. Would you like to create it now?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Create Index', 
            onPress: () => Linking.openURL(indexUrl)
          }
        ]
      );
    }
    return [];
  }
  throw error;
};

// Get parties hosted by a user
export const getUserHostedParties = async (userId, university) => {
  try {
    // First try with the composite query
    try {
      let partiesQuery;
      
      if (university) {
        partiesQuery = query(
          collection(db, 'parties'),
          where('host', '==', userId),
          where('university', '==', university),
          orderBy('date_time', 'asc')
        );
      } else {
        partiesQuery = query(
          collection(db, 'parties'),
          where('host', '==', userId),
          orderBy('date_time', 'asc')
        );
      }
      
      const querySnapshot = await getDocs(partiesQuery);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
        date_time: doc.data().date_time?.toDate?.() || new Date(doc.data().date_time)
      }));
    } catch (indexError) {
      console.error('Index error for hosted parties:', indexError);
      
      // Fallback to a simpler query without ordering
      const simpleQuery = query(
        collection(db, 'parties'),
        where('host', '==', userId)
      );
      
      const querySnapshot = await getDocs(simpleQuery);
      const parties = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date(),
          updatedAt: data.updatedAt?.toDate?.() || new Date(),
          date_time: data.date_time?.toDate?.() || new Date(data.date_time)
        };
      }).filter(party => !university || party.university === university);
      
      // Sort manually
      return parties.sort((a, b) => new Date(a.date_time) - new Date(b.date_time));
    }
  } catch (error) {
    console.error('Error getting hosted parties:', error);
    return handleMissingIndexError(error);
  }
};

// Get user joined parties
export const getUserJoinedParties = async (userId) => {
  try {
    // Get user document to get the list of joined party IDs
    const userDoc = await getDoc(doc(db, 'users', userId));
    
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }
    
    const userData = userDoc.data();
    const joinedPartyIds = userData.joinedParties || [];
    
    if (joinedPartyIds.length === 0) {
      return [];
    }
    
    try {
      // Query parties where the user is an attendee
      const partiesQuery = query(
        collection(db, 'parties'),
        where('attendees', 'array-contains', userId),
        orderBy('date_time', 'asc')
      );
      
      const querySnapshot = await getDocs(partiesQuery);
      const parties = [];
      
      for (const docSnapshot of querySnapshot.docs) {
        const partyData = docSnapshot.data();
        
        // Get host details
        const hostDoc = await getDoc(doc(db, 'users', partyData.host));
        const hostData = hostDoc.exists() ? hostDoc.data() : { username: 'Unknown Host' };
        
        parties.push({
          id: docSnapshot.id,
          ...partyData,
          host: {
            id: partyData.host,
            username: hostData.username
          },
          createdAt: partyData.createdAt?.toDate?.() || new Date(),
          updatedAt: partyData.updatedAt?.toDate?.() || new Date(),
          date_time: partyData.date_time?.toDate?.() || new Date(partyData.date_time)
        });
      }
      
      return parties;
    } catch (indexError) {
      console.error('Error fetching joined parties:', indexError);
      
      // Check if it's a permission error
      if (indexError.code === 'permission-denied') {
        console.log('Permission denied. Returning empty array.');
        return [];
      }
      
      // If it's an index error, show the index creation dialog
      if (indexError.message && indexError.message.includes('requires an index')) {
        handleMissingIndexError(indexError);
      }
      
      // Fallback: fetch each party individually
      try {
        const parties = [];
        
        for (const partyId of joinedPartyIds) {
          try {
            const partyDoc = await getDoc(doc(db, 'parties', partyId));
            
            if (partyDoc.exists()) {
              const partyData = partyDoc.data();
              
              // Get host details
              const hostDoc = await getDoc(doc(db, 'users', partyData.host));
              const hostData = hostDoc.exists() ? hostDoc.data() : { username: 'Unknown Host' };
              
              parties.push({
                id: partyDoc.id,
                ...partyData,
                host: {
                  id: partyData.host,
                  username: hostData.username
                },
                createdAt: partyData.createdAt?.toDate?.() || new Date(),
                updatedAt: partyData.updatedAt?.toDate?.() || new Date(),
                date_time: partyData.date_time?.toDate?.() || new Date(partyData.date_time)
              });
            }
          } catch (error) {
            console.error(`Error fetching party ${partyId}:`, error);
          }
        }
        
        // Sort manually
        return parties.sort((a, b) => new Date(a.date_time) - new Date(b.date_time));
      } catch (fallbackError) {
        console.error('Fallback method failed:', fallbackError);
        return [];
      }
    }
  } catch (error) {
    console.error('Error fetching joined parties:', error);
    return [];
  }
}; 