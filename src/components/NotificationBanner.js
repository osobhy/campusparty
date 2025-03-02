import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const NotificationBanner = ({ 
  message, 
  type = 'info', // 'success', 'error', 'warning', 'info'
  onDismiss,
  duration = 3000, // Auto-dismiss after 3 seconds by default
  visible = false
}) => {
  const { theme } = useTheme();
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  
  // Get icon and color based on notification type
  const getTypeProperties = () => {
    switch (type) {
      case 'success':
        return { 
          icon: 'checkmark-circle', 
          color: theme.success,
          backgroundColor: theme.success + '20'
        };
      case 'error':
        return { 
          icon: 'alert-circle', 
          color: theme.error,
          backgroundColor: theme.error + '20'
        };
      case 'warning':
        return { 
          icon: 'warning', 
          color: theme.warning,
          backgroundColor: theme.warning + '20'
        };
      case 'info':
      default:
        return { 
          icon: 'information-circle', 
          color: theme.info,
          backgroundColor: theme.info + '20'
        };
    }
  };
  
  const { icon, color, backgroundColor } = getTypeProperties();
  
  // Show/hide animation
  useEffect(() => {
    if (visible) {
      // Show notification
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
      
      // Auto-dismiss after duration
      if (duration > 0) {
        const timer = setTimeout(() => {
          handleDismiss();
        }, duration);
        
        return () => clearTimeout(timer);
      }
    } else {
      // Hide notification
      handleDismiss();
    }
  }, [visible]);
  
  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onDismiss) onDismiss();
    });
  };
  
  return (
    <Animated.View 
      style={[
        styles.container, 
        { 
          backgroundColor,
          borderColor: color,
          transform: [{ translateY }],
          opacity,
        }
      ]}
    >
      <View style={styles.content}>
        <Ionicons name={icon} size={24} color={color} />
        <Text style={[styles.message, { color: theme.text }]}>{message}</Text>
      </View>
      
      <TouchableOpacity onPress={handleDismiss} style={styles.dismissButton}>
        <Ionicons name="close" size={20} color={color} />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: 16,
    margin: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  message: {
    marginLeft: 10,
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  dismissButton: {
    padding: 5,
  },
});

export default NotificationBanner; 