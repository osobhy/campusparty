import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { addExpense, getPartyExpenses, settleExpense } from '../services/expenseService';

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

const ExpenseSplitter = ({ partyId, partyHost }) => {
  const { currentUser } = useAuth();
  const themeContext = useTheme();
  
  // Ensure we always have a valid theme object with all required properties
  const theme = themeContext?.theme || defaultTheme;
  
  const [expenses, setExpenses] = useState([]);
  const [newExpense, setNewExpense] = useState({
    title: '',
    amount: '',
    paidBy: '',
    splitWith: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Initialize paidBy when currentUser is available
    if (currentUser?.uid) {
      setNewExpense(prev => ({
        ...prev,
        paidBy: currentUser.uid
      }));
    }
  }, [currentUser]);

  useEffect(() => {
    if (partyId) {
      loadExpenses();
    }
  }, [partyId]);

  const loadExpenses = async () => {
    if (!partyId) {
      setError('No party ID provided');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      const expenseData = await getPartyExpenses(partyId);
      setExpenses(expenseData);
    } catch (error) {
      console.error('Error loading expenses:', error);
      setError('Failed to load expenses');
      Alert.alert('Error', 'Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async () => {
    if (!currentUser?.uid) {
      Alert.alert('Error', 'You must be logged in to add expenses');
      return;
    }
    
    if (!newExpense.title || !newExpense.amount) {
      Alert.alert('Error', 'Please enter both a title and amount');
      return;
    }

    try {
      const amount = parseFloat(newExpense.amount);
      if (isNaN(amount) || amount <= 0) {
        Alert.alert('Error', 'Please enter a valid amount');
        return;
      }

      await addExpense(partyId, {
        ...newExpense,
        amount,
        timestamp: new Date().toISOString(),
        paidBy: currentUser.uid,
        paidByName: currentUser.displayName,
        settled: false
      });

      setNewExpense({
        title: '',
        amount: '',
        paidBy: currentUser.uid,
        splitWith: []
      });
      
      loadExpenses();
    } catch (error) {
      console.error('Error adding expense:', error);
      Alert.alert('Error', 'Failed to add expense');
    }
  };

  const handleSettleExpense = async (expenseId) => {
    if (!currentUser?.uid) {
      Alert.alert('Error', 'You must be logged in to settle expenses');
      return;
    }
    
    try {
      await settleExpense(partyId, expenseId, currentUser.uid);
      loadExpenses();
      Alert.alert('Success', 'Expense marked as settled');
    } catch (error) {
      console.error('Error settling expense:', error);
      Alert.alert('Error', 'Failed to settle expense');
    }
  };

  const renderExpenseItem = ({ item }) => {
    if (!currentUser?.uid) return null;
    
    const isOwedByCurrentUser = item.splitWith.includes(currentUser.uid) && item.paidBy !== currentUser.uid;
    const isPaidByCurrentUser = item.paidBy === currentUser.uid;
    const perPersonAmount = item.amount / (item.splitWith.length + 1);

    return (
      <View style={[styles.expenseItem, { backgroundColor: theme.card || '#ffffff', borderColor: theme.border || '#e5e7eb' }]}>
        <View style={styles.expenseHeader}>
          <Text style={[styles.expenseTitle, { color: theme.text || '#111827' }]}>{item.title}</Text>
          <Text style={[styles.expenseAmount, { color: theme.primary || '#6366f1' }]}>${item.amount.toFixed(2)}</Text>
        </View>
        
        <Text style={[styles.expenseDetails, { color: theme.subtext || '#6b7280' }]}>
          Paid by: {item.paidByName || 'Unknown'} • ${perPersonAmount.toFixed(2)} per person
        </Text>
        
        {isOwedByCurrentUser && !item.settledBy?.includes(currentUser.uid) && (
          <TouchableOpacity 
            style={[styles.settleButton, { backgroundColor: theme.success || '#10b981' }]}
            onPress={() => handleSettleExpense(item.id)}
          >
            <Ionicons name="cash-outline" size={16} color="#fff" />
            <Text style={styles.settleButtonText}>Settle Up</Text>
          </TouchableOpacity>
        )}

        {isPaidByCurrentUser && (
          <View style={[styles.settledList, { borderTopColor: theme.border || '#eee' }]}>
            <Text style={[styles.settledTitle, { color: theme.text || '#111827' }]}>Settled by:</Text>
            {item.settledBy && item.settledBy.length > 0 ? (
              item.settledBy.map((userId, index) => (
                <Text key={index} style={[styles.settledUser, { color: theme.subtext || '#6b7280' }]}>• {userId}</Text>
              ))
            ) : (
              <Text style={[styles.noSettled, { color: theme.subtext || '#6b7280' }]}>No one has settled yet</Text>
            )}
          </View>
        )}
      </View>
    );
  };

  if (!currentUser) {
    return (
      <View style={[styles.container, { backgroundColor: theme.card || '#ffffff' }]}>
        <Text style={[styles.title, { color: theme.text || '#111827' }]}>Split Party Expenses</Text>
        <Text style={[styles.noExpenses, { color: theme.subtext || '#6b7280' }]}>
          Please log in to use expense splitting features
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.card || '#ffffff' }]}>
      <Text style={[styles.title, { color: theme.text || '#111827' }]}>Split Party Expenses</Text>
      
      {/* Add new expense form */}
      <View style={styles.addExpenseForm}>
        <TextInput
          style={[styles.input, { 
            backgroundColor: theme.background || '#f8f9fa', 
            color: theme.text || '#111827',
            borderColor: theme.border || '#e5e7eb'
          }]}
          placeholder="Expense title (e.g., Pizza)"
          placeholderTextColor={theme.subtext || '#6b7280'}
          value={newExpense.title}
          onChangeText={(text) => setNewExpense({...newExpense, title: text})}
        />
        <TextInput
          style={[styles.input, { 
            backgroundColor: theme.background || '#f8f9fa', 
            color: theme.text || '#111827',
            borderColor: theme.border || '#e5e7eb'
          }]}
          placeholder="Amount ($)"
          placeholderTextColor={theme.subtext || '#6b7280'}
          value={newExpense.amount}
          onChangeText={(text) => setNewExpense({...newExpense, amount: text})}
          keyboardType="decimal-pad"
        />
        <TouchableOpacity 
          style={[styles.addButton, { backgroundColor: theme.success || '#10b981' }]}
          onPress={handleAddExpense}
        >
          <Ionicons name="add-circle-outline" size={18} color="#fff" />
          <Text style={styles.addButtonText}>Add Expense</Text>
        </TouchableOpacity>
      </View>

      {/* Expenses list */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary || '#6366f1'} />
          <Text style={[styles.loadingText, { color: theme.subtext || '#6b7280' }]}>Loading expenses...</Text>
        </View>
      ) : error ? (
        <Text style={[styles.errorText, { color: theme.error || '#ef4444' }]}>{error}</Text>
      ) : expenses.length > 0 ? (
        <FlatList
          data={expenses}
          renderItem={renderExpenseItem}
          keyExtractor={(item) => item.id}
          style={styles.expensesList}
        />
      ) : (
        <Text style={[styles.noExpenses, { color: theme.subtext || '#6b7280' }]}>No expenses added yet</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 10,
    padding: 15,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  addExpenseForm: {
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  addButton: {
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  expensesList: {
    maxHeight: 300,
  },
  expenseItem: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  expenseTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  expenseDetails: {
    fontSize: 14,
    marginBottom: 10,
  },
  settleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  settleButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  settledList: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  settledTitle: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  settledUser: {
    marginLeft: 10,
    marginBottom: 2,
  },
  noSettled: {
    marginLeft: 10,
    fontStyle: 'italic',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
  },
  errorText: {
    textAlign: 'center',
    padding: 10,
  },
  noExpenses: {
    textAlign: 'center',
    padding: 20,
  },
});

export default ExpenseSplitter; 