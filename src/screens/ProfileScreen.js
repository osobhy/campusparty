import React, { useState } from 'react';
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
import PartyCard from '../components/PartyCard';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen({ navigation }) {
  const { currentUser } = useAuth();
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

  // Add header when component mounts
  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      title: 'My Profile',
      headerStyle: {
        backgroundColor: '#6366f1',
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
  }, [navigation]);

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
      <SafeAreaView style={styles.container}>
        <View style={styles.notLoggedInContainer}>
          <Text style={styles.notLoggedInText}>
            Please log in to view your profile
          </Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.buttonText}>Login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : '?'}
          </Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.username}>{currentUser.displayName}</Text>
          <Text style={styles.email}>{currentUser.email}</Text>
          <Text style={styles.university}>{currentUser.university || 'University not set'}</Text>
        </View>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'hosted' && styles.activeTab]}
          onPress={() => setActiveTab('hosted')}
        >
          <Text style={[styles.tabText, activeTab === 'hosted' && styles.activeTabText]}>
            Hosted Parties
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'joined' && styles.activeTab]}
          onPress={() => setActiveTab('joined')}
        >
          <Text style={[styles.tabText, activeTab === 'joined' && styles.activeTabText]}>
            Joined Parties
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading parties...</Text>
        </View>
      ) : (
        <ScrollView 
          style={styles.partyList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
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
              <Text style={styles.noParties}>You haven't hosted any parties yet</Text>
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
              <Text style={styles.noParties}>You haven't joined any parties yet</Text>
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
    backgroundColor: '#f8f9fa',
  },
  notLoggedInContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  notLoggedInText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  loginButton: {
    backgroundColor: '#3b82f6',
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
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#6366f1',
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
    color: '#111827',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 4,
  },
  university: {
    fontSize: 14,
    color: '#6b7280',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#6366f1',
  },
  tabText: {
    fontSize: 16,
    color: '#6b7280',
  },
  activeTabText: {
    color: '#6366f1',
    fontWeight: 'bold',
  },
  partyList: {
    padding: 15,
  },
  noParties: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
}); 