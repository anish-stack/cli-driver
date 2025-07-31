import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  AppState,
  ActivityIndicator,
  View,
  BackHandler,
  NativeModules,
  Alert,
} from 'react-native';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { initializePersistedState, store } from './Store/store';
import Login from './src/screens/Login/Login';
import Splash from './src/screens/Spalsh/Splash';
import Home from './src/pages/Home';
import Earnings from './src/screens/Earnings/Earnings';
import Profile from './src/screens/Profile/Profile';

import {
  requestUserPermission,
  getFCMToken,
} from './utility/NotificationService';
import messaging from '@react-native-firebase/messaging';
import AppErrorBoundary from './AppErrorBoundary';
import LocationService from './services/LocationServices';
import axios from 'axios';
import { API_URL_APP } from './constant/api';
import { getData } from './utility/storage';

const Stack = createNativeStackNavigator();
const { FloatingWidget } = NativeModules;
console.log("NativeModules", NativeModules.RideServiceBridge)
const apiClient = axios.create({
  baseURL: API_URL_APP,
  timeout: 10000,
});

export default function App() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [allUserData, setAllUserData] = useState(null);
  const appState = useRef(AppState.currentState);
  const isInitializing = useRef(false);

  // Memoized user data fetcher with error handling
  const fetchUserData = useCallback(async () => {
    try {
      const token = await getData('authToken');
      if (!token) return null;

      const response = await apiClient.get('rider/user-details', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response?.data?.partner) {
        console.log('Partner data fetched:', response.data.partner);
        setAllUserData(response.data.partner);
        return response.data.partner;
      }
      return null;
    } catch (error: any) {
      console.error('Error fetching user data:', error);

      if (error.response?.status === 401) {

        console.log('Token expired, user needs to re-authenticate');
      }
      return null;
    }
  }, []);

  // Optimized app state change handler
  const handleAppStateChange = useCallback(async (nextAppState: any) => {
    try {
      if (appState.current === 'active' && nextAppState === 'background') {
        const userData = await fetchUserData();

        if (userData?.isAvailable || userData?.on_ride_id) {
          FloatingWidget?.startWidget?.();
        }
      }

      if (nextAppState === 'active') {
        FloatingWidget?.stopWidget?.();

        await fetchUserData();
      }

      appState.current = nextAppState;
    } catch (error) {
      console.error('Error in app state change:', error);
    }
  }, [fetchUserData]);

  // Initialize location service with proper error handling
  const initializeLocationService = useCallback(async () => {
    try {
      await LocationService.initialize();
      console.log('Location service initialized successfully');
    } catch (error) {
      console.error('Location service initialization error:', error);
      Alert.alert(
        'Location Error',
        'Failed to initialize location services. Some features may not work properly.',
        [{ text: 'OK' }]
      );
    }
  }, []);

  // Initialize FCM with proper error handling
  const initializeFCM = useCallback(async () => {
    try {
      await requestUserPermission();
      await getFCMToken();

      const unsubscribe = messaging().onMessage(async (remoteMessage) => {
        console.log('Received FCM message in foreground:', remoteMessage);
        // Handle foreground notifications
      });

      return unsubscribe;
    } catch (error) {
      console.error('FCM initialization error:', error);
      return () => { }; // Return empty cleanup function
    }
  }, []);

  // Main initialization effect
  useEffect(() => {
    const initialize = async () => {
      if (isInitializing.current) return;
      isInitializing.current = true;

      try {
        // Initialize store first
        await initializePersistedState();

        // Initialize services in parallel
        await Promise.allSettled([
          initializeLocationService(),
          fetchUserData(),
        ]);

        setIsInitialized(true);
      } catch (error) {
        console.error('App initialization error:', error);
        setIsInitialized(true); // Continue even if some initialization fails
      } finally {
        isInitializing.current = false;
      }
    };

    initialize();
  }, [initializeLocationService, fetchUserData]);

  // App state and back handler effect
  useEffect(() => {
    const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      // Allow back navigation in specific screens, block in others
      return false; // Customize this logic based on your needs
    });

    return () => {
      appStateSubscription?.remove();
      backHandler?.remove();
    };
  }, [handleAppStateChange]);

  // FCM effect
  useEffect(() => {
    let unsubscribeFCM: (() => void) | undefined;

    const setupFCM = async () => {
      unsubscribeFCM = await initializeFCM();
    };

    setupFCM();

    return () => {
      if (unsubscribeFCM) {
        unsubscribeFCM();
      }
    };
  }, [initializeFCM]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      LocationService.cleanup();
      FloatingWidget?.stopWidget?.();
    };
  }, []);

  // Loading state
  if (!isInitialized) {
    return (
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#ffffff'
      }}>
        <ActivityIndicator size="large" color="#0066cc" />
      </View>
    );
  }

  return (
    <Provider store={store}>
      <NavigationContainer>
        <SafeAreaProvider>
          <AppErrorBoundary>
            <Stack.Navigator
              initialRouteName="splash"
              screenOptions={{
                headerBackTitleVisible: false,
                gestureEnabled: true,
              }}
            >
              <Stack.Screen
                name="splash"
                options={{ headerShown: false }}
                component={Splash}
              />
              <Stack.Screen
                name="login"
                options={{ title: 'Login To Driver Account' }}
                component={Login}
              />
              <Stack.Screen
                name="Home"
                options={{ headerShown: false }}
                component={Home}
              />
              <Stack.Screen
                name="Earnings"
                options={{ headerShown: false }}
                component={Earnings}
              />
              <Stack.Screen
                name="Profile"
                options={{ headerShown: false }}
                component={Profile}
              />
            </Stack.Navigator>
          </AppErrorBoundary>
        </SafeAreaProvider>
      </NavigationContainer>
    </Provider>
  );
}