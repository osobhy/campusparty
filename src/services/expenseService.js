import { db } from '../config/firebase';
import { collection, addDoc, getDocs, doc, updateDoc, arrayUnion, query, where, orderBy } from 'firebase/firestore';

/**
 * Create a new expense pool for a party
 * @param {string} partyId - The ID of the party
 * @param {string} creatorId - The ID of the user creating the expense pool
 * @param {Object} poolInfo - Information about the expense pool
 * @returns {Promise<string>} - The ID of the created expense pool
 */
export const createExpensePool = async (partyId, creatorId, poolInfo) => {
  try {
    const poolRef = collection(db, 'parties', partyId, 'expensePools');
    const docRef = await addDoc(poolRef, {
      name: poolInfo.name,
      description: poolInfo.description || '',
      totalAmount: poolInfo.totalAmount || 0,
      creatorId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
      isSettled: false,
      participants: [creatorId],
      venmoUsername: poolInfo.venmoUsername || null
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating expense pool:', error);
    throw error;
  }
};

/**
 * Get all expense pools for a party
 * @param {string} partyId - The ID of the party
 * @returns {Promise<Array>} - Array of expense pools
 */
export const getPartyExpensePools = async (partyId) => {
  try {
    const poolsRef = collection(db, 'parties', partyId, 'expensePools');
    const q = query(poolsRef, where('isActive', '==', true), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting expense pools:', error);
    throw error;
  }
};

/**
 * Add a new expense to a party
 * @param {string} partyId - The ID of the party
 * @param {Object} expenseData - The expense data
 * @returns {Promise<string>} - The ID of the created expense
 */
export const addExpense = async (partyId, expenseData) => {
  try {
    const expensesRef = collection(db, 'parties', partyId, 'expenses');
    const docRef = await addDoc(expensesRef, {
      ...expenseData,
      settledBy: [],
      createdAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding expense:', error);
    throw error;
  }
};

/**
 * Get all expenses for a party
 * @param {string} partyId - The ID of the party
 * @returns {Promise<Array>} - Array of expense objects
 */
export const getPartyExpenses = async (partyId) => {
  try {
    const expensesRef = collection(db, 'parties', partyId, 'expenses');
    const q = query(expensesRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting party expenses:', error);
    throw error;
  }
};

/**
 * Get expenses that a user needs to settle
 * @param {string} userId - The ID of the user
 * @returns {Promise<Array>} - Array of expense objects
 */
export const getUserExpensesToSettle = async (userId) => {
  try {
    // This is a complex query that would require a custom index in Firestore
    // For simplicity, we'll get all expenses and filter client-side
    // In a production app, you would create appropriate indexes and queries
    
    const partiesRef = collection(db, 'parties');
    const partiesSnapshot = await getDocs(partiesRef);
    
    const expenses = [];
    
    for (const partyDoc of partiesSnapshot.docs) {
      const partyId = partyDoc.id;
      const expensesRef = collection(db, 'parties', partyId, 'expenses');
      const expensesSnapshot = await getDocs(expensesRef);
      
      for (const expenseDoc of expensesSnapshot.docs) {
        const expense = {
          id: expenseDoc.id,
          partyId,
          partyName: partyDoc.data().name,
          ...expenseDoc.data()
        };
        
        // Check if this expense involves the user and they haven't settled yet
        if (expense.splitWith?.includes(userId) && 
            expense.paidBy !== userId && 
            !expense.settledBy?.includes(userId)) {
          expenses.push(expense);
        }
      }
    }
    
    return expenses;
  } catch (error) {
    console.error('Error getting user expenses to settle:', error);
    throw error;
  }
};

/**
 * Mark an expense as settled by a user
 * @param {string} partyId - The ID of the party
 * @param {string} expenseId - The ID of the expense
 * @param {string} userId - The ID of the user settling the expense
 * @returns {Promise<void>}
 */
export const settleExpense = async (partyId, expenseId, userId) => {
  try {
    const expenseRef = doc(db, 'parties', partyId, 'expenses', expenseId);
    await updateDoc(expenseRef, {
      settledBy: arrayUnion(userId)
    });
  } catch (error) {
    console.error('Error settling expense:', error);
    throw error;
  }
};

/**
 * Get expenses that a user has paid for
 * @param {string} userId - The ID of the user
 * @returns {Promise<Array>} - Array of expense objects
 */
export const getUserPaidExpenses = async (userId) => {
  try {
    // Similar to getUserExpensesToSettle, this would be more efficient with proper indexes
    const partiesRef = collection(db, 'parties');
    const partiesSnapshot = await getDocs(partiesRef);
    
    const expenses = [];
    
    for (const partyDoc of partiesSnapshot.docs) {
      const partyId = partyDoc.id;
      const expensesRef = collection(db, 'parties', partyId, 'expenses');
      const q = query(expensesRef, where('paidBy', '==', userId));
      const expensesSnapshot = await getDocs(q);
      
      for (const expenseDoc of expensesSnapshot.docs) {
        expenses.push({
          id: expenseDoc.id,
          partyId,
          partyName: partyDoc.data().name,
          ...expenseDoc.data()
        });
      }
    }
    
    return expenses;
  } catch (error) {
    console.error('Error getting user paid expenses:', error);
    throw error;
  }
};

/**
 * Join an expense pool
 * @param {string} partyId - The ID of the party
 * @param {string} poolId - The ID of the expense pool
 * @param {string} userId - The ID of the user joining the pool
 * @returns {Promise<void>}
 */
export const joinExpensePool = async (partyId, poolId, userId) => {
  try {
    const poolRef = collection(db, 'parties', partyId, 'expensePools', poolId, 'participants');
    await updateDoc(poolRef, {
      participants: arrayUnion(userId)
    });
  } catch (error) {
    console.error('Error joining expense pool:', error);
    throw error;
  }
};

/**
 * Leave an expense pool
 * @param {string} partyId - The ID of the party
 * @param {string} poolId - The ID of the expense pool
 * @param {string} userId - The ID of the user leaving the pool
 * @returns {Promise<void>}
 */
export const leaveExpensePool = async (partyId, poolId, userId) => {
  try {
    const poolRef = collection(db, 'parties', partyId, 'expensePools', poolId, 'participants');
    await updateDoc(poolRef, {
      participants: arrayRemove(userId)
    });
  } catch (error) {
    console.error('Error leaving expense pool:', error);
    throw error;
  }
};

/**
 * Calculate how much each participant owes
 * @param {string} partyId - The ID of the party
 * @param {string} poolId - The ID of the expense pool
 * @returns {Promise<Array>} - Array of participant balances
 */
export const calculateBalances = async (partyId, poolId) => {
  try {
    // Get the pool
    const poolRef = collection(db, 'parties', partyId, 'expensePools', poolId);
    const poolDoc = await getDoc(poolRef);
    
    if (!poolDoc.exists) {
      throw new Error('Expense pool not found');
    }
    
    const pool = poolDoc.data();
    
    // Get all expenses
    const expenses = await getPartyExpenses(partyId);
    
    // Calculate how much each person has paid
    const payments = {};
    pool.participants.forEach(userId => {
      payments[userId] = 0;
    });
    
    expenses.forEach(expense => {
      if (payments[expense.paidBy] !== undefined) {
        payments[expense.paidBy] += expense.amount;
      }
    });
    
    // Calculate the fair share per person
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const fairShare = totalExpenses / pool.participants.length;
    
    // Calculate balances
    const balances = [];
    
    for (const userId of pool.participants) {
      const paid = payments[userId] || 0;
      const balance = paid - fairShare;
      
      balances.push({
        userId,
        paid,
        owes: balance < 0 ? Math.abs(balance) : 0,
        owed: balance > 0 ? balance : 0,
        netBalance: balance
      });
    }
    
    return balances;
  } catch (error) {
    console.error('Error calculating balances:', error);
    throw error;
  }
};

/**
 * Settle an expense pool
 * @param {string} partyId - The ID of the party
 * @param {string} poolId - The ID of the expense pool
 * @returns {Promise<void>}
 */
export const settleExpensePool = async (partyId, poolId) => {
  try {
    const poolRef = collection(db, 'parties', partyId, 'expensePools', poolId);
    await updateDoc(poolRef, {
      isSettled: true,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error settling expense pool:', error);
    throw error;
  }
};

/**
 * Get user profile with Venmo information
 * @param {string} userId - The ID of the user
 * @returns {Promise<Object|null>} - User profile or null if not found
 */
export const getUserVenmoProfile = async (userId) => {
  try {
    const userDoc = doc(db, 'users', userId);
    const userData = await getDoc(userDoc);
    
    if (!userData.exists) {
      return null;
    }
    
    return {
      id: userData.id,
      displayName: userData.data().displayName || 'Anonymous',
      venmoUsername: userData.data().venmoUsername || null
    };
  } catch (error) {
    console.error('Error getting user Venmo profile:', error);
    throw error;
  }
};

/**
 * Update user's Venmo username
 * @param {string} userId - The ID of the user
 * @param {string} venmoUsername - The Venmo username
 * @returns {Promise<void>}
 */
export const updateVenmoUsername = async (userId, venmoUsername) => {
  try {
    await updateDoc(doc(db, 'users', userId), {
      venmoUsername,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating Venmo username:', error);
    throw error;
  }
}; 