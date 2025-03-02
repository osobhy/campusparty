import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import PartyCard from '../components/PartyCard';
import { useAuth } from '../context/AuthContext';
import { useParties } from '../hooks/useParties';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useNotification } from '../context/NotificationContext';

export default function HomeScreen({ navigation }) {
  const { currentUser, logout } = useAuth();
  const { theme } = useTheme();
  const { showSuccess, showError, showInfo } = useNotification();
  const { 
    parties, 
    loading, 
    refreshing, 
    handleJoinParty, 
    handleLeaveParty, 
    onRefresh,
    error
  } = useParties(currentUser?.uid);

  // Show error notification if there's an error fetching parties
  useEffect(() => {
    if (error) {
      showError(`Error: ${error}`);
    }
  }, [error]);

  // Welcome notification when user logs in
  useEffect(() => {
    if (currentUser) {
      showSuccess(`Welcome, ${currentUser.displayName || 'User'}!`);
    }
  }, []);

  const handlePartyAction = async (partyId) => {
    if (!currentUser) {
      showInfo('Please login to join parties');
      setTimeout(() => {
        navigation.navigate('Login');
      }, 1000);
      return;
    }

    try {
      const result = await handleJoinParty(partyId, currentUser.uid);
      
      if (result.requiresAuth) {
        showInfo('Please login to join parties');
        setTimeout(() => {
          navigation.navigate('Login');
        }, 1000);
        return;
      }
      
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
                try {
                  const leaveResult = await handleLeaveParty(partyId, currentUser.uid);
                  if (leaveResult.success) {
                    showSuccess('You have left the party');
                  } else {
                    showError(leaveResult.error || 'Failed to leave party');
                  }
                } catch (error) {
                  console.error('Error leaving party:', error);
                  showError('Failed to leave party. Please try again.');
                }
              }
            }
          ]
        );
        return;
      }
      
      if (result.success) {
        showSuccess('You have joined the party!');
      } else {
        showError(result.error || 'Failed to join party');
      }
    } catch (error) {
      console.error('Error handling party action:', error);
      showError('Something went wrong. Please try again.');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      showInfo('You have been logged out');
    } catch (error) {
      console.error('Error logging out:', error);
      showError('Failed to logout. Please try again.');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {currentUser && currentUser.university && (
        <View style={[styles.universityBanner, { backgroundColor: theme.primary }]}>
          <Ionicons name="school-outline" size={20} color="white" />
          <Text style={styles.universityText}>
            Showing parties from {currentUser.university}
          </Text>
        </View>
      )}

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.createButton, { backgroundColor: theme.secondary }]}
          onPress={() => {
            if (currentUser) {
              navigation.navigate('CreateParty');
            } else {
              showInfo('Please login to create parties');
              setTimeout(() => {
                navigation.navigate('Login');
              }, 1000);
            }
          }}
        >
          <Text style={styles.buttonText}>Create New Party</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            currentUser ? styles.logoutButton : styles.loginButton, 
            { backgroundColor: currentUser ? theme.error : theme.accent }
          ]}
          onPress={() => {
            if (currentUser) {
              handleLogout();
            } else {
              navigation.navigate('Login');
            }
          }}
        >
          <Text style={styles.buttonText}>
            {currentUser ? 'Logout' : 'Login'}
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.subtext }]}>Loading parties...</Text>
        </View>
      ) : (
        <ScrollView 
          style={styles.partyList}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              colors={[theme.primary]}
              tintColor={theme.primary}
            />
          }
        >
          {!currentUser ? (
            <View style={[styles.loginPrompt, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Ionicons name="lock-closed-outline" size={40} color={theme.primary} />
              <Text style={[styles.loginPromptTitle, { color: theme.text }]}>Login with your .edu email</Text>
              <Text style={[styles.loginPromptText, { color: theme.subtext }]}>
                To see parties from your university, please login with your college email address.
              </Text>
              <TouchableOpacity
                style={[styles.loginPromptButton, { backgroundColor: theme.primary }]}
                onPress={() => navigation.navigate('Login')}
              >
                <Text style={styles.loginPromptButtonText}>Login Now</Text>
              </TouchableOpacity>
            </View>
          ) : parties && parties.length > 0 ? (
            parties.map(party => (
              <PartyCard 
                key={party.id} 
                party={party} 
                onJoin={() => handlePartyAction(party.id)}
                isLoggedIn={!!currentUser}
                isJoined={currentUser && party.attendees && party.attendees.includes(currentUser.uid)}
                isHost={currentUser && party.host && party.host.id === currentUser.uid}
                theme={theme}
              />
            ))
          ) : (
            <View style={styles.noPartiesContainer}>
              <Ionicons name="calendar-outline" size={40} color={theme.primary} />
              <Text style={[styles.noParties, { color: theme.text }]}>
                No parties found at {currentUser.university}
              </Text>
              <Text style={[styles.noPartiesSubtext, { color: theme.subtext }]}>
                Be the first to create a party for your university!
              </Text>
            </View>
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
  universityBanner: {
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  universityText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  buttonContainer: {
    padding: 15,
  },
  createButton: {
    padding: 15,
    borderRadius: 25,
    marginBottom: 10,
    alignItems: 'center',
  },
  loginButton: {
    padding: 15,
    borderRadius: 25,
    alignItems: 'center',
  },
  logoutButton: {
    padding: 15,
    borderRadius: 25,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  partyList: {
    padding: 15,
  },
  loginPrompt: {
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    marginVertical: 20,
    borderWidth: 1,
  },
  loginPromptTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
  },
  loginPromptText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 15,
  },
  loginPromptButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  loginPromptButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  noPartiesContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  noParties: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
  },
  noPartiesSubtext: {
    textAlign: 'center',
    fontSize: 14,
    marginTop: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
});