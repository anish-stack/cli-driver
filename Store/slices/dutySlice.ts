import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit"
import axios, { isAxiosError } from "axios"
import { API_URL_APP } from "../../constant/api"
import { saveData, removeItem, getData } from "../../utility/storage"

export interface CurrentRide {
  id: string
  isActive: boolean
  rideType: "pickup" | "dropoff" | "waiting" | "arrived"
  estimatedTime?: string
  passengerName?: string
  pickupLocation?: string
  dropoffLocation?: string
  startTime?: string
  fare?: number
}

export interface DutyState {
  loading: boolean
  isOnline: boolean
  isOnRide: boolean
  isAvailable: boolean
  earnings: number
  totalEarnings: number
  trips: number
  totalRides: number
  hours: string
  loggedInHours: string
  averageRating: number
  currentRide: CurrentRide | null
  error: string | null
  lastStatusChange: string | null
  lastUpdated: string | null
  currentDate: string | null
  isInitialized: boolean
}

interface ToggleDutyParams {
  token: string
  userData: any
}

interface RiderDataResponse {
  success: boolean
  driver: {
    on_ride_id: string | null
    isAvailable: boolean
    status: string
    // Add other driver properties as needed
  }
  currentRide: CurrentRide | null
  totalRides: number
  totalEarnings: number
  averageRating: number
  totalHours: string
  todayIST: string
  todayEarnings?: number
  todayTrips?: number
  todayHours?: string
}

// Fetch complete rider data
export const fetchRiderData = createAsyncThunk("duty/fetchRiderData", async (token: string, { rejectWithValue }) => {
  const savedToken = await getData("authToken");
  const authToken = token || savedToken;

  if (!authToken) {
    return rejectWithValue("No authentication token provided.");
  }


  try {
    const response = await axios.get("http://192.168.1.23:3200/api/v1/rider/getMyAllDetails", {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    })
   
    if (response.data) {
      const data: RiderDataResponse = response.data
      const timestamp = new Date().toISOString()

      const riderState = {
        isOnRide: !!data.on_ride_id,
        isAvailable: data.isAvailable,
        isOnline: data.isAvailable ? "online" : "offline",
        currentRide: data.currentRide || null,
        totalRides: data.totalRides || 0,
        totalEarnings: data.totalEarnings || 0,
        averageRating: data.averageRating || 0,
        loggedInHours: data.totalHours || "0h 0m",
        currentDate: data.todayIST || timestamp,
        // Today's specific data
        earnings: data.todayEarnings || 0,
        trips: data.todayTrips || 0,
        hours: data.todayHours || "0h 0m",
        lastUpdated: timestamp,
      }

      // Save critical data to storage
      await Promise.all([
        saveData("dutyStatus", riderState.isOnline),
        saveData("isOnRide", riderState.isOnRide),
        saveData("isAvailable", riderState.isAvailable),
        saveData("earnings", riderState.earnings),
        saveData("totalEarnings", riderState.totalEarnings),
        saveData("trips", riderState.trips),
        saveData("totalRides", riderState.totalRides),
        saveData("hours", riderState.hours),
        saveData("loggedInHours", riderState.loggedInHours),
        saveData("averageRating", riderState.averageRating),
        saveData("lastUpdated", timestamp),
      ])

      return riderState
    } else {
      return rejectWithValue(response.data.message || "Failed to fetch rider data")
    }
  } catch (error) {
    console.error("Error fetching rider data from:", error)
    if (isAxiosError(error)) {
      return rejectWithValue(error.response?.data?.message || error.message)
    }
    return rejectWithValue("Network error occurred while fetching rider data")
  }
})

