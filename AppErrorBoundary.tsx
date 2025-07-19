import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { COLORS, SIZES, WEIGHTS, SPACING, RADIUS } from './constant/ui';
import Icon from 'react-native-vector-icons/MaterialIcons';

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.log('App Error Boundary caught an error:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  handleRestart = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleReportError = () => {
    const errorMessage = `Error: ${this.state.error?.message || 'Unknown error'}\nStack: ${this.state.error?.stack || 'No stack trace'}`;
    
    Alert.alert(
      'Error Report',
      'This error information can be sent to the development team for analysis.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Copy Error', 
          onPress: () => {
            // In a real app, you might want to copy to clipboard or send to error reporting service
            console.log('Error details:', errorMessage);
          }
        }
      ]
    );
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <View style={styles.errorContainer}>
            <Icon name="error-outline" size={80} color={COLORS.error} />
            <Text style={styles.title}>Oops! Something went wrong</Text>
            <Text style={styles.subtitle}>
              The app encountered an unexpected error. Don't worry, your data is safe.
            </Text>
            
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.primaryButton} onPress={this.handleRestart}>
                <Text style={styles.primaryButtonText}>Try Again</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.secondaryButton} onPress={this.handleReportError}>
                <Text style={styles.secondaryButtonText}>Report Error</Text>
              </TouchableOpacity>
            </View>
            
            {__DEV__ && (
              <View style={styles.debugContainer}>
                <Text style={styles.debugTitle}>Debug Info (Dev Mode Only):</Text>
                <Text style={styles.debugText}>
                  {this.state.error && this.state.error.toString()}
                </Text>
              </View>
            )}
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  title: {
    fontSize: SIZES.xxl,
    fontWeight: WEIGHTS.bold,
    color: COLORS.dark,
    textAlign: 'center',
    marginTop: SPACING.large,
    marginBottom: SPACING.medium,
  },
  subtitle: {
    fontSize: SIZES.medium,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    lineHeight: 22,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 300,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.medium,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.medium,
    marginBottom: SPACING.medium,
  },
  primaryButtonText: {
    color: COLORS.light,
    fontSize: SIZES.medium,
    fontWeight: WEIGHTS.semiBold,
    textAlign: 'center',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.gray,
    paddingVertical: SPACING.medium,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.medium,
  },
  secondaryButtonText: {
    color: COLORS.gray,
    fontSize: SIZES.medium,
    fontWeight: WEIGHTS.medium,
    textAlign: 'center',
  },
  debugContainer: {
    marginTop: SPACING.xl,
    padding: SPACING.medium,
    backgroundColor: COLORS.lightGray,
    borderRadius: RADIUS.small,
    width: '100%',
  },
  debugTitle: {
    fontSize: SIZES.small,
    fontWeight: WEIGHTS.bold,
    color: COLORS.dark,
    marginBottom: SPACING.small,
  },
  debugText: {
    fontSize: SIZES.xsmall,
    color: COLORS.gray,
    fontFamily: 'monospace',
  },
});

export default AppErrorBoundary;