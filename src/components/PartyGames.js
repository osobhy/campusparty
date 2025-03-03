import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Modal, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '@react-navigation/native';
import { 
  getUniversityGames, 
  getPopularGames, 
  addGameToParty, 
  getPartyGames,
  joinPartyGame,
  removePartyGame,
  createCustomGame
} from '../services/gameService';

const PartyGames = ({ partyId, university, isHost }) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [partyGames, setPartyGames] = useState([]);
  const [availableGames, setAvailableGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddGameModal, setShowAddGameModal] = useState(false);
  const [showCreateGameModal, setShowCreateGameModal] = useState(false);
  const [showGameDetailsModal, setShowGameDetailsModal] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [newGame, setNewGame] = useState({
    name: '',
    description: '',
    rules: '',
    category: 'drinking',
    isPublic: true,
    universities: [university]
  });

  useEffect(() => {
    loadGames();
  }, [partyId, university]);

  const loadGames = async () => {
    try {
      setLoading(true);
      
      // Get games already added to the party
      const partyGamesData = await getPartyGames(partyId);
      setPartyGames(partyGamesData);
      
      // Get university-specific games
      const universityGamesData = await getUniversityGames(university);
      
      // Get popular games
      const popularGamesData = await getPopularGames();
      
      // Combine and remove duplicates
      const combinedGames = [...universityGamesData];
      
      popularGamesData.forEach(game => {
        if (!combinedGames.some(g => g.id === game.id)) {
          combinedGames.push(game);
        }
      });
      
      setAvailableGames(combinedGames);
    } catch (error) {
      console.error('Error loading games:', error);
      Alert.alert('Error', 'Failed to load games');
    } finally {
      setLoading(false);
    }
  };

  const handleAddGame = async (gameId) => {
    try {
      await addGameToParty(partyId, gameId);
      setShowAddGameModal(false);
      Alert.alert('Success', 'Game added to party');
      loadGames();
    } catch (error) {
      console.error('Error adding game:', error);
      Alert.alert('Error', 'Failed to add game');
    }
  };

  const handleJoinGame = async (gameId) => {
    try {
      await joinPartyGame(partyId, gameId, user.uid, user.displayName);
      Alert.alert('Success', 'You joined the game');
      loadGames();
    } catch (error) {
      console.error('Error joining game:', error);
      Alert.alert('Error', 'Failed to join game');
    }
  };

  const handleRemoveGame = async (gameId) => {
    try {
      await removePartyGame(partyId, gameId);
      Alert.alert('Success', 'Game removed from party');
      loadGames();
    } catch (error) {
      console.error('Error removing game:', error);
      Alert.alert('Error', 'Failed to remove game');
    }
  };

  const handleCreateGame = async () => {
    if (!newGame.name || !newGame.description || !newGame.rules) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      await createCustomGame(newGame, user.uid);
      setShowCreateGameModal(false);
      Alert.alert('Success', 'Game created successfully');
      
      // Reset form
      setNewGame({
        name: '',
        description: '',
        rules: '',
        category: 'drinking',
        isPublic: true,
        universities: [university]
      });
      
      // Reload games
      loadGames();
    } catch (error) {
      console.error('Error creating game:', error);
      Alert.alert('Error', 'Failed to create game');
    }
  };

  const filteredAvailableGames = availableGames.filter(game => {
    const alreadyAdded = partyGames.some(pg => pg.gameId === game.id);
    const matchesSearch = searchQuery === '' || 
      game.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      game.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    return !alreadyAdded && matchesSearch;
  });

  const renderPartyGameItem = ({ item }) => {
    const isUserParticipating = item.participants.some(p => p.id === user.uid);
    
    return (
      <TouchableOpacity 
        style={[styles.gameItem, { backgroundColor: colors.card }]}
        onPress={() => {
          setSelectedGame(item);
          setShowGameDetailsModal(true);
        }}
      >
        <View style={styles.gameHeader}>
          <View style={styles.gameInfo}>
            <Text style={[styles.gameName, { color: colors.text }]}>{item.gameName}</Text>
            <Text style={[styles.gameCategory, { color: colors.primary }]}>
              {item.gameCategory.charAt(0).toUpperCase() + item.gameCategory.slice(1)}
            </Text>
          </View>
          
          <View style={styles.gameActions}>
            {isHost && (
              <TouchableOpacity 
                style={[styles.iconButton, { backgroundColor: colors.error + '20' }]}
                onPress={() => handleRemoveGame(item.id)}
              >
                <Ionicons name="trash-outline" size={18} color={colors.error} />
              </TouchableOpacity>
            )}
            
            {!isUserParticipating && (
              <TouchableOpacity 
                style={[styles.joinButton, { backgroundColor: colors.primary }]}
                onPress={() => handleJoinGame(item.id)}
              >
                <Text style={styles.joinButtonText}>Join</Text>
              </TouchableOpacity>
            )}
            
            {isUserParticipating && (
              <View style={[styles.participatingBadge, { backgroundColor: colors.success + '20' }]}>
                <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                <Text style={[styles.participatingText, { color: colors.success }]}>Joined</Text>
              </View>
            )}
          </View>
        </View>
        
        <Text 
          style={[styles.gameDescription, { color: colors.text }]}
          numberOfLines={2}
        >
          {item.gameDescription}
        </Text>
        
        <View style={styles.participantsContainer}>
          <Text style={[styles.participantsLabel, { color: colors.subtext }]}>
            {item.participants.length} {item.participants.length === 1 ? 'player' : 'players'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderAvailableGameItem = ({ item }) => (
    <TouchableOpacity 
      style={[styles.availableGameItem, { backgroundColor: colors.card }]}
      onPress={() => handleAddGame(item.id)}
    >
      <View style={styles.availableGameHeader}>
        <Text style={[styles.availableGameName, { color: colors.text }]}>{item.name}</Text>
        <Text style={[styles.availableGameCategory, { color: colors.primary }]}>
          {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
        </Text>
      </View>
      
      <Text 
        style={[styles.availableGameDescription, { color: colors.text }]}
        numberOfLines={2}
      >
        {item.description}
      </Text>
      
      {item.universities.includes(university) && (
        <View style={[styles.universityBadge, { backgroundColor: colors.notification + '20' }]}>
          <Ionicons name="school-outline" size={12} color={colors.notification} />
          <Text style={[styles.universityText, { color: colors.notification }]}>
            {university}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderAddGameModal = () => (
    <Modal
      visible={showAddGameModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowAddGameModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Add Game to Party</Text>
            <TouchableOpacity onPress={() => setShowAddGameModal(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          <TextInput
            style={[styles.searchInput, { 
              backgroundColor: colors.card,
              color: colors.text,
              borderColor: colors.border
            }]}
            placeholder="Search games..."
            placeholderTextColor={colors.subtext}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          
          {filteredAvailableGames.length > 0 ? (
            <FlatList
              data={filteredAvailableGames}
              renderItem={renderAvailableGameItem}
              keyExtractor={(item) => item.id}
              style={styles.availableGamesList}
            />
          ) : (
            <View style={styles.noGamesContainer}>
              <Ionicons name="game-controller-outline" size={48} color={colors.subtext} />
              <Text style={[styles.noGamesText, { color: colors.subtext }]}>
                No games found
              </Text>
              <Text style={[styles.noGamesSubtext, { color: colors.subtext }]}>
                Try a different search or create your own game
              </Text>
            </View>
          )}
          
          <TouchableOpacity 
            style={[styles.createGameButton, { backgroundColor: colors.primary }]}
            onPress={() => {
              setShowAddGameModal(false);
              setShowCreateGameModal(true);
            }}
          >
            <Ionicons name="add-circle-outline" size={18} color="#fff" />
            <Text style={styles.createGameButtonText}>Create New Game</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderCreateGameModal = () => (
    <Modal
      visible={showCreateGameModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowCreateGameModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Create New Game</Text>
            <TouchableOpacity onPress={() => setShowCreateGameModal(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          <TextInput
            style={[styles.input, { 
              backgroundColor: colors.card,
              color: colors.text,
              borderColor: colors.border
            }]}
            placeholder="Game name"
            placeholderTextColor={colors.subtext}
            value={newGame.name}
            onChangeText={(text) => setNewGame({...newGame, name: text})}
          />
          
          <TextInput
            style={[styles.input, { 
              backgroundColor: colors.card,
              color: colors.text,
              borderColor: colors.border
            }]}
            placeholder="Short description"
            placeholderTextColor={colors.subtext}
            value={newGame.description}
            onChangeText={(text) => setNewGame({...newGame, description: text})}
          />
          
          <TextInput
            style={[styles.textArea, { 
              backgroundColor: colors.card,
              color: colors.text,
              borderColor: colors.border
            }]}
            placeholder="Game rules and instructions"
            placeholderTextColor={colors.subtext}
            multiline={true}
            numberOfLines={4}
            value={newGame.rules}
            onChangeText={(text) => setNewGame({...newGame, rules: text})}
          />
          
          <View style={styles.categorySelector}>
            <Text style={[styles.categoryLabel, { color: colors.text }]}>Category:</Text>
            <View style={styles.categoryOptions}>
              {['drinking', 'card', 'trivia', 'active', 'other'].map(category => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryOption,
                    { 
                      backgroundColor: newGame.category === category ? colors.primary : colors.card,
                      borderColor: colors.border
                    }
                  ]}
                  onPress={() => setNewGame({...newGame, category})}
                >
                  <Text 
                    style={[
                      styles.categoryOptionText, 
                      { color: newGame.category === category ? '#fff' : colors.text }
                    ]}
                  >
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.publicToggle}
            onPress={() => setNewGame({...newGame, isPublic: !newGame.isPublic})}
          >
            <Ionicons
              name={newGame.isPublic ? "checkbox-outline" : "square-outline"}
              size={24}
              color={colors.primary}
            />
            <Text style={[styles.publicToggleText, { color: colors.text }]}>
              Make this game public for all universities
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.submitButton, { backgroundColor: colors.primary }]}
            onPress={handleCreateGame}
          >
            <Text style={styles.submitButtonText}>Create Game</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderGameDetailsModal = () => {
    if (!selectedGame) return null;
    
    return (
      <Modal
        visible={showGameDetailsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowGameDetailsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{selectedGame.gameName}</Text>
              <TouchableOpacity onPress={() => setShowGameDetailsModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            <View style={[styles.gameDetailCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.gameDetailCategory, { color: colors.primary }]}>
                {selectedGame.gameCategory.charAt(0).toUpperCase() + selectedGame.gameCategory.slice(1)}
              </Text>
              
              <Text style={[styles.gameDetailDescription, { color: colors.text }]}>
                {selectedGame.gameDescription}
              </Text>
              
              <View style={styles.sectionDivider} />
              
              <Text style={[styles.rulesTitle, { color: colors.text }]}>Rules:</Text>
              <Text style={[styles.rulesText, { color: colors.text }]}>
                {selectedGame.gameRules}
              </Text>
            </View>
            
            <View style={styles.participantsSection}>
              <Text style={[styles.participantsTitle, { color: colors.text }]}>
                Players ({selectedGame.participants.length})
              </Text>
              
              {selectedGame.participants.length > 0 ? (
                <FlatList
                  data={selectedGame.participants}
                  renderItem={({ item }) => (
                    <View style={[styles.participantItem, { backgroundColor: colors.card }]}>
                      <Ionicons name="person-circle-outline" size={24} color={colors.primary} />
                      <Text style={[styles.participantName, { color: colors.text }]}>
                        {item.name}
                      </Text>
                    </View>
                  )}
                  keyExtractor={(item, index) => index.toString()}
                  style={styles.participantsList}
                />
              ) : (
                <Text style={[styles.noParticipantsText, { color: colors.subtext }]}>
                  No players have joined yet
                </Text>
              )}
            </View>
            
            {!selectedGame.participants.some(p => p.id === user.uid) && (
              <TouchableOpacity 
                style={[styles.joinGameButton, { backgroundColor: colors.primary }]}
                onPress={() => {
                  handleJoinGame(selectedGame.id);
                  setShowGameDetailsModal(false);
                }}
              >
                <Text style={styles.joinGameButtonText}>Join Game</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Party Games</Text>
        
        {isHost && (
          <TouchableOpacity 
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={() => setShowAddGameModal(true)}
          >
            <Ionicons name="add" size={16} color="#fff" />
            <Text style={styles.addButtonText}>Add Game</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.subtext }]}>Loading games...</Text>
        </View>
      ) : partyGames.length > 0 ? (
        <FlatList
          data={partyGames}
          renderItem={renderPartyGameItem}
          keyExtractor={(item) => item.id}
          style={styles.gamesList}
        />
      ) : (
        <View style={styles.noGamesContainer}>
          <Ionicons name="game-controller-outline" size={48} color={colors.subtext} />
          <Text style={[styles.noGamesText, { color: colors.subtext }]}>
            No games added yet
          </Text>
          {isHost && (
            <TouchableOpacity 
              style={[styles.addFirstGameButton, { backgroundColor: colors.primary }]}
              onPress={() => setShowAddGameModal(true)}
            >
              <Text style={styles.addFirstGameButtonText}>Add First Game</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
      
      {renderAddGameModal()}
      {renderCreateGameModal()}
      {renderGameDetailsModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 4,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
  },
  gamesList: {
    maxHeight: 400,
  },
  gameItem: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  gameInfo: {
    flex: 1,
  },
  gameName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  gameCategory: {
    fontSize: 12,
    fontWeight: '500',
  },
  gameActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: 6,
    borderRadius: 4,
    marginLeft: 8,
  },
  joinButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginLeft: 8,
  },
  joinButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  participatingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8,
  },
  participatingText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  gameDescription: {
    fontSize: 14,
    marginBottom: 10,
  },
  participantsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  participantsLabel: {
    fontSize: 12,
  },
  noGamesContainer: {
    alignItems: 'center',
    padding: 20,
  },
  noGamesText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 4,
  },
  noGamesSubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  addFirstGameButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 12,
  },
  addFirstGameButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  searchInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
  },
  availableGamesList: {
    maxHeight: 300,
    marginBottom: 16,
  },
  availableGameItem: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  availableGameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  availableGameName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  availableGameCategory: {
    fontSize: 12,
    fontWeight: '500',
  },
  availableGameDescription: {
    fontSize: 14,
    marginBottom: 8,
  },
  universityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  universityText: {
    fontSize: 10,
    marginLeft: 4,
  },
  createGameButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
  },
  createGameButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
    textAlignVertical: 'top',
    minHeight: 100,
  },
  categorySelector: {
    marginBottom: 16,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  categoryOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  categoryOption: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  categoryOptionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  publicToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  publicToggleText: {
    marginLeft: 8,
  },
  submitButton: {
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  gameDetailCard: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  gameDetailCategory: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  gameDetailDescription: {
    fontSize: 16,
    marginBottom: 16,
    lineHeight: 22,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: '#ddd',
    marginVertical: 12,
  },
  rulesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  rulesText: {
    fontSize: 14,
    lineHeight: 20,
  },
  participantsSection: {
    marginBottom: 16,
  },
  participantsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  participantsList: {
    maxHeight: 150,
  },
  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  participantName: {
    marginLeft: 10,
    fontSize: 14,
  },
  noParticipantsText: {
    textAlign: 'center',
    padding: 12,
    fontStyle: 'italic',
  },
  joinGameButton: {
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  joinGameButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default PartyGames; 