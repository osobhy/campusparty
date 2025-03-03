import { db } from '../firebase/config';
import { collection, addDoc, getDocs, query, where, orderBy, doc, getDoc, updateDoc, arrayUnion, deleteDoc } from 'firebase/firestore';

/**
 * Get available games for a university
 * @param {string} university - The university name
 * @returns {Promise<Array>} - Array of game objects
 */
export const getUniversityGames = async (university) => {
  try {
    const gamesRef = collection(db, 'games');
    const q = query(
      gamesRef, 
      where('universities', 'array-contains', university),
      orderBy('popularity', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting university games:', error);
    throw error;
  }
};

/**
 * Get popular games across all universities
 * @returns {Promise<Array>} - Array of game objects
 */
export const getPopularGames = async () => {
  try {
    const gamesRef = collection(db, 'games');
    const q = query(gamesRef, orderBy('popularity', 'desc'), where('isPublic', '==', true));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting popular games:', error);
    throw error;
  }
};

/**
 * Get a specific game by ID
 * @param {string} gameId - The ID of the game
 * @returns {Promise<Object>} - Game object
 */
export const getGameById = async (gameId) => {
  try {
    const gameDoc = await getDoc(doc(db, 'games', gameId));
    
    if (!gameDoc.exists()) {
      return null;
    }
    
    return {
      id: gameDoc.id,
      ...gameDoc.data()
    };
  } catch (error) {
    console.error('Error getting game by ID:', error);
    throw error;
  }
};

/**
 * Add a game to a party
 * @param {string} partyId - The ID of the party
 * @param {string} gameId - The ID of the game
 * @returns {Promise<string>} - The ID of the party game
 */
export const addGameToParty = async (partyId, gameId) => {
  try {
    // Get the game details
    const game = await getGameById(gameId);
    
    if (!game) {
      throw new Error('Game not found');
    }
    
    // Add the game to the party
    const partyGamesRef = collection(db, 'parties', partyId, 'games');
    const docRef = await addDoc(partyGamesRef, {
      gameId,
      gameName: game.name,
      gameDescription: game.description,
      gameRules: game.rules,
      gameCategory: game.category,
      addedAt: new Date().toISOString(),
      isActive: true,
      participants: []
    });
    
    // Increment the game's popularity
    const gameRef = doc(db, 'games', gameId);
    await updateDoc(gameRef, {
      popularity: game.popularity + 1
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error adding game to party:', error);
    throw error;
  }
};

/**
 * Get games for a party
 * @param {string} partyId - The ID of the party
 * @returns {Promise<Array>} - Array of party game objects
 */
export const getPartyGames = async (partyId) => {
  try {
    const partyGamesRef = collection(db, 'parties', partyId, 'games');
    const q = query(partyGamesRef, where('isActive', '==', true), orderBy('addedAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting party games:', error);
    throw error;
  }
};

/**
 * Join a party game
 * @param {string} partyId - The ID of the party
 * @param {string} gameId - The ID of the party game
 * @param {string} userId - The ID of the user
 * @param {string} userName - The name of the user
 * @returns {Promise<void>}
 */
export const joinPartyGame = async (partyId, gameId, userId, userName) => {
  try {
    const gameRef = doc(db, 'parties', partyId, 'games', gameId);
    await updateDoc(gameRef, {
      participants: arrayUnion({
        id: userId,
        name: userName,
        joinedAt: new Date().toISOString()
      })
    });
  } catch (error) {
    console.error('Error joining party game:', error);
    throw error;
  }
};

/**
 * Remove a game from a party
 * @param {string} partyId - The ID of the party
 * @param {string} gameId - The ID of the party game
 * @returns {Promise<void>}
 */
export const removePartyGame = async (partyId, gameId) => {
  try {
    const gameRef = doc(db, 'parties', partyId, 'games', gameId);
    await updateDoc(gameRef, {
      isActive: false
    });
  } catch (error) {
    console.error('Error removing party game:', error);
    throw error;
  }
};

/**
 * Create a custom game
 * @param {Object} gameData - The game data
 * @param {string} creatorId - The ID of the creator
 * @returns {Promise<string>} - The ID of the created game
 */
export const createCustomGame = async (gameData, creatorId) => {
  try {
    const gamesRef = collection(db, 'games');
    const docRef = await addDoc(gamesRef, {
      ...gameData,
      creatorId,
      createdAt: new Date().toISOString(),
      popularity: 0,
      isPublic: gameData.isPublic || false
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating custom game:', error);
    throw error;
  }
};

/**
 * Get games created by a user
 * @param {string} userId - The ID of the user
 * @returns {Promise<Array>} - Array of game objects
 */
export const getUserCreatedGames = async (userId) => {
  try {
    const gamesRef = collection(db, 'games');
    const q = query(gamesRef, where('creatorId', '==', userId), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting user created games:', error);
    throw error;
  }
}; 