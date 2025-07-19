import { configureStore } from '@reduxjs/toolkit';
import LoginSlice, { loadPersistedState, restorePersistedState } from './slices/loginSlice';
import DutySlice, { loadPersistedDutyState, restorePersistedState as restorePersistedDutyState } from './slices/dutySlice';

export const store = configureStore({
  reducer: {
    login: LoginSlice,
    duty: DutySlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export const initializePersistedState = async () => {
  try {
    console.log("🔄 Initializing persisted state...");
    
    // Load login persisted state
    const loginPersistedState = await loadPersistedState();
    console.log("📦 Loaded login persisted state:", loginPersistedState);
    
    // Load duty persisted state
    const dutyPersistedState = await loadPersistedDutyState();
    console.log("📦 Loaded duty persisted state:", dutyPersistedState);
    
    // Restore login state
    if (Object.keys(loginPersistedState).length > 0) {
      store.dispatch(restorePersistedState(loginPersistedState));
      console.log("✅ Login persisted state restored to Redux store.");
    } else {
      console.log("ℹ️ No login persisted state found.");
    }
    
    // Restore duty state
    if (Object.keys(dutyPersistedState).length > 0) {
      store.dispatch(restorePersistedDutyState(dutyPersistedState));
      console.log("✅ Duty persisted state restored to Redux store.");
    } else {
      console.log("ℹ️ No duty persisted state found.");
    }
    
  } catch (error) {
    console.error('❌ Failed to initialize persisted state:', error);
  }
};

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
