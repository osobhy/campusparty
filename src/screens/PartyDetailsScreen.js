import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getPartyById, handleJoinParty, handleLeaveParty } from '../services/partyService';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import SafetyFeatures from '../components/SafetyFeatures';
import PartyPlaylist from '../components/PartyPlaylist';
import ExpenseSplitter from '../components/ExpenseSplitter';
import PartyFeedback from '../components/PartyFeedback';
import PartyGames from '../components/PartyGames';

// Default theme as fallback
const defaultTheme = {
  background: '#f8f9fa',
  card: '#ffffff',
  text: '#111827',
  subtext: '#6b7280',
  primary: '#6366f1',
  secondary: '#a855f7',
  accent: '#3b82f6',
  border: '#e5e7eb',
  error: '#ef4444',
  success: '#10b981',
  warning: '#f59e0b',
  info: '#3b82f6',
  notification: '#f59e0b'
};

const PartyDetailsScreen = ({ route, navigation }) => {
  const { partyId, university: routeUniversity } = route.params || {};
  const themeContext = useTheme();
  
  // Ensure we always have a valid theme object with all required properties
  const theme = themeContext?.theme || defaultTheme;
  
  const { currentUser, userProfile } = useAuth();
  const [party, setParty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isJoined, setIsJoined] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [isPartyOver, setIsPartyOver] = useState(false);
  const [university, setUniversity] = useState(null);

  // Debug logging
  useEffect(() => {
    console.log('PartyDetailsScreen - Route params:', route.params);
    console.log('PartyDetailsScreen - Route university:', routeUniversity);
    console.log('PartyDetailsScreen - User profile university:', userProfile?.university);
    console.log('PartyDetailsScreen - Theme available:', !!themeContext);
  }, [route.params, userProfile, themeContext]);

  // Initialize university from various sources
  useEffect(() => {
    const universityToUse = routeUniversity || userProfile?.university || 'Unknown';
    console.log('Setting university to:', universityToUse);
    setUniversity(universityToUse);
  }, [routeUniversity, userProfile]);

  useEffect(() => {
    if (partyId) {
      loadPartyDetails();
    } else {
      console.error('No partyId provided in route params');
      Alert.alert('Error', 'No party ID provided');
      navigation.goBack();
    }
  }, [partyId]);

  const loadPartyDetails = async () => {
    try {
      setLoading(true);
      console.log('Loading party details for ID:', partyId);
      const partyData = await getPartyById(partyId);
      
      if (!partyData) {
        console.error('Party not found for ID:', partyId);
        Alert.alert('Error', 'Party not found');
        navigation.goBack();
        return;
      }
      
      console.log('Party data loaded:', partyData);
      setParty(partyData);
      
      // If party has university and we don't, use that
      if (partyData.university && (!university || university === 'Unknown')) {
        console.log('Using party university:', partyData.university);
        setUniversity(partyData.university);
      }
      
      // Check if user is joined or host
      if (currentUser) {
        const isUserJoined = partyData.attendees?.includes(currentUser.uid) || false;
        const isUserHost = partyData.host?.id === currentUser.uid || false;
        console.log('User joined:', isUserJoined, 'User is host:', isUserHost);
        setIsJoined(isUserJoined);
        setIsHost(isUserHost);
      }

      // Check if party is over
      const partyDate = new Date(partyData.date_time);
      const isOver = partyDate < new Date();
      console.log('Party is over:', isOver);
      setIsPartyOver(isOver);
    } catch (error) {
      console.error('Error loading party details:', error);
      Alert.alert('Error', 'Failed to load party details');
    } finally {
      setLoading(false);
    }
  };

  const handlePartyAction = async () => {
    if (!currentUser) {
      Alert.alert('Login Required', 'Please login to join parties');
      navigation.navigate('Login');
      return;
    }
    
    try {
      if (isJoined) {
        // Leave party
        const result = await handleLeaveParty(partyId, currentUser.uid);
        if (result.success) {
          setIsJoined(false);
          Alert.alert('Success', 'You have left the party');
        } else {
          Alert.alert('Error', result.error || 'Failed to leave party');
        }
      } else {
        // Join party
        const result = await handleJoinParty(partyId, currentUser.uid);
        if (result.success) {
          setIsJoined(true);
          Alert.alert('Success', 'You have joined the party');
        } else if (result.alreadyJoined) {
          setIsJoined(true);
        } else {
          Alert.alert('Error', result.error || 'Failed to join party');
        }
      }
      
      // Refresh party details
      loadPartyDetails();
    } catch (error) {
      console.error('Error handling party action:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background || '#f8f9fa' }]}>
        <ActivityIndicator size="large" color={theme.primary || '#6366f1'} />
        <Text style={[styles.loadingText, { color: theme.text || '#111827' }]}>Loading party details...</Text>
      </View>
    );
  }

  if (!party) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: theme.background || '#f8f9fa' }]}>
        <Ionicons name="alert-circle-outline" size={48} color={theme.error || '#ef4444'} />
        <Text style={[styles.errorText, { color: theme.text || '#111827' }]}>Party not found</Text>
        <TouchableOpacity 
          style={[styles.backButton, { backgroundColor: theme.primary || '#6366f1' }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Debug university before rendering components
  console.log('Rendering with university:', university);

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background || '#f8f9fa' }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text || '#111827' }]}>{party.title}</Text>
        <Text style={[styles.host, { color: theme.text || '#111827' }]}>
          Hosted by: {party.host?.username || 'Unknown'}
        </Text>
        {university && (
          <Text style={[styles.universityText, { color: theme.primary || '#6366f1' }]}>
            University: {university}
          </Text>
        )}
      </View>
      
      <View style={[styles.card, { backgroundColor: theme.card || '#ffffff' }]}>
        <Text style={[styles.sectionTitle, { color: theme.text || '#111827' }]}>Details</Text>
        <Text style={[styles.description, { color: theme.text || '#111827' }]}>{party.description}</Text>
        
        <View style={styles.detailRow}>
          <Ionicons name="location-outline" size={20} color={theme.primary || '#6366f1'} />
          <Text style={[styles.detailText, { color: theme.text || '#111827' }]}>{party.location}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Ionicons name="time-outline" size={20} color={theme.primary || '#6366f1'} />
          <Text style={[styles.detailText, { color: theme.text || '#111827' }]}>
            {new Date(party.date_time).toLocaleString()}
          </Text>
        </View>
        
        <View style={styles.detailRow}>
          <Ionicons name="people-outline" size={20} color={theme.primary || '#6366f1'} />
          <Text style={[styles.detailText, { color: theme.text || '#111827' }]}>
            {party.attendees ? party.attendees.length : 0} attending
            {party.max_attendees ? ` (max: ${party.max_attendees})` : ''}
          </Text>
        </View>
        
        {party.requiresPayment && (
          <View style={styles.detailRow}>
            <Ionicons name="cash-outline" size={20} color={theme.primary || '#6366f1'} />
            <Text style={[styles.detailText, { color: theme.text || '#111827' }]}>
              Entry fee: ${party.paymentAmount} (Venmo @{party.venmoUsername})
            </Text>
          </View>
        )}

        {isPartyOver && (
          <View style={[styles.partyStatusBanner, { backgroundColor: (theme.notification || '#f59e0b') + '20' }]}>
            <Ionicons name="time" size={20} color={theme.notification || '#f59e0b'} />
            <Text style={[styles.partyStatusText, { color: theme.notification || '#f59e0b' }]}>
              This party has ended
            </Text>
          </View>
        )}
      </View>
      
      {!isHost && !isPartyOver && (
        <TouchableOpacity 
          style={[
            styles.actionButton, 
            { backgroundColor: isJoined ? (theme.error || '#ef4444') : (theme.primary || '#6366f1') }
          ]}
          onPress={handlePartyAction}
        >
          <Ionicons 
            name={isJoined ? "exit-outline" : "enter-outline"} 
            size={20} 
            color="white" 
          />
          <Text style={styles.actionButtonText}>
            {isJoined ? "Leave Party" : "Join Party"}
          </Text>
        </TouchableOpacity>
      )}
      
      {/* Safety Features Section */}
      <SafetyFeatures partyId={party.id} university={university || 'Unknown'} />
      
      {/* Party Games Section */}
      <PartyGames 
        partyId={party.id} 
        university={university || 'Unknown'} 
        isHost={isHost} 
      />
      
      {/* Party Playlist Section */}
      <PartyPlaylist partyId={party.id} isHost={isHost} />
      
      {/* Expense Splitter Section */}
      <ExpenseSplitter partyId={party.id} partyHost={party.host?.id} />

      {/* Party Feedback Section */}
      <PartyFeedback partyId={party.id} isHost={isHost} isPartyOver={isPartyOver} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  host: {
    fontSize: 16,
    marginBottom: 8,
  },
  universityText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    marginBottom: 16,
    lineHeight: 22,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailText: {
    fontSize: 16,
    marginLeft: 8,
  },
  partyStatusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 8,
    marginTop: 12,
  },
  partyStatusText: {
    marginLeft: 8,
    fontWeight: '500',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 25,
    marginBottom: 20,
  },
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
});

export default PartyDetailsScreen; 