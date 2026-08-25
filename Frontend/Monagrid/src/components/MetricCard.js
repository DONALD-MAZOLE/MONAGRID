import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../theme/colors';

export default function MetricCard({ label, value, accent }) {
  return (
    <View style={[styles.card, accent && { borderTopColor: accent, borderTopWidth: 3 }]}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.cardBg2,
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  value: {
    color: Colors.white,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
  },
  label: {
    color: Colors.textSecondary,
    fontSize: 11,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
});
