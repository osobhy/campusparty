import React, { createContext, useState, useContext } from 'react';
import NotificationBanner from '../components/NotificationBanner';

const NotificationContext = createContext();

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [notification, setNotification] = useState({
    visible: false,
    message: '',
    type: 'info',
    duration: 3000,
  });

  // Show a notification
  const showNotification = ({ message, type = 'info', duration = 3000 }) => {
    setNotification({
      visible: true,
      message,
      type,
      duration,
    });
  };

  // Hide the notification
  const hideNotification = () => {
    setNotification(prev => ({
      ...prev,
      visible: false,
    }));
  };

  // Convenience methods for different notification types
  const showSuccess = (message, duration) => {
    showNotification({ message, type: 'success', duration });
  };

  const showError = (message, duration) => {
    showNotification({ message, type: 'error', duration });
  };

  const showWarning = (message, duration) => {
    showNotification({ message, type: 'warning', duration });
  };

  const showInfo = (message, duration) => {
    showNotification({ message, type: 'info', duration });
  };

  return (
    <NotificationContext.Provider
      value={{
        showNotification,
        hideNotification,
        showSuccess,
        showError,
        showWarning,
        showInfo,
      }}
    >
      {children}
      <NotificationBanner
        visible={notification.visible}
        message={notification.message}
        type={notification.type}
        duration={notification.duration}
        onDismiss={hideNotification}
      />
    </NotificationContext.Provider>
  );
}; 