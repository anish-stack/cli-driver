import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, View, ViewStyle, TextStyle } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';

interface UniversalButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success' | 'warning';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: string;
  rightIcon?: string;
  iconColor?: string;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  loadingColor?: string;
  borderRadius?: number;
  elevation?: number;
  uppercase?: boolean;
  rippleColor?: string;
}

const UniversalButton: React.FC<UniversalButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  iconColor,
  fullWidth = false,
  style,
  textStyle,
  loadingColor,
  borderRadius,
  elevation,
  uppercase = false,
  rippleColor,
}) => {
  // Size configurations
  const sizeConfig = {
    small: {
      height: verticalScale(40),
      paddingHorizontal: scale(16),
      fontSize: moderateScale(14),
      iconSize: moderateScale(16),
    },
    medium: {
      height: verticalScale(48),
      paddingHorizontal: scale(20),
      fontSize: moderateScale(16),
      iconSize: moderateScale(18),
    },
    large: {
      height: verticalScale(56),
      paddingHorizontal: scale(24),
      fontSize: moderateScale(18),
      iconSize: moderateScale(20),
    },
  };

  // Variant configurations
  const variantConfig = {
    primary: {
      backgroundColor: '#2563eb',
      textColor: '#ffffff',
      borderColor: '#2563eb',
      borderWidth: 0,
      shadowColor: '#2563eb',
      shadowOpacity: 0.3,
      elevation: 4,
    },
    secondary: {
      backgroundColor: '#64748b',
      textColor: '#ffffff',
      borderColor: '#64748b',
      borderWidth: 0,
      shadowColor: '#64748b',
      shadowOpacity: 0.3,
      elevation: 4,
    },
    outline: {
      backgroundColor: 'transparent',
      textColor: '#2563eb',
      borderColor: '#2563eb',
      borderWidth: 1,
      shadowColor: 'transparent',
      shadowOpacity: 0,
      elevation: 0,
    },
    ghost: {
      backgroundColor: 'transparent',
      textColor: '#2563eb',
      borderColor: 'transparent',
      borderWidth: 0,
      shadowColor: 'transparent',
      shadowOpacity: 0,
      elevation: 0,
    },
    danger: {
      backgroundColor: '#dc2626',
      textColor: '#ffffff',
      borderColor: '#dc2626',
      borderWidth: 0,
      shadowColor: '#dc2626',
      shadowOpacity: 0.3,
      elevation: 4,
    },
    success: {
      backgroundColor: '#16a34a',
      textColor: '#ffffff',
      borderColor: '#16a34a',
      borderWidth: 0,
      shadowColor: '#16a34a',
      shadowOpacity: 0.3,
      elevation: 4,
    },
    warning: {
      backgroundColor: '#ca8a04',
      textColor: '#ffffff',
      borderColor: '#ca8a04',
      borderWidth: 0,
      shadowColor: '#ca8a04',
      shadowOpacity: 0.3,
      elevation: 4,
    },
  };

  const currentSize = sizeConfig[size];
  const currentVariant = variantConfig[variant];

  // Dynamic styles based on state
  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      height: currentSize.height,
      paddingHorizontal: currentSize.paddingHorizontal,
      backgroundColor: currentVariant.backgroundColor,
      borderRadius: borderRadius ?? scale(12),
      borderWidth: currentVariant.borderWidth,
      borderColor: currentVariant.borderColor,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      shadowColor: currentVariant.shadowColor,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: currentVariant.shadowOpacity,
      shadowRadius: 4,
      elevation: elevation ?? currentVariant.elevation,
    };

    if (fullWidth) {
      baseStyle.width = '100%';
    }

    if (disabled || loading) {
      baseStyle.opacity = 0.6;
      baseStyle.shadowOpacity = 0;
      baseStyle.elevation = 0;
    }

    return baseStyle;
  };

  const getTextStyle = (): TextStyle => ({
    fontSize: currentSize.fontSize,
    fontWeight: '600',
    fontFamily: 'Poppins-Regular',
    color: currentVariant.textColor,
    textAlign: 'center',
    ...(uppercase && { textTransform: 'uppercase' }),
  });

  const getIconColor = () => {
    return iconColor || currentVariant.textColor;
  };

  const getLoadingColor = () => {
    return loadingColor || currentVariant.textColor;
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...(rippleColor && {
        android_ripple: { color: rippleColor, borderless: false }
      })}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={getLoadingColor()}
        />
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {leftIcon && (
            <Icon
              name={leftIcon}
              size={currentSize.iconSize}
              color={getIconColor()}
              style={{ marginRight: scale(8) }}
            />
          )}

          <Text style={[getTextStyle(), textStyle]}>
            {title}
          </Text>

          {rightIcon && (
            <Icon
              name={rightIcon}
              size={currentSize.iconSize}
              color={getIconColor()}
              style={{ marginLeft: scale(8) }}
            />
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

export default UniversalButton;