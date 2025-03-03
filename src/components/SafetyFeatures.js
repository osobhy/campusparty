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
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const SafetyFeatures = ({ partyId, university }) => {
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
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
  const [userProfile, setUserProfile] = useState({
    gender: 'male',
    weight: 70, // kg
    startTime: new Date()
  });
  const [rideshareOptions, setRideshareOptions] = useState([]);
  const [shuttleInfo, setShuttleInfo] = useState([]);

  useEffect(() => {
    loadDesignatedDrivers();
    loadDrinkHistory();
    checkIfUserIsDD();
  }, [partyId, user?.uid]);

  useEffect(() => {
    // Calculate BAC whenever drink history changes
    if (drinkHistory.length > 0) {
      const totalDrinks = drinkHistory.length;
      const firstDrinkTime = drinkHistory[0].timestamp.toDate();
      const hours = (new Date() - firstDrinkTime) / (1000 * 60 * 60);
      const bac = calculateBAC(
        userProfile.gender,
        userProfile.weight,
        totalDrinks,
        Math.max(0.5, hours) // Minimum 30 minutes to avoid extreme initial values
      );
      setEstimatedBAC(bac);
      setDrinkCount(totalDrinks);
    }
  }, [drinkHistory]);

  const loadDesignatedDrivers = async () => {
    try {
      const drivers = await getDesignatedDrivers(partyId);
      setDdList(drivers);
    } catch (error) {
      console.error('Error loading designated drivers:', error);
      Alert.alert('Error', 'Failed to load designated drivers');
    }
  };

  const loadDrinkHistory = async () => {
    if (!user?.uid) return;
    
    try {
      const today = new Date();
      const drinks = await getDrinkHistory(user.uid, today);
      setDrinkHistory(drinks);
    } catch (error) {
      console.error('Error loading drink history:', error);
    }
  };

  const checkIfUserIsDD = async () => {
    if (!user?.uid || !partyId) return;
    
    try {
      const drivers = await getDesignatedDrivers(partyId);
      const isUserDD = drivers.some(driver => driver.userId === user.uid);
      setIsDD(isUserDD);
    } catch (error) {
      console.error('Error checking if user is DD:', error);
    }
  };

  const handleRegisterAsDD = async () => {
    try {
      await registerAsDD(partyId, user.uid, userInfo);
      setIsDD(true);
      setShowDDModal(false);
      loadDesignatedDrivers();
      Alert.alert('Success', 'You are now registered as a designated driver');
    } catch (error) {
      console.error('Error registering as DD:', error);
      Alert.alert('Error', 'Failed to register as designated driver');
    }
  };

  const handleUnregisterAsDD = async () => {
    try {
      await unregisterAsDD(partyId, user.uid);
      setIsDD(false);
      loadDesignatedDrivers();
      Alert.alert('Success', 'You are no longer a designated driver');
    } catch (error) {
      console.error('Error unregistering as DD:', error);
      Alert.alert('Error', 'Failed to unregister as designated driver');
    }
  };

  const handleRequestRide = async () => {
    if (!selectedDD) {
      Alert.alert('Error', 'Please select a designated driver');
      return;
    }

    try {
      await requestRide(selectedDD.userId, user.uid, {
        location: pickupLocation,
        timestamp: new Date()
      });
      setShowRideModal(false);
      Alert.alert('Success', 'Ride request sent to the driver');
    } catch (error) {
      console.error('Error requesting ride:', error);
      Alert.alert('Error', 'Failed to request ride');
    }
  };

  const handleAddDrink = async (drinkType = 'standard') => {
    try {
      const drinkInfo = {
        type: drinkType,
        timestamp: new Date(),
        estimatedAlcoholContent: drinkType === 'beer' ? 0.05 : drinkType === 'wine' ? 0.12 : 0.4
      };
      
      await trackDrink(user.uid, drinkInfo);
      loadDrinkHistory();
      setShowDrinkModal(false);
    } catch (error) {
      console.error('Error tracking drink:', error);
      Alert.alert('Error', 'Failed to track drink');
    }
  };

  const handleGetMeHome = async () => {
    try {
      // Get user's current location
      // For demo purposes, we'll use a placeholder
      const currentLocation = { latitude: 37.7749, longitude: -122.4194 };
      
      // Get rideshare options
      const rideshare = await getRideshareOptions(currentLocation);
      setRideshareOptions(rideshare);
      
      // Get campus shuttles
      const shuttles = await getCampusShuttles(university);
      setShuttleInfo(shuttles);
      
      setShowRideModal(true);
    } catch (error) {
      console.error('Error getting transportation options:', error);
      Alert.alert('Error', 'Failed to get transportation options');
    }
  };

  const getBACColor = () => {
    if (estimatedBAC < 0.04) return 'green';
    if (estimatedBAC < 0.08) return 'orange';
    return 'red';
  };

  const getBACWarning = () => {
    if (estimatedBAC < 0.04) return 'Safe';
    if (estimatedBAC < 0.08) return 'Caution';
    return 'Danger - Do Not Drive';
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <Text style={[styles.title, { color: colors.text }]}>Safety Features</Text>
      
      {/* Designated Driver Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Designated Driver</Text>
        
        {isDD ? (
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: colors.error }]} 
            onPress={handleUnregisterAsDD}
          >
            <Text style={styles.buttonText}>Unregister as DD</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: colors.primary }]} 
            onPress={() => setShowDDModal(true)}
          >
            <Text style={styles.buttonText}>Volunteer as DD</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: colors.secondary }]} 
          onPress={handleGetMeHome}
        >
          <Text style={styles.buttonText}>Get Me Home</Text>
        </TouchableOpacity>
      </View>
      
      {/* Drink Counter Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Drink Counter</Text>
        
        <View style={styles.drinkInfo}>
          <Text style={[styles.drinkCount, { color: colors.text }]}>
            Drinks: {drinkCount}
          </Text>
          <Text style={[styles.bac, { color: getBACColor() }]}>
            Est. BAC: {estimatedBAC.toFixed(2)}% - {getBACWarning()}
          </Text>
        </View>
        
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: colors.primary }]} 
          onPress={() => setShowDrinkModal(true)}
        >
          <Text style={styles.buttonText}>Add Drink</Text>
        </TouchableOpacity>
      </View>

      {/* DD Registration Modal */}
      <Modal
        visible={showDDModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDDModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Register as Designated Driver</Text>
            
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
              placeholder="Phone Number"
              placeholderTextColor={colors.text + '80'}
              value={userInfo.phoneNumber}
              onChangeText={(text) => setUserInfo({...userInfo, phoneNumber: text})}
            />
            
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
              placeholder="Car Info (Make, Model, Color)"
              placeholderTextColor={colors.text + '80'}
              value={userInfo.carInfo}
              onChangeText={(text) => setUserInfo({...userInfo, carInfo: text})}
            />
            
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
              placeholder="Max Passengers"
              placeholderTextColor={colors.text + '80'}
              keyboardType="number-pad"
              value={userInfo.maxPassengers.toString()}
              onChangeText={(text) => setUserInfo({...userInfo, maxPassengers: parseInt(text) || 1})}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, { backgroundColor: colors.error }]} 
                onPress={() => setShowDDModal(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, { backgroundColor: colors.primary }]} 
                onPress={handleRegisterAsDD}
              >
                <Text style={styles.buttonText}>Register</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Ride Request Modal */}
      <Modal
        visible={showRideModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowRideModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Get Me Home</Text>
            
            <Text style={[styles.modalSubtitle, { color: colors.text }]}>Designated Drivers</Text>
            <ScrollView style={styles.ddList}>
              {ddList.length > 0 ? (
                ddList.map((driver, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.ddItem,
                      selectedDD?.userId === driver.userId && { backgroundColor: colors.primary + '40' }
                    ]}
                    onPress={() => setSelectedDD(driver)}
                  >
                    <Text style={[styles.ddName, { color: colors.text }]}>
                      {driver.displayName || 'Anonymous Driver'}
                    </Text>
                    <Text style={[styles.ddInfo, { color: colors.text + '80' }]}>
                      {driver.carInfo} • Max: {driver.maxPassengers} passengers
                    </Text>
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={[styles.emptyText, { color: colors.text + '80' }]}>
                  No designated drivers available
                </Text>
              )}
            </ScrollView>
            
            {selectedDD && (
              <>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
                  placeholder="Your Pickup Location"
                  placeholderTextColor={colors.text + '80'}
                  value={pickupLocation}
                  onChangeText={setPickupLocation}
                />
                
                <TouchableOpacity 
                  style={[styles.button, { backgroundColor: colors.primary }]} 
                  onPress={handleRequestRide}
                >
                  <Text style={styles.buttonText}>Request Ride</Text>
                </TouchableOpacity>
              </>
            )}
            
            <Text style={[styles.modalSubtitle, { color: colors.text, marginTop: 20 }]}>Other Options</Text>
            
            <View style={styles.otherOptions}>
              {rideshareOptions.map((option, index) => (
                <TouchableOpacity 
                  key={index}
                  style={[styles.optionItem, { backgroundColor: colors.card }]}
                  onPress={() => Alert.alert('Opening', `Opening ${option.name} app...`)}
                >
                  <Text style={[styles.optionName, { color: colors.text }]}>{option.name}</Text>
                  <Text style={[styles.optionInfo, { color: colors.text + '80' }]}>
                    Est. ${option.price} • {option.eta} min
                  </Text>
                </TouchableOpacity>
              ))}
              
              {shuttleInfo.map((shuttle, index) => (
                <TouchableOpacity 
                  key={index}
                  style={[styles.optionItem, { backgroundColor: colors.card }]}
                  onPress={() => Alert.alert('Info', shuttle.details)}
                >
                  <Text style={[styles.optionName, { color: colors.text }]}>
                    {shuttle.name}
                  </Text>
                  <Text style={[styles.optionInfo, { color: colors.text + '80' }]}>
                    Next: {shuttle.nextDeparture} • Free
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <TouchableOpacity 
              style={[styles.button, { backgroundColor: colors.error, marginTop: 20 }]} 
              onPress={() => setShowRideModal(false)}
            >
              <Text style={styles.buttonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Drink Tracking Modal */}
      <Modal
        visible={showDrinkModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDrinkModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Add Drink</Text>
            
            <View style={styles.drinkButtons}>
              <TouchableOpacity 
                style={[styles.drinkButton, { backgroundColor: colors.primary }]} 
                onPress={() => handleAddDrink('beer')}
              >
                <Ionicons name="beer" size={24} color="white" />
                <Text style={styles.drinkButtonText}>Beer</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.drinkButton, { backgroundColor: colors.primary }]} 
                onPress={() => handleAddDrink('wine')}
              >
                <Ionicons name="wine" size={24} color="white" />
                <Text style={styles.drinkButtonText}>Wine</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.drinkButton, { backgroundColor: colors.primary }]} 
                onPress={() => handleAddDrink('shot')}
              >
                <Ionicons name="flask" size={24} color="white" />
                <Text style={styles.drinkButtonText}>Shot</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.userProfileInputs}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Your Information (for BAC calculation)</Text>
              
              <View style={styles.profileRow}>
                <TouchableOpacity
                  style={[
                    styles.genderButton,
                    { backgroundColor: userProfile.gender === 'male' ? colors.primary : colors.background }
                  ]}
                  onPress={() => setUserProfile({...userProfile, gender: 'male'})}
                >
                  <Text style={[styles.genderButtonText, { color: userProfile.gender === 'male' ? 'white' : colors.text }]}>Male</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.genderButton,
                    { backgroundColor: userProfile.gender === 'female' ? colors.primary : colors.background }
                  ]}
                  onPress={() => setUserProfile({...userProfile, gender: 'female'})}
                >
                  <Text style={[styles.genderButtonText, { color: userProfile.gender === 'female' ? 'white' : colors.text }]}>Female</Text>
                </TouchableOpacity>
              </View>
              
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
                placeholder="Weight (kg)"
                placeholderTextColor={colors.text + '80'}
                keyboardType="number-pad"
                value={userProfile.weight.toString()}
                onChangeText={(text) => setUserProfile({...userProfile, weight: parseInt(text) || 70})}
              />
            </View>
            
            <TouchableOpacity 
              style={[styles.button, { backgroundColor: colors.error, marginTop: 20 }]} 
              onPress={() => setShowDrinkModal(false)}
            >
              <Text style={styles.buttonText}>Cancel</Text>
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
});

export default SafetyFeatures; 