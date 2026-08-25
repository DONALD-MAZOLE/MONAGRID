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
import StatusCard from '../components/StatusCard';
import ProbabilityBar from '../components/ProbabilityBar';
import { predictSingle } from '../services/apiService';

export default function SingleAnalysisScreen() {
  const [imageUri, setImageUri]   = useState(null);
  const [imageName, setImageName] = useState('');
  const [imageMime, setImageMime] = useState('image/jpeg');
  const [loading, setLoading]     = useState(false);
  const [result, setResult]       = useState(null);   // raw API response
  const [error, setError]         = useState(null);

  // ── Pick from library ─────────────────────────────────────
  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission Required', 'Please allow access to your photo library.');
      return;
    }
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });
    if (!picked.canceled && picked.assets.length > 0) {
      const asset = picked.assets[0];
      setImageUri(asset.uri);
      setImageName(asset.fileName || 'panel.jpg');
      setImageMime(asset.mimeType || 'image/jpeg');
      setResult(null);
      setError(null);
    }
  };

  // ── Capture from camera ───────────────────────────────────
  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission Required', 'Please allow camera access.');
      return;
    }
    const photo = await ImagePicker.launchCameraAsync({ quality: 1 });
    if (!photo.canceled && photo.assets.length > 0) {
      const asset = photo.assets[0];
      setImageUri(asset.uri);
      setImageName(asset.fileName || 'captured_panel.jpg');
      setImageMime(asset.mimeType || 'image/jpeg');
      setResult(null);
      setError(null);
    }
  };

  // ── Send to FastAPI /predict ──────────────────────────────
  const analyzeImage = async () => {
    if (!imageUri) return;
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const prediction = await predictSingle(imageUri, imageName, imageMime);
      setResult(prediction);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Probability entries from API response ─────────────────
  const probEntries = result?.probabilities
    ? Object.entries(result.probabilities)
    : [];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Real-time Solar Panel Inspection</Text>
        <Text style={styles.sub}>Upload or capture a solar panel image for AI-powered analysis</Text>

        {/* Upload Actions */}
        <View style={styles.uploadRow}>
          <TouchableOpacity style={styles.uploadBtn} onPress={pickImage} activeOpacity={0.75}>
            <Text style={styles.uploadIcon}>🖼️</Text>
            <Text style={styles.uploadBtnText}>Upload Image</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.uploadBtn} onPress={takePhoto} activeOpacity={0.75}>
            <Text style={styles.uploadIcon}>📷</Text>
            <Text style={styles.uploadBtnText}>Take Photo</Text>
          </TouchableOpacity>
        </View>

        {/* Preview */}
        {imageUri ? (
          <View style={styles.previewCard}>
            <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="cover" />
            <Text style={styles.imageName}>Inspection Target: {imageName}</Text>
            <GradientButton
              title="Analyze Image"
              onPress={analyzeImage}
              loading={loading}
              style={styles.analyzeBtn}
            />
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>☀️</Text>
            <Text style={styles.emptyText}>No image selected yet</Text>
            <Text style={styles.emptyHint}>Select or capture a solar panel image above</Text>
          </View>
        )}

        {/* Loading */}
        {loading && (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={Colors.green} size="large" />
            <Text style={styles.loadingText}>Sending to Monagrid AI model...</Text>
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
        {result && !loading && (
          <View style={styles.resultsBox}>
            <Text style={styles.resultsHeading}>Analysis Results</Text>

            <StatusCard
              label={result.label}
              confidence={result.confidence}
              confidencePct={result.confidence_pct}
              description={result.description}
              severity={result.severity}
            />

            {/* Probability distribution from API */}
            {probEntries.length > 0 && (
              <>
                <Text style={styles.matrixTitle}>Probability Distribution</Text>
                {probEntries.map(([lbl, score]) => (
                  <ProbabilityBar key={lbl} label={lbl} score={score} />
                ))}
              </>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: Colors.black },
  container: { flex: 1, backgroundColor: Colors.black },
  content:   { padding: 16, paddingBottom: 40 },

  heading: { color: Colors.white, fontSize: 20, fontWeight: '800', marginBottom: 6, letterSpacing: 0.2 },
  sub:     { color: Colors.textSecondary, fontSize: 13, marginBottom: 20, lineHeight: 18 },

  uploadRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  uploadBtn: {
    flex: 1,
    backgroundColor: Colors.cardBg2,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  uploadIcon:    { fontSize: 28, marginBottom: 6 },
  uploadBtnText: { color: Colors.textPrimary, fontSize: 13, fontWeight: '600' },

  previewCard: {
    backgroundColor: Colors.cardBg,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  previewImage: { width: '100%', height: 220 },
  imageName:    { color: Colors.textSecondary, fontSize: 12, padding: 10 },
  analyzeBtn:   { margin: 12, marginTop: 0 },

  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: Colors.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: Colors.textPrimary, fontSize: 16, fontWeight: '600' },
  emptyHint: { color: Colors.textSecondary, fontSize: 12, marginTop: 4 },

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

  resultsBox: {
    backgroundColor: Colors.cardBg,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  resultsHeading: { color: Colors.white, fontSize: 17, fontWeight: '700', marginBottom: 10 },
  matrixTitle:    { color: Colors.white, fontSize: 14, fontWeight: '600', marginTop: 14, marginBottom: 6 },
});