// Toggle duty status action
export const toggleDutyStatus = createAsyncThunk(
  "duty/toggleStatus",
  async ({ token, userData }: ToggleDutyParams, { getState, rejectWithValue, dispatch }) => {
    try {
      const state = getState() as { duty: DutyState }
      const goingOnline = !state.duty.isOnline

      // Check recharge expiry
      if (userData?.RechargeData?.expireData) {
        const expireDate = new Date(userData.RechargeData.expireData)
        const currentDate = new Date()

        if (goingOnline && expireDate < currentDate) {
          return rejectWithValue("Recharge expired. Please recharge to go online.")
        }
      }

      const response = await axios.post(
        `${API_URL_APP}rider/toggleWorkStatusOfRider`,
        { status: goingOnline },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      )

      console.log("Toggle duty status response:", response.data)
      if (response.data.success) {
        const newStatus = response.data.cabRider?.status === "online"
        const timestamp = new Date().toISOString()

        // Save status to storage
        await Promise.all([saveData("dutyStatus", newStatus), saveData("lastStatusChange", timestamp)])

        // Fetch updated rider data after status change
        dispatch(fetchRiderData(token))

        return {
          isOnline: newStatus,
          lastStatusChange: timestamp,
          source: "toggle" as const,
        }
      } else {
        return rejectWithValue(response.data.message || "Failed to toggle status")
      }
    } catch (error) {
      console.error("Error toggling duty status:", error)
      if (isAxiosError(error)) {
        return rejectWithValue(error.response?.data?.message || error.message)
      }
      return rejectWithValue("Network error occurred")
    }
  },
)

// Update earnings action (now uses the main API)
export const updateEarnings = createAsyncThunk(
  "duty/updateEarnings",
  async (token: string, { dispatch, rejectWithValue }) => {
    try {
      // Use the main rider data fetch instead of separate earnings endpoint
      await dispatch(fetchRiderData(token)).unwrap()
      return { success: true }
    } catch (error) {
      return rejectWithValue("Failed to update earnings")
    }
  },
)

// Load persisted duty state
export const loadPersistedDutyState = async (): Promise<Partial<DutyState>> => {
  try {
    const [
      isOnline,
      isOnRide,
      isAvailable,
      earnings,
      totalEarnings,
      trips,
      totalRides,
      hours,
      loggedInHours,
      averageRating,
      lastStatusChange,
      lastUpdated,
    ] = await Promise.all([
      getData("dutyStatus"),
      getData("isOnRide"),
      getData("isAvailable"),
      getData("earnings"),
      getData("totalEarnings"),
      getData("trips"),
      getData("totalRides"),
      getData("hours"),
      getData("loggedInHours"),
      getData("averageRating"),
      getData("lastStatusChange"),
      getData("lastUpdated"),
    ])

    const persistedState: Partial<DutyState> = {
      isOnline: isOnline || false,
      isOnRide: isOnRide || false,
      isAvailable: isAvailable || false,
      earnings: earnings || 0,
      totalEarnings: totalEarnings || 0,
      trips: trips || 0,
      totalRides: totalRides || 0,
      hours: hours || "0h 0m",
      loggedInHours: loggedInHours || "0h 0m",
      averageRating: averageRating || 0,
      lastStatusChange: lastStatusChange || null,
      lastUpdated: lastUpdated || null,
      isInitialized: true,
    }

    console.log("Loaded persisted duty state:", persistedState)
    return persistedState
  } catch (error) {
    console.log("Error loading persisted duty state:", error)
    return { isInitialized: true }
  }
}

const initialState: DutyState = {
  loading: false,
  isOnline: false,
  isOnRide: false,
  isAvailable: false,
  earnings: 0,
  totalEarnings: 0,
  trips: 0,
  totalRides: 0,
  hours: "0h 0m",
  loggedInHours: "0h 0m",
  averageRating: 0,
  currentRide: null,
  error: null,
  lastStatusChange: null,
  lastUpdated: null,
  currentDate: null,
  isInitialized: false,
}

