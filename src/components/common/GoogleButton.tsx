import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, ActivityIndicator } from 'react-native';

export default function GoogleButton({
  loading = false,
  disabled = false,
  onPress,
  text = 'Sign in with Google',
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        (disabled || loading) && styles.disabledButton,
      ]}
    >
      {!loading && (
        <Image
          source={require('../../assets/images/google.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      )}

      {loading ? (
        <ActivityIndicator size="small" color="#000" style={{ marginLeft: 5 }} />
      ) : (
        <Text style={styles.text}>{text}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  disabledButton: {
    opacity: 0.5,
  },
  logo: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  text: {
    color: '#000',
    fontSize: 14,
    fontWeight: '500',
  },
});
