import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { createParty } from '../services/partyService';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function CreatePartyScreen({ navigation }) {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    date_time: new Date(),
    max_attendees: '',
    requiresPayment: false,
    paymentAmount: '',
    venmoUsername: '',
    paymentDescription: '',
  });

  const formatDate = (date) => {
    return date.toLocaleDateString();
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const currentDateTime = new Date(formData.date_time);
      selectedDate.setHours(currentDateTime.getHours());
      selectedDate.setMinutes(currentDateTime.getMinutes());
      setFormData({ ...formData, date_time: selectedDate });
    }
  };

  const onTimeChange = (event, selectedTime) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const newDateTime = new Date(formData.date_time);
      newDateTime.setHours(selectedTime.getHours());
      newDateTime.setMinutes(selectedTime.getMinutes());
      setFormData({ ...formData, date_time: newDateTime });
    }
  };

  const handleSubmit = async () => {
    // Validate inputs
    if (!formData.title || !formData.description || !formData.location) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (formData.max_attendees && isNaN(parseInt(formData.max_attendees))) {
      Alert.alert('Error', 'Maximum attendees must be a number');
      return;
    }

    // Validate payment fields if payment is required
    if (formData.requiresPayment) {
      if (!formData.paymentAmount || isNaN(parseFloat(formData.paymentAmount))) {
        Alert.alert('Error', 'Please enter a valid payment amount');
        return;
      }
      
      if (!formData.venmoUsername) {
        Alert.alert('Error', 'Please enter your Venmo username');
        return;
      }
    }

    // Check if user has university information
    if (!currentUser.university) {
      Alert.alert('Error', 'Your university information is missing. Please update your profile.');
      return;
    }

    try {
      setLoading(true);
      
      // Prepare party data
      const partyData = {
        title: formData.title,
        description: formData.description,
        location: formData.location,
        date_time: formData.date_time.toISOString(),
        max_attendees: formData.max_attendees ? parseInt(formData.max_attendees) : null,
        requiresPayment: formData.requiresPayment,
        paymentAmount: formData.requiresPayment ? formData.paymentAmount : null,
        venmoUsername: formData.requiresPayment ? formData.venmoUsername : null,
        paymentDescription: formData.requiresPayment ? formData.paymentDescription : null,
      };
      
      // Create party in Firestore with university information
      await createParty(partyData, currentUser.uid, currentUser.university);
      
      Alert.alert(
        'Success',
        'Party created successfully!',
        [{ text: 'OK', onPress: () => navigation.navigate('Home') }]
      );
    } catch (error) {
      console.error('Error creating party:', error);
      Alert.alert('Error', 'Failed to create party. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Toggle payment requirement
  const togglePaymentRequired = () => {
    setFormData({
      ...formData,
      requiresPayment: !formData.requiresPayment
    });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView}>
        <View style={styles.form}>
          <View style={styles.universityBanner}>
            <Text style={styles.universityText}>
              Creating party for {currentUser?.university || 'your university'}
            </Text>
            <Text style={styles.universitySubtext}>
              Only students from your university will see this party
            </Text>
          </View>

          <TextInput
            style={styles.input}
            placeholder="Party Title *"
            value={formData.title}
            onChangeText={(text) => setFormData({...formData, title: text})}
          />

          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Description *"
            multiline
            numberOfLines={4}
            value={formData.description}
            onChangeText={(text) => setFormData({...formData, description: text})}
          />

          <TextInput
            style={styles.input}
            placeholder="Location *"
            value={formData.location}
            onChangeText={(text) => setFormData({...formData, location: text})}
          />

          <View style={styles.dateTimeContainer}>
            <TouchableOpacity 
              style={styles.dateTimeButton} 
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dateTimeButtonText}>
                Date: {formatDate(formData.date_time)}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.dateTimeButton} 
              onPress={() => setShowTimePicker(true)}
            >
              <Text style={styles.dateTimeButtonText}>
                Time: {formatTime(formData.date_time)}
              </Text>
            </TouchableOpacity>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={formData.date_time}
              mode="date"
              display="default"
              onChange={onDateChange}
            />
          )}

          {showTimePicker && (
            <DateTimePicker
              value={formData.date_time}
              mode="time"
              display="default"
              onChange={onTimeChange}
            />
          )}

          <TextInput
            style={styles.input}
            placeholder="Maximum Attendees (optional)"
            keyboardType="numeric"
            value={formData.max_attendees}
            onChangeText={(text) => setFormData({...formData, max_attendees: text})}
          />

          {/* Payment Options */}
          <View style={styles.paymentSection}>
            <Text style={styles.sectionTitle}>Payment Options</Text>
            
            <TouchableOpacity 
              style={styles.toggleContainer}
              onPress={togglePaymentRequired}
            >
              <View style={[
                styles.toggleButton, 
                formData.requiresPayment ? styles.toggleActive : {}
              ]}>
                <View style={[
                  styles.toggleCircle, 
                  formData.requiresPayment ? styles.toggleCircleActive : {}
                ]} />
              </View>
              <Text style={styles.toggleText}>
                Require payment to attend
              </Text>
            </TouchableOpacity>

            {formData.requiresPayment && (
              <View style={styles.paymentFields}>
                <TextInput
                  style={styles.input}
                  placeholder="Payment Amount ($) *"
                  keyboardType="decimal-pad"
                  value={formData.paymentAmount}
                  onChangeText={(text) => setFormData({...formData, paymentAmount: text})}
                />
                
                <TextInput
                  style={styles.input}
                  placeholder="Your Venmo Username *"
                  value={formData.venmoUsername}
                  onChangeText={(text) => setFormData({...formData, venmoUsername: text})}
                />
                
                <TextInput
                  style={styles.input}
                  placeholder="Payment Description (optional)"
                  value={formData.paymentDescription}
                  onChangeText={(text) => setFormData({...formData, paymentDescription: text})}
                />
                
                <View style={styles.infoBox}>
                  <Text style={styles.infoText}>
                    Attendees will be prompted to pay via Venmo before they can RSVP.
                    You'll need to manually verify payments.
                  </Text>
                </View>
              </View>
            )}
          </View>

          <TouchableOpacity 
            style={styles.button} 
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>Create Party</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  form: {
    padding: 20,
  },
  universityBanner: {
    backgroundColor: '#6366f1',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  universityText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  universitySubtext: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 5,
  },
  input: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  dateTimeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  dateTimeButton: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    flex: 0.48,
  },
  dateTimeButtonText: {
    color: '#4b5563',
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#6366f1',
    padding: 15,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  paymentSection: {
    marginTop: 10,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  toggleButton: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    padding: 5,
  },
  toggleActive: {
    backgroundColor: '#6366f1',
  },
  toggleCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'white',
  },
  toggleCircleActive: {
    transform: [{ translateX: 20 }],
  },
  toggleText: {
    marginLeft: 10,
    fontSize: 16,
  },
  paymentFields: {
    marginTop: 10,
  },
  infoBox: {
    backgroundColor: '#f0f9ff',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#bae6fd',
    marginBottom: 15,
  },
  infoText: {
    color: '#0369a1',
    fontSize: 14,
  },
});