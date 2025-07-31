import {
    Platform,
    PermissionsAndroid,
    NativeModules,
    AppState,
    AppStateStatus
} from 'react-native';
import axios, { AxiosResponse } from 'axios';
import {  getData } from '../utility/storage';

const { LocationModule } = NativeModules;

// TypeScript Interfaces
interface LocationData {
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: number;
    provider: string;
}

interface LocationPayload {
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: number;
    app_state: AppStateStatus;
    provider: string;
}

interface LocationServiceConfig {
    API_TIMEOUT: number;
    LOCATION_UPDATE_INTERVAL: number;
    MAX_RETRY_ATTEMPTS: number;
    RETRY_DELAY: number;
    API_ENDPOINT: string;
    MIN_DISTANCE_THRESHOLD: number;
    MIN_TIME_THRESHOLD: number;
    LOCATION_ACCURACY_THRESHOLD: number;
}

interface LocationServiceStatus {
    isActive: boolean;
    hasPermissions: boolean;
    hasAuthToken: boolean;
    currentLocation: LocationData | null;
    lastError: string | null;
    appState: AppStateStatus;
}

interface LocationSentEventData {
    location: LocationData;
    response: any;
}

interface LocationSendErrorEventData {
    error: string;
    retryCount: number;
}

interface LocationSendFailedEventData {
    error: string;
    location: LocationData;
}

interface LocationModuleNative {
    getCurrentLocation(
        successCallback: (lat: number, lng: number, accuracy?: number, timestamp?: number) => void,
        errorCallback: (error: string) => void
    ): void;
}

type LocationServiceEvents = 
    | 'locationUpdate'
    | 'locationSent'
    | 'locationSendError'
    | 'locationSendFailed'
    | 'error'
    | 'serviceStarted'
    | 'serviceStopped'
    | 'appStateChange'
    | 'initialized'
    | 'initializationError';

type EventCallback = (data?: any) => void;

interface EventListeners {
    [key: string]: EventCallback[];
}

// Configuration constants
const CONFIG: LocationServiceConfig = {
    API_TIMEOUT: 10000,
    LOCATION_UPDATE_INTERVAL: 4000,
    MAX_RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 2000,
    API_ENDPOINT: "https://www.appv2.olyox.com/webhook/cab-receive-location",
    MIN_DISTANCE_THRESHOLD: 10, // meters
    MIN_TIME_THRESHOLD: 30000, // 30 seconds
    LOCATION_ACCURACY_THRESHOLD: 100, // meters
};

class LocationService {
    private location: LocationData | null = null;
    private error: string | null = null;
    private authToken: string | null = null;
    private locationInterval: NodeJS.Timeout | null = null;
    private appState: AppStateStatus = AppState.currentState;
    private lastLocation: LocationData | null = null;
    private retryCount: number = 0;
    private isServiceActive: boolean = false;
    private permissionsGranted: boolean = false;
    private listeners: EventListeners = {};

    constructor() {}

    // Event listener system
    addListener(event: LocationServiceEvents, callback: EventCallback): void {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    }

    removeListener(event: LocationServiceEvents, callback: EventCallback): void {
        if (this.listeners[event]) {
            this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
        }
    }

