import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../theme/colors';
import ProbabilityBar from './ProbabilityBar';

// ─────────────────────────────────────────────────────────────
// Colour maps
// ─────────────────────────────────────────────────────────────
const BINARY_STYLE = {
  HEALTHY: { bg: '#e8f5e9', border: '#2e7d32', text: '#1b3a2b', tag: '✅ STATUS: HEALTHY' },
  FAULTY:  { bg: '#fff3f3', border: '#c62828', text: '#4b1c1c', tag: '🔴 FAULT DETECTED'  },
};

const FAULT_STYLE = {
  'Bird-drop':          { bg: '#fffde7', border: '#f9a825', text: '#4a3800', icon: '🐦' },
  'Dusty':              { bg: '#f3f3f3', border: '#757575', text: '#2a2a2a', icon: '🌫️' },
  'Electrical-damage':  { bg: '#fff3e0', border: '#e65100', text: '#4a1c00', icon: '⚡' },
  'Physical-Damage':    { bg: '#fce4ec', border: '#880e4f', text: '#3b0020', icon: '🔨' },
};

const SEVERITY_BADGE = {
  ok:       { bg: '#2e7d32', text: '#ffffff', label: 'OK'        },
  low:      { bg: '#f9a825', text: '#000000', label: 'LOW'       },
  moderate: { bg: '#e65100', text: '#ffffff', label: 'MODERATE'  },
  critical: { bg: '#c62828', text: '#ffffff', label: 'CRITICAL'  },
  error:    { bg: '#757575', text: '#ffffff', label: 'ERROR'      },
};

// ─────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────
function SeverityBadge({ severity }) {
  const s = SEVERITY_BADGE[severity] || SEVERITY_BADGE.error;
  return (
    <View style={[styles.badge, { backgroundColor: s.bg }]}>
      <Text style={[styles.badgeText, { color: s.text }]}>{s.label}</Text>
    </View>
  );
}

function ProbSection({ title, probs, textColor }) {
  if (!probs || Object.keys(probs).length === 0) return null;
  return (
    <>
      <Text style={[styles.probTitle, textColor && { color: textColor }]}>{title}</Text>
      {Object.entries(probs).map(([lbl, score]) => (
        <ProbabilityBar 
          key={lbl} 
          label={lbl} 
          score={score} 
          textColor={textColor}
          trackColor="rgba(0,0,0,0.1)" 
        />
      ))}
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Main StatusCard
// ─────────────────────────────────────────────────────────────
export default function StatusCard({ result }) {
  if (!result) return null;

  const isHealthy   = result.label === 'Healthy';
  const binaryStyle = isHealthy ? BINARY_STYLE.HEALTHY : BINARY_STYLE.FAULTY;
  const faultDetail = result.fault_detail;
  const faultStyle  = faultDetail ? (FAULT_STYLE[faultDetail.label] || FAULT_STYLE['Physical-Damage']) : null;

  return (
    <View style={styles.wrapper}>
      {/* ── Stage 1: Binary result ────────────────────── */}
      <View style={[styles.card, { backgroundColor: binaryStyle.bg, borderLeftColor: binaryStyle.border }]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTag, { color: binaryStyle.text }]}>{binaryStyle.tag}</Text>
          <SeverityBadge severity={result.severity} />
        </View>
        <Text style={[styles.cardDesc, { color: binaryStyle.text }]}>{result.description}</Text>
        <Text style={[styles.cardConf, { color: binaryStyle.text }]}>
          Confidence: {result.confidence_pct}
        </Text>
        <ProbSection title="Binary Probability" probs={result.probabilities} textColor={binaryStyle.text} />
      </View>

      {/* ── Stage 2: Fault type (only when Faulty) ────── */}
      {faultDetail && faultStyle && (
        <View style={[styles.card, styles.faultCard, { backgroundColor: faultStyle.bg, borderLeftColor: faultStyle.border }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTag, { color: faultStyle.text }]}>
              {faultStyle.icon}  FAULT TYPE: {faultDetail.label.toUpperCase()}
            </Text>
            <SeverityBadge severity={faultDetail.severity} />
          </View>
          <Text style={[styles.cardDesc, { color: faultStyle.text }]}>{faultDetail.description}</Text>
          <Text style={[styles.cardConf, { color: faultStyle.text }]}>
            Confidence: {faultDetail.confidence_pct}
          </Text>
          <ProbSection title="Fault Type Probability" probs={faultDetail.probabilities} textColor={faultStyle.text} />
        </View>
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// Also export the helper so screens can compute derived values
// ─────────────────────────────────────────────────────────────
export function getStatusInfo(label) {
  if (!label) return null;
  if (label.toUpperCase() === 'HEALTHY') {
    return { style: BINARY_STYLE.HEALTHY };
  }
  return { style: BINARY_STYLE.FAULTY };
}

const styles = StyleSheet.create({
  wrapper:  { gap: 10 },

  card: {
    borderLeftWidth: 6,
    borderRadius: 10,
    padding: 14,
  },
  faultCard: {
    marginTop: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    flexWrap: 'wrap',
    gap: 6,
  },
  cardTag:  { fontWeight: '800', fontSize: 13, flexShrink: 1 },
  cardDesc: { fontSize: 13, lineHeight: 18, marginBottom: 6 },
  cardConf: { fontSize: 12, fontWeight: '600', marginBottom: 8 },

  probTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
    marginTop: 4,
  },

  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  badgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
});
