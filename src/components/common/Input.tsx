import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, TextInputProps } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';

interface UniversalInputProps extends TextInputProps {
    label?: string;
    placeholder?: string;
    value: string;
    onChangeText: (text: string) => void;
    error?: string;
    leftIcon?: string;
    rightIcon?: string;
    secureTextEntry?: boolean;
    showPasswordToggle?: boolean;
    inputType?: 'text' | 'email' | 'password' | 'number' | 'phone';
    containerStyle?: object;
    inputStyle?: object;
    labelStyle?: object;
    errorStyle?: object;
    required?: boolean;
    editable?: boolean;
    multiline?: boolean;
    numberOfLines?: number;
    onRightIconPress?: () => void;
    rightIconColor?: string;
    leftIconColor?: string;
    borderColor?: string;
    focusedBorderColor?: string;
    backgroundColor?: string;
    labelColor?: string;
    textColor?: string;
    placeholderTextColor?: string;
}

const UniversalInput: React.FC<UniversalInputProps> = ({
    label,
    placeholder,
    value,
    onChangeText,
    error,
    leftIcon,
    rightIcon,
    secureTextEntry = false,
    showPasswordToggle = false,
    inputType = 'text',
    containerStyle,
    inputStyle,
    labelStyle,
    errorStyle,
    required = false,
    editable = true,
    multiline = false,
    numberOfLines = 1,
    onRightIconPress,
    rightIconColor = '#64748b',
    leftIconColor = '#64748b',
    borderColor = '#e2e8f0',
    focusedBorderColor = '#2563eb',
    backgroundColor = '#ffffff',
    labelColor = '#374151',
    textColor = '#1f2937',
    placeholderTextColor = '#9ca3af',
    ...props
}) => {
    const [showPassword, setShowPassword] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    // Get keyboard type based on input type
    const getKeyboardType = () => {
        switch (inputType) {
            case 'email':
                return 'email-address';
            case 'number':
                return 'numeric';
            case 'phone':
                return 'phone-pad';
            default:
                return 'default';
        }
    };

    // Get auto complete type
    const getAutoComplete = () => {
        switch (inputType) {
            case 'email':
                return 'email';
            case 'password':
                return 'password';
            case 'phone':
                return 'tel';
            default:
                return 'off';
        }
    };

    // Get auto capitalize
    const getAutoCapitalize = () => {
        switch (inputType) {
            case 'email':
                return 'none';
            case 'password':
                return 'none';
            default:
                return 'sentences';
        }
    };

    // Handle password toggle
    const handlePasswordToggle = () => {
        setShowPassword(!showPassword);
    };

    // Handle right icon press
    const handleRightIconPress = () => {
        if (showPasswordToggle) {
            handlePasswordToggle();
        } else if (onRightIconPress) {
            onRightIconPress();
        }
    };

    // Get right icon name
    const getRightIcon = () => {
        if (showPasswordToggle) {
            return showPassword ? 'visibility' : 'visibility-off';
        }
        return rightIcon;
    };

    return (
        <View style={[
            { marginBottom: verticalScale(20) },
            containerStyle
        ]}>
            {/* Label */}
            {label && (
                <Text style={[
                    {
                        fontSize: moderateScale(14),
                        fontFamily: 'Poppins-Regular',
                        fontWeight: '600',
                        color: labelColor,
                        marginBottom: verticalScale(8),
                    },
                    labelStyle
                ]}>
                    {label}
                    {required && (
                        <Text style={{ color: '#ef4444' }}> *</Text>
                    )}
                </Text>
            )}

            {/* Input Container */}
            <View style={{
                flexDirection: 'row',
                alignItems: multiline ? 'flex-start' : 'center',
                backgroundColor: backgroundColor,
                borderRadius: scale(4),
                borderWidth: 1,
                borderColor: error ? '#ef4444' : isFocused ? focusedBorderColor : borderColor,
                paddingHorizontal: scale(16),
                paddingVertical: multiline ? verticalScale(12) : 0,
                minHeight: multiline ? verticalScale(80) : verticalScale(40),
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
                elevation: 1,
                opacity: editable ? 1 : 0.6,
            }}>
                {/* Left Icon */}
                {leftIcon && (
                    <Icon
                        name={leftIcon}
                        size={moderateScale(20)}
                        color={leftIconColor}
                        style={{
                            marginRight: scale(12),
                            marginTop: multiline ? verticalScale(2) : 0
                        }}
                    />
                )}

                {/* Text Input */}
                <TextInput
                    style={[
                        {
                            flex: 1,
                            fontSize: moderateScale(16),
                            fontFamily: 'Poppins-Regular',
                            color: textColor,
                            textAlignVertical: multiline ? 'top' : 'center',
                            paddingTop: multiline ? verticalScale(8) : 0,
                            paddingBottom: multiline ? verticalScale(8) : 0,
                        },
                        inputStyle
                    ]}
                    placeholder={placeholder}
                    placeholderTextColor={placeholderTextColor}
                    value={value}
                    onChangeText={onChangeText}
                    secureTextEntry={secureTextEntry || (inputType === 'password' && !showPassword)}
                    keyboardType={getKeyboardType()}
                    autoComplete={getAutoComplete()}
                    autoCapitalize={getAutoCapitalize()}
                    editable={editable}
                    multiline={multiline}
                    numberOfLines={numberOfLines}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    {...props}
                />

                {/* Right Icon */}
                {(rightIcon || showPasswordToggle) && (
                    <TouchableOpacity
                        onPress={handleRightIconPress}
                        style={{
                            paddingLeft: scale(8),
                            paddingVertical: scale(8),
                            marginTop: multiline ? verticalScale(2) : 0
                        }}
                        disabled={!showPasswordToggle && !onRightIconPress}
                    >
                        <Icon
                            name={getRightIcon() || 'help'}
                            size={moderateScale(20)}
                            color={rightIconColor}
                        />
                    </TouchableOpacity>
                )}
            </View>

            {/* Error Message */}
            {error && (
                <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginTop: verticalScale(6),
                    marginLeft: scale(4),
                }}>
                    <Icon
                        name="error"
                        size={moderateScale(12)}
                        color="#ef4444"
                        style={{ marginRight: scale(4) }}
                    />
                    <Text style={[
                        {
                            color: '#ef4444',
                            fontSize: moderateScale(12),
                            flex: 1,
                        },
                        errorStyle
                    ]}>
                        {error}
                    </Text>
                </View>
            )}
        </View>
    );
};

export default UniversalInput;