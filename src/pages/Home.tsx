import React, { useEffect, useState, useCallback, useRef } from 'react';
import { AppState, AppStateStatus, NativeModules } from 'react-native';
import OlyoxTabBar from '../components/common/UberTabBar';
import Map from '../components/map/Map';
import { NewRidePooling } from '../../services/RidePolling';
import { IRide } from '../../utility/types';
import { useFetchUserDetails } from '../hooks/RiderDetailsHooks';
import { useSelector } from 'react-redux';
import { RootState } from '../../Store/store';
const { RideServiceBridge } = NativeModules
export default function Home() {
  const { allUserData } = useSelector((state: RootState) => ({
    allUserData: state.user.allUserData,
    loading: state.user.loading.allDetails,
    error: state.user.error.allDetails,
  }));

  const { userData, refetch: fetchDetails } = useFetchUserDetails();
  const [newLocation, setNewLocation] = useState({ latitude: 0, longitude: 0 });
  const [availableRides, setAvailableRides] = useState<IRide[]>([]);
  const appState = useRef(AppState.currentState);
  console.log(userData)
  const fetchPoolingRides = useCallback(async () => {
    if (!userData?._id) return;

    try {
      if (
        allUserData?.isAvailable &&
        !allUserData?.on_ride_id &&
        allUserData?.currentRide === null
      ) {
        RideServiceBridge.startRideService(userData._id)
        const rides = await NewRidePooling(userData._id);
        if (rides && rides.length > 0) {
          console.log('✅ Pooling rides found:', rides);
          setAvailableRides(rides);
        } else {
          console.log('❌ No pooling rides found.');
        }
      } else {
        console.log('⛔ Not eligible for pooling.', {
          isAvailable: allUserData?.isAvailable,
          on_ride_id: allUserData?.on_ride_id,
          currentRide: allUserData?.currentRide,
        });
        RideServiceBridge.stopRideService(userData._id)

      }
    } catch (error) {
      console.error('🔥 Error fetching pooling rides:', error);
    }
  }, [userData, allUserData]);

  // Set location and initial fetch
  useEffect(() => {
    if (!allUserData) {
      fetchDetails();
    } else {
      setNewLocation({
        latitude: allUserData.location[1],
        longitude: allUserData.location[0],
      });
      fetchPoolingRides();
    }
  }, [allUserData, fetchPoolingRides, fetchDetails]);

  // Poll every second
  useEffect(() => {
    const interval = setInterval(() => {
      fetchPoolingRides();
    }, 1000);

    return () => clearInterval(interval);
  }, [fetchPoolingRides]);

  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        console.log('🔁 App resumed, refetching user data...');
        await fetchDetails();
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [fetchDetails]);

  return (
    <OlyoxTabBar
      isDriverMode={allUserData?.isAvailable}
      currentLocation={newLocation}
      activeRide={allUserData?.on_ride_id ? allUserData?.currentRide : null}
    >
      <Map
        useDemo={false}
        rideStarted={!!allUserData?.on_ride_id}
        rideStatus="pending"
        availableRides={availableRides}
      />
    </OlyoxTabBar>
  );
}
