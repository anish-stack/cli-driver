import React from 'react';
import { View, Text, ViewStyle, TextStyle } from 'react-native';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';

interface UniversalDividerProps {
  text?: string;
  orientation?: 'horizontal' | 'vertical';
  variant?: 'solid' | 'dashed' | 'dotted' | 'gradient';
  thickness?: number;
  color?: string;
  gradientColors?: string[];
  length?: number | string;
  spacing?: number;
  textPosition?: 'center' | 'left' | 'right';
  textStyle?: TextStyle;
  containerStyle?: ViewStyle;
  lineStyle?: ViewStyle;
  backgroundColor?: string;
  textBackgroundColor?: string;
  textPadding?: number;
  opacity?: number;
}

const UniversalDivider: React.FC<UniversalDividerProps> = ({
  text,
  orientation = 'horizontal',
  variant = 'solid',
  thickness = 1,
  color = '#e2e8f0',
  gradientColors = ['#e2e8f0', '#cbd5e1', '#e2e8f0'],
  length = '100%',
  spacing = 16,
  textPosition = 'center',
  textStyle,
  containerStyle,
  lineStyle,
  backgroundColor,
  textBackgroundColor,
  textPadding = 12,
  opacity = 1,
}) => {
  // Get line style based on variant
  const getLineStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      backgroundColor: variant === 'gradient' ? 'transparent' : color,
      opacity,
    };

    if (orientation === 'horizontal') {
      baseStyle.height = thickness;
      baseStyle.width = length;
    } else {
      baseStyle.width = thickness;
      baseStyle.height = length;
    }

    // Add border style for dashed/dotted variants
    if (variant === 'dashed') {
      baseStyle.borderStyle = 'dashed';
      baseStyle.borderWidth = thickness;
      baseStyle.borderColor = color;
      baseStyle.backgroundColor = 'transparent';
    } else if (variant === 'dotted') {
      baseStyle.borderStyle = 'dotted';
      baseStyle.borderWidth = thickness;
      baseStyle.borderColor = color;
      baseStyle.backgroundColor = 'transparent';
    }

    return baseStyle;
  };

  // Get container style based on orientation
  const getContainerStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      alignItems: 'center',
      justifyContent: 'center',
    };

    if (orientation === 'horizontal') {
      baseStyle.flexDirection = 'row';
      baseStyle.marginVertical = verticalScale(spacing);
    } else {
      baseStyle.flexDirection = 'column';
      baseStyle.marginHorizontal = scale(spacing);
    }

    if (backgroundColor) {
      baseStyle.backgroundColor = backgroundColor;
    }

    return baseStyle;
  };

  // Get text container style
  const getTextContainerStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      paddingHorizontal: scale(textPadding),
      paddingVertical: verticalScale(textPadding / 2),
    };

    if (textBackgroundColor) {
      baseStyle.backgroundColor = textBackgroundColor;
      baseStyle.borderRadius = scale(4);
    }

    return baseStyle;
  };

  // Get default text style
  const getTextStyle = (): TextStyle => ({
    fontSize: moderateScale(14),
    color: '#64748b',
        fontFamily: 'Poppins-Regular',
    fontWeight: '500',
    textAlign: 'center',
  });

  // Render gradient divider (for future implementation with LinearGradient)
  const renderGradientDivider = () => {
    // Note: This would require react-native-linear-gradient
    // For now, we'll use a simple colored line
    return (
      <View style={[getLineStyle(), lineStyle]} />
    );
  };

  // Render simple divider without text
  const renderSimpleDivider = () => {
    return (
      <View style={[getContainerStyle(), containerStyle]}>
        {variant === 'gradient' ? (
          renderGradientDivider()
        ) : (
          <View style={[getLineStyle(), lineStyle]} />
        )}
      </View>
    );
  };

  // Render divider with text
  const renderDividerWithText = () => {
    const isHorizontal = orientation === 'horizontal';
    
    if (textPosition === 'left') {
      return (
        <View style={[getContainerStyle(), containerStyle]}>
          <View style={getTextContainerStyle()}>
            <Text style={[getTextStyle(), textStyle]}>{text}</Text>
          </View>
          <View style={[
            getLineStyle(),
            { flex: 1, marginLeft: isHorizontal ? scale(8) : 0, marginTop: !isHorizontal ? verticalScale(8) : 0 },
            lineStyle
          ]} />
        </View>
      );
    }

    if (textPosition === 'right') {
      return (
        <View style={[getContainerStyle(), containerStyle]}>
          <View style={[
            getLineStyle(),
            { flex: 1, marginRight: isHorizontal ? scale(8) : 0, marginBottom: !isHorizontal ? verticalScale(8) : 0 },
            lineStyle
          ]} />
          <View style={getTextContainerStyle()}>
            <Text style={[getTextStyle(), textStyle]}>{text}</Text>
          </View>
        </View>
      );
    }

    // Center position (default)
    return (
      <View style={[getContainerStyle(), containerStyle]}>
        <View style={[
          getLineStyle(),
          { flex: 1, marginRight: isHorizontal ? scale(8) : 0, marginBottom: !isHorizontal ? verticalScale(8) : 0 },
          lineStyle
        ]} />
        <View style={getTextContainerStyle()}>
          <Text style={[getTextStyle(), textStyle]}>{text}</Text>
        </View>
        <View style={[
          getLineStyle(),
          { flex: 1, marginLeft: isHorizontal ? scale(8) : 0, marginTop: !isHorizontal ? verticalScale(8) : 0 },
          lineStyle
        ]} />
      </View>
    );
  };

  return text ? renderDividerWithText() : renderSimpleDivider();
};

export default UniversalDivider;