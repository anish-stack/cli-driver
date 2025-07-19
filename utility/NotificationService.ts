import messaging from '@react-native-firebase/messaging';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FCM_TOKEN_KEY = 'fcm_token';

export const requestUserPermission = async () => {
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (enabled) {
    console.log('✅ Notification permission enabled');
    await getFCMToken();
  } else {
    console.log('❌ Notification permission denied');
  }
};

export const getFCMToken = async () => {
  try {
    const storedToken = await AsyncStorage.getItem(FCM_TOKEN_KEY);

    if (storedToken) {
      console.log('📦 Using stored FCM Token:', storedToken);
      return storedToken;
    }

    const newToken = await messaging().getToken();
    if (newToken) {
      console.log('✅ New FCM Token:', newToken);
      await AsyncStorage.setItem(FCM_TOKEN_KEY, newToken);
      // TODO: 🔐 Send token to your backend if needed
      return newToken;
    } else {
      console.log('❌ Failed to get FCM token');
    }
  } catch (error) {
    console.log('❌ Error getting/saving FCM token:', error);
  }
};

export const setupFCMListeners = () => {

  messaging().onMessage(async remoteMessage => {
    console.log('📬 Foreground Notification:', remoteMessage);
    Alert.alert(
      remoteMessage.notification?.title || 'New Message',
      remoteMessage.notification?.body || ''
    );
  });

  // App opened from background by tapping notification
  messaging().onNotificationOpenedApp(remoteMessage => {
    console.log('📲 App opened from background tap:', remoteMessage);
    
  });

  // App opened from quit state
  messaging()
    .getInitialNotification()
    .then(remoteMessage => {
      if (remoteMessage) {
        console.log('📲 App opened from quit state tap:', remoteMessage);
      
      }
    });

  // Token refresh
  messaging().onTokenRefresh(async newToken => {
    console.log('🔄 FCM Token refreshed:', newToken);
    await AsyncStorage.setItem(FCM_TOKEN_KEY, newToken);
  
  });
};
