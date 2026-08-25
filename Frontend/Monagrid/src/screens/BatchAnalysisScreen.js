import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../theme/colors';
import GradientButton from '../components/GradientButton';
import MetricCard from '../components/MetricCard';
import { predictBatch } from '../services/apiService';

// Colour per label for the results table
function labelColor(label) {
  if (!label) return Colors.textPrimary;
  return label.toUpperCase() === 'HEALTHY' ? Colors.green : Colors.redDark;
}

export default function BatchAnalysisScreen() {
  const [images, setImages]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);   // array of BatchResult from API
  const [error, setError]     = useState(null);

  // ── Pick multiple images ──────────────────────────────────
  const pickImages = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission Required', 'Please allow access to your photo library.');
      return;
    }
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 1,
    });
    if (!picked.canceled && picked.assets.length > 0) {
      setImages(picked.assets);
      setResults(null);
      setError(null);
    }
  };

  // ── Send to FastAPI /predict/batch ────────────────────────
  const analyzeImages = async () => {
    if (images.length === 0) return;
    setLoading(true);
    setResults(null);
    setError(null);
    try {
      const assets = images.map(a => ({
        uri:      a.uri,
        fileName: a.fileName || 'panel.jpg',
        mimeType: a.mimeType || 'image/jpeg',
      }));
      const batchResults = await predictBatch(assets);
      setResults(batchResults);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Derived metrics from API response ────────────────────
  const total   = results ? results.length : 0;
  const healthy = results ? results.filter(r => r.prediction?.label === 'Healthy').length : 0;
  const faulty  = total - healthy;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Real-Time Solar Panel Inspection</Text>
        <Text style={styles.sub}>Upload multiple images for fleet batch analysis</Text>

        {/* Upload area */}
        <TouchableOpacity style={styles.uploadArea} onPress={pickImages} activeOpacity={0.75}>
          <Text style={styles.uploadIcon}>📂</Text>
          <Text style={styles.uploadText}>Select Multiple Images</Text>
          <Text style={styles.uploadHint}>JPG · PNG · up to 50 images</Text>
        </TouchableOpacity>

        {/* Preview grid */}
        {images.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>{images.length} image(s) ready</Text>
            <View style={styles.grid}>
              {images.map((asset, idx) => (
                <View key={idx} style={styles.gridItem}>
                  <Image source={{ uri: asset.uri }} style={styles.gridImage} resizeMode="cover" />
                  <Text style={styles.gridCaption} numberOfLines={1}>
                    {asset.fileName || `panel_${idx + 1}.jpg`}
                  </Text>
                </View>
              ))}
            </View>

            <GradientButton
              title={`Analyze ${images.length} Images`}
              onPress={analyzeImages}
              loading={loading}
              style={styles.analyzeBtn}
            />
          </>
        )}

        {/* Loading */}
        {loading && (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={Colors.green} size="large" />
            <Text style={styles.loadingText}>Running batch inference on Monagrid AI...</Text>
          </View>
        )}

        {/* Error */}
        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorTitle}>⚠️ Connection Error</Text>
            <Text style={styles.errorMsg}>{error}</Text>
            <Text style={styles.errorHint}>Make sure the backend server is running on port 8000.</Text>
          </View>
        )}

        {/* Results */}
        {results && !loading && (
          <>
            {/* Metrics */}
            <View style={styles.metricsRow}>
              <MetricCard label="Total Panels" value={total}   accent={Colors.green} />
              <MetricCard label="Healthy"       value={healthy} accent={Colors.green} />
              <MetricCard label="Faulty"        value={faulty}  accent={Colors.redDark} />
            </View>

            {/* Detailed table */}
            <Text style={styles.resultsHeading}>Detailed Results</Text>
            <View style={styles.tableCard}>
              {/* Header */}
              <View style={[styles.tableRow, styles.tableHeader]}>
                <Text style={[styles.tableCell, styles.colNo]}>#</Text>
                <Text style={[styles.tableCell, styles.colImg]}>Image</Text>
                <Text style={[styles.tableCell, styles.colCond]}>Result</Text>
                <Text style={[styles.tableCell, styles.colConf]}>Confidence</Text>
              </View>

              {results.map((r, idx) => {
                const pred = r.prediction || {};
                const hasError = !!r.error;
                return (
                  <View
                    key={idx}
                    style={[styles.tableRow, idx % 2 === 0 ? styles.rowEven : styles.rowOdd]}
                  >
                    <Text style={[styles.tableCell, styles.colNo, { color: Colors.textSecondary }]}>
                      {idx + 1}
                    </Text>
                    <Text
                      style={[styles.tableCell, styles.colImg]}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {r.filename}
                    </Text>
                    <Text
                      style={[
                        styles.tableCell,
                        styles.colCond,
                        { color: hasError ? Colors.orange : labelColor(pred.label) },
                      ]}
                      numberOfLines={1}
                    >
                      {hasError ? 'Error' : (pred.label || '—')}
                    </Text>
                    <Text style={[styles.tableCell, styles.colConf]}>
                      {hasError ? '—' : (pred.confidence_pct || '—')}
                    </Text>
                  </View>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: Colors.black },
  container: { flex: 1, backgroundColor: Colors.black },
  content:   { padding: 16, paddingBottom: 40 },

  heading: { color: Colors.white, fontSize: 20, fontWeight: '800', marginBottom: 6 },
  sub:     { color: Colors.textSecondary, fontSize: 13, marginBottom: 20 },

  uploadArea: {
    backgroundColor: Colors.cardBg2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  uploadIcon: { fontSize: 36, marginBottom: 8 },
  uploadText: { color: Colors.textPrimary, fontSize: 15, fontWeight: '600' },
  uploadHint: { color: Colors.textSecondary, fontSize: 12, marginTop: 4 },

  sectionTitle: { color: Colors.white, fontSize: 14, fontWeight: '600', marginBottom: 10 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  gridItem: {
    width: '31%',
    backgroundColor: Colors.cardBg,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  gridImage:   { width: '100%', height: 90 },
  gridCaption: { color: Colors.textSecondary, fontSize: 10, padding: 4, textAlign: 'center' },

  analyzeBtn: { marginBottom: 16 },

  loadingBox: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: Colors.cardBg,
    borderRadius: 12,
    marginBottom: 16,
  },
  loadingText: { color: Colors.textSecondary, marginTop: 12, fontSize: 13, fontStyle: 'italic' },

  errorBox: {
    backgroundColor: '#fff8f3',
    borderLeftWidth: 5,
    borderLeftColor: Colors.redDark,
    borderRadius: 8,
    padding: 14,
    marginBottom: 16,
  },
  errorTitle: { color: '#4b2b1f', fontWeight: '700', fontSize: 14, marginBottom: 4 },
  errorMsg:   { color: '#4b2b1f', fontSize: 13 },
  errorHint:  { color: '#4b2b1f', fontSize: 12, marginTop: 6, fontStyle: 'italic' },

  metricsRow: { flexDirection: 'row', marginBottom: 16, marginHorizontal: -4 },

  resultsHeading: { color: Colors.white, fontSize: 17, fontWeight: '700', marginBottom: 10 },

  tableCard: {
    backgroundColor: Colors.cardBg,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  tableHeader: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  rowEven: { backgroundColor: 'rgba(255,255,255,0.01)' },
  rowOdd:  { backgroundColor: 'transparent' },

  tableCell: { color: Colors.textPrimary, fontSize: 12 },
  colNo:   { width: 24, color: Colors.textSecondary },
  colImg:  { flex: 2, paddingRight: 6 },
  colCond: { flex: 1.5, paddingRight: 6 },
  colConf: { width: 76, textAlign: 'right' },
});
