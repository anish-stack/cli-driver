import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios, { isAxiosError } from 'axios';
import { API_URL_APP } from '../../constant/api';
import { saveData, removeItem, getData } from '../../utility/storage';
import { LoginState, LoginWithOtpParams, VerifyOtpParams, VerifyOtpResponse } from '../../utility/types';

export const loginWithOtp = createAsyncThunk(
  'login/loginWithOtp',
  async ({ formattedPhone, otpType, fcmToken, isGranted }: LoginWithOtpParams, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL_APP}rider/rider-login`, {
        fcmToken: isGranted ? fcmToken : null,
        number: formattedPhone,
        otpType,
      });
      console.log("response",response.data)
      return response.data;
    } catch (error) {
      console.log("error hu ", error)
      if (isAxiosError(error)) {
        return rejectWithValue(error.response?.data?.message || error.message);
      }
    }
  }
);

export const verifyOtp = createAsyncThunk(
  'login/verifyOtp',
  async ({ otp, number, type }: VerifyOtpParams, { rejectWithValue }) => {
    console.log(otp, number, type)
    try {
      const response = await axios.post(`${API_URL_APP}rider/rider-verify`, {
        otp,
        number,
        otpType: type,
      });

      const { token, accountStatus, isDocumentUpload, DocumentVerify } = response.data;
      console.log("response.data", response.data)
      
      // Save token and other states to storage
      await saveData('authToken', token);
      await saveData('accountStatus', accountStatus);
      await saveData('isDocumentUpload', isDocumentUpload);
      await saveData('DocumentVerify', DocumentVerify);
      await saveData('isAuthenticated', true);

      return { token, accountStatus, isDocumentUpload, DocumentVerify };
    } catch (error) {
      if (isAxiosError(error)) {
        return rejectWithValue(error.response?.data?.message || error.message);
      }
    }
  }
);


export const loadPersistedState = async (): Promise<Partial<LoginState>> => {
  try {
    const [
      token,
      accountStatus,
      isDocumentUpload,
      DocumentVerify,
      isAuthenticated
    ] = await Promise.all([
      getData('authToken'),
      getData('accountStatus'),
      getData('isDocumentUpload'),
      getData('DocumentVerify'),
      getData('isAuthenticated')
    ]);

    return {
      token: token || null,
      accountStatus: accountStatus || null,
      isDocumentUpload: isDocumentUpload || false,
      DocumentVerify: DocumentVerify || null,
      isAuthenticated: isAuthenticated || false,
    };
  } catch (error) {
    console.log('Error loading persisted state:', error);
    return {};
  }
};

const initialState: LoginState = {
  loading: false,
  token: null,
  accountStatus: null,
  isDocumentUpload: false,
  DocumentVerify: null,
  error: null,
  isAuthenticated: false,
};

const LoginSlice = createSlice({
  name: 'login',
  initialState,
  reducers: {
    logout: (state) => {
      state.token = null;
      state.accountStatus = null;
      state.isDocumentUpload = false;
      state.DocumentVerify = null;
      state.error = null;
      state.isAuthenticated = false;
      
      // Remove all persisted data
      removeItem('authToken');
      removeItem('accountStatus');
      removeItem('isDocumentUpload');
      removeItem('DocumentVerify');
      removeItem('isAuthenticated');
    },
    
    // New reducer to restore persisted state
    restorePersistedState: (state, action: PayloadAction<Partial<LoginState>>) => {
      Object.assign(state, action.payload);
    },
    
    // New reducer to manually update any field and persist it
    updateField: (state, action: PayloadAction<{ field: keyof LoginState; value: any }>) => {
      const { field, value } = action.payload;
      (state as any)[field] = value;
      
      // Persist the updated field
      if (field !== 'loading' && field !== 'error') {
        saveData(field, value);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginWithOtp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginWithOtp.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(loginWithOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(verifyOtp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyOtp.fulfilled, (state, action: PayloadAction<VerifyOtpResponse>) => {
        state.loading = false;
        state.token = action.payload.token;
        state.accountStatus = action.payload.accountStatus;
        state.isDocumentUpload = action.payload.isDocumentUpload;
        state.DocumentVerify = action.payload.DocumentVerify;
        state.isAuthenticated = true;
        // Note: Persistence is already handled in the async thunk
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { logout, restorePersistedState, updateField } = LoginSlice.actions;
export default LoginSlice.reducer;