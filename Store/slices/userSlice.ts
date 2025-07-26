import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios, { AxiosRequestConfig } from 'axios';
import { getData, saveData } from '../../utility/storage';
import { API_URL_APP } from '../../constant/api';

// Interfaces
interface Partner {
    id: string;
    name: string;
    email: string;
    phone: string;
    isAvailable: boolean;
    status: 'online' | 'offline';
    RechargeData?: {
        expireData: string;
        amount: number;
        isActive: boolean;
    };
}

interface UserDetailsResponse {
    success: boolean;
    partner: Partner;
    message?: string;
}

interface AllDetailsResponse {
    success: boolean;
    data: any;
    message?: string;
}

interface ToggleDutyResponse {
    isOnline: boolean;
    lastStatusChange: string;
    source: 'toggle';
}

interface UserState {
    userData: Partner | null;
    allUserData: any;
    isOnline: boolean;
    dutyStatus: boolean;
    lastStatusChange: string | null;
    loading: {
        userDetails: boolean;
        allDetails: boolean;
        toggleDuty: boolean;
    };
    error: {
        userDetails: string | null;
        allDetails: string | null;
        toggleDuty: string | null;
    };
}

const MAX_RETRIES = 3;

// Helper function for error messages
const getErrorMessage = (error: unknown): string => {
    if (axios.isAxiosError(error)) {
        return error.response?.data?.message || error.message || 'Network error occurred';
    }
    if (error instanceof Error) {
        return error.message;
    }
    return 'An unknown error occurred';
};

// Helper function for authenticated requests
const makeAuthenticatedRequest = async <T = any>(
    url: string,
    token: string,
    options: AxiosRequestConfig = {}
): Promise<T> => {
    console.log("Making authenticated request with token:", token);

    if (!token) {
        throw new Error('No authentication token found');
    }

    const config: AxiosRequestConfig = {
        ...options,
        url,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
            Authorization: `Bearer ${token}`,
        },
    };

    const response = await axios(config);
    return response.data;
};

// Async Thunks
export const fetchUserDetails = createAsyncThunk(
    'user/fetchUserDetails',
    async (token: string, { rejectWithValue }) => {
        if (!token) {
            return rejectWithValue('No authentication token available');
        }

        let attempt = 0;

        while (attempt < MAX_RETRIES) {
            try {
                console.log(`Attempting to fetch user details, try: ${attempt + 1}`);

                const response = await makeAuthenticatedRequest<UserDetailsResponse>(
                    `${API_URL_APP}rider/user-details`,
                    token
                );

                if (response.partner) {
                    console.log("User details fetched successfully:", response.partner);
                    return response.partner;
                }

                throw new Error('No partner data found in response');

            } catch (err) {
                attempt++;
                const errorMessage = getErrorMessage(err);
                console.error(`Error attempt ${attempt}:`, errorMessage);

                if (attempt >= MAX_RETRIES) {
                    return rejectWithValue(errorMessage);
                }

                // Add delay between retries
                await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            }
        }

        return rejectWithValue('Max retries exceeded');
    }
);

