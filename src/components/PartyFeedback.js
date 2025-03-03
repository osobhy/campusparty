import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, Alert, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { submitFeedback, getPartyFeedback, hasUserSubmittedFeedback, getFeedbackStats } from '../services/feedbackService';
import { useTheme } from '@react-navigation/native';

const PartyFeedback = ({ partyId, isHost, isPartyOver = false }) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [feedback, setFeedback] = useState([]);
  const [userFeedback, setUserFeedback] = useState({
    rating: 0,
    comment: '',
    isAnonymous: true
  });
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  useEffect(() => {
    loadFeedback();
  }, [partyId]);

  const loadFeedback = async () => {
    try {
      setLoading(true);
      
      // Check if user has already submitted feedback
      if (user) {
        const submitted = await hasUserSubmittedFeedback(partyId, user.uid);
        setHasSubmitted(submitted);
      }
      
      // Get feedback stats
      const feedbackStats = await getFeedbackStats(partyId);
      setStats(feedbackStats);
      
      // Get all feedback
      const feedbackData = await getPartyFeedback(partyId);
      setFeedback(feedbackData);
    } catch (error) {
      console.error('Error loading feedback:', error);
      Alert.alert('Error', 'Failed to load feedback');
    } finally {
      setLoading(false);
    }
  };

  const handleRatingPress = (rating) => {
    setUserFeedback(prev => ({ ...prev, rating }));
  };

  const toggleAnonymous = () => {
    setUserFeedback(prev => ({ ...prev, isAnonymous: !prev.isAnonymous }));
  };

  const handleSubmitFeedback = async () => {
    if (userFeedback.rating === 0) {
      Alert.alert('Error', 'Please select a rating');
      return;
    }

    try {
      await submitFeedback(partyId, {
        rating: userFeedback.rating,
        comment: userFeedback.comment.trim(),
        isAnonymous: userFeedback.isAnonymous,
        userId: user.uid,
        userName: userFeedback.isAnonymous ? 'Anonymous' : user.displayName
      });
      
      setHasSubmitted(true);
      setShowFeedbackModal(false);
      Alert.alert('Success', 'Your feedback has been submitted');
      
      // Reset form
      setUserFeedback({
        rating: 0,
        comment: '',
        isAnonymous: true
      });
      
      // Reload feedback
      loadFeedback();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      Alert.alert('Error', 'Failed to submit feedback');
    }
  };

  const renderFeedbackItem = ({ item }) => (
    <View style={[styles.feedbackItem, { backgroundColor: colors.card }]}>
      <View style={styles.feedbackHeader}>
        <Text style={[styles.feedbackAuthor, { color: colors.text }]}>
          {item.userName || 'Anonymous'}
        </Text>
        <View style={styles.ratingContainer}>
          {[1, 2, 3, 4, 5].map(star => (
            <Ionicons
              key={star}
              name="star"
              size={16}
              color={star <= item.rating ? colors.primary : colors.border}
            />
          ))}
        </View>
      </View>
      
      {item.comment && (
        <Text style={[styles.feedbackComment, { color: colors.text }]}>
          {item.comment}
        </Text>
      )}
      
      <Text style={[styles.feedbackDate, { color: colors.subtext }]}>
        {new Date(item.timestamp).toLocaleDateString()}
      </Text>
    </View>
  );

  const renderRatingStats = () => {
    if (!stats) return null;
    
    return (
      <View style={[styles.statsContainer, { backgroundColor: colors.card }]}>
        <View style={styles.averageRatingContainer}>
          <Text style={[styles.averageRating, { color: colors.text }]}>
            {stats.averageRating.toFixed(1)}
          </Text>
          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map(star => (
              <Ionicons
                key={star}
                name="star"
                size={20}
                color={star <= Math.round(stats.averageRating) ? colors.primary : colors.border}
              />
            ))}
          </View>
          <Text style={[styles.totalRatings, { color: colors.subtext }]}>
            {stats.totalFeedback} {stats.totalFeedback === 1 ? 'rating' : 'ratings'}
          </Text>
        </View>
        
        <View style={styles.distributionContainer}>
          {Object.entries(stats.ratingDistribution).reverse().map(([rating, count]) => (
            <View key={rating} style={styles.distributionRow}>
              <Text style={[styles.distributionLabel, { color: colors.text }]}>{rating} ★</Text>
              <View style={styles.distributionBarContainer}>
                <View 
                  style={[
                    styles.distributionBar, 
                    { 
                      backgroundColor: colors.primary,
                      width: `${stats.totalFeedback > 0 ? (count / stats.totalFeedback) * 100 : 0}%` 
                    }
                  ]}
                />
              </View>
              <Text style={[styles.distributionCount, { color: colors.subtext }]}>{count}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderFeedbackModal = () => (
    <Modal
      visible={showFeedbackModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowFeedbackModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => setShowFeedbackModal(false)}
          >
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          
          <Text style={[styles.modalTitle, { color: colors.text }]}>Rate This Party</Text>
          
          <View style={styles.ratingSelector}>
            {[1, 2, 3, 4, 5].map(rating => (
              <TouchableOpacity
                key={rating}
                style={styles.ratingButton}
                onPress={() => handleRatingPress(rating)}
              >
                <Ionicons
                  name={rating <= userFeedback.rating ? "star" : "star-outline"}
                  size={32}
                  color={rating <= userFeedback.rating ? colors.primary : colors.text}
                />
              </TouchableOpacity>
            ))}
          </View>
          
          <TextInput
            style={[styles.commentInput, { 
              backgroundColor: colors.card,
              color: colors.text,
              borderColor: colors.border
            }]}
            placeholder="Share your thoughts about this party..."
            placeholderTextColor={colors.subtext}
            multiline={true}
            numberOfLines={4}
            value={userFeedback.comment}
            onChangeText={(text) => setUserFeedback(prev => ({ ...prev, comment: text }))}
          />
          
          <TouchableOpacity 
            style={styles.anonymousToggle}
            onPress={toggleAnonymous}
          >
            <Ionicons
              name={userFeedback.isAnonymous ? "checkbox-outline" : "square-outline"}
              size={24}
              color={colors.primary}
            />
            <Text style={[styles.anonymousText, { color: colors.text }]}>
              Submit anonymously
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.submitButton, { backgroundColor: colors.primary }]}
            onPress={handleSubmitFeedback}
          >
            <Text style={styles.submitButtonText}>Submit Feedback</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Party Ratings & Feedback</Text>
        
        {!isHost && !hasSubmitted && isPartyOver && (
          <TouchableOpacity 
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={() => setShowFeedbackModal(true)}
          >
            <Ionicons name="star" size={16} color="#fff" />
            <Text style={styles.addButtonText}>Rate Party</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {renderRatingStats()}
      
      {feedback.length > 0 ? (
        <FlatList
          data={feedback}
          renderItem={renderFeedbackItem}
          keyExtractor={(item) => item.id}
          style={styles.feedbackList}
        />
      ) : (
        <Text style={[styles.noFeedback, { color: colors.subtext }]}>
          No feedback yet
        </Text>
      )}
      
      {renderFeedbackModal()}
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
  statsContainer: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  averageRatingContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  averageRating: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  starsContainer: {
    flexDirection: 'row',
    marginVertical: 8,
  },
  totalRatings: {
    fontSize: 14,
  },
  distributionContainer: {
    marginTop: 8,
  },
  distributionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  distributionLabel: {
    width: 30,
    fontSize: 14,
  },
  distributionBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  distributionBar: {
    height: '100%',
    borderRadius: 4,
  },
  distributionCount: {
    width: 30,
    fontSize: 14,
    textAlign: 'right',
  },
  feedbackList: {
    maxHeight: 300,
  },
  feedbackItem: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  feedbackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  feedbackAuthor: {
    fontWeight: 'bold',
  },
  ratingContainer: {
    flexDirection: 'row',
  },
  feedbackComment: {
    marginBottom: 8,
    lineHeight: 20,
  },
  feedbackDate: {
    fontSize: 12,
    textAlign: 'right',
  },
  noFeedback: {
    textAlign: 'center',
    padding: 16,
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  closeButton: {
    alignSelf: 'flex-end',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  ratingSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  ratingButton: {
    padding: 8,
  },
  commentInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  anonymousToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  anonymousText: {
    marginLeft: 8,
  },
  submitButton: {
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default PartyFeedback; 