import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { Colors } from '../theme/colors';
import { API_BASE_URL } from '../config/api';

const CLASS_CARDS = [
  {
    icon: '✅',
    title: 'Healthy (Class 0)',
    desc: 'The solar panel is operating within normal parameters. No visible defect detected.',
    borderColor: Colors.green,
    bg: '#e8f5e9',
    text: '#1b3a2b',
  },
  {
    icon: '🔴',
    title: 'Faulty (Class 1)',
    desc: 'A fault has been detected on this solar panel. Immediate inspection is recommended.',
    borderColor: Colors.redDark,
    bg: '#fff8f3',
    text: '#4b2b1f',
  },
];

export default function AboutScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>

        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroTag}>Improving Solar Efficiency</Text>
          <Text style={styles.heroTitle}>Monagrid</Text>
          <Text style={styles.heroCopy}>
            AI-powered solar panel fault detection — upload a panel photo and get an instant
            Healthy / Faulty assessment powered by a custom PyTorch ResNet-18 binary classifier.
          </Text>
        </View>

        <View style={styles.divider} />

        {/* How it works */}
        <Text style={styles.sectionTitle}>How It Works</Text>
        <View style={styles.stepsRow}>
          {['📸 Capture', '🧠 Analyse', '📊 Report'].map((step, i) => (
            <View key={i} style={styles.stepCard}>
              <Text style={styles.stepNum}>{i + 1}</Text>
              <Text style={styles.stepLabel}>{step}</Text>
            </View>
          ))}
        </View>

        <View style={styles.divider} />

        {/* Detection classes */}
        <Text style={styles.sectionTitle}>Output Classes</Text>
        {CLASS_CARDS.map((card, i) => (
          <View
            key={i}
            style={[styles.infoCard, { backgroundColor: card.bg, borderLeftColor: card.borderColor }]}
          >
            <Text style={styles.cardIcon}>{card.icon}</Text>
            <View style={styles.cardBody}>
              <Text style={[styles.cardTitle, { color: card.text }]}>{card.title}</Text>
              <Text style={[styles.cardDesc,  { color: card.text }]}>{card.desc}</Text>
            </View>
          </View>
        ))}

        <View style={styles.divider} />

        {/* Model information */}
        <Text style={styles.sectionTitle}>Model Information</Text>
        <View style={styles.modelCard}>
          {[
            ['Architecture',   'ResNet-18 (fine-tuned)'],
            ['Framework',      'PyTorch'],
            ['Task',           'Binary Classification'],
            ['Input',          '224 × 224 px RGB'],
            ['Normalisation',  'ImageNet mean / std'],
            ['Output',         '2-class Softmax'],
            ['Classes',        '0 = Healthy · 1 = Faulty'],
            ['Version',        'v2.0 — Binary Classifier'],
          ].map(([k, v], i) => (
            <View key={i} style={[styles.modelRow, i > 0 && styles.modelRowBorder]}>
              <Text style={styles.modelKey}>{k}</Text>
              <Text style={styles.modelVal}>{v}</Text>
            </View>
          ))}
        </View>

        <View style={styles.divider} />

        {/* API info */}
        <Text style={styles.sectionTitle}>Backend API</Text>
        <View style={styles.modelCard}>
          {[
            ['Base URL',  API_BASE_URL],
            ['POST /predict',       'Single image analysis'],
            ['POST /predict/batch', 'Fleet batch analysis'],
            ['GET /health',         'Backend health check'],
            ['Docs',        `${API_BASE_URL}/docs`],
          ].map(([k, v], i) => (
            <View key={i} style={[styles.modelRow, i > 0 && styles.modelRowBorder]}>
              <Text style={styles.modelKey}>{k}</Text>
              <Text style={[styles.modelVal, { flex: 1 }]} numberOfLines={1} ellipsizeMode="tail">{v}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.footer}>© 2026 Monagrid.com — All rights reserved</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: Colors.black },
  container: { flex: 1, backgroundColor: Colors.black },
  content:   { padding: 16, paddingBottom: 40 },

  hero: {
    backgroundColor: Colors.cardBg,
    borderRadius: 14,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  heroTag:   { color: Colors.yellow, fontStyle: 'italic', fontSize: 12, fontWeight: '600', marginBottom: 6 },
  heroTitle: { color: Colors.white, fontSize: 32, fontWeight: '900', letterSpacing: -0.5, marginBottom: 10 },
  heroCopy:  { color: Colors.textSecondary, fontSize: 13, lineHeight: 20 },

  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 20 },

  sectionTitle: { color: Colors.white, fontSize: 17, fontWeight: '700', marginBottom: 14 },

  stepsRow: { flexDirection: 'row', gap: 10, marginBottom: 4 },
  stepCard: {
    flex: 1,
    backgroundColor: Colors.cardBg2,
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
  },
  stepNum:   { color: Colors.green, fontSize: 20, fontWeight: '800', marginBottom: 4 },
  stepLabel: { color: Colors.textPrimary, fontSize: 12, textAlign: 'center', fontWeight: '600' },

  infoCard: {
    flexDirection: 'row',
    borderLeftWidth: 5,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    alignItems: 'flex-start',
    gap: 10,
  },
  cardIcon:  { fontSize: 22, marginTop: 2 },
  cardBody:  { flex: 1 },
  cardTitle: { fontWeight: '700', fontSize: 13, marginBottom: 3 },
  cardDesc:  { fontSize: 12, lineHeight: 17 },

  modelCard: {
    backgroundColor: Colors.cardBg,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    paddingHorizontal: 14,
    gap: 8,
  },
  modelRowBorder: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  modelKey: { color: Colors.textSecondary, fontSize: 12, width: 130 },
  modelVal: { color: Colors.textPrimary,   fontSize: 12, fontWeight: '600', flexShrink: 1 },

  footer: { color: 'rgba(255,255,255,0.2)', fontSize: 11, textAlign: 'center', marginTop: 24 },
});
