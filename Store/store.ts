import { configureStore } from '@reduxjs/toolkit';
import LoginSlice, { loadPersistedState, restorePersistedState } from './slices/loginSlice';
import UserSlice, { 
  loadUserPersistedState, 
  restoreUserPersistedState,
  saveUserPersistedState 
} from './slices/userSlice';

export const store = configureStore({
  reducer: {
    login: LoginSlice,
    user: UserSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

// Subscription to persist user state on changes
let currentUserState: any;
store.subscribe(() => {
  const previousUserState = currentUserState;
  currentUserState = store.getState().user;
  
  // Only persist if user state actually changed
  if (previousUserState !== currentUserState) {
    saveUserPersistedState(currentUserState);
  }
});

export const initializePersistedState = async () => {
  try {
    console.log("🔄 Initializing persisted state...");
    
    // Load login persisted state
    const loginPersistedState = await loadPersistedState();
    console.log("📦 Loaded login persisted state:", loginPersistedState);
    
    // Load user persisted state
    const userPersistedState = await loadUserPersistedState();
    console.log("📦 Loaded user persisted state:", userPersistedState);
    
    // Restore login state
    if (Object.keys(loginPersistedState).length > 0) {
      store.dispatch(restorePersistedState(loginPersistedState));
      console.log("✅ Login persisted state restored to Redux store.");
    } else {
      console.log("ℹ️ No login persisted state found.");
    }
    
    // Restore user state
    if (Object.keys(userPersistedState).length > 0) {
      store.dispatch(restoreUserPersistedState(userPersistedState));
      console.log("✅ User persisted state restored to Redux store.");
    } else {
      console.log("ℹ️ No user persisted state found.");
    }
    
  } catch (error) {
    console.error('❌ Failed to initialize persisted state:', error);
  }
};

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;