export const getAllDetails = createAsyncThunk(
    'user/getAllDetails',
    async (token: string, { rejectWithValue, dispatch }) => {
        try {
            const savedToken = await getData("authToken");
            const authToken = token || savedToken;

            if (!authToken) {
                return rejectWithValue("No authentication token provided.");
            }

            console.log("Fetching all details...");

            const response = await axios.get<AllDetailsResponse>(
                `${API_URL_APP}rider/getMyAllDetails`,
                {
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            // Also refresh user details
            dispatch(fetchUserDetails(authToken));

            console.log("All details fetched successfully:", response.data);
            return response.data;

        } catch (err) {
            const errorMessage = getErrorMessage(err);
            console.error("Error fetching all details:", errorMessage);
            return rejectWithValue(errorMessage);
        }
    }
);

export const toggleDutyStatus = createAsyncThunk(
    'user/toggleDutyStatus',
    async (
        { token, userData, currentOnlineStatus }: 
        { token: string; userData: Partner; currentOnlineStatus: boolean },
        { rejectWithValue }
    ) => {
        if (!token) {
            return rejectWithValue('No authentication token available');
        }

        try {
            const goingOnline = !currentOnlineStatus;

            // Check recharge expiry
            if (userData?.RechargeData?.expireData) {
                const expireDate = new Date(userData.RechargeData.expireData);
                const currentDate = new Date();

                if (goingOnline && expireDate < currentDate) {
                    return rejectWithValue("Recharge expired. Please recharge to go online.");
                }
            }

            const response = await axios.post(
                `${API_URL_APP}rider/toggleWorkStatusOfRider`,
                { status: goingOnline ? 'online' : 'offline' },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            console.log("Toggle duty status response:", response.data);

            if (response.data.success) {
                const newStatus = response.data.cabRider?.status === "online";
                const timestamp = new Date().toISOString();

                // Save status to storage
                await Promise.all([
                    saveData("dutyStatus", newStatus),
                    saveData("lastStatusChange", timestamp)
                ]);

                const result: ToggleDutyResponse = {
                    isOnline: newStatus,
                    lastStatusChange: timestamp,
                    source: "toggle",
                };

                return result;
            } else {
                return rejectWithValue(response.data.message || "Failed to toggle status");
            }

        } catch (err) {
            const errorMessage = getErrorMessage(err);
            console.error("Error toggling duty status:", err);
            return rejectWithValue(errorMessage);
        }
    }
);

// Initial state
const initialState: UserState = {
    userData: null,
    allUserData: null,
    isOnline: false,
    dutyStatus: false,
    lastStatusChange: null,
    loading: {
        userDetails: false,
        allDetails: false,
        toggleDuty: false,
    },
    error: {
        userDetails: null,
        allDetails: null,
        toggleDuty: null,
    },
};

// Slice
const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        clearUserErrors: (state) => {
            state.error.userDetails = null;
            state.error.allDetails = null;
            state.error.toggleDuty = null;
        },
        clearUserDetailsError: (state) => {
            state.error.userDetails = null;
        },
        clearAllDetailsError: (state) => {
            state.error.allDetails = null;
        },
        clearToggleDutyError: (state) => {
            state.error.toggleDuty = null;
        },
        setOnlineStatus: (state, action: PayloadAction<boolean>) => {
            state.isOnline = action.payload;
            state.dutyStatus = action.payload;
        },
        restoreUserPersistedState: (state, action: PayloadAction<Partial<UserState>>) => {
            return { ...state, ...action.payload };
        },
        resetUserState: () => initialState,
    },
    extraReducers: (builder) => {
        // Fetch User Details
        builder
            .addCase(fetchUserDetails.pending, (state) => {
                state.loading.userDetails = true;
                state.error.userDetails = null;
            })
            .addCase(fetchUserDetails.fulfilled, (state, action) => {
                state.loading.userDetails = false;
                state.userData = action.payload;
                state.isOnline = action.payload.isAvailable === true;
                state.dutyStatus = action.payload.isAvailable === true;
                console.log("User availability status:", state.isOnline);
            })
            .addCase(fetchUserDetails.rejected, (state, action) => {
                state.loading.userDetails = false;
                state.error.userDetails = action.payload as string;
            });

        // Get All Details
        builder
            .addCase(getAllDetails.pending, (state) => {
                state.loading.allDetails = true;
                state.error.allDetails = null;
            })
            .addCase(getAllDetails.fulfilled, (state, action) => {
                state.loading.allDetails = false;
                state.allUserData = action.payload;
                console.log("Returning all user data from store:", action.payload);
            })
            .addCase(getAllDetails.rejected, (state, action) => {
                state.loading.allDetails = false;
                state.error.allDetails = action.payload as string;
            });

        // Toggle Duty Status
        builder
            .addCase(toggleDutyStatus.pending, (state) => {
                state.loading.toggleDuty = true;
                state.error.toggleDuty = null;
            })
            .addCase(toggleDutyStatus.fulfilled, (state, action) => {
                state.loading.toggleDuty = false;
                state.isOnline = action.payload.isOnline;
                state.dutyStatus = action.payload.isOnline;
                state.lastStatusChange = action.payload.lastStatusChange;
            })
            .addCase(toggleDutyStatus.rejected, (state, action) => {
                state.loading.toggleDuty = false;
                state.error.toggleDuty = action.payload as string;
            });
    },
});

// Persistence functions
export const loadUserPersistedState = async (): Promise<Partial<UserState>> => {
    try {
        const [dutyStatus, lastStatusChange, userData, allUserData] = await Promise.all([
            getData('dutyStatus'),
            getData('lastStatusChange'),
            getData('userData'),
            getData('allUserData'),
        ]);

        const persistedState: Partial<UserState> = {};

        if (dutyStatus !== null) {
            persistedState.dutyStatus = dutyStatus;
            persistedState.isOnline = dutyStatus;
        }

        if (lastStatusChange) {
            persistedState.lastStatusChange = lastStatusChange;
        }

        if (userData) {
            persistedState.userData = userData;
        }

        if (allUserData) {
            persistedState.allUserData = allUserData;
        }

        console.log("📦 Loaded user persisted state:", persistedState);
        return persistedState;
    } catch (error) {
        console.error('❌ Failed to load user persisted state:', error);
        return {};
    }
};

export const saveUserPersistedState = async (state: UserState): Promise<void> => {
    try {
        await Promise.all([
            saveData('dutyStatus', state.dutyStatus),
            saveData('lastStatusChange', state.lastStatusChange),
            saveData('userData', state.userData),
            saveData('allUserData', state.allUserData),
        ]);
        console.log("💾 User state persisted successfully");
    } catch (error) {
        console.error('❌ Failed to persist user state:', error);
    }
};

export const {
    clearUserErrors,
    clearUserDetailsError,
    clearAllDetailsError,
    clearToggleDutyError,
    setOnlineStatus,
    restoreUserPersistedState,
    resetUserState,
} = userSlice.actions;

export default userSlice.reducer;