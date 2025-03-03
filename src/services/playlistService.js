import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  getDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp, 
  increment, 
  arrayUnion, 
  arrayRemove 
} from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * Create a new collaborative playlist for a party
 * @param {string} partyId - The ID of the party
 * @param {string} creatorId - The ID of the user creating the playlist
 * @param {Object} playlistInfo - Information about the playlist
 * @returns {Promise<string>} - The ID of the created playlist
 */
export const createPlaylist = async (partyId, creatorId, playlistInfo) => {
  try {
    const playlistsCollection = collection(db, 'parties', partyId, 'playlists');
    const playlistRef = doc(playlistsCollection);
    
    await setDoc(playlistRef, {
      name: playlistInfo.name,
      description: playlistInfo.description || '',
      creatorId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isActive: true,
      voteRequired: playlistInfo.voteRequired || false,
      minVotes: playlistInfo.minVotes || 1,
      currentSong: null
    });
    
    return playlistRef.id;
  } catch (error) {
    console.error('Error creating playlist:', error);
    throw error;
  }
};

/**
 * Get all playlists for a party
 * @param {string} partyId - The ID of the party
 * @returns {Promise<Array>} - Array of playlists
 */
export const getPartyPlaylists = async (partyId) => {
  try {
    const playlistsCollection = collection(db, 'parties', partyId, 'playlists');
    const playlistsQuery = query(
      playlistsCollection,
      where('isActive', '==', true),
      orderBy('createdAt', 'desc')
    );
    
    const playlistsSnapshot = await getDocs(playlistsQuery);
    
    return playlistsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting playlists:', error);
    throw error;
  }
};

/**
 * Add a song to a playlist
 * @param {string} partyId - The ID of the party
 * @param {string} playlistId - The ID of the playlist
 * @param {string} userId - The ID of the user adding the song
 * @param {Object} songInfo - Information about the song
 * @returns {Promise<string>} - The ID of the added song
 */
export const addSongToPlaylist = async (partyId, playlistId, userId, songInfo) => {
  try {
    const songsCollection = collection(db, 'parties', partyId, 'playlists', playlistId, 'songs');
    const songRef = doc(songsCollection);
    
    await setDoc(songRef, {
      title: songInfo.title,
      artist: songInfo.artist,
      albumArt: songInfo.albumArt || null,
      duration: songInfo.duration || 0,
      spotifyId: songInfo.spotifyId || null,
      youtubeId: songInfo.youtubeId || null,
      addedBy: userId,
      addedAt: serverTimestamp(),
      votes: 1,
      voters: [userId],
      played: false,
      playedAt: null
    });
    
    return songRef.id;
  } catch (error) {
    console.error('Error adding song to playlist:', error);
    throw error;
  }
};

/**
 * Get all songs in a playlist
 * @param {string} partyId - The ID of the party
 * @param {string} playlistId - The ID of the playlist
 * @param {boolean} includePlayedSongs - Whether to include songs that have already been played
 * @returns {Promise<Array>} - Array of songs
 */
export const getPlaylistSongs = async (partyId, playlistId, includePlayedSongs = false) => {
  try {
    const songsCollection = collection(db, 'parties', partyId, 'playlists', playlistId, 'songs');
    
    let songsQuery;
    if (!includePlayedSongs) {
      songsQuery = query(
        songsCollection,
        where('played', '==', false),
        orderBy('votes', 'desc'),
        orderBy('addedAt', 'asc')
      );
    } else {
      songsQuery = query(
        songsCollection,
        orderBy('votes', 'desc'),
        orderBy('addedAt', 'asc')
      );
    }
    
    const songsSnapshot = await getDocs(songsQuery);
    
    return songsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting playlist songs:', error);
    throw error;
  }
};

/**
 * Vote for a song in a playlist
 * @param {string} partyId - The ID of the party
 * @param {string} playlistId - The ID of the playlist
 * @param {string} songId - The ID of the song
 * @param {string} userId - The ID of the user voting
 * @returns {Promise<void>}
 */
