import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Image,
  Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useParties } from '../hooks/useParties';
import { useTheme } from '../context/ThemeContext';
import PartyCard from '../components/PartyCard';
import { Ionicons } from '@expo/vector-icons';

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
  notification: '#f59e0b'
};

export default function ProfileScreen({ navigation }) {
  const { currentUser, userProfile } = useAuth();
  const themeContext = useTheme();
  
  // Ensure we always have a valid theme object with all required properties
  const theme = themeContext?.theme || defaultTheme;
  
  const { 
    hostedParties, 
    joinedParties, 
    loading, 
    refreshing, 
    handleJoinParty, 
    handleLeaveParty, 
    onRefresh 
  } = useParties(currentUser?.uid);
  
  const [activeTab, setActiveTab] = useState('hosted');

  // Debug logging
  useEffect(() => {
    console.log('ProfileScreen - Current User:', currentUser);
    console.log('ProfileScreen - User Profile:', userProfile);
    console.log('ProfileScreen - Theme available:', !!themeContext);
    console.log('ProfileScreen - Dark mode:', themeContext?.isDarkMode);
  }, [currentUser, userProfile, themeContext]);

  // Add header when component mounts
  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      title: 'My Profile',
      headerStyle: {
        backgroundColor: theme.primary || '#6366f1',
      },
      headerTintColor: '#fff',
      headerTitleStyle: {
        fontWeight: 'bold',
      },
      headerRight: () => (
        <TouchableOpacity 
          style={{ marginRight: 15 }}
          onPress={() => navigation.navigate('Settings')}
        >
          <Ionicons name="settings-outline" size={24} color="white" />
        </TouchableOpacity>
      ),
    });
  }, [navigation, theme]);

  const handlePartyAction = async (partyId) => {
    if (!currentUser) return;
    
    const result = await handleJoinParty(partyId, currentUser.uid);
    
    if (result.alreadyJoined) {
      // User is already attending, ask if they want to leave
      Alert.alert(
        'Leave Party',
        'You are already attending this party. Do you want to leave?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Leave', 
            style: 'destructive',
            onPress: async () => {
              const leaveResult = await handleLeaveParty(partyId, currentUser.uid);
              if (leaveResult.success) {
                Alert.alert('Success', 'You have left the party');
              } else {
                Alert.alert('Error', leaveResult.error || 'Failed to leave party');
              }
            }
          }
        ]
      );
    }
  };

  if (!currentUser) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background || '#f8f9fa' }]}>
        <View style={styles.notLoggedInContainer}>
          <Text style={[styles.notLoggedInText, { color: theme.subtext || '#6b7280' }]}>
            Please log in to view your profile
          </Text>
          <TouchableOpacity
            style={[styles.loginButton, { backgroundColor: theme.primary || '#6366f1' }]}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.buttonText}>Login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background || '#f8f9fa' }]}>
      <View style={[styles.profileHeader, { backgroundColor: theme.card || '#ffffff', borderBottomColor: theme.border || '#e5e7eb' }]}>
        <View style={[styles.avatarContainer, { backgroundColor: theme.primary || '#6366f1' }]}>
          <Text style={styles.avatarText}>
            {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : '?'}
          </Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={[styles.username, { color: theme.text || '#111827' }]}>
            {currentUser.displayName}
          </Text>
          <Text style={[styles.email, { color: theme.subtext || '#6b7280' }]}>
            {currentUser.email}
          </Text>
          <Text style={[styles.university, { color: theme.subtext || '#6b7280' }]}>
            {userProfile?.university || 'University not set'}
          </Text>
          {!userProfile?.university && (
            <TouchableOpacity 
              style={[styles.updateButton, { backgroundColor: theme.primary || '#6366f1' }]}
              onPress={() => navigation.navigate('Settings')}
            >
              <Text style={styles.updateButtonText}>Update Profile</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={[styles.tabContainer, { backgroundColor: theme.card || '#ffffff', borderBottomColor: theme.border || '#e5e7eb' }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'hosted' && [styles.activeTab, { borderBottomColor: theme.primary || '#6366f1' }]]}
          onPress={() => setActiveTab('hosted')}
        >
          <Text 
            style={[
              styles.tabText, 
              { color: theme.subtext || '#6b7280' },
              activeTab === 'hosted' && [styles.activeTabText, { color: theme.primary || '#6366f1' }]
            ]}
          >
            Hosted Parties
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'joined' && [styles.activeTab, { borderBottomColor: theme.primary || '#6366f1' }]]}
          onPress={() => setActiveTab('joined')}
        >
          <Text 
            style={[
              styles.tabText, 
              { color: theme.subtext || '#6b7280' },
              activeTab === 'joined' && [styles.activeTabText, { color: theme.primary || '#6366f1' }]
            ]}
          >
            Joined Parties
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary || '#6366f1'} />
          <Text style={[styles.loadingText, { color: theme.subtext || '#6b7280' }]}>Loading parties...</Text>
        </View>
      ) : (
        <ScrollView 
          style={styles.partyList}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh} 
              colors={[theme.primary || '#6366f1']}
              tintColor={theme.primary || '#6366f1'}
            />
          }
        >
          {activeTab === 'hosted' ? (
            hostedParties.length > 0 ? (
              hostedParties.map(party => (
                <PartyCard 
                  key={party.id} 
                  party={party} 
                  onJoin={() => {}} // Host can't leave their own party
                  isLoggedIn={true}
                  isJoined={true}
                  isHost={true}
                />
              ))
            ) : (
              <Text style={[styles.noParties, { color: theme.subtext || '#6b7280' }]}>
                You haven't hosted any parties yet
              </Text>
            )
          ) : (
            joinedParties.length > 0 ? (
              joinedParties.map(party => (
                <PartyCard 
                  key={party.id} 
                  party={party} 
                  onJoin={() => handlePartyAction(party.id)}
                  isLoggedIn={true}
                  isJoined={true}
                  isHost={party.host.id === currentUser.uid}
                />
              ))
            ) : (
              <Text style={[styles.noParties, { color: theme.subtext || '#6b7280' }]}>
                You haven't joined any parties yet
              </Text>
            )
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  notLoggedInContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  notLoggedInText: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
  loginButton: {
    padding: 15,
    borderRadius: 25,
    alignItems: 'center',
    width: '80%',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  profileHeader: {
    flexDirection: 'row',
    padding: 20,
    borderBottomWidth: 1,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  profileInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  username: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    marginBottom: 4,
  },
  university: {
    fontSize: 14,
    marginBottom: 8,
  },
  updateButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
    alignSelf: 'flex-start',
  },
  updateButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 10,
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 16,
  },
  activeTabText: {
    fontWeight: 'bold',
  },
  partyList: {
    flex: 1,
    padding: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
  },
  noParties: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
  },
}); 