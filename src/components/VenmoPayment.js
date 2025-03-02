import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Linking,
  ActivityIndicator,
  Modal
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { markUserAsPaid } from '../services/partyService';

const VenmoPayment = ({ 
  partyId, 
  userId, 
  paymentAmount, 
  venmoUsername, 
  paymentDescription,
  onPaymentComplete,
  onCancel
}) => {
  const { theme } = useTheme();
  const [paymentReference, setPaymentReference] = useState('');
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Open Venmo app or website
  const openVenmo = () => {
    // Format the payment description
    const description = paymentDescription || 'Party payment';
    
    // Try to open Venmo app with deep link
    const venmoAppUrl = `venmo://paycharge?txn=pay&recipients=${venmoUsername}&amount=${paymentAmount}&note=${encodeURIComponent(description)}`;
    
    // Fallback to website if app is not installed
    const venmoWebUrl = `https://venmo.com/${venmoUsername}`;
    
    Linking.canOpenURL(venmoAppUrl)
      .then(supported => {
        if (supported) {
          return Linking.openURL(venmoAppUrl);
        } else {
          return Linking.openURL(venmoWebUrl);
        }
      })
      .catch(err => {
        console.error('Error opening Venmo:', err);
        Alert.alert(
          'Error',
          'Could not open Venmo. Please manually send payment to ' + venmoUsername
        );
      });
  };

  // Submit payment reference for verification
  const submitPaymentReference = async () => {
    if (!paymentReference.trim()) {
      Alert.alert('Error', 'Please enter the Venmo payment reference');
      return;
    }

    try {
      setLoading(true);
      await markUserAsPaid(partyId, userId, paymentReference);
      setShowConfirmation(true);
    } catch (error) {
      console.error('Error marking payment:', error);
      Alert.alert('Error', 'Failed to record payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Complete the payment process
  const completePayment = () => {
    setShowConfirmation(false);
    if (onPaymentComplete) {
      onPaymentComplete();
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.card }]}>
      <Text style={[styles.title, { color: theme.text }]}>Payment Required</Text>
      
      <View style={styles.paymentDetails}>
        <Text style={[styles.label, { color: theme.subtext }]}>Amount:</Text>
        <Text style={[styles.value, { color: theme.text }]}>${paymentAmount}</Text>
      </View>
      
      <View style={styles.paymentDetails}>
        <Text style={[styles.label, { color: theme.subtext }]}>Venmo:</Text>
        <Text style={[styles.value, { color: theme.text }]}>@{venmoUsername}</Text>
      </View>
      
      <View style={styles.paymentDetails}>
        <Text style={[styles.label, { color: theme.subtext }]}>Description:</Text>
        <Text style={[styles.value, { color: theme.text }]}>{paymentDescription || 'Party payment'}</Text>
      </View>
      
      <TouchableOpacity 
        style={[styles.venmoButton, { backgroundColor: '#3D95CE' }]}
        onPress={openVenmo}
      >
        <Text style={styles.venmoButtonText}>Pay with Venmo</Text>
      </TouchableOpacity>
      
      <Text style={[styles.orText, { color: theme.subtext }]}>- OR -</Text>
      
      <Text style={[styles.instructionText, { color: theme.text }]}>
        After making your payment, enter the Venmo transaction ID or reference below:
      </Text>
      
      <TextInput
        style={[styles.input, { 
          backgroundColor: theme.inputBackground,
          color: theme.text,
          borderColor: theme.border
        }]}
        placeholder="Venmo Transaction ID/Reference"
        placeholderTextColor={theme.subtext}
        value={paymentReference}
        onChangeText={setPaymentReference}
      />
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.cancelButton, { borderColor: theme.border }]}
          onPress={onCancel}
        >
          <Text style={[styles.buttonText, { color: theme.text }]}>Cancel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.submitButton, { backgroundColor: theme.primary }]}
          onPress={submitPaymentReference}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={styles.submitButtonText}>Submit</Text>
          )}
        </TouchableOpacity>
      </View>
      
      {/* Confirmation Modal */}
      <Modal
        visible={showConfirmation}
        transparent
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Payment Recorded</Text>
            <Text style={[styles.modalText, { color: theme.subtext }]}>
              Your payment has been recorded. The host will verify your payment and confirm your attendance.
            </Text>
            <TouchableOpacity 
              style={[styles.modalButton, { backgroundColor: theme.primary }]}
              onPress={completePayment}
            >
              <Text style={styles.modalButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    borderRadius: 10,
    marginVertical: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  paymentDetails: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  label: {
    width: 100,
    fontWeight: 'bold',
  },
  value: {
    flex: 1,
  },
  venmoButton: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 15,
  },
  venmoButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  orText: {
    textAlign: 'center',
    marginVertical: 15,
  },
  instructionText: {
    marginBottom: 10,
  },
  input: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 15,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    padding: 12,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    marginRight: 10,
    borderWidth: 1,
  },
  submitButton: {
    marginLeft: 10,
  },
  buttonText: {
    fontWeight: 'bold',
  },
  submitButtonText: {
    color: 'white',
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
    padding: 20,
    borderRadius: 10,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalText: {
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 22,
  },
  modalButton: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default VenmoPayment; 