export const voteSong = async (partyId, playlistId, songId, userId) => {
  try {
    const songRef = doc(db, 'parties', partyId, 'playlists', playlistId, 'songs', songId);
    const songSnapshot = await getDoc(songRef);
    
    if (!songSnapshot.exists()) {
      throw new Error('Song not found');
    }
    
    const songData = songSnapshot.data();
    
    // Check if user has already voted
    if (songData.voters.includes(userId)) {
      // Remove vote
      await updateDoc(songRef, {
        votes: increment(-1),
        voters: arrayRemove(userId)
      });
    } else {
      // Add vote
      await updateDoc(songRef, {
        votes: increment(1),
        voters: arrayUnion(userId)
      });
    }
  } catch (error) {
    console.error('Error voting for song:', error);
    throw error;
  }
};

/**
 * Mark a song as played
 * @param {string} partyId - The ID of the party
 * @param {string} playlistId - The ID of the playlist
 * @param {string} songId - The ID of the song
 * @returns {Promise<void>}
 */
export const markSongAsPlayed = async (partyId, playlistId, songId) => {
  try {
    const songRef = doc(db, 'parties', partyId, 'playlists', playlistId, 'songs', songId);
    
    await updateDoc(songRef, {
      played: true,
      playedAt: serverTimestamp()
    });
    
    // Update current song in playlist
    const playlistRef = doc(db, 'parties', partyId, 'playlists', playlistId);
    
    await updateDoc(playlistRef, {
      currentSong: songId,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error marking song as played:', error);
    throw error;
  }
};

/**
 * Search for songs (mock implementation - would connect to Spotify/YouTube API in production)
 * @param {string} query - The search query
 * @returns {Promise<Array>} - Array of song results
 */
export const searchSongs = async (query) => {
  // This is a mock implementation
  // In a real app, you would connect to Spotify or YouTube API
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Mock data
  const mockResults = [
    {
      id: '1',
      title: 'Blinding Lights',
      artist: 'The Weeknd',
      albumArt: 'https://i.scdn.co/image/ab67616d0000b273c5649add07ed3720be9d5526',
      duration: 200,
      spotifyId: '0VjIjW4GlUZAMYd2vXMi3b'
    },
    {
      id: '2',
      title: 'Levitating',
      artist: 'Dua Lipa',
      albumArt: 'https://i.scdn.co/image/ab67616d0000b273bd26ede1ae69327010d49946',
      duration: 203,
      spotifyId: '39LLxExYz6ewLAcYrzQQyP'
    },
    // Filter results based on query
    // This is just a simple mock implementation
    // In a real app, the filtering would be done by the API
  ].filter(song => 
    song.title.toLowerCase().includes(query.toLowerCase()) || 
    song.artist.toLowerCase().includes(query.toLowerCase())
  );
  
  return mockResults;
};

/**
 * Get the current song playing in a playlist
 * @param {string} partyId - The ID of the party
 * @param {string} playlistId - The ID of the playlist
 * @returns {Promise<Object|null>} - The current song or null if no song is playing
 */
export const getCurrentSong = async (partyId, playlistId) => {
  try {
    const playlistRef = doc(db, 'parties', partyId, 'playlists', playlistId);
    const playlistSnapshot = await getDoc(playlistRef);
    
    if (!playlistSnapshot.exists()) {
      throw new Error('Playlist not found');
    }
    
    const playlistData = playlistSnapshot.data();
    
    if (!playlistData.currentSong) {
      return null;
    }
    
    const songRef = doc(db, 'parties', partyId, 'playlists', playlistId, 'songs', playlistData.currentSong);
    const songSnapshot = await getDoc(songRef);
    
    if (!songSnapshot.exists()) {
      return null;
    }
    
    return {
      id: songSnapshot.id,
      ...songSnapshot.data()
    };
  } catch (error) {
    console.error('Error getting current song:', error);
    throw error;
  }
}; 