const dutySlice = createSlice({
  name: "duty",
  initialState,
  reducers: {
    // Restore persisted state
    restorePersistedState: (state, action: PayloadAction<Partial<DutyState>>) => {
      Object.assign(state, action.payload)
      state.isInitialized = true
    },

    // Set online status locally
    setOnlineStatus: (state, action: PayloadAction<{ isOnline: boolean; source: string }>) => {
      const { isOnline } = action.payload

      if (state.isOnline !== isOnline) {
        state.isOnline = isOnline
        state.lastStatusChange = new Date().toISOString()

        // Save to storage asynchronously
        saveData("dutyStatus", isOnline)
        saveData("lastStatusChange", state.lastStatusChange)
      }
    },

    // Update ride status
    updateRideStatus: (
      state,
      action: PayloadAction<{ isOnRide: boolean; isAvailable: boolean; currentRide?: CurrentRide | null }>,
    ) => {
      const { isOnRide, isAvailable, currentRide } = action.payload

      state.isOnRide = isOnRide
      state.isAvailable = isAvailable
      if (currentRide !== undefined) {
        state.currentRide = currentRide
      }

      // Save to storage
      saveData("isOnRide", isOnRide)
      saveData("isAvailable", isAvailable)
    },

    // Update current ride details
    updateCurrentRide: (state, action: PayloadAction<CurrentRide | null>) => {
      state.currentRide = action.payload
      state.isOnRide = !!action.payload
      saveData("isOnRide", state.isOnRide)
    },

    // Clear error
    clearError: (state) => {
      state.error = null
    },

    // Update stats manually
    updateStats: (
      state,
      action: PayloadAction<{
        earnings?: number
        totalEarnings?: number
        trips?: number
        totalRides?: number
        hours?: string
        loggedInHours?: string
        averageRating?: number
      }>,
    ) => {
      const { earnings, totalEarnings, trips, totalRides, hours, loggedInHours, averageRating } = action.payload

      const updates: Promise<void>[] = []

      if (earnings !== undefined && state.earnings !== earnings) {
        state.earnings = earnings
        updates.push(saveData("earnings", earnings))
      }
      if (totalEarnings !== undefined && state.totalEarnings !== totalEarnings) {
        state.totalEarnings = totalEarnings
        updates.push(saveData("totalEarnings", totalEarnings))
      }
      if (trips !== undefined && state.trips !== trips) {
        state.trips = trips
        updates.push(saveData("trips", trips))
      }
      if (totalRides !== undefined && state.totalRides !== totalRides) {
        state.totalRides = totalRides
        updates.push(saveData("totalRides", totalRides))
      }
      if (hours !== undefined && state.hours !== hours) {
        state.hours = hours
        updates.push(saveData("hours", hours))
      }
      if (loggedInHours !== undefined && state.loggedInHours !== loggedInHours) {
        state.loggedInHours = loggedInHours
        updates.push(saveData("loggedInHours", loggedInHours))
      }
      if (averageRating !== undefined && state.averageRating !== averageRating) {
        state.averageRating = averageRating
        updates.push(saveData("averageRating", averageRating))
      }

      // Execute all storage updates
      if (updates.length > 0) {
        Promise.all(updates).catch((error) => console.error("Error saving stats to storage:", error))
      }
    },

    // Reset duty state
    resetDutyState: (state) => {
      Object.assign(state, initialState)
      state.isInitialized = true

      // Remove persisted data
      const removePromises = [
        removeItem("dutyStatus"),
        removeItem("isOnRide"),
        removeItem("isAvailable"),
        removeItem("earnings"),
        removeItem("totalEarnings"),
        removeItem("trips"),
        removeItem("totalRides"),
        removeItem("hours"),
        removeItem("loggedInHours"),
        removeItem("averageRating"),
        removeItem("lastStatusChange"),
        removeItem("lastUpdated"),
      ]

      Promise.all(removePromises).catch((error) => console.error("Error removing persisted data:", error))
    },

    // Initialize state
    initializeDutyState: (state) => {
      state.isInitialized = true
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch rider data
      .addCase(fetchRiderData.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchRiderData.fulfilled, (state, action) => {
        state.loading = false
        Object.assign(state, action.payload)
        state.isInitialized = true
        state.error = null
      })
      .addCase(fetchRiderData.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

      // Toggle duty status
      .addCase(toggleDutyStatus.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(toggleDutyStatus.fulfilled, (state, action) => {
        state.loading = false
        state.isOnline = action.payload.isOnline
        state.lastStatusChange = action.payload.lastStatusChange
        state.error = null
        state.isInitialized = true
      })
      .addCase(toggleDutyStatus.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

      // Update earnings (now just triggers fetchRiderData)
      .addCase(updateEarnings.pending, (state) => {
        // Don't set loading to true to avoid UI flicker
        state.error = null
      })
      .addCase(updateEarnings.fulfilled, (state) => {
        state.loading = false
        // Data is updated by fetchRiderData
      })
      .addCase(updateEarnings.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
  },
})

export const {
  restorePersistedState,
  setOnlineStatus,
  updateRideStatus,
  updateCurrentRide,
  clearError,
  updateStats,
  resetDutyState,
  initializeDutyState,
} = dutySlice.actions

export default dutySlice.reducer
