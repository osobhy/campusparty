import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getPartyById, handleJoinParty, handleLeaveParty } from '../services/partyService';
import { useAuth } from '../contexts/AuthContext';
import SafetyFeatures from '../components/SafetyFeatures';
import PartyPlaylist from '../components/PartyPlaylist';
import ExpenseSplitter from '../components/ExpenseSplitter';
import PartyFeedback from '../components/PartyFeedback';
import PartyGames from '../components/PartyGames';

const PartyDetailsScreen = ({ route, navigation }) => {
  const { partyId } = route.params;
  const { colors } = useTheme();
  const { user } = useAuth();
  const [party, setParty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isJoined, setIsJoined] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [isPartyOver, setIsPartyOver] = useState(false);

  useEffect(() => {
    loadPartyDetails();
  }, [partyId]);

  const loadPartyDetails = async () => {
    try {
      setLoading(true);
      const partyData = await getPartyById(partyId);
      
      if (!partyData) {
        Alert.alert('Error', 'Party not found');
        navigation.goBack();
        return;
      }
      
      setParty(partyData);
      
      // Check if user is joined or host
      if (user) {
        setIsJoined(partyData.attendees?.includes(user.uid) || false);
        setIsHost(partyData.host?.id === user.uid || false);
      }

      // Check if party is over
      const partyDate = new Date(partyData.date_time);
      setIsPartyOver(partyDate < new Date());
    } catch (error) {
      console.error('Error loading party details:', error);
      Alert.alert('Error', 'Failed to load party details');
    } finally {
      setLoading(false);
    }
  };

  const handlePartyAction = async () => {
    if (!user) {
      Alert.alert('Login Required', 'Please login to join parties');
      navigation.navigate('Login');
      return;
    }
    
    try {
      if (isJoined) {
        // Leave party
        const result = await handleLeaveParty(partyId, user.uid);
        if (result.success) {
          setIsJoined(false);
          Alert.alert('Success', 'You have left the party');
        } else {
          Alert.alert('Error', result.error || 'Failed to leave party');
        }
      } else {
        // Join party
        const result = await handleJoinParty(partyId, user.uid);
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
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>Loading party details...</Text>
      </View>
    );
  }

  if (!party) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
        <Text style={[styles.errorText, { color: colors.text }]}>Party not found</Text>
        <TouchableOpacity 
          style={[styles.backButton, { backgroundColor: colors.primary }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>{party.title}</Text>
        <Text style={[styles.host, { color: colors.text }]}>
          Hosted by: {party.host?.username || 'Unknown'}
        </Text>
      </View>
      
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Details</Text>
        <Text style={[styles.description, { color: colors.text }]}>{party.description}</Text>
        
        <View style={styles.detailRow}>
          <Ionicons name="location-outline" size={20} color={colors.primary} />
          <Text style={[styles.detailText, { color: colors.text }]}>{party.location}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Ionicons name="time-outline" size={20} color={colors.primary} />
          <Text style={[styles.detailText, { color: colors.text }]}>
            {new Date(party.date_time).toLocaleString()}
          </Text>
        </View>
        
        <View style={styles.detailRow}>
          <Ionicons name="people-outline" size={20} color={colors.primary} />
          <Text style={[styles.detailText, { color: colors.text }]}>
            {party.attendees ? party.attendees.length : 0} attending
            {party.max_attendees ? ` (max: ${party.max_attendees})` : ''}
          </Text>
        </View>
        
        {party.requiresPayment && (
          <View style={styles.detailRow}>
            <Ionicons name="cash-outline" size={20} color={colors.primary} />
            <Text style={[styles.detailText, { color: colors.text }]}>
              Entry fee: ${party.paymentAmount} (Venmo @{party.venmoUsername})
            </Text>
          </View>
        )}

        {isPartyOver && (
          <View style={[styles.partyStatusBanner, { backgroundColor: colors.notification + '20' }]}>
            <Ionicons name="time" size={20} color={colors.notification} />
            <Text style={[styles.partyStatusText, { color: colors.notification }]}>
              This party has ended
            </Text>
          </View>
        )}
      </View>
      
      {!isHost && !isPartyOver && (
        <TouchableOpacity 
          style={[
            styles.actionButton, 
            { backgroundColor: isJoined ? colors.error : colors.primary }
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
      <SafetyFeatures partyId={party.id} university={party.university || 'Unknown'} />
      
      {/* Party Games Section */}
      <PartyGames 
        partyId={party.id} 
        university={party.university || 'Unknown'} 
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
    marginBottom: 16,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
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
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 8,
    marginBottom: 20,
  },
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  partyStatusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 6,
    marginTop: 12,
  },
  partyStatusText: {
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default PartyDetailsScreen; 