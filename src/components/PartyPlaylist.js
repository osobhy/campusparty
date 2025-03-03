import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  Image, 
  TextInput,
  Modal,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { 
  createPlaylist, 
  getPartyPlaylists, 
  addSongToPlaylist, 
  getPlaylistSongs,
  voteSong,
  markSongAsPlayed,
  searchSongs,
  getCurrentSong
} from '../services/playlistService';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

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

const PartyPlaylist = ({ partyId, isHost }) => {
  const { currentUser } = useAuth();
  const themeContext = useTheme();
  
  // Ensure we always have a valid theme object with all required properties
  const theme = themeContext?.theme || defaultTheme;
  
  const [playlists, setPlaylists] = useState([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [songs, setSongs] = useState([]);
  const [currentSong, setCurrentSong] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddSongModal, setShowAddSongModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDescription, setNewPlaylistDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load playlists when component mounts
  useEffect(() => {
    if (partyId) {
      loadPlaylists();
    }
  }, [partyId]);

  // Load songs when a playlist is selected
  useEffect(() => {
    if (selectedPlaylist) {
      loadSongs();
      loadCurrentSong();
    }
  }, [selectedPlaylist]);

  const loadPlaylists = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedPlaylists = await getPartyPlaylists(partyId);
      setPlaylists(fetchedPlaylists);
      
      // Select the first playlist if available and none is selected
      if (fetchedPlaylists.length > 0 && !selectedPlaylist) {
        setSelectedPlaylist(fetchedPlaylists[0]);
      }
    } catch (error) {
      console.error('Error loading playlists:', error);
      setError('Failed to load playlists');
      Alert.alert('Error', 'Failed to load playlists');
    } finally {
      setLoading(false);
    }
  };

  const loadSongs = async () => {
    if (!selectedPlaylist) return;
    
    try {
      setLoading(true);
      setError(null);
      const fetchedSongs = await getPlaylistSongs(partyId, selectedPlaylist.id);
      setSongs(fetchedSongs);
    } catch (error) {
      console.error('Error loading songs:', error);
      setError('Failed to load songs');
      Alert.alert('Error', 'Failed to load songs');
    } finally {
      setLoading(false);
    }
  };

  const loadCurrentSong = async () => {
    if (!selectedPlaylist) return;
    
    try {
      const fetchedCurrentSong = await getCurrentSong(partyId, selectedPlaylist.id);
      setCurrentSong(fetchedCurrentSong);
    } catch (error) {
      console.error('Error loading current song:', error);
    }
  };

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) {
      Alert.alert('Error', 'Please enter a playlist name');
      return;
    }
    
    try {
      const playlistInfo = {
        name: newPlaylistName.trim(),
        description: newPlaylistDescription.trim(),
        voteRequired: false,
        minVotes: 1
      };
      
      await createPlaylist(partyId, currentUser.uid, playlistInfo);
      setNewPlaylistName('');
      setNewPlaylistDescription('');
      setShowCreateModal(false);
      loadPlaylists();
      Alert.alert('Success', 'Playlist created successfully');
    } catch (error) {
      console.error('Error creating playlist:', error);
      Alert.alert('Error', 'Failed to create playlist');
    }
  };

  const handleSearchSongs = async (query) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    
    try {
      setIsSearching(true);
      const results = await searchSongs(query);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching songs:', error);
      Alert.alert('Error', 'Failed to search songs');
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddSong = async (song) => {
    try {
      await addSongToPlaylist(partyId, selectedPlaylist.id, currentUser.uid, song);
      setShowAddSongModal(false);
      loadSongs();
      Alert.alert('Success', 'Song added to playlist');
    } catch (error) {
      console.error('Error adding song:', error);
      Alert.alert('Error', 'Failed to add song to playlist');
    }
  };

  const handleVoteSong = async (songId) => {
    try {
      await voteSong(partyId, selectedPlaylist.id, songId, currentUser.uid);
      loadSongs();
    } catch (error) {
      console.error('Error voting for song:', error);
      Alert.alert('Error', 'Failed to vote for song');
    }
  };

  const handlePlaySong = async (songId) => {
    if (!isHost) {
      Alert.alert('Error', 'Only the host can play songs');
      return;
    }
    
    try {
      await markSongAsPlayed(partyId, selectedPlaylist.id, songId);
      loadSongs();
      loadCurrentSong();
    } catch (error) {
      console.error('Error playing song:', error);
      Alert.alert('Error', 'Failed to play song');
    }
  };

  const renderPlaylistItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.playlistItem,
        selectedPlaylist?.id === item.id && { backgroundColor: (theme.primary || '#6366f1') + '40' }
      ]}
      onPress={() => setSelectedPlaylist(item)}
    >
      <Text style={[styles.playlistName, { color: theme.text || '#111827' }]}>{item.name}</Text>
      {item.description ? (
        <Text style={[styles.playlistDescription, { color: (theme.text || '#111827') + '80' }]}>
          {item.description}
        </Text>
      ) : null}
    </TouchableOpacity>
  );

  const renderSongItem = ({ item }) => {
    const hasVoted = item.voters?.includes(currentUser.uid);
    
    return (
      <View style={[styles.songItem, { backgroundColor: theme.card || '#ffffff' }]}>
        <TouchableOpacity
          style={styles.voteButton}
          onPress={() => handleVoteSong(item.id)}
        >
          <Ionicons
            name={hasVoted ? "heart" : "heart-outline"}
            size={24}
            color={hasVoted ? (theme.primary || '#6366f1') : (theme.text || '#111827')}
          />
          <Text style={[styles.voteCount, { color: theme.text || '#111827' }]}>{item.votes}</Text>
        </TouchableOpacity>
        
        <View style={styles.songInfo}>
          {item.albumArt ? (
            <Image source={{ uri: item.albumArt }} style={styles.albumArt} />
          ) : (
            <View style={[styles.albumArtPlaceholder, { backgroundColor: theme.border || '#e5e7eb' }]}>
              <Ionicons name="musical-note" size={24} color={theme.text || '#111827'} />
            </View>
          )}
          
          <View style={styles.songDetails}>
            <Text style={[styles.songTitle, { color: theme.text || '#111827' }]}>{item.title}</Text>
            <Text style={[styles.songArtist, { color: (theme.text || '#111827') + '80' }]}>{item.artist}</Text>
          </View>
        </View>
        
        {isHost && (
          <TouchableOpacity
            style={[styles.playButton, { backgroundColor: theme.primary || '#6366f1' }]}
            onPress={() => handlePlaySong(item.id)}
          >
            <Ionicons name="play" size={20} color="white" />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderSearchResultItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.searchResultItem, { backgroundColor: theme.card || '#ffffff' }]}
      onPress={() => handleAddSong(item)}
    >
      {item.albumArt ? (
        <Image source={{ uri: item.albumArt }} style={styles.resultAlbumArt} />
      ) : (
        <View style={[styles.resultAlbumArtPlaceholder, { backgroundColor: theme.border || '#e5e7eb' }]}>
          <Ionicons name="musical-note" size={20} color={theme.text || '#111827'} />
        </View>
      )}
      
      <View style={styles.resultDetails}>
        <Text style={[styles.resultTitle, { color: theme.text || '#111827' }]}>{item.title}</Text>
        <Text style={[styles.resultArtist, { color: (theme.text || '#111827') + '80' }]}>{item.artist}</Text>
      </View>
      
      <Ionicons name="add-circle" size={24} color={theme.primary || '#6366f1'} />
    </TouchableOpacity>
  );

  const renderCurrentSong = () => {
    if (!currentSong) return null;
    
    return (
      <View style={[styles.currentSongContainer, { backgroundColor: (theme.primary || '#6366f1') + '20' }]}>
        <Text style={[styles.nowPlayingText, { color: theme.primary || '#6366f1' }]}>Now Playing</Text>
        
        <View style={styles.currentSongContent}>
          {currentSong.albumArt ? (
            <Image source={{ uri: currentSong.albumArt }} style={styles.currentAlbumArt} />
          ) : (
            <View style={[styles.currentAlbumArtPlaceholder, { backgroundColor: theme.border || '#e5e7eb' }]}>
              <Ionicons name="musical-note" size={32} color={theme.text || '#111827'} />
            </View>
          )}
          
          <View style={styles.currentSongDetails}>
            <Text style={[styles.currentSongTitle, { color: theme.text || '#111827' }]}>
              {currentSong.title}
            </Text>
            <Text style={[styles.currentSongArtist, { color: (theme.text || '#111827') + '80' }]}>
              {currentSong.artist}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  if (error && !currentUser) {
    return (
      <View style={[styles.container, { backgroundColor: theme.card || '#ffffff' }]}>
        <Text style={[styles.title, { color: theme.text || '#111827' }]}>Party Playlists</Text>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.error || '#ef4444' }]}>
            Please log in to use playlist features
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background || '#f8f9fa' }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text || '#111827' }]}>Party Playlists</Text>
        
        <TouchableOpacity
          style={[styles.createButton, { backgroundColor: theme.primary || '#6366f1' }]}
          onPress={() => setShowCreateModal(true)}
        >
          <Text style={styles.createButtonText}>Create Playlist</Text>
        </TouchableOpacity>
      </View>
      
      {/* Playlists Horizontal List */}
      <View style={styles.playlistsContainer}>
        {playlists.length > 0 ? (
          <FlatList
            horizontal
            data={playlists}
            renderItem={renderPlaylistItem}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.playlistsList}
          />
        ) : (
          <Text style={[styles.emptyText, { color: (theme.text || '#111827') + '80' }]}>
            No playlists yet. Create one to get started!
          </Text>
        )}
      </View>
      
      {/* Current Song Display */}
      {renderCurrentSong()}
      
      {/* Songs List */}
      {selectedPlaylist ? (
        <View style={styles.songsContainer}>
          <View style={styles.songsHeader}>
            <Text style={[styles.songsTitle, { color: theme.text || '#111827' }]}>
              {selectedPlaylist.name} - Songs
            </Text>
            
            <TouchableOpacity
              style={[styles.addSongButton, { backgroundColor: theme.secondary || '#a855f7' }]}
              onPress={() => setShowAddSongModal(true)}
            >
              <Text style={styles.addSongButtonText}>Add Song</Text>
            </TouchableOpacity>
          </View>
          
          {loading ? (
            <ActivityIndicator size="large" color={theme.primary || '#6366f1'} style={styles.loader} />
          ) : songs.length > 0 ? (
            <FlatList
              data={songs}
              renderItem={renderSongItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.songsList}
            />
          ) : (
            <Text style={[styles.emptyText, { color: (theme.text || '#111827') + '80' }]}>
              No songs in this playlist yet. Add some!
            </Text>
          )}
        </View>
      ) : null}
      
      {/* Create Playlist Modal */}
      <Modal
        visible={showCreateModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: theme.card || '#ffffff' }]}>
            <Text style={[styles.modalTitle, { color: theme.text || '#111827' }]}>Create New Playlist</Text>
            
            <TextInput
              style={[styles.input, { backgroundColor: theme.background || '#f8f9fa', color: theme.text || '#111827' }]}
              placeholder="Playlist Name"
              placeholderTextColor={(theme.text || '#111827') + '80'}
              value={newPlaylistName}
              onChangeText={setNewPlaylistName}
            />
            
            <TextInput
              style={[styles.input, { backgroundColor: theme.background || '#f8f9fa', color: theme.text || '#111827' }]}
              placeholder="Description (optional)"
              placeholderTextColor={(theme.text || '#111827') + '80'}
              value={newPlaylistDescription}
              onChangeText={setNewPlaylistDescription}
              multiline
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.error || '#ef4444' }]}
                onPress={() => setShowCreateModal(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.primary || '#6366f1' }]}
                onPress={handleCreatePlaylist}
              >
                <Text style={styles.modalButtonText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Add Song Modal */}
      <Modal
        visible={showAddSongModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddSongModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: theme.card || '#ffffff' }]}>
            <Text style={[styles.modalTitle, { color: theme.text || '#111827' }]}>Add Song</Text>
            
            <TextInput
              style={[styles.input, { backgroundColor: theme.background || '#f8f9fa', color: theme.text || '#111827' }]}
              placeholder="Search for songs..."
              placeholderTextColor={(theme.text || '#111827') + '80'}
              value={searchQuery}
              onChangeText={handleSearchSongs}
              autoFocus
            />
            
            {isSearching ? (
              <ActivityIndicator size="large" color={theme.primary || '#6366f1'} style={styles.searchLoader} />
            ) : searchResults.length > 0 ? (
              <FlatList
                data={searchResults}
                renderItem={renderSearchResultItem}
                keyExtractor={(item, index) => `${item.id}-${index}`}
                style={styles.searchResults}
              />
            ) : searchQuery ? (
              <Text style={[styles.emptyText, { color: (theme.text || '#111827') + '80' }]}>
                No results found. Try a different search term.
              </Text>
            ) : null}
            
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: theme.error || '#ef4444' }]}
              onPress={() => setShowAddSongModal(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  createButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  createButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  playlistsContainer: {
    marginBottom: 16,
  },
  playlistsList: {
    paddingVertical: 8,
  },
  playlistItem: {
    padding: 12,
    borderRadius: 8,
    marginRight: 12,
    minWidth: 150,
  },
  playlistName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  playlistDescription: {
    fontSize: 12,
  },
  currentSongContainer: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  nowPlayingText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  currentSongContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currentAlbumArt: {
    width: 60,
    height: 60,
    borderRadius: 4,
    marginRight: 12,
  },
  currentAlbumArtPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 4,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentSongDetails: {
    flex: 1,
  },
  currentSongTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  currentSongArtist: {
    fontSize: 14,
  },
  songsContainer: {
    flex: 1,
  },
  songsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  songsTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  addSongButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  addSongButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 12,
  },
  songsList: {
    paddingBottom: 16,
  },
  songItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  voteButton: {
    alignItems: 'center',
    marginRight: 12,
  },
  voteCount: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  songInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  albumArt: {
    width: 48,
    height: 48,
    borderRadius: 4,
    marginRight: 12,
  },
  albumArtPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 4,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  songDetails: {
    flex: 1,
  },
  songTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  songArtist: {
    fontSize: 14,
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    padding: 16,
    fontSize: 16,
  },
  modalContainer: {
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  searchResults: {
    maxHeight: 300,
    marginBottom: 16,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  resultAlbumArt: {
    width: 40,
    height: 40,
    borderRadius: 4,
    marginRight: 12,
  },
  resultAlbumArtPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 4,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultDetails: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  resultArtist: {
    fontSize: 14,
  },
  closeButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  loader: {
    marginVertical: 20,
  },
  searchLoader: {
    marginVertical: 20,
  },
  errorContainer: {
    padding: 16,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
});

export default PartyPlaylist; 