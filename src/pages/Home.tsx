import { View, Text } from 'react-native'
import React, { useEffect, useState } from 'react'
import OlyoxTabBar from '../components/common/UberTabBar'
import { useGetAllDetails } from '../hooks/RiderDetailsHooks'
import Map from '../components/map/Map';

export default function Home() {
  const { allUserData, getAllDetails: refecth } = useGetAllDetails();
  const [newLocation, setNewLocation] = useState({ latitude: 0, longitude: 0 });





  useEffect(() => {
    if (!allUserData) {
      refecth();
    } else {

      const newLocationDriver = { latitude: allUserData?.location[1], longitude: allUserData?.location[0] }
      setNewLocation({
        latitude: newLocationDriver.latitude,
        longitude: newLocationDriver.longitude,
      })

    }

  }, [allUserData, refecth]);


  return (
    <OlyoxTabBar
      isDriverMode={allUserData?.isAvailable}
      currentLocation={newLocation}
      activeRide={allUserData?.isOnRide ? allUserData?.currentRide : null}
    >
      <Map useDemo={false} rideStarted={allUserData?.isOnRide} rideStatus="pending" />

    </OlyoxTabBar>
  )
}
