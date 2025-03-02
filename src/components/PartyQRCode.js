import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

// Import QRCode with error handling
let QRCode;
try {
  QRCode = require('react-native-qrcode-svg').default;
} catch (error) {
  console.warn('QR Code library not available:', error);
  // Fallback component if QRCode is not available
  QRCode = ({ value, size, color, backgroundColor }) => (
    <View 
      style={{ 
        width: size, 
        height: size, 
        backgroundColor: backgroundColor,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: color
      }}
    >
      <Text style={{ color, textAlign: 'center' }}>QR Code Unavailable</Text>
    </View>
  );
}

const PartyQRCode = ({ visible, onClose, party }) => {
  const { theme } = useTheme();
  
  if (!party) return null;
  
  // Create a shareable party link
  const partyLink = `campusparty://party/${party.id}`;
  
  // Create a shareable party message
  const partyMessage = `Join my party: ${party.title}\n\nLocation: ${party.location}\nDate: ${new Date(party.date_time).toLocaleString()}\n\nJoin with this link: ${partyLink}`;
  
  // Handle sharing the party
  const handleShare = async () => {
    try {
      await Share.share({
        message: partyMessage,
        title: `Join ${party.title}`,
      });
    } catch (error) {
      console.error('Error sharing party:', error);
    }
  };
  
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color={theme.text} />
          </TouchableOpacity>
          
          <Text style={[styles.title, { color: theme.text }]}>Share Party</Text>
          
          <View style={styles.qrContainer}>
            <QRCode
              value={partyLink}
              size={200}
              color={theme.text}
              backgroundColor={theme.card}
            />
          </View>
          
          <Text style={[styles.partyTitle, { color: theme.primary }]}>{party.title}</Text>
          <Text style={[styles.partyDetails, { color: theme.subtext }]}>
            {new Date(party.date_time).toLocaleString()}
          </Text>
          <Text style={[styles.partyDetails, { color: theme.subtext }]}>
            {party.location}
          </Text>
          
          <TouchableOpacity 
            style={[styles.shareButton, { backgroundColor: theme.primary }]}
            onPress={handleShare}
          >
            <Ionicons name="share-social" size={20} color="white" style={styles.shareIcon} />
            <Text style={styles.shareButtonText}>Share Party</Text>
          </TouchableOpacity>
          
          <Text style={[styles.note, { color: theme.subtext }]}>
            Scan this QR code to join the party
          </Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '85%',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    borderWidth: 1,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    zIndex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    marginTop: 10,
  },
  qrContainer: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  partyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
  },
  partyDetails: {
    fontSize: 14,
    marginBottom: 5,
    textAlign: 'center',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginTop: 20,
    marginBottom: 10,
  },
  shareIcon: {
    marginRight: 8,
  },
  shareButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  note: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 10,
  },
});

export default PartyQRCode; 