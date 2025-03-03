import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text } from 'react-native';
import { useTheme } from '../context/ThemeContext';

// Screens
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import CreatePartyScreen from '../screens/CreatePartyScreen';
import SettingsScreen from '../screens/SettingsScreen';
import PartyDetailsScreen from '../screens/PartyDetailsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Custom tab icon component to avoid font issues
const TabIcon = ({ focused, color, name }) => {
  return (
    <View style={{ 
      width: 24, 
      height: 24, 
      backgroundColor: focused ? color : 'transparent',
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <View style={{ 
        width: focused ? 16 : 12, 
        height: focused ? 16 : 12, 
        backgroundColor: color,
        borderRadius: 8
      }} />
    </View>
  );
};

// Stack navigator for authentication and party creation
const HomeStack = () => {
  const { theme } = useTheme();
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.headerBackground,
        },
        headerTintColor: theme.headerText,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        contentStyle: {
          backgroundColor: theme.background,
        },
      }}
    >
      <Stack.Screen 
        name="HomeScreen" 
        component={HomeScreen} 
        options={{ title: 'Campus Party 🎉' }}
      />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen 
        name="CreateParty" 
        component={CreatePartyScreen} 
        options={{ title: 'Create Party' }}
      />
      <Stack.Screen 
        name="PartyDetails" 
        component={PartyDetailsScreen} 
        options={{ title: 'Party Details' }}
      />
    </Stack.Navigator>
  );
};

// Profile stack navigator
const ProfileStack = () => {
  const { theme } = useTheme();
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.headerBackground,
        },
        headerTintColor: theme.headerText,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        contentStyle: {
          backgroundColor: theme.background,
        },
      }}
    >
      <Stack.Screen 
        name="ProfileScreen" 
        component={ProfileScreen} 
        options={{ title: 'My Profile' }}
      />
      <Stack.Screen 
        name="Settings" 
        component={SettingsScreen} 
        options={{ title: 'Settings' }}
      />
      <Stack.Screen 
        name="PartyDetails" 
        component={PartyDetailsScreen} 
        options={{ title: 'Party Details' }}
      />
    </Stack.Navigator>
  );
};

// Main tab navigator
const MainNavigator = () => {
  const { theme } = useTheme();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          return <TabIcon focused={focused} color={color} name={route.name} />;
        },
        tabBarActiveTintColor: theme.tabBarActive,
        tabBarInactiveTintColor: theme.tabBarInactive,
        tabBarStyle: {
          backgroundColor: theme.tabBarBackground,
          borderTopColor: theme.border,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeStack} 
        options={{
          tabBarLabel: ({ focused, color }) => (
            <Text style={{ color, fontSize: 12, marginBottom: 3 }}>Home</Text>
          )
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileStack} 
        options={{
          tabBarLabel: ({ focused, color }) => (
            <Text style={{ color, fontSize: 12, marginBottom: 3 }}>Profile</Text>
          )
        }}
      />
    </Tab.Navigator>
  );
};

export default MainNavigator; 