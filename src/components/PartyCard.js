import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import PartyQRCode from './PartyQRCode';
import VenmoPayment from './VenmoPayment';
import { useAuth } from '../context/AuthContext';
import { checkUserPaymentStatus } from '../services/partyService';

export default function PartyCard({ party, onJoin, isLoggedIn, isJoined, isHost, theme: propTheme }) {
  // Use provided theme from props or get from context
  const themeContext = useTheme();
  const theme = propTheme || themeContext.theme;
  const [showQRCode, setShowQRCode] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const { currentUser } = useAuth();
  
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

  // Check payment status when component mounts
  useEffect(() => {
    if (isLoggedIn && currentUser && party.requiresPayment) {
      checkPaymentStatus();
    }
  }, [isLoggedIn, currentUser, party.id]);

  // Check if user has paid for the party
  const checkPaymentStatus = async () => {
    try {
      setLoading(true);
      const status = await checkUserPaymentStatus(party.id, currentUser.uid);
      setPaymentStatus(status);
    } catch (error) {
      console.error('Error checking payment status:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle join button press
  const handleJoinPress = () => {
    if (isJoined) {
      // If already joined, leave the party
      onJoin();
    } else if (party.requiresPayment && !paymentStatus?.isPaid) {
      // If payment required and not paid, show payment screen
      setShowPayment(true);
    } else {
      // Otherwise join normally
      onJoin();
    }
  };

  // Handle payment completion
  const handlePaymentComplete = () => {
    setShowPayment(false);
    checkPaymentStatus();
    onJoin();
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
        
        {/* Payment information */}
        {party.requiresPayment && (
          <View style={styles.paymentInfo}>
            <Text style={[styles.detailText, { color: theme.subtext }]}>
              💰 Entry Fee: ${party.paymentAmount}
            </Text>
            <Text style={[styles.detailText, { color: theme.subtext }]}>
              💳 Payment: Venmo @{party.venmoUsername}
            </Text>
            {isJoined && paymentStatus && (
              <View style={[
                styles.paymentStatus, 
                { backgroundColor: paymentStatus.isPaid ? theme.success + '20' : theme.error + '20' }
              ]}>
                <Text style={[
                  styles.paymentStatusText, 
                  { color: paymentStatus.isPaid ? theme.success : theme.error }
                ]}>
                  {paymentStatus.isPaid ? 'Payment Verified ✓' : 'Payment Required'}
                </Text>
              </View>
            )}
          </View>
        )}
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
          onPress={handleJoinPress}
        >
          <Text style={styles.joinButtonText}>
            {isJoined ? 'Leave Party' : 'Join Party'}
          </Text>
        </TouchableOpacity>
      )}
      
      {/* QR Code Modal */}
      <PartyQRCode 
        visible={showQRCode} 
        onClose={() => setShowQRCode(false)} 
        party={party} 
      />
      
      {/* Payment Modal */}
      <Modal
        visible={showPayment}
        transparent
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <VenmoPayment
              partyId={party.id}
              userId={currentUser?.uid}
              paymentAmount={party.paymentAmount}
              venmoUsername={party.venmoUsername}
              paymentDescription={party.paymentDescription || `Payment for ${party.title}`}
              onPaymentComplete={handlePaymentComplete}
              onCancel={() => setShowPayment(false)}
            />
          </View>
        </View>
      </Modal>
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
  paymentInfo: {
    marginTop: 5,
    paddingTop: 5,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  paymentStatus: {
    marginTop: 5,
    padding: 5,
    borderRadius: 5,
    alignSelf: 'flex-start',
  },
  paymentStatusText: {
    fontWeight: 'bold',
    fontSize: 12,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    borderRadius: 15,
    overflow: 'hidden',
  },
});