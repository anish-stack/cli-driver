import { useCallback, useState } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { setOnlineStatus } from '../../Store/slices/dutySlice';
import { useDispatch } from "react-redux"
const API_BASE_URL = 'https://www.appv2.olyox.com/api/v1/rider';

export const useFetchUserDetails = () => {
    const [userData, setUserData] = useState(null);
    const [isOnline, setIsOnline] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { token } = useSelector((state: any) => state.login)
    console.log("Token from store in hook:");
    const dispatch = useDispatch()

    // Authenticated request with token from SecureStore
    const makeAuthenticatedRequest = useCallback(async (url, options = {}) => {

        if (!token) {
            throw new Error('No authentication token found');
        }
        return axios({
            ...options,
            url,
            headers: {
                ...options.headers,
                Authorization: `Bearer ${token}`,
            },
        });
    }, []);

    // Main function to fetch user details with retry logic
    const fetchUserDetails = useCallback(async () => {
        setLoading(true);
        setError(null);

        const MAX_RETRIES = 3;
        let attempt = 0;

        while (attempt < MAX_RETRIES) {
            try {
                console.log("Attempting to fetch user details hook, try:", attempt + 1);
                const response = await makeAuthenticatedRequest(`${API_BASE_URL}/user-details`);

                if (response.data.partner) {
                    console.log("User details fetched successfully from hook", response.data.partner);
                    setUserData(response.data.partner);

                    const isAvailable = response.data.partner.isAvailable === true;
                    dispatch(setOnlineStatus({ isOnline: isAvailable, source: 'userFetch' }))
                    console.log("User availability status:", isAvailable);
                    setIsOnline(isAvailable);
                    setLoading(false);
                    return response.data.partner;
                }

                throw new Error('No partner data found');
            } catch (err) {
                attempt++;
                console.error(`Error attempt ${attempt}:`, err?.response?.data?.message || err.message);

                if (attempt >= MAX_RETRIES) {
                    setError(err?.response?.data?.message || err.message);
                    setLoading(false);
                    return null;
                }
            }
        }
    }, []);



    return {
        userData,
        isOnline,
        loading,
        error,
        fetchUserDetails,
    };
};
