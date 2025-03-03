import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { 
  registerAsDD, 
  unregisterAsDD, 
  getDesignatedDrivers, 
  requestRide, 
  trackDrink, 
  getDrinkHistory, 
  calculateBAC,
  getRideshareOptions,
  getCampusShuttles
} from '../services/safetyService';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { db } from '../firebase/config';

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
  notification: '#f59e0b',
  colors: {
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
  }
};

const SafetyFeatures = ({ partyId, university }) => {
  const { currentUser, userProfile } = useAuth();
  const themeContext = useTheme();
  
  // Ensure we always have a valid theme object with all required properties
  const theme = themeContext?.theme || defaultTheme;
  
  const [isDD, setIsDD] = useState(false);
  const [ddList, setDdList] = useState([]);
  const [drinkCount, setDrinkCount] = useState(0);
  const [drinkHistory, setDrinkHistory] = useState([]);
  const [estimatedBAC, setEstimatedBAC] = useState(0);
  const [showDDModal, setShowDDModal] = useState(false);
  const [showRideModal, setShowRideModal] = useState(false);
  const [showDrinkModal, setShowDrinkModal] = useState(false);
  const [selectedDD, setSelectedDD] = useState(null);
  const [pickupLocation, setPickupLocation] = useState('');
  const [userInfo, setUserInfo] = useState({
    phoneNumber: '',
    carInfo: '',
    maxPassengers: 4
  });
  const [userPhysicalProfile, setUserPhysicalProfile] = useState({
    gender: 'male',
    weight: 70, // kg
    startTime: new Date()
  });
  const [rideshareOptions, setRideshareOptions] = useState([]);
  const [shuttleInfo, setShuttleInfo] = useState([]);
  const [error, setError] = useState(null);
  const [isFirebaseInitialized, setIsFirebaseInitialized] = useState(!!db);

  // Debug logging
  useEffect(() => {
    console.log('SafetyFeatures - PartyId:', partyId);
    console.log('SafetyFeatures - University:', university);
    console.log('SafetyFeatures - Current User:', currentUser?.uid);
    console.log('SafetyFeatures - User Profile:', userProfile);
    console.log('SafetyFeatures - Firebase Initialized:', isFirebaseInitialized);
    console.log('SafetyFeatures - Theme available:', !!themeContext);
  }, [partyId, university, currentUser, userProfile, isFirebaseInitialized, themeContext]);

  useEffect(() => {
    // Check if Firebase is initialized
    if (!db) {
      console.error('Firebase is not initialized. Safety features are unavailable.');
      setError('Firebase is not initialized. Safety features are unavailable.');
      setIsFirebaseInitialized(false);
      return;
    } else {
      setIsFirebaseInitialized(true);
    }

    if (currentUser && partyId) {
      console.log('Loading safety data for user:', currentUser.uid, 'and party:', partyId);
      loadDesignatedDrivers();
      loadDrinkHistory();
      checkIfUserIsDD();
    }
  }, [partyId, currentUser?.uid]);

  useEffect(() => {
    // Calculate BAC whenever drink history changes
    if (drinkHistory.length > 0) {
      const totalDrinks = drinkHistory.length;
      const firstDrinkTime = new Date(drinkHistory[0].timestamp);
      const hours = (new Date() - firstDrinkTime) / (1000 * 60 * 60);
      const bac = calculateBAC(
        userPhysicalProfile.gender,
        userPhysicalProfile.weight,
        totalDrinks,
        Math.max(0.5, hours) // Minimum 30 minutes to avoid extreme initial values
      );
      setEstimatedBAC(bac);
      setDrinkCount(totalDrinks);
    }
  }, [drinkHistory]);

  const loadDesignatedDrivers = async () => {
    if (!isFirebaseInitialized) {
      console.warn('Skipping loadDesignatedDrivers - Firebase not initialized');
      return;
    }
    if (!currentUser || !partyId) {
      console.warn('Skipping loadDesignatedDrivers - Missing user or partyId');
      return;
    }
    
    try {
      console.log('Loading designated drivers for party:', partyId);
      const drivers = await getDesignatedDrivers(partyId);
      console.log('Loaded drivers:', drivers);
      setDdList(drivers);
      setError(null);
    } catch (error) {
      console.error('Error loading designated drivers:', error);
      setError('Failed to load designated drivers');
    }
  };

  const loadDrinkHistory = async () => {
    if (!isFirebaseInitialized) {
      console.warn('Skipping loadDrinkHistory - Firebase not initialized');
      return;
    }
    if (!currentUser?.uid) {
      console.warn('Skipping loadDrinkHistory - No user ID');
      return;
    }
    
    try {
      console.log('Loading drink history for user:', currentUser.uid);
      const today = new Date();
      const drinks = await getDrinkHistory(currentUser.uid, today);
      console.log('Loaded drinks:', drinks);
      setDrinkHistory(drinks || []);
      setError(null);
    } catch (error) {
      console.error('Error loading drink history:', error);
      setError('Failed to load drink history');
    }
  };

  const checkIfUserIsDD = async () => {
    if (!isFirebaseInitialized) {
      console.warn('Skipping checkIfUserIsDD - Firebase not initialized');
      return;
    }
    if (!currentUser?.uid || !partyId) {
      console.warn('Skipping checkIfUserIsDD - Missing user or partyId');
      return;
    }
    
    try {
      console.log('Checking if user is DD:', currentUser.uid);
      const drivers = await getDesignatedDrivers(partyId);
      const isUserDD = drivers.some(driver => driver.userId === currentUser.uid);
      console.log('User is DD:', isUserDD);
      setIsDD(isUserDD);
      setError(null);
    } catch (error) {
      console.error('Error checking if user is DD:', error);
      setError('Failed to check designated driver status');
    }
  };

  const handleRegisterAsDD = async () => {
    if (!isFirebaseInitialized) {
      Alert.alert('Error', 'Firebase is not initialized. Safety features are unavailable.');
      return;
    }
    
    if (!currentUser?.uid || !partyId) {
      Alert.alert('Error', 'You must be logged in to register as a designated driver');
      return;
    }
    
    try {
      console.log('Registering as DD:', currentUser.uid);
      await registerAsDD(partyId, currentUser.uid, userInfo);
      setIsDD(true);
      setShowDDModal(false);
      loadDesignatedDrivers();
      Alert.alert('Success', 'You are now registered as a designated driver');
      setError(null);
    } catch (error) {
      console.error('Error registering as DD:', error);
      Alert.alert('Error', 'Failed to register as designated driver');
      setError('Failed to register as designated driver');
    }
  };

  const handleUnregisterAsDD = async () => {
    if (!isFirebaseInitialized) {
      console.warn('Skipping handleUnregisterAsDD - Firebase not initialized');
      return;
    }
    if (!currentUser?.uid || !partyId) {
      console.warn('Skipping handleUnregisterAsDD - Missing user or partyId');
      return;
    }
    
    try {
      console.log('Unregistering as DD:', currentUser.uid);
      await unregisterAsDD(partyId, currentUser.uid);
      setIsDD(false);
      loadDesignatedDrivers();
      Alert.alert('Success', 'You are no longer a designated driver');
      setError(null);
    } catch (error) {
      console.error('Error unregistering as DD:', error);
      Alert.alert('Error', 'Failed to unregister as designated driver');
      setError('Failed to unregister as designated driver');
    }
  };

  const handleRequestRide = async () => {
    if (!isFirebaseInitialized) {
      Alert.alert('Error', 'Firebase is not initialized. Safety features are unavailable.');
      return;
    }
    
    if (!currentUser?.uid) {
      Alert.alert('Error', 'You must be logged in to request a ride');
      return;
    }
    
    if (!selectedDD) {
      Alert.alert('Error', 'Please select a designated driver');
      return;
    }

    try {
      console.log('Requesting ride from:', selectedDD.userId);
      await requestRide(selectedDD.userId, currentUser.uid, {
        location: pickupLocation,
        timestamp: new Date()
      });
      setShowRideModal(false);
      Alert.alert('Success', 'Ride request sent to the driver');
      setError(null);
    } catch (error) {
      console.error('Error requesting ride:', error);
      Alert.alert('Error', 'Failed to request ride');
      setError('Failed to request ride');
    }
  };

  const handleAddDrink = async (drinkType = 'standard') => {
    if (!isFirebaseInitialized) {
      Alert.alert('Error', 'Firebase is not initialized. Safety features are unavailable.');
      return;
    }
    
    if (!currentUser?.uid) {
      Alert.alert('Error', 'You must be logged in to track drinks');
      return;
    }
    
    try {
      console.log('Adding drink for user:', currentUser.uid);
      const drinkInfo = {
        type: drinkType,
        timestamp: new Date(),
        estimatedAlcoholContent: drinkType === 'beer' ? 0.05 : drinkType === 'wine' ? 0.12 : 0.4
      };
      
      await trackDrink(currentUser.uid, drinkInfo);
      loadDrinkHistory();
      setShowDrinkModal(false);
      setError(null);
    } catch (error) {
      console.error('Error tracking drink:', error);
      Alert.alert('Error', 'Failed to track drink');
      setError('Failed to track drink');
    }
  };

  const handleGetMeHome = async () => {
    if (!isFirebaseInitialized) {
      Alert.alert('Error', 'Firebase is not initialized. Safety features are unavailable.');
      return;
    }
    
    if (!currentUser?.uid) {
      Alert.alert('Error', 'You must be logged in to use this feature');
      return;
    }
    
    try {
      console.log('Getting home options for university:', university);
      // Load designated drivers
      const drivers = await getDesignatedDrivers(partyId);
      setDdList(drivers);
      
      // Load rideshare options
      const rideshare = await getRideshareOptions(university);
      setRideshareOptions(rideshare || []);
      
      // Load campus shuttles
      const shuttles = await getCampusShuttles(university);
      setShuttleInfo(shuttles || []);
      
      setShowRideModal(true);
      setError(null);
    } catch (error) {
      console.error('Error getting home options:', error);
      Alert.alert('Error', 'Failed to load transportation options');
      setError('Failed to load transportation options');
    }
  };

  const getBACColor = () => {
    if (estimatedBAC >= 0.08) return theme.error || '#ef4444';
    if (estimatedBAC >= 0.05) return '#FFA500'; // Orange
    return theme.success || '#10b981';
  };

  const getBACWarning = () => {
    if (estimatedBAC >= 0.08) return "You are likely over the legal limit to drive";
    if (estimatedBAC >= 0.05) return "You are approaching the legal limit to drive";
    return "You are likely under the legal limit to drive";
  };

  if (!isFirebaseInitialized) {
    return (
      <View style={[styles.container, { backgroundColor: theme.card || '#ffffff' }]}>
        <Text style={[styles.title, { color: theme.text || '#111827' }]}>Safety Features</Text>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.error || '#ef4444' }]}>
            Firebase is not initialized. Safety features are unavailable.
          </Text>
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: theme.primary || '#6366f1' }]} 
            onPress={() => {
              setIsFirebaseInitialized(!!db);
              if (db && currentUser && partyId) {
                loadDesignatedDrivers();
                loadDrinkHistory();
                checkIfUserIsDD();
              }
            }}
          >
            <Text style={styles.buttonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // If there's an error and user is not authenticated, show login prompt
  if (error && !currentUser) {
    return (
      <View style={[styles.container, { backgroundColor: theme.card || '#ffffff' }]}>
        <Text style={[styles.title, { color: theme.text || '#111827' }]}>Safety Features</Text>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.error || '#ef4444' }]}>
            Please log in to use safety features
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.card || '#ffffff' }]}>
      <Text style={[styles.title, { color: theme.text || '#111827' }]}>Safety Features</Text>
      
      {error ? (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.error || '#ef4444' }]}>{error}</Text>
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: theme.primary || '#6366f1' }]} 
            onPress={() => {
              loadDesignatedDrivers();
              loadDrinkHistory();
              checkIfUserIsDD();
            }}
          >
            <Text style={styles.buttonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.content}>
          {/* Designated Driver Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text || '#111827' }]}>Designated Driver</Text>
            
            {isDD ? (
              <TouchableOpacity 
                style={[styles.button, { backgroundColor: theme.error || '#ef4444' }]} 
                onPress={handleUnregisterAsDD}
              >
                <Text style={styles.buttonText}>Unregister as Designated Driver</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={[styles.button, { backgroundColor: theme.primary || '#6366f1' }]} 
                onPress={() => setShowDDModal(true)}
              >
                <Text style={styles.buttonText}>Register as Designated Driver</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={[styles.button, { backgroundColor: theme.secondary || '#a855f7' }]} 
              onPress={handleGetMeHome}
            >
              <Text style={styles.buttonText}>Get Me Home</Text>
            </TouchableOpacity>
          </View>
          
          {/* Drink Counter Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text || '#111827' }]}>Drink Counter</Text>
            
            <View style={styles.drinkInfo}>
              <Text style={[styles.drinkCount, { color: theme.text || '#111827' }]}>
                Drinks: {drinkCount}
              </Text>
              <Text style={[styles.bac, { color: getBACColor() }]}>
                Estimated BAC: {estimatedBAC.toFixed(3)}
              </Text>
              <Text style={[styles.bacWarning, { color: getBACColor() }]}>
                {getBACWarning()}
              </Text>
            </View>
            
            <TouchableOpacity 
              style={[styles.button, { backgroundColor: theme.primary || '#6366f1' }]} 
              onPress={() => setShowDrinkModal(true)}
            >
              <Text style={styles.buttonText}>Add Drink</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      
      {/* Designated Driver Modal */}
      <Modal
        visible={showDDModal}
        transparent
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: theme.card || '#ffffff' }]}>
            <Text style={[styles.modalTitle, { color: theme.text || '#111827' }]}>Register as Designated Driver</Text>
            
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.background || '#f8f9fa', 
                color: theme.text || '#111827' 
              }]}
              placeholder="Phone Number"
              placeholderTextColor={(theme.text || '#111827') + '80'}
              value={userInfo.phoneNumber}
              onChangeText={(text) => setUserInfo({...userInfo, phoneNumber: text})}
            />
            
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.background || '#f8f9fa', 
                color: theme.text || '#111827' 
              }]}
              placeholder="Car Info (Make, Model, Color)"
              placeholderTextColor={(theme.text || '#111827') + '80'}
              value={userInfo.carInfo}
              onChangeText={(text) => setUserInfo({...userInfo, carInfo: text})}
            />
            
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.background || '#f8f9fa', 
                color: theme.text || '#111827' 
              }]}
              placeholder="Max Passengers"
              placeholderTextColor={(theme.text || '#111827') + '80'}
              keyboardType="number-pad"
              value={userInfo.maxPassengers.toString()}
              onChangeText={(text) => setUserInfo({...userInfo, maxPassengers: parseInt(text) || 4})}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, { backgroundColor: theme.error || '#ef4444' }]} 
                onPress={() => setShowDDModal(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, { backgroundColor: theme.primary || '#6366f1' }]} 
                onPress={handleRegisterAsDD}
              >
                <Text style={styles.buttonText}>Register</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Ride Modal */}
      <Modal
        visible={showRideModal}
        transparent
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: theme.card || '#ffffff' }]}>
            <Text style={[styles.modalTitle, { color: theme.text || '#111827' }]}>Get Me Home</Text>
            
            <Text style={[styles.modalSubtitle, { color: theme.text || '#111827' }]}>Designated Drivers</Text>
            <ScrollView style={styles.ddList}>
              {ddList.length > 0 ? (
                ddList.map((driver, index) => (
                  <TouchableOpacity 
                    key={index}
                    style={[
                      styles.ddItem,
                      selectedDD?.userId === driver.userId && { 
                        backgroundColor: (theme.primary || '#6366f1') + '40' 
                      }
                    ]}
                    onPress={() => setSelectedDD(driver)}
                  >
                    <Text style={[styles.ddName, { color: theme.text || '#111827' }]}>
                      {driver.displayName || 'Anonymous Driver'}
                    </Text>
                    <Text style={[styles.ddInfo, { color: (theme.text || '#111827') + '80' }]}>
                      {driver.carInfo} • Max: {driver.maxPassengers} passengers
                    </Text>
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={[styles.emptyText, { color: (theme.text || '#111827') + '80' }]}>
                  No designated drivers available
                </Text>
              )}
            </ScrollView>
            
            {selectedDD && (
              <>
                <TextInput
                  style={[styles.input, { 
                    backgroundColor: theme.background || '#f8f9fa', 
                    color: theme.text || '#111827' 
                  }]}
                  placeholder="Your Pickup Location"
                  placeholderTextColor={(theme.text || '#111827') + '80'}
                  value={pickupLocation}
                  onChangeText={setPickupLocation}
                />
                
                <TouchableOpacity 
                  style={[styles.button, { backgroundColor: theme.primary || '#6366f1' }]} 
                  onPress={handleRequestRide}
                >
                  <Text style={styles.buttonText}>Request Ride</Text>
                </TouchableOpacity>
              </>
            )}
            
            <Text style={[styles.modalSubtitle, { color: theme.text || '#111827', marginTop: 20 }]}>Other Options</Text>
            
            <View style={styles.otherOptions}>
              {rideshareOptions.map((option, index) => (
                <TouchableOpacity 
                  key={index}
                  style={[styles.optionItem, { backgroundColor: theme.card || '#ffffff' }]}
                  onPress={() => Alert.alert('Opening', `Opening ${option.name} app...`)}
                >
                  <Text style={[styles.optionName, { color: theme.text || '#111827' }]}>{option.name}</Text>
                  <Text style={[styles.optionInfo, { color: (theme.text || '#111827') + '80' }]}>
                    Est. ${option.price} • {option.eta} min
                  </Text>
                </TouchableOpacity>
              ))}
              
              {shuttleInfo.map((shuttle, index) => (
                <TouchableOpacity 
                  key={index}
                  style={[styles.optionItem, { backgroundColor: theme.card || '#ffffff' }]}
                  onPress={() => Alert.alert('Info', shuttle.details)}
                >
                  <Text style={[styles.optionName, { color: theme.text || '#111827' }]}>
                    {shuttle.name}
                  </Text>
                  <Text style={[styles.optionInfo, { color: (theme.text || '#111827') + '80' }]}>
                    Next: {shuttle.nextDeparture} • Free
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <TouchableOpacity 
              style={[styles.button, { backgroundColor: theme.error || '#ef4444', marginTop: 20 }]} 
              onPress={() => setShowRideModal(false)}
            >
              <Text style={styles.buttonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      
      {/* Drink Modal */}
      <Modal
        visible={showDrinkModal}
        transparent
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: theme.card || '#ffffff' }]}>
            <Text style={[styles.modalTitle, { color: theme.text || '#111827' }]}>Add Drink</Text>
            
            <View style={styles.drinkButtons}>
              <TouchableOpacity 
                style={[styles.drinkButton, { backgroundColor: theme.primary || '#6366f1' }]} 
                onPress={() => handleAddDrink('beer')}
              >
                <Text style={styles.buttonText}>Beer</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.drinkButton, { backgroundColor: theme.primary || '#6366f1' }]} 
                onPress={() => handleAddDrink('wine')}
              >
                <Text style={styles.buttonText}>Wine</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.drinkButton, { backgroundColor: theme.primary || '#6366f1' }]} 
                onPress={() => handleAddDrink('shot')}
              >
                <Text style={styles.buttonText}>Shot</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.userProfileInputs}>
              <Text style={[styles.inputLabel, { color: theme.text || '#111827' }]}>Your Information (for BAC calculation)</Text>
              
              <View style={styles.profileRow}>
                <TouchableOpacity
                  style={[
                    styles.genderButton,
                    { backgroundColor: userPhysicalProfile.gender === 'male' ? 
                      (theme.primary || '#6366f1') : 
                      (theme.background || '#f8f9fa') 
                    }
                  ]}
                  onPress={() => setUserPhysicalProfile({...userPhysicalProfile, gender: 'male'})}
                >
                  <Text style={[
                    styles.genderButtonText, 
                    { color: userPhysicalProfile.gender === 'male' ? 
                      'white' : 
                      (theme.text || '#111827') 
                    }
                  ]}>Male</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.genderButton,
                    { backgroundColor: userPhysicalProfile.gender === 'female' ? 
                      (theme.primary || '#6366f1') : 
                      (theme.background || '#f8f9fa') 
                    }
                  ]}
                  onPress={() => setUserPhysicalProfile({...userPhysicalProfile, gender: 'female'})}
                >
                  <Text style={[
                    styles.genderButtonText, 
                    { color: userPhysicalProfile.gender === 'female' ? 
                      'white' : 
                      (theme.text || '#111827') 
                    }
                  ]}>Female</Text>
                </TouchableOpacity>
              </View>
              
              <TextInput
                style={[styles.input, { 
                  backgroundColor: theme.background || '#f8f9fa', 
                  color: theme.text || '#111827' 
                }]}
                placeholder="Weight (kg)"
                placeholderTextColor={(theme.text || '#111827') + '80'}
                keyboardType="number-pad"
                value={userPhysicalProfile.weight.toString()}
                onChangeText={(text) => setUserPhysicalProfile({...userPhysicalProfile, weight: parseInt(text) || 70})}
              />
            </View>
            
            <TouchableOpacity 
              style={[styles.button, { backgroundColor: theme.error || '#ef4444', marginTop: 20 }]} 
              onPress={() => setShowDrinkModal(false)}
            >
              <Text style={styles.buttonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 8,
    marginVertical: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  button: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 6,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
  },
  drinkInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  drinkCount: {
    fontSize: 16,
    fontWeight: '600',
  },
  bac: {
    fontSize: 16,
    fontWeight: '600',
  },
  bacWarning: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    padding: 20,
    borderRadius: 12,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  input: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 6,
  },
  ddList: {
    maxHeight: 150,
    marginBottom: 16,
  },
  ddItem: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  ddName: {
    fontSize: 16,
    fontWeight: '600',
  },
  ddInfo: {
    fontSize: 14,
  },
  emptyText: {
    textAlign: 'center',
    padding: 12,
  },
  otherOptions: {
    marginTop: 8,
  },
  optionItem: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  optionName: {
    fontSize: 16,
    fontWeight: '600',
  },
  optionInfo: {
    fontSize: 14,
  },
  drinkButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  drinkButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  drinkButtonText: {
    color: 'white',
    marginTop: 4,
  },
  userProfileInputs: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 8,
  },
  profileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  genderButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  genderButtonText: {
    fontWeight: '600',
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
});

export default SafetyFeatures; 