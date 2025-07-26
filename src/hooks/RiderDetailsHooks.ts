import { useCallback, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../Store/store';
import {
    fetchUserDetails,
    getAllDetails,
    toggleDutyStatus,

    clearToggleDutyError,
    clearUserErrors,
} from '../../Store/slices/userSlice';

// Type definitions
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

interface ToggleDutyResponse {
    isOnline: boolean;
    lastStatusChange: string;
    source: 'toggle';
}

export const useFetchUserDetails = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { token } = useSelector((state: RootState) => state.login);
    const { userData, isOnline, loading, error } = useSelector((state: RootState) => ({
        userData: state.user.userData,
        isOnline: state.user.isOnline,
        loading: state.user.loading.userDetails,
        error: state.user.error.userDetails,
    }));

    const fetchDetails = useCallback(async (): Promise<Partner | null> => {
        if (!token) {
            return null;
        }

        try {
            const result = await dispatch(fetchUserDetails(token)).unwrap();
            return result;
        } catch (error) {
            console.error('Failed to fetch user details:', error);
            return null;
        }
    }, [dispatch, token]);

    return {
        userData,
        isOnline,
        loading,
        error,
        fetchUserDetails: fetchDetails,
        refetch: fetchDetails,
    };
};

export const useGetAllDetails = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { token } = useSelector((state: RootState) => state.login);
    const { allUserData, loading, error } = useSelector((state: RootState) => ({
        allUserData: state.user.allUserData,
        loading: state.user.loading.allDetails,
        error: state.user.error.allDetails,
    }));

    const getAllDetailsData = useCallback(async (): Promise<void> => {
        if (!token) {
            return;
        }

        try {
            await dispatch(getAllDetails(token)).unwrap();
        } catch (error) {
            console.error('Failed to fetch all details:', error);
        }
    }, [dispatch, token]);

    // Auto-fetch on mount
    useEffect(() => {
        if (!allUserData && !loading && token) {
            getAllDetailsData();
        }
    }, [getAllDetailsData, allUserData, loading, token]);

    console.log("Returning all user data from hook:", allUserData);

    return {
        allUserData,
        loading,
        error,
        getAllDetails: getAllDetailsData,
        refetch: getAllDetailsData,
    };
};

export const useToggleDutyStatus = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { token } = useSelector((state: RootState) => state.login);
    const { loading, error } = useSelector((state: RootState) => ({
        loading: state.user.loading.toggleDuty,
        error: state.user.error.toggleDuty,
    }));

    const toggleStatus = useCallback(async (
        userData: Partner,
        currentOnlineStatus: boolean
    ): Promise<ToggleDutyResponse | null> => {
        if (!token) {
            return null;
        }

        try {
            const result = await dispatch(toggleDutyStatus({
                token,
                userData,
                currentOnlineStatus
            })).unwrap();
            return result;
        } catch (error) {
            console.error('Failed to toggle duty status:', error);
            return null;
        }
    }, [dispatch, token]);

    const clearError = useCallback(() => {
        dispatch(clearToggleDutyError());
    }, [dispatch]);

    return {
        toggleDutyStatus: toggleStatus,
        loading,
        error,
        clearError,
    };
};

// Custom hook to replace useUserManagement
export const useUserManagement = () => {
    const dispatch = useDispatch<AppDispatch>();
    const userDetails = useFetchUserDetails();
    const allDetails = useGetAllDetails();
    const dutyToggle = useToggleDutyStatus();

    const refreshAllData = useCallback(async () => {
        console.log("Refreshing all user data...");
        await Promise.all([
            userDetails.refetch(),
            allDetails.refetch(),
        ]);
    }, [userDetails.refetch, allDetails.refetch]);

    const clearAllErrors = useCallback(() => {
        dispatch(clearUserErrors());
    }, [dispatch]);

    const isLoading = userDetails.loading || allDetails.loading || dutyToggle.loading;
    const hasError = !!(userDetails.error || allDetails.error || dutyToggle.error);

    return {
        userDetails,
        allDetails,
        dutyToggle,
        refreshAllData,
        clearAllErrors,
        isLoading,
        hasError,
    };
};

// Additional utility hooks for specific user state access
export const useUserData = () => {
    return useSelector((state: RootState) => state.user.userData);
};

export const useUserOnlineStatus = () => {
    return useSelector((state: RootState) => state.user.isOnline);
};

export const useUserDutyStatus = () => {
    return useSelector((state: RootState) => state.user.dutyStatus);
};

export const useUserLoadingState = () => {
    return useSelector((state: RootState) => state.user.loading);
};

export const useUserErrors = () => {
    return useSelector((state: RootState) => state.user.error);
};

export const useAllUserData = () => {
    return useSelector((state: RootState) => state.user.allUserData);
};