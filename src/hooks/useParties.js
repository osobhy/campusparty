import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { 
  getAllParties, 
  joinParty, 
  leaveParty, 
  getUserHostedParties, 
  getUserJoinedParties 
} from '../services/partyService';
import { useAuth } from '../context/AuthContext';

export const useParties = (userId) => {
  const [parties, setParties] = useState([]);
  const [hostedParties, setHostedParties] = useState([]);
  const [joinedParties, setJoinedParties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();

  const fetchParties = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get user's university from currentUser
      const userUniversity = currentUser?.university;
      
      // Only show parties from the user's university
      const partiesData = await getAllParties(userUniversity);
      setParties(partiesData || []);
      
      if (userId) {
        try {
          // Fetch user's hosted parties
          const hosted = await getUserHostedParties(userId, userUniversity);
          setHostedParties(hosted || []);
        } catch (hostError) {
          console.error('Error fetching hosted parties:', hostError);
          setHostedParties([]);
        }
        
        try {
          // Fetch user's joined parties
          const joined = await getUserJoinedParties(userId, userUniversity);
          setJoinedParties(joined || []);
        } catch (joinError) {
          console.error('Error fetching joined parties:', joinError);
          setJoinedParties([]);
        }
      }
    } catch (error) {
      console.error('Error fetching parties:', error);
      setError('Failed to load parties. Please try again.');
      setParties([]);
      setHostedParties([]);
      setJoinedParties([]);
    } finally {
      setLoading(false);
    }
  }, [userId, currentUser?.university]);

  const handleJoinParty = useCallback(async (partyId, userId) => {
    if (!userId) {
      return { success: false, requiresAuth: true };
    }

    try {
      // Check if user has already joined
      const party = parties.find(p => p.id === partyId);
      if (!party) {
        return { 
          success: false, 
          error: 'Party not found' 
        };
      }
      
      if (party.attendees && party.attendees.includes(userId)) {
        // User is already attending, ask if they want to leave
        return { 
          success: true, 
          alreadyJoined: true, 
          party 
        };
      }

      // Join the party
      await joinParty(partyId, userId);
      await fetchParties(); // Refresh parties list
      return { success: true };
    } catch (error) {
      console.error('Error joining party:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to join party' 
      };
    }
  }, [parties, fetchParties]);

  const handleLeaveParty = useCallback(async (partyId, userId) => {
    try {
      await leaveParty(partyId, userId);
      await fetchParties(); // Refresh parties list
      return { success: true };
    } catch (error) {
      console.error('Error leaving party:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to leave party' 
      };
    }
  }, [fetchParties]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchParties();
    setRefreshing(false);
  }, [fetchParties]);

  // Initial fetch
  useEffect(() => {
    fetchParties();
  }, [fetchParties]);

  return {
    parties,
    hostedParties,
    joinedParties,
    loading,
    refreshing,
    error,
    fetchParties,
    handleJoinParty,
    handleLeaveParty,
    onRefresh
  };
}; 