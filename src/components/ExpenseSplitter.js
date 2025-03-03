import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { addExpense, getPartyExpenses, settleExpense } from '../services/expenseService';

const ExpenseSplitter = ({ partyId, partyHost }) => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [newExpense, setNewExpense] = useState({
    title: '',
    amount: '',
    paidBy: user.uid,
    splitWith: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExpenses();
  }, [partyId]);

  const loadExpenses = async () => {
    try {
      setLoading(true);
      const expenseData = await getPartyExpenses(partyId);
      setExpenses(expenseData);
    } catch (error) {
      console.error('Error loading expenses:', error);
      Alert.alert('Error', 'Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async () => {
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
        paidBy: user.uid,
        paidByName: user.displayName,
        settled: false
      });

      setNewExpense({
        title: '',
        amount: '',
        paidBy: user.uid,
        splitWith: []
      });
      
      loadExpenses();
    } catch (error) {
      console.error('Error adding expense:', error);
      Alert.alert('Error', 'Failed to add expense');
    }
  };

  const handleSettleExpense = async (expenseId) => {
    try {
      await settleExpense(partyId, expenseId, user.uid);
      loadExpenses();
      Alert.alert('Success', 'Expense marked as settled');
    } catch (error) {
      console.error('Error settling expense:', error);
      Alert.alert('Error', 'Failed to settle expense');
    }
  };

  const renderExpenseItem = ({ item }) => {
    const isOwedByCurrentUser = item.splitWith.includes(user.uid) && item.paidBy !== user.uid;
    const isPaidByCurrentUser = item.paidBy === user.uid;
    const perPersonAmount = item.amount / (item.splitWith.length + 1);

    return (
      <View style={styles.expenseItem}>
        <View style={styles.expenseHeader}>
          <Text style={styles.expenseTitle}>{item.title}</Text>
          <Text style={styles.expenseAmount}>${item.amount.toFixed(2)}</Text>
        </View>
        
        <Text style={styles.expenseDetails}>
          Paid by: {item.paidByName || 'Unknown'} • ${perPersonAmount.toFixed(2)} per person
        </Text>
        
        {isOwedByCurrentUser && !item.settledBy?.includes(user.uid) && (
          <TouchableOpacity 
            style={styles.settleButton}
            onPress={() => handleSettleExpense(item.id)}
          >
            <Ionicons name="cash-outline" size={16} color="#fff" />
            <Text style={styles.settleButtonText}>Settle Up</Text>
          </TouchableOpacity>
        )}

        {isPaidByCurrentUser && (
          <View style={styles.settledList}>
            <Text style={styles.settledTitle}>Settled by:</Text>
            {item.settledBy && item.settledBy.length > 0 ? (
              item.settledBy.map((userId, index) => (
                <Text key={index} style={styles.settledUser}>• {userId}</Text>
              ))
            ) : (
              <Text style={styles.noSettled}>No one has settled yet</Text>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Split Party Expenses</Text>
      
      {/* Add new expense form */}
      <View style={styles.addExpenseForm}>
        <TextInput
          style={styles.input}
          placeholder="Expense title (e.g., Pizza)"
          value={newExpense.title}
          onChangeText={(text) => setNewExpense({...newExpense, title: text})}
        />
        <TextInput
          style={styles.input}
          placeholder="Amount ($)"
          value={newExpense.amount}
          onChangeText={(text) => setNewExpense({...newExpense, amount: text})}
          keyboardType="decimal-pad"
        />
        <TouchableOpacity 
          style={styles.addButton}
          onPress={handleAddExpense}
        >
          <Ionicons name="add-circle-outline" size={18} color="#fff" />
          <Text style={styles.addButtonText}>Add Expense</Text>
        </TouchableOpacity>
      </View>

      {/* Expenses list */}
      {loading ? (
        <Text style={styles.loadingText}>Loading expenses...</Text>
      ) : expenses.length > 0 ? (
        <FlatList
          data={expenses}
          renderItem={renderExpenseItem}
          keyExtractor={(item) => item.id}
          style={styles.expensesList}
        />
      ) : (
        <Text style={styles.noExpenses}>No expenses added yet</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
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
    color: '#333',
  },
  addExpenseForm: {
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    backgroundColor: '#f9f9f9',
  },
  addButton: {
    backgroundColor: '#4CAF50',
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
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  expenseTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  expenseDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  settleButton: {
    backgroundColor: '#2196F3',
    borderRadius: 6,
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  settleButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  settledList: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
  },
  settledTitle: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  settledUser: {
    color: '#666',
    marginLeft: 5,
  },
  noSettled: {
    color: '#999',
    fontStyle: 'italic',
    marginLeft: 5,
  },
  loadingText: {
    textAlign: 'center',
    color: '#666',
    padding: 20,
  },
  noExpenses: {
    textAlign: 'center',
    color: '#666',
    padding: 20,
    fontStyle: 'italic',
  },
});

export default ExpenseSplitter; 