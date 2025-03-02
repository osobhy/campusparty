import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Linking, ScrollView, Switch } from 'react-native';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/config';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const SettingsScreen = () => {
  const navigation = useNavigation();
  const { theme, isDarkMode, toggleTheme } = useTheme();

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