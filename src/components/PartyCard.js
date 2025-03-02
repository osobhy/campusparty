import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import PartyQRCode from './PartyQRCode';

export default function PartyCard({ party, onJoin, isLoggedIn, isJoined, isHost, theme: propTheme }) {
  // Use provided theme from props or get from context
  const themeContext = useTheme();
  const theme = propTheme || themeContext.theme;
  const [showQRCode, setShowQRCode] = useState(false);
  
  // Format date and time
  const formatDateTime = (dateTimeString) => {
    try {
      const date = new Date(dateTimeString);
      return date.toLocaleString([], {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Date not available';
    }
  };

  if (!party) {
    return null;
  }

  return (
    <View style={[styles.card, { 
      backgroundColor: theme.card,
      shadowColor: theme.text,
      borderColor: theme.border,
    }]}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: theme.primary }]}>
          {party.title || 'Untitled Party'}
        </Text>
        
        {isLoggedIn && (
          <TouchableOpacity 
            style={[styles.shareButton, { backgroundColor: theme.primary + '20' }]}
            onPress={() => setShowQRCode(true)}
          >
            <Ionicons name="share-social-outline" size={20} color={theme.primary} />
          </TouchableOpacity>
        )}
      </View>
      
      <Text style={[styles.description, { color: theme.text }]}>
        {party.description || 'No description available'}
      </Text>
      
      <View style={styles.details}>
        <Text style={[styles.detailText, { color: theme.subtext }]}>
          📍 {party.location || 'Location not specified'}
        </Text>
        <Text style={[styles.detailText, { color: theme.subtext }]}>
          🕒 {formatDateTime(party.date_time)}
        </Text>
        <Text style={[styles.detailText, { color: theme.subtext }]}>
          👤 Host: {party.host?.username || 'Unknown Host'}
        </Text>
        {party.max_attendees && (
          <Text style={[styles.detailText, { color: theme.subtext }]}>
            👥 Max Attendees: {party.max_attendees}
          </Text>
        )}
        <Text style={[styles.detailText, { color: theme.subtext }]}>
          🎟️ Current Attendees: {party.attendees ? party.attendees.length : 0}
        </Text>
      </View>

      {party.university && (
        <View style={[styles.universityTag, { backgroundColor: theme.primary + '20' }]}>
          <Text style={[styles.universityText, { color: theme.primary }]}>
            {party.university}
          </Text>
        </View>
      )}

      {isHost ? (
        <View style={[styles.hostBadge, { backgroundColor: theme.primary }]}>
          <Text style={styles.hostBadgeText}>You are hosting this party</Text>
        </View>
      ) : (
        <TouchableOpacity 
          style={[
            styles.joinButton,
            { backgroundColor: isJoined ? theme.error : theme.success },
          ]}
          onPress={onJoin}
        >
          <Text style={styles.joinButtonText}>
            {isJoined ? 'Leave Party' : 'Join Party'}
          </Text>
        </TouchableOpacity>
      )}
      
      <PartyQRCode 
        visible={showQRCode} 
        onClose={() => setShowQRCode(false)} 
        party={party} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
  },
  shareButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  description: {
    fontSize: 16,
    marginBottom: 15,
  },
  details: {
    marginBottom: 15,
  },
  detailText: {
    fontSize: 14,
    marginBottom: 5,
  },
  universityTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 10,
  },
  universityText: {
    fontSize: 12,
    fontWeight: '600',
  },
  joinButton: {
    padding: 12,
    borderRadius: 25,
    alignItems: 'center',
  },
  joinButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  hostBadge: {
    padding: 12,
    borderRadius: 25,
    alignItems: 'center',
  },
  hostBadgeText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});