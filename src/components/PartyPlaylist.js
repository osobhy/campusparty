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
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const PartyPlaylist = ({ partyId, isHost }) => {
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
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

  // Load playlists when component mounts
  useEffect(() => {
    loadPlaylists();
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
      const fetchedPlaylists = await getPartyPlaylists(partyId);
      setPlaylists(fetchedPlaylists);
      
      // Select the first playlist if available and none is selected
      if (fetchedPlaylists.length > 0 && !selectedPlaylist) {
        setSelectedPlaylist(fetchedPlaylists[0]);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading playlists:', error);
      setLoading(false);
      Alert.alert('Error', 'Failed to load playlists');
    }
  };

  const loadSongs = async () => {
    if (!selectedPlaylist) return;
    
    try {
      setLoading(true);
      const fetchedSongs = await getPlaylistSongs(partyId, selectedPlaylist.id);
      setSongs(fetchedSongs);
      setLoading(false);
    } catch (error) {
      console.error('Error loading songs:', error);
      setLoading(false);
      Alert.alert('Error', 'Failed to load songs');
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
      
      await createPlaylist(partyId, user.uid, playlistInfo);
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
      setIsSearching(false);
    } catch (error) {
      console.error('Error searching songs:', error);
      setIsSearching(false);
      Alert.alert('Error', 'Failed to search songs');
    }
  };

  const handleAddSong = async (song) => {
    try {
      await addSongToPlaylist(partyId, selectedPlaylist.id, user.uid, song);
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
      await voteSong(partyId, selectedPlaylist.id, songId, user.uid);
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
        selectedPlaylist?.id === item.id && { backgroundColor: colors.primary + '40' }
      ]}
      onPress={() => setSelectedPlaylist(item)}
    >
      <Text style={[styles.playlistName, { color: colors.text }]}>{item.name}</Text>
      {item.description ? (
        <Text style={[styles.playlistDescription, { color: colors.text + '80' }]}>
          {item.description}
        </Text>
      ) : null}
    </TouchableOpacity>
  );

  const renderSongItem = ({ item }) => {
    const hasVoted = item.voters?.includes(user.uid);
    
    return (
      <View style={[styles.songItem, { backgroundColor: colors.card }]}>
        <TouchableOpacity
          style={styles.voteButton}
          onPress={() => handleVoteSong(item.id)}
        >
          <Ionicons
            name={hasVoted ? "heart" : "heart-outline"}
            size={24}
            color={hasVoted ? colors.primary : colors.text}
          />
          <Text style={[styles.voteCount, { color: colors.text }]}>{item.votes}</Text>
        </TouchableOpacity>
        
        <View style={styles.songInfo}>
          {item.albumArt ? (
            <Image source={{ uri: item.albumArt }} style={styles.albumArt} />
          ) : (
            <View style={[styles.albumArtPlaceholder, { backgroundColor: colors.border }]}>
              <Ionicons name="musical-note" size={24} color={colors.text} />
            </View>
          )}
          
          <View style={styles.songDetails}>
            <Text style={[styles.songTitle, { color: colors.text }]}>{item.title}</Text>
            <Text style={[styles.songArtist, { color: colors.text + '80' }]}>{item.artist}</Text>
          </View>
        </View>
        
        {isHost && (
          <TouchableOpacity
            style={[styles.playButton, { backgroundColor: colors.primary }]}
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
      style={[styles.searchResultItem, { backgroundColor: colors.card }]}
      onPress={() => handleAddSong(item)}
    >
      {item.albumArt ? (
        <Image source={{ uri: item.albumArt }} style={styles.resultAlbumArt} />
      ) : (
        <View style={[styles.resultAlbumArtPlaceholder, { backgroundColor: colors.border }]}>
          <Ionicons name="musical-note" size={20} color={colors.text} />
        </View>
      )}
      
      <View style={styles.resultDetails}>
        <Text style={[styles.resultTitle, { color: colors.text }]}>{item.title}</Text>
        <Text style={[styles.resultArtist, { color: colors.text + '80' }]}>{item.artist}</Text>
      </View>
      
      <Ionicons name="add-circle" size={24} color={colors.primary} />
    </TouchableOpacity>
  );

  const renderCurrentSong = () => {
    if (!currentSong) return null;
    
    return (
      <View style={[styles.currentSongContainer, { backgroundColor: colors.primary + '20' }]}>
        <Text style={[styles.nowPlayingText, { color: colors.primary }]}>Now Playing</Text>
        
        <View style={styles.currentSongContent}>
          {currentSong.albumArt ? (
            <Image source={{ uri: currentSong.albumArt }} style={styles.currentAlbumArt} />
          ) : (
            <View style={[styles.currentAlbumArtPlaceholder, { backgroundColor: colors.border }]}>
              <Ionicons name="musical-note" size={32} color={colors.text} />
            </View>
          )}
          
          <View style={styles.currentSongDetails}>
            <Text style={[styles.currentSongTitle, { color: colors.text }]}>
              {currentSong.title}
            </Text>
            <Text style={[styles.currentSongArtist, { color: colors.text + '80' }]}>
              {currentSong.artist}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Party Playlists</Text>
        
        <TouchableOpacity
          style={[styles.createButton, { backgroundColor: colors.primary }]}
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
          <Text style={[styles.emptyText, { color: colors.text + '80' }]}>
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
            <Text style={[styles.songsTitle, { color: colors.text }]}>
              {selectedPlaylist.name} - Songs
            </Text>
            
            <TouchableOpacity
              style={[styles.addSongButton, { backgroundColor: colors.secondary }]}
              onPress={() => setShowAddSongModal(true)}
            >
              <Text style={styles.addSongButtonText}>Add Song</Text>
            </TouchableOpacity>
          </View>
          
          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
          ) : songs.length > 0 ? (
            <FlatList
              data={songs}
              renderItem={renderSongItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.songsList}
            />
          ) : (
            <Text style={[styles.emptyText, { color: colors.text + '80' }]}>
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
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Create New Playlist</Text>
            
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
              placeholder="Playlist Name"
              placeholderTextColor={colors.text + '80'}
              value={newPlaylistName}
              onChangeText={setNewPlaylistName}
            />
            
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
              placeholder="Description (optional)"
              placeholderTextColor={colors.text + '80'}
              value={newPlaylistDescription}
              onChangeText={setNewPlaylistDescription}
              multiline
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.error }]}
                onPress={() => setShowCreateModal(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.primary }]}
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
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Add Song to Playlist</Text>
            
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
              placeholder="Search for songs..."
              placeholderTextColor={colors.text + '80'}
              value={searchQuery}
              onChangeText={handleSearchSongs}
              autoFocus
            />
            
            {isSearching ? (
              <ActivityIndicator size="small" color={colors.primary} style={styles.searchLoader} />
            ) : searchResults.length > 0 ? (
              <FlatList
                data={searchResults}
                renderItem={renderSearchResultItem}
                keyExtractor={(item) => item.id}
                style={styles.searchResults}
              />
            ) : searchQuery.trim() ? (
              <Text style={[styles.emptyText, { color: colors.text + '80' }]}>
                No results found
              </Text>
            ) : null}
            
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: colors.error }]}
              onPress={() => setShowAddSongModal(false)}
            >
              <Text style={styles.modalButtonText}>Close</Text>
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
    padding: 16,
    borderRadius: 8,
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
    fontSize: 18,
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
    paddingVertical: 8,
    borderRadius: 20,
  },
  addSongButtonText: {
    color: 'white',
    fontWeight: '600',
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
    width: 50,
    height: 50,
    borderRadius: 4,
    marginRight: 12,
  },
  albumArtPlaceholder: {
    width: 50,
    height: 50,
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
    fontWeight: '600',
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
  modalButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  closeButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  searchResults: {
    maxHeight: 300,
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
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  resultArtist: {
    fontSize: 12,
  },
  emptyText: {
    textAlign: 'center',
    padding: 16,
  },
  loader: {
    marginTop: 20,
  },
  searchLoader: {
    marginVertical: 20,
  },
});

export default PartyPlaylist; 