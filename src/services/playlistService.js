import firebase from '../config/firebase';
import 'firebase/firestore';

const db = firebase.firestore();

/**
 * Create a new collaborative playlist for a party
 * @param {string} partyId - The ID of the party
 * @param {string} creatorId - The ID of the user creating the playlist
 * @param {Object} playlistInfo - Information about the playlist
 * @returns {Promise<string>} - The ID of the created playlist
 */
export const createPlaylist = async (partyId, creatorId, playlistInfo) => {
  try {
    const playlistRef = db.collection('parties').doc(partyId).collection('playlists').doc();
    
    await playlistRef.set({
      name: playlistInfo.name,
      description: playlistInfo.description || '',
      creatorId,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
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
    const playlistsSnapshot = await db.collection('parties').doc(partyId).collection('playlists')
      .where('isActive', '==', true)
      .orderBy('createdAt', 'desc')
      .get();
    
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
    const songRef = db.collection('parties').doc(partyId)
      .collection('playlists').doc(playlistId)
      .collection('songs').doc();
    
    await songRef.set({
      title: songInfo.title,
      artist: songInfo.artist,
      albumArt: songInfo.albumArt || null,
      duration: songInfo.duration || 0,
      spotifyId: songInfo.spotifyId || null,
      youtubeId: songInfo.youtubeId || null,
      addedBy: userId,
      addedAt: firebase.firestore.FieldValue.serverTimestamp(),
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
    let query = db.collection('parties').doc(partyId)
      .collection('playlists').doc(playlistId)
      .collection('songs')
      .orderBy('votes', 'desc')
      .orderBy('addedAt', 'asc');
    
    if (!includePlayedSongs) {
      query = query.where('played', '==', false);
    }
    
    const songsSnapshot = await query.get();
    
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
    const songRef = db.collection('parties').doc(partyId)
      .collection('playlists').doc(playlistId)
      .collection('songs').doc(songId);
    
    const songDoc = await songRef.get();
    
    if (!songDoc.exists) {
      throw new Error('Song not found');
    }
    
    const songData = songDoc.data();
    
    // Check if user has already voted
    if (songData.voters.includes(userId)) {
      // Remove vote
      await songRef.update({
        votes: firebase.firestore.FieldValue.increment(-1),
        voters: firebase.firestore.FieldValue.arrayRemove(userId)
      });
    } else {
      // Add vote
      await songRef.update({
        votes: firebase.firestore.FieldValue.increment(1),
        voters: firebase.firestore.FieldValue.arrayUnion(userId)
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
    const songRef = db.collection('parties').doc(partyId)
      .collection('playlists').doc(playlistId)
      .collection('songs').doc(songId);
    
    await songRef.update({
      played: true,
      playedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    // Update current song in playlist
    const playlistRef = db.collection('parties').doc(partyId)
      .collection('playlists').doc(playlistId);
    
    await playlistRef.update({
      currentSong: songId,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
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
    {
      id: '3',
      title: 'Stay',
      artist: 'The Kid LAROI, Justin Bieber',
      albumArt: 'https://i.scdn.co/image/ab67616d0000b273e85259a1cae0588a95d604d9',
      duration: 141,
      spotifyId: '5HCyWlXZPP0y6Gqq8TgA20'
    },
    {
      id: '4',
      title: 'good 4 u',
      artist: 'Olivia Rodrigo',
      albumArt: 'https://i.scdn.co/image/ab67616d0000b273a91c10fe9472d9bd89802e5a',
      duration: 178,
      spotifyId: '4ZtFanR9U6ndgddUvNcjcG'
    },
    {
      id: '5',
      title: 'Heat Waves',
      artist: 'Glass Animals',
      albumArt: 'https://i.scdn.co/image/ab67616d0000b2739e495fb707973f3390850eea',
      duration: 238,
      spotifyId: '02MWAaffLxlfxAUY7c5dvx'
    }
  ];
  
  // Filter based on query
  return mockResults.filter(song => 
    song.title.toLowerCase().includes(query.toLowerCase()) || 
    song.artist.toLowerCase().includes(query.toLowerCase())
  );
};

/**
 * Get the currently playing song for a playlist
 * @param {string} partyId - The ID of the party
 * @param {string} playlistId - The ID of the playlist
 * @returns {Promise<Object|null>} - The currently playing song or null
 */
export const getCurrentSong = async (partyId, playlistId) => {
  try {
    const playlistRef = db.collection('parties').doc(partyId)
      .collection('playlists').doc(playlistId);
    
    const playlistDoc = await playlistRef.get();
    
    if (!playlistDoc.exists || !playlistDoc.data().currentSong) {
      return null;
    }
    
    const currentSongId = playlistDoc.data().currentSong;
    const songDoc = await playlistRef.collection('songs').doc(currentSongId).get();
    
    if (!songDoc.exists) {
      return null;
    }
    
    return {
      id: songDoc.id,
      ...songDoc.data()
    };
  } catch (error) {
    console.error('Error getting current song:', error);
    throw error;
  }
}; 