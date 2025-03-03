import { db } from '../config/firebase';
import { collection, addDoc, getDocs, query, where, orderBy, doc, getDoc } from 'firebase/firestore';

/**
 * Submit anonymous feedback for a party
 * @param {string} partyId - The ID of the party
 * @param {Object} feedbackData - The feedback data
 * @returns {Promise<string>} - The ID of the created feedback
 */
export const submitFeedback = async (partyId, feedbackData) => {
  try {
    const feedbackRef = collection(db, 'parties', partyId, 'feedback');
    const docRef = await addDoc(feedbackRef, {
      ...feedbackData,
      timestamp: new Date().toISOString(),
      isAnonymous: feedbackData.isAnonymous || true
    });
    return docRef.id;
  } catch (error) {
    console.error('Error submitting feedback:', error);
    throw error;
  }
};

/**
 * Get all feedback for a party
 * @param {string} partyId - The ID of the party
 * @returns {Promise<Array>} - Array of feedback objects
 */
export const getPartyFeedback = async (partyId) => {
  try {
    const feedbackRef = collection(db, 'parties', partyId, 'feedback');
    const q = query(feedbackRef, orderBy('timestamp', 'desc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting party feedback:', error);
    throw error;
  }
};

/**
 * Get feedback statistics for a party
 * @param {string} partyId - The ID of the party
 * @returns {Promise<Object>} - Feedback statistics
 */
export const getFeedbackStats = async (partyId) => {
  try {
    const feedback = await getPartyFeedback(partyId);
    
    if (feedback.length === 0) {
      return {
        averageRating: 0,
        totalFeedback: 0,
        ratingDistribution: {
          1: 0,
          2: 0,
          3: 0,
          4: 0,
          5: 0
        }
      };
    }
    
    // Calculate average rating
    const totalRating = feedback.reduce((sum, item) => sum + (item.rating || 0), 0);
    const averageRating = totalRating / feedback.length;
    
    // Calculate rating distribution
    const ratingDistribution = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0
    };
    
    feedback.forEach(item => {
      if (item.rating && ratingDistribution[item.rating] !== undefined) {
        ratingDistribution[item.rating]++;
      }
    });
    
    return {
      averageRating,
      totalFeedback: feedback.length,
      ratingDistribution
    };
  } catch (error) {
    console.error('Error getting feedback stats:', error);
    throw error;
  }
};

/**
 * Check if a user has already submitted feedback for a party
 * @param {string} partyId - The ID of the party
 * @param {string} userId - The ID of the user
 * @returns {Promise<boolean>} - Whether the user has submitted feedback
 */
export const hasUserSubmittedFeedback = async (partyId, userId) => {
  try {
    const feedbackRef = collection(db, 'parties', partyId, 'feedback');
    const q = query(feedbackRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    return !querySnapshot.empty;
  } catch (error) {
    console.error('Error checking if user submitted feedback:', error);
    throw error;
  }
};

/**
 * Get feedback for parties hosted by a user
 * @param {string} hostId - The ID of the host
 * @returns {Promise<Object>} - Object with party IDs as keys and feedback arrays as values
 */
export const getHostFeedback = async (hostId) => {
  try {
    // Get parties hosted by the user
    const partiesRef = collection(db, 'parties');
    const q = query(partiesRef, where('host.id', '==', hostId));
    const partiesSnapshot = await getDocs(q);
    
    const feedbackByParty = {};
    
    // Get feedback for each party
    for (const partyDoc of partiesSnapshot.docs) {
      const partyId = partyDoc.id;
      const feedback = await getPartyFeedback(partyId);
      
      feedbackByParty[partyId] = {
        partyName: partyDoc.data().title,
        feedback
      };
    }
    
    return feedbackByParty;
  } catch (error) {
    console.error('Error getting host feedback:', error);
    throw error;
  }
}; 