    private emit(event: LocationServiceEvents, data?: any): void {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => callback(data));
        }
    }

    // Request location permissions
    async requestLocationPermission(): Promise<boolean> {
        if (Platform.OS === 'android') {
            try {
                const permissions = [
                    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                    PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
                ];

                // Request basic location permissions
                const results = await PermissionsAndroid.requestMultiple(permissions);

                const fineLocationGranted = results[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED;
                const coarseLocationGranted = results[PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED;

                if (!fineLocationGranted && !coarseLocationGranted) {
                    throw new Error('Location permissions denied');
                }

                // Request background location permission for Android 10+
                if (Platform.Version >= 29) {
                    const backgroundLocationResult = await PermissionsAndroid.request(
                        PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
                        {
                            title: 'Background Location Permission',
                            message: 'App needs background location access for continuous ride tracking.',
                            buttonNeutral: 'Ask Me Later',
                            buttonNegative: 'Cancel',
                            buttonPositive: 'OK',
                        }
                    );

                    if (backgroundLocationResult !== PermissionsAndroid.RESULTS.GRANTED) {
                        console.warn('Background location permission denied');
                    }
                }

                this.permissionsGranted = true;
                return true;
            } catch (err: any) {
                console.error('Permission request error:', err);
                this.error = err.message;
                this.emit('error', err.message);
                return false;
            }
        }

        this.permissionsGranted = true;
        return true;
    }

    // Get current location with enhanced error handling
    getCurrentLocation(): Promise<LocationData> {
        return new Promise((resolve, reject) => {
            const locationModule = LocationModule as LocationModuleNative;
            
            if (!locationModule) {
                const error = new Error('LocationModule not available');
                reject(error);
                return;
            }

            if (!this.permissionsGranted) {
                const error = new Error('Location permissions not granted');
                reject(error);
                return;
            }

            const timeout = setTimeout(() => {
                reject(new Error('Location request timeout'));
            }, CONFIG.API_TIMEOUT);

            locationModule.getCurrentLocation(
                (lat: number, lng: number, accuracy?: number, timestamp?: number) => {
                    clearTimeout(timeout);

                    // Validate location data
                    if (typeof lat !== 'number' || typeof lng !== 'number' ||
                        isNaN(lat) || isNaN(lng) ||
                        lat === 0 || lng === 0) {
                        reject(new Error('Invalid location data received'));
                        return;
                    }

                    // Check accuracy if provided
                    if (accuracy && accuracy > CONFIG.LOCATION_ACCURACY_THRESHOLD) {
                        console.warn(`Low location accuracy: ${accuracy}m`);
                    }

                    const locationData: LocationData = {
                        latitude: lat,
                        longitude: lng,
                        accuracy: accuracy || 0,
                        timestamp: timestamp || Date.now(),
                        provider: 'gps'
                    };

                    resolve(locationData);
                },
                (error: string) => {
                    clearTimeout(timeout);
                    const errorMsg = error || 'Failed to get location';
                    reject(new Error(errorMsg));
                }
            );
        });
    }

    // Send location to backend with enhanced retry logic
    async sendLocationToBackend(locationData: LocationData, retryCount: number = 0): Promise<boolean> {
        if (!this.authToken) {
            console.log('No auth token available, skipping location send');
            return false;
        }

        if (!locationData || !locationData.latitude || !locationData.longitude) {
            console.error('Invalid location data for sending');
            return false;
        }

        try {
            const payload: LocationPayload = {
                latitude: locationData.latitude,
                longitude: locationData.longitude,
                accuracy: locationData.accuracy,
                timestamp: locationData.timestamp,
                app_state: this.appState,
                provider: locationData.provider || 'unknown'
            };

            const response: AxiosResponse = await axios.post(
                CONFIG.API_ENDPOINT,
                payload,
                {
                    headers: {
                        Authorization: `Bearer ${this.authToken}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: CONFIG.API_TIMEOUT,
                }
            );
           
            if (response.status === 200) {
                this.retryCount = 0; // Reset retry count on success
                const eventData: LocationSentEventData = { location: locationData, response: response.data };
                this.emit('locationSent', eventData);
                console.log('Location sent successfully');
                return true;
            } else {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
        } catch (error: any) {
            console.error('Location send error:', error.message);
            const errorEventData: LocationSendErrorEventData = { error: error.message, retryCount };
            this.emit('locationSendError', errorEventData);

            // Exponential backoff retry logic
            if (retryCount < CONFIG.MAX_RETRY_ATTEMPTS) {
                const delay = CONFIG.RETRY_DELAY * Math.pow(2, retryCount);
                console.log(`Retrying location send in ${delay}ms... Attempt ${retryCount + 1}`);

                setTimeout(() => {
                    this.sendLocationToBackend(locationData, retryCount + 1);
                }, delay);
            } else {
                console.error('Max retry attempts reached for location send');
                const failedEventData: LocationSendFailedEventData = { error: error.message, location: locationData };
                this.emit('locationSendFailed', failedEventData);
            }
        }
        return false;
    }

    // Check if location has significantly changed
    private hasLocationChanged(newLocation: LocationData): boolean {
        if (!this.lastLocation) return true;

        const distance = this.calculateDistance(
            this.lastLocation.latitude, this.lastLocation.longitude,
            newLocation.latitude, newLocation.longitude
        );

        const timeDiff = newLocation.timestamp - this.lastLocation.timestamp;

        // Send update if moved more than threshold distance or time passed
        return distance > CONFIG.MIN_DISTANCE_THRESHOLD || timeDiff > CONFIG.MIN_TIME_THRESHOLD;
    }

    // Calculate distance between two coordinates (Haversine formula)
    private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const R = 6371e3; // Earth's radius in meters
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    }

    // Update location with optimization
    private async updateLocation(): Promise<void> {
        try {
            const locationData = await this.getCurrentLocation();
            this.location = locationData;
            this.error = null;

            this.emit('locationUpdate', locationData);

            // Only send if location changed significantly
            if (this.hasLocationChanged(locationData)) {
                const success = await this.sendLocationToBackend(locationData);
                if (success) {
                    this.lastLocation = locationData;
                }
            } else {
                console.log('Location change not significant, skipping send');
            }
        } catch (error: any) {
            console.error('Location update error:', error.message);
            this.error = error.message;
            this.emit('error', error.message);
        }
    }

    // Start location service
    startLocationService(): void {
        if (this.isServiceActive) {
            console.log('Location service already active');
            return;
        }

        if (!this.permissionsGranted) {
            console.error('Cannot start location service: permissions not granted');
            return;
        }

        console.log('Starting location service...');
        this.isServiceActive = true;

        // Initial location update
        this.updateLocation();

        // Set up interval for regular updates
        this.locationInterval = setInterval(() => {
            if (this.isServiceActive) {
                this.updateLocation();
            }
        }, CONFIG.LOCATION_UPDATE_INTERVAL);

        this.emit('serviceStarted');
    }

    // Stop location service
    stopLocationService(): void {
        if (!this.isServiceActive) {
            console.log('Location service already stopped');
            return;
        }

        console.log('Stopping location service...');
        this.isServiceActive = false;

        if (this.locationInterval) {
            clearInterval(this.locationInterval);
            this.locationInterval = null;
        }

        this.emit('serviceStopped');
    }

    // Handle app state changes
    handleAppStateChange(nextAppState: AppStateStatus): void {
        console.log('Location service handling app state change:', this.appState, '->', nextAppState);
        this.appState = nextAppState;

        switch (nextAppState) {
            case 'active':
                // App is in foreground
                if (!this.isServiceActive && this.permissionsGranted && this.authToken) {
                    this.startLocationService();
                }
                break;
            case 'background':
                // App is in background - continue location updates
                console.log('App in background, continuing location service...');
                // Location service continues running
                break;
            case 'inactive':
                // App is being minimized or transitioning
                console.log('App is inactive...');
                break;
            default:
                break;
        }

        this.emit('appStateChange', nextAppState);
    }

    // Set authentication token
    setAuthToken(token: string): void {
        this.authToken = token;
        console.log('Auth token set for location service');

        // Start service if conditions are met
        if (token && this.permissionsGranted && !this.isServiceActive) {
            this.startLocationService();
        }
    }

    // Initialize location service
    async initialize(): Promise<void> {
        try {
            console.log('Initializing location service...');

            // Request permissions
            const hasPermission = await this.requestLocationPermission();
            if (!hasPermission) {
                throw new Error('Location permission denied');
            }

            // Get auth token
            try {
                const token = await getData('authToken');
                if (token) {
                    this.setAuthToken(token);
                }
            } catch (err) {
                console.log('No auth token found:', err);
            }

            console.log('Location service initialized successfully');
            this.emit('initialized');

        } catch (error: any) {
            console.error('Location service initialization failed:', error);
            this.emit('initializationError', error);
            throw error;
        }
    }

    // Cleanup function
    cleanup(): void {
        console.log('Cleaning up location service...');
        this.stopLocationService();
        this.listeners = {};
        this.location = null;
        this.lastLocation = null;
        this.authToken = null;
        this.error = null;
    }

    // Get current service status
    getStatus(): LocationServiceStatus {
        return {
            isActive: this.isServiceActive,
            hasPermissions: this.permissionsGranted,
            hasAuthToken: !!this.authToken,
            currentLocation: this.location,
            lastError: this.error,
            appState: this.appState
        };
    }

    // Force location update
    async forceLocationUpdate(): Promise<void> {
        if (!this.isServiceActive) {
            throw new Error('Location service is not active');
        }
        return await this.updateLocation();
    }
}

// Export singleton instance
export default new LocationService();