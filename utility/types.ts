export interface LoginWithOtpParams {
  formattedPhone: string;
  otpType: string;
  fcmToken: string | null;
  isGranted: boolean;
}

export interface VerifyOtpParams {
  otp: string;
  number: string;
  type: string;
}

export interface VerifyOtpResponse {
  token: string;
  accountStatus: string;
  isDocumentUpload: boolean;
  DocumentVerify: boolean;
}

export interface LoginState {
  loading: boolean;
  token: string | null;
  accountStatus: string | null;
  isDocumentUpload: boolean;
  DocumentVerify: boolean | null;
  isAuthenticated:boolean,
  error: any;
}
