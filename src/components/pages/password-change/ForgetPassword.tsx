import axios, { isAxiosError } from 'axios';
import React, { useState } from 'react';
import {
  Alert,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { API_ENDPOINT } from '../../../constant/url';
import UniversalInput from '../../common/Input';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface PasswordChangeProps {
  onBack?: () => void;
}

const PasswordChange: React.FC<PasswordChangeProps> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [isOtpModelOpen, setIsOtpModelOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [passwordValidations, setPasswordValidations] = useState({
    hasUpper: false,
    hasLower: false,
    hasNumber: false,
    hasSpecial: false,
    isMinLength: false,
  });

  const validatePassword = (password: string) => {
    const validations = {
      hasUpper: /[A-Z]/.test(password),
      hasLower: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecial: /[^A-Za-z0-9]/.test(password),
      isMinLength: password.length >= 8,
    };
    setPasswordValidations(validations);
    return Object.values(validations).every(Boolean);
  };

  const handlePasswordChange = (text: string) => {
    setNewPassword(text);
    validatePassword(text);
  };

  const handleBack = () => {
    if (isOtpModelOpen) {
      // If OTP modal is open, go back to email input
      setIsOtpModelOpen(false);
      setOtp('');
      setNewPassword('');
      setPasswordValidations({
        hasUpper: false,
        hasLower: false,
        hasNumber: false,
        hasSpecial: false,
        isMinLength: false,
      });
    } else {
      // If on email input, call parent's onBack or handle navigation
      navigation?.goBack();
    }
  };

  const handleForgetPassword = async () => {
    if (!email) {
      return Alert.alert('Validation', 'Please enter your email address to receive the OTP.');
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_ENDPOINT}/user/request-password-reset`, { email });
      if (response.data?.success) {
        Alert.alert('OTP Sent', response.data.message);
        setIsOtpModelOpen(true);
      } else {
        Alert.alert('Server Busy', 'Please try again shortly.');
      }
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        Alert.alert('Error', error.response?.data?.message || 'Something went wrong.');
      } else {
        Alert.alert('Error', 'An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtpAndSubmit = async () => {
    if (!email || !otp || !newPassword) {
      return Alert.alert('Validation', 'Please fill in all fields.');
    }

    if (!validatePassword(newPassword)) {
      return Alert.alert('Password Too Weak', 'Please meet all password requirements.');
    }

    setLoading(true);
    try {
      const response = await axios.post(`http://192.168.1.23:8000/api/v1/user/verify-password-reset`, {
        email,
        otp,
        newPassword,
      });

      if (response.data?.success) {
        Alert.alert('Success', response.data.message, [
          {
            text: 'OK',
            onPress: () => {
              setIsOtpModelOpen(false);
              setEmail('');
              setOtp('');
              setNewPassword('');
              setPasswordValidations({
                hasUpper: false,
                hasLower: false,
                hasNumber: false,
                hasSpecial: false,
                isMinLength: false,
              });
              onBack?.();
            },
          },
        ]);
      } else {
        Alert.alert('Failed', 'Please try again later.');
      }
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        Alert.alert('Error', error.response?.data?.message || 'Something went wrong.');
      } else {
        Alert.alert('Error', 'Unexpected error. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header with Back Button */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Icon name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isOtpModelOpen ? 'Verify & Reset' : 'Reset Password'}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.iconContainer}>
          <Icon 
            name={isOtpModelOpen ? "shield-check" : "lock-reset"} 
            size={60} 
            color="#4285F4" 
          />
        </View>

        <Text style={styles.heading}>
          {isOtpModelOpen ? 'Almost There!' : 'Forgot Your Password?'}
        </Text>
        
        <Text style={styles.subHeading}>
          {isOtpModelOpen 
            ? 'Enter the OTP sent to your email and create a new password.'
            : 'Enter your email address and we\'ll send you an OTP to reset your password.'
          }
        </Text>

        <View style={styles.formContainer}>
          <UniversalInput
            label="Email"
            placeholder="Enter your registered email"
            value={email}
            onChangeText={setEmail}
            inputType="email"
            leftIcon="email"
            required
            editable={!isOtpModelOpen}
            style={isOtpModelOpen ? styles.disabledInput : undefined}
          />

          {!isOtpModelOpen && (
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleForgetPassword}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Icon name="send" size={18} color="#fff" style={styles.buttonIcon} />
                  <Text style={styles.buttonText}>Send OTP</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {isOtpModelOpen && (
            <>
              <UniversalInput
                label="OTP"
                placeholder="Enter the 6-digit OTP"
                value={otp}
                onChangeText={setOtp}
                inputType="phone"
                leftIcon="numeric"
                required
                maxLength={6}
              />

              <UniversalInput
                label="New Password"
                placeholder="Create a strong password"
                value={newPassword}
                onChangeText={handlePasswordChange}
                inputType="password"
                leftIcon="lock-outline"
                required
              />

              <View style={styles.validationContainer}>
                <Text style={styles.validationTitle}>Password Requirements:</Text>
                <View style={styles.validationList}>
                  <Text style={passwordValidations.hasUpper ? styles.valid : styles.invalid}>
                    <Icon name={passwordValidations.hasUpper ? "check-circle" : "close-circle"} size={14} />
                    {' '}One uppercase letter (A–Z)
                  </Text>
                  <Text style={passwordValidations.hasLower ? styles.valid : styles.invalid}>
                    <Icon name={passwordValidations.hasLower ? "check-circle" : "close-circle"} size={14} />
                    {' '}One lowercase letter (a–z)
                  </Text>
                  <Text style={passwordValidations.hasNumber ? styles.valid : styles.invalid}>
                    <Icon name={passwordValidations.hasNumber ? "check-circle" : "close-circle"} size={14} />
                    {' '}One number (0–9)
                  </Text>
                  <Text style={passwordValidations.hasSpecial ? styles.valid : styles.invalid}>
                    <Icon name={passwordValidations.hasSpecial ? "check-circle" : "close-circle"} size={14} />
                    {' '}One special character (!@#$)
                  </Text>
                  <Text style={passwordValidations.isMinLength ? styles.valid : styles.invalid}>
                    <Icon name={passwordValidations.isMinLength ? "check-circle" : "close-circle"} size={14} />
                    {' '}Minimum 8 characters
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleVerifyOtpAndSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Icon name="check" size={18} color="#fff" style={styles.buttonIcon} />
                    <Text style={styles.buttonText}>Reset Password</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.linkButton}
                onPress={handleForgetPassword}
                disabled={loading}
              >
                <Icon name="reload" size={18} color="#4285F4" />
                <Text style={styles.linkText}>Resend OTP</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default PasswordChange;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  container: {
    padding: 20,
    backgroundColor: '#f9f9f9',
    flexGrow: 1,
  },
  iconContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  heading: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 10,
    textAlign: 'center',
    color: '#333',
  },
  subHeading: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  formContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  disabledInput: {
    backgroundColor: '#f8f9fa',
    opacity: 0.7,
  },
  button: {
    backgroundColor: '#4285F4',
    paddingVertical: 15,
    borderRadius: 10,
    marginTop: 20,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: '#4285F4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  linkButton: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  linkText: {
    color: '#4285F4',
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  validationContainer: {
    marginTop: 15,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4285F4',
  },
  validationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  validationList: {
    gap: 5,
  },
  valid: {
    color: '#28a745',
    fontSize: 13,
    fontWeight: '500',
  },
  invalid: {
    color: '#dc3545',
    fontSize: 13,
    fontWeight: '500',
  },
});