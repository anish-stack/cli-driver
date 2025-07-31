import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  PermissionsAndroid,
  Platform,
  NativeModules,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import firebase  from '@react-native-firebase/app'
const { LocationModule } = NativeModules;


export default function App() {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'App needs access to your location.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  };

  const fetchLocation = async () => {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      setError('Location permission denied');
      setLoading(false);
      return;
    }

    try {
      LocationModule.getCurrentLocation(
        (lat, lng) => {
          setLocation({ latitude: lat, longitude: lng });
          setLoading(false);
        },
        (err) => {
          setError(err);
          setLoading(false);
        }
      );
    } catch (e) {
      setError('Failed to get location: ' + e.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocation();
  }, []);

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#00aaa9" />
      ) : location ? (
        <>
          <Text style={styles.title}>Your Location:</Text>
          <Text style={styles.text}>Latitude: {location.latitude}</Text>
          <Text style={styles.text}>Longitude: {location.longitude}</Text>

          <MapView
            style={styles.map}
            initialRegion={{
              latitude: location.latitude,
              longitude: location.longitude,
              latitudeDelta: 0.005,
              longitudeDelta: 0.005,
            }}
          >
            <Marker
              coordinate={{
                latitude: location.latitude,
                longitude: location.longitude,
              }}
              title="You are here"
              pinColor="#00aaa9"
            />
          </MapView>
        </>
      ) : (
        <Text style={[styles.text, { color: 'red' }]}>{error || 'Location not available'}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  text: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 5,
  },
  map: {
    flex: 1,
    marginTop: 10,
    borderRadius: 10,
  },
});
