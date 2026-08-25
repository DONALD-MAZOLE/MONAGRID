import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, ActivityIndicator } from 'react-native';
import { Colors } from '../theme/colors';

export default function GradientButton({ title, onPress, loading, style, textStyle }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={loading}
      activeOpacity={0.8}
      style={[styles.button, style]}
    >
      {/* Simulated gradient via layered views */}
      <View style={styles.gradientLayer} />
      {loading ? (
        <ActivityIndicator color={Colors.white} />
      ) : (
        <Text style={[styles.buttonText, textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    // Fallback gradient using two-stop background approximation
    backgroundColor: '#2e7d32',
    // We'll overlay a semi-transparent orange on the right half
    position: 'relative',
    minHeight: 44,
  },
  gradientLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#fb8c00',
    opacity: 0.45,
    // Right half only approximation: use a gradient mask substitute
  },
  buttonText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 0.3,
    zIndex: 1,
  },
});
