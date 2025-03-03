import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Linking, ScrollView, Switch, TextInput, ActivityIndicator } from 'react-native';
import { signOut } from 'firebase/auth';
import { auth, db } from '../firebase/config';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';

const SettingsScreen = () => {
  const navigation = useNavigation();
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const { currentUser, userProfile, getUserProfile } = useAuth();
  const [university, setUniversity] = useState('');
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);

  // Initialize university from userProfile
  useEffect(() => {
    if (userProfile?.university) {
      setUniversity(userProfile.university);
    }
  }, [userProfile]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to sign out. Please try again.');
      console.error('Sign out error:', error);
    }
  };

  const handleSaveProfile = async () => {
    if (!currentUser || !db) {
      Alert.alert('Error', 'You must be logged in to update your profile');
      return;
    }

    try {
      setSaving(true);
      const userDocRef = doc(db, 'users', currentUser.uid);
      
      await updateDoc(userDocRef, {
        university: university
      });
      
      // Refresh user profile
      await getUserProfile(currentUser.uid);
      
      Alert.alert('Success', 'Profile updated successfully');
      setEditMode(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const createFirestoreIndexes = () => {
    Alert.alert(
      'Create Firestore Indexes',
      'You need to create two indexes for the app to work properly. Would you like to create them now?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Create Hosted Parties Index', 
          onPress: () => Linking.openURL('https://console.firebase.google.com/v1/r/project/campusparty-9c4fd/firestore/indexes?create_composite=ClFwcm9qZWN0cy9jYW1wdXNwYXJ0eS05YzRmZC9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvcGFydGllcy9pbmRleGVzL18QARoICgRob3N0EAEaDQoJZGF0ZV90aW1lEAEaDAoIX19uYW1lX18QAQ')
        },
        { 
          text: 'Create Joined Parties Index', 
          onPress: () => Linking.openURL('https://console.firebase.google.com/v1/r/project/campusparty-9c4fd/firestore/indexes?create_composite=ClFwcm9qZWN0cy9jYW1wdXNwYXJ0eS05YzRmZC9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvcGFydGllcy9pbmRleGVzL18QARoNCglhdHRlbmRlZXMYARoNCglkYXRlX3RpbWUQARoMCghfX25hbWVfXxAB')
        }
      ]
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.sectionTitle, { color: theme.subtext }]}>Profile</Text>
        
        {editMode ? (
          <View style={styles.profileEditContainer}>
            <Text style={[styles.label, { color: theme.text }]}>University</Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.inputBackground, 
                color: theme.text,
                borderColor: theme.border
              }]}
              placeholder="Enter your university"
              placeholderTextColor={theme.subtext}
              value={university}
              onChangeText={setUniversity}
            />
            
            <View style={styles.buttonRow}>
              <TouchableOpacity 
                style={[styles.button, styles.cancelButton, { borderColor: theme.border }]} 
                onPress={() => {
                  setEditMode(false);
                  if (userProfile?.university) {
                    setUniversity(userProfile.university);
                  }
                }}
                disabled={saving}
              >
                <Text style={[styles.buttonText, { color: theme.text }]}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.button, styles.saveButton, { backgroundColor: theme.primary }]} 
                onPress={handleSaveProfile}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.saveButtonText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity 
            style={[styles.option, { borderBottomColor: theme.border }]} 
            onPress={() => setEditMode(true)}
          >
            <Ionicons name="school-outline" size={24} color={theme.primary} />
            <View style={styles.profileInfoContainer}>
              <Text style={[styles.optionText, { color: theme.text }]}>University</Text>
              <Text style={[styles.profileValue, { color: theme.subtext }]}>
                {userProfile?.university || 'Not set'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.subtext} style={styles.chevron} />
          </TouchableOpacity>
        )}
      </View>

      <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.sectionTitle, { color: theme.subtext }]}>Appearance</Text>
        <View style={[styles.option, { borderBottomColor: theme.border }]}>
          <Ionicons name={isDarkMode ? "moon" : "sunny"} size={24} color={theme.primary} />
          <Text style={[styles.optionText, { color: theme.text }]}>Dark Mode</Text>
          <Switch
            style={{ marginLeft: 'auto' }}
            value={isDarkMode}
            onValueChange={toggleTheme}
            trackColor={{ false: '#767577', true: theme.primary }}
            thumbColor={isDarkMode ? theme.accent : '#f4f3f4'}
          />
        </View>
      </View>

      <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.sectionTitle, { color: theme.subtext }]}>Account</Text>
        <TouchableOpacity style={[styles.option, { borderBottomColor: theme.border }]} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={24} color={theme.error} />
          <Text style={[styles.optionText, { color: theme.error }]}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.sectionTitle, { color: theme.subtext }]}>Database</Text>
        <TouchableOpacity style={[styles.option, { borderBottomColor: theme.border }]} onPress={createFirestoreIndexes}>
          <Ionicons name="construct-outline" size={24} color={theme.primary} />
          <Text style={[styles.optionText, { color: theme.text }]}>Create Firestore Indexes</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.sectionTitle, { color: theme.subtext }]}>About</Text>
        <View style={styles.infoContainer}>
          <Text style={[styles.infoText, { color: theme.text }]}>CampusParty v1.0.0</Text>
          <Text style={[styles.infoDescription, { color: theme.subtext }]}>
            A mobile application for hosting and joining campus parties.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginVertical: 16,
    borderRadius: 10,
    overflow: 'hidden',
    marginHorizontal: 16,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginHorizontal: 16,
    marginVertical: 12,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  optionText: {
    fontSize: 16,
    marginLeft: 12,
  },
  profileInfoContainer: {
    flex: 1,
    marginLeft: 12,
  },
  profileValue: {
    fontSize: 14,
    marginTop: 2,
  },
  chevron: {
    marginLeft: 'auto',
  },
  profileEditContainer: {
    padding: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  cancelButton: {
    borderWidth: 1,
    marginRight: 8,
  },
  saveButton: {
    marginLeft: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  infoContainer: {
    padding: 16,
  },
  infoText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  infoDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
});

export default SettingsScreen; 