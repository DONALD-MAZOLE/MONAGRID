import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../theme/colors';

/**
 * Maps the API label to display info.
 * Binary classifier: Healthy (0) | Faulty (1)
 */
export function getStatusInfo(label) {
  if (!label) return null;
  const upper = label.toUpperCase();

  if (upper === 'HEALTHY') {
    return {
      tag: 'STATUS',
      label: 'Healthy',
      description: 'The solar panel is operating within normal parameters. No visible defect detected.',
      style: { bg: '#e8f5e9', border: Colors.green, text: '#1b3a2b' },
    };
  }

  if (upper === 'FAULTY') {
    return {
      tag: 'FAULT DETECTED',
      label: 'Faulty',
      description: 'A fault has been detected on this solar panel. Immediate inspection is recommended.',
      style: { bg: '#fff8f3', border: Colors.redDark, text: '#4b2b1f' },
    };
  }

  // Fallback
  return {
    tag: 'RESULT',
    label,
    description: '',
    style: { bg: Colors.cardBg, border: Colors.orange, text: Colors.textPrimary },
  };
}

export default function StatusCard({ label, confidence, confidencePct, description, severity }) {
  const info = getStatusInfo(label);
  if (!info) return null;

  // Allow overriding the description from the API response
  const desc = description || info.description;

  return (
    <View style={[styles.card, { backgroundColor: info.style.bg, borderLeftColor: info.style.border }]}>
      <Text style={[styles.tag, { color: info.style.text }]}>
        {info.tag}: {info.label.toUpperCase()}
      </Text>
      <Text style={[styles.desc, { color: info.style.text }]}>{desc}</Text>
      {(confidence !== undefined || confidencePct) && (
        <Text style={[styles.confidence, { color: info.style.text }]}>
          Model Confidence: {confidencePct || `${(confidence * 100).toFixed(2)}%`}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderLeftWidth: 6,
    borderRadius: 8,
    padding: 14,
    marginVertical: 8,
  },
  tag: {
    fontWeight: '700',
    fontSize: 14,
    marginBottom: 4,
  },
  desc: {
    fontSize: 13,
    lineHeight: 18,
  },
  confidence: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '600',
  },
});
