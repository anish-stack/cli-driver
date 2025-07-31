import axios, { isAxiosError } from "axios";
import { API_URL_APP } from "../constant/api";

interface Ride {
  _id: string;
  ride_status: string;
  [key: string]: any;
}

interface RideState {
  rides: Map<string, Ride>;
}

interface PoolingResponse {
  data: Ride[] | null;
}

interface StatusResponse {
  data: {
    _id: string;
    ride_status: string;
    [key: string]: any;
  };
}


export const NewRidePooling = async (riderId: string): Promise<Ride[] | null> => {
  try {
    const response = await axios.get<PoolingResponse>(
      `${API_URL_APP}new/pooling-rides-for-rider/${riderId}`
    );

    return response.data?.data ?? null;

  } catch (error) {
    if (isAxiosError(error)) {
      console.error("Error in NewRidePooling:", error.response?.data);
      throw new Error(error.response?.data || "Axios error");
    } else {
      console.error("Unexpected error:", error);
      throw new Error("Unexpected error occurred");
    }
  }
};


export const StatusOfRideComingRide = async (
  rideId: string,
  state: RideState
): Promise<
  | { action: "remove"; rideId: string }
  | { action: "update"; rideId: string; ride: Ride }
> => {
  try {
    const response = await axios.get<StatusResponse>(
      `${API_URL_APP}/new/status-driver/${rideId}`
    );

    const updatedRide = response.data.data;
    const rideStatus = updatedRide.ride_status;

    if (rideStatus === "driver_assigned" || rideStatus === "cancelled") {
      state.rides.delete(rideId);
      return { action: "remove", rideId };
    }

    state.rides.set(rideId, updatedRide);
    return { action: "update", rideId, ride: updatedRide };

  } catch (error) {
    if (isAxiosError(error)) {
      console.error("Error while checking ride status", error.response?.data);
      throw new Error(error.response?.data || "Axios error");
    } else {
      console.error("Unexpected error:", error);
      throw new Error("Unexpected error occurred");
    }
  }
};
