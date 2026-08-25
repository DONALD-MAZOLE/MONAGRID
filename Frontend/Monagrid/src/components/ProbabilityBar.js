import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../theme/colors';

/**
 * A single probability row: label on left, progress bar on right
 */
export default function ProbabilityBar({ label, score }) {
  const pct = Math.min(Math.max(score, 0), 1);

  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.trackOuter}>
        <View style={[styles.trackFill, { width: `${(pct * 100).toFixed(1)}%` }]} />
      </View>
      <Text style={styles.score}>{(pct * 100).toFixed(1)}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  label: {
    color: Colors.textSecondary,
    fontSize: 12,
    width: 160,
    flexShrink: 0,
  },
  trackOuter: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 4,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  trackFill: {
    height: '100%',
    backgroundColor: Colors.green,
    borderRadius: 4,
  },
  score: {
    color: Colors.textSecondary,
    fontSize: 12,
    width: 44,
    textAlign: 'right',
  },
});
