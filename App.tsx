import React, { useEffect, useState } from 'react';
import { AppState, ActivityIndicator, View } from 'react-native';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { initializePersistedState, store } from './Store/store';
import Login from './src/screens/Login/Login';
import Splash from './src/screens/Spalsh/Splash'; 

import { requestUserPermission, getFCMToken } from './utility/NotificationService';
import messaging from '@react-native-firebase/messaging';
import AppErrorBoundary from './AppErrorBoundary';
import Home from './src/pages/Home';

const Stack = createNativeStackNavigator();

export default function App() {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, []);

  const handleAppStateChange = (nextAppState:any) => {
    if (nextAppState === 'background') {
      console.log('App is in background...');
    
    }
  };

  useEffect(() => {
    requestUserPermission();
    getFCMToken();

    const unsubscribe = messaging().onMessage(async remoteMessage => {
      console.log('Received in foreground:', remoteMessage);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    const initialize = async () => {
      try {
        await initializePersistedState();
        setIsInitialized(true);
      } catch (error) {
        console.log('Initialization error:', error);
        setIsInitialized(true); // Continue even if persistence fails
      }
    };

    initialize();
  }, []);

  if (!isInitialized) { 
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Provider store={store}>
      <NavigationContainer>
        <SafeAreaProvider>
          <AppErrorBoundary>
            <Stack.Navigator initialRouteName="splash">
              <Stack.Screen name="splash" options={{ headerShown: false }} component={Splash} />
              <Stack.Screen name="login" options={{ title: "Login To Driver Account" }} component={Login} />
              <Stack.Screen name="Home" options={{ headerShown: false }} component={Home} />
            </Stack.Navigator>
          </AppErrorBoundary>
        </SafeAreaProvider>
      </NavigationContainer>
    </Provider>
  );
}
