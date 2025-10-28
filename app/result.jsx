// app/result.jsx
import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
// ✅ result.jsx is in /app, so use a relative import:
import { PLANT_ID_API_KEY } from "./plantid";

export default function Result() {
  const router = useRouter();
  const { uri } = useLocalSearchParams();

  const [loading, setLoading] = useState(false);
  const [preds, setPreds] = useState(null);

  const hasPhoto = typeof uri === "string" && uri.length > 0;

  const createIdentification = async (imagesArray) => {
    const res = await fetch("https://plant.id/api/v3/identification", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Api-Key": PLANT_ID_API_KEY,
      },
      body: JSON.stringify({
        images: imagesArray,
        similar_images: true,
      }),
    });

    const text = await res.text();
    if (!res.ok) {
      console.warn("Plant.id CREATE error:", res.status, text);
      throw new Error(`Create ${res.status}: ${text}`);
    }
    try {
      return JSON.parse(text);
    } catch {
      throw new Error("Create: Invalid JSON response");
    }
  };

  const retrieveIdentification = async (token) => {
    const params = new URLSearchParams({
      details: [
        "common_names",
        "url",
        "wiki_description",
        "edible_parts",
        "watering",
        "toxicity",
      ].join(","),
      language: "da", // or "en"
    }).toString();

    const res = await fetch(
      `https://plant.id/api/v3/identification/${token}?${params}`,
      { headers: { "Api-Key": PLANT_ID_API_KEY } }
    );

    const text = await res.text();
    if (!res.ok) {
      console.warn("Plant.id RETRIEVE error:", res.status, text);
      throw new Error(`Retrieve ${res.status}: ${text}`);
    }
    try {
      return JSON.parse(text);
    } catch {
      throw new Error("Retrieve: Invalid JSON response");
    }
  };

  const identifyPlant = useCallback(async (imageUri) => {
    // 1) Read photo as base64
    const base64 = await FileSystem.readAsStringAsync(imageUri, { encoding: 'base64' });


    // 2) Try create WITHOUT prefix first; if 400, retry WITH prefix
    let created;
    try {
      created = await createIdentification([base64]);
    } catch (e) {
      if (String(e.message).includes("Create 400")) {
        created = await createIdentification([`data:image/jpeg;base64,${base64}`]);
      } else {
        throw e;
      }
    }

    // Accept either .id or .access_token
    const token = created?.id || created?.access_token;
    let full = created;

    // 3) Retrieve details if we got a token
    if (token) {
      full = await retrieveIdentification(token);
    }

    // 4) Normalize for UI
    const suggestions =
      full?.result?.classification?.suggestions ??
      full?.result?.is_plant?.classification?.suggestions ??
      [];

    return suggestions.map((s) => ({
      label: s?.name || "Unknown",
      confidence: Number(s?.probability ?? 0),
      details: s?.details || null,
      similar_images: s?.similar_images || [],
    }));
  }, []);

  const onIdentify = useCallback(async () => {
    if (!hasPhoto) {
      Alert.alert("No photo", "Please capture a photo first.");
      return;
    }
    try {
      setLoading(true);
      const results = await identifyPlant(uri);
      setPreds(results);

      if (!results?.length) {
        Alert.alert("No matches", "Try a closer, well-lit photo of a single leaf/flower.");
      }
    } catch (e) {
      console.warn("Identify error:", e);
      // Surface the API status & body up to 300 chars
      Alert.alert("Identification failed", String(e?.message || "Unknown error").slice(0, 300));
    } finally {
      setLoading(false);
    }
  }, [hasPhoto, identifyPlant, uri]);

  return (
    <View style={styles.fill}>
      {/* Top bar */}
      <SafeAreaView style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={26} color="#fff" />
        </Pressable>
        <Text style={styles.topTitle}>Result</Text>
        <View style={{ width: 40 }} />
      </SafeAreaView>

      {/* Content */}
      <ScrollView contentContainerStyle={styles.content}>
        {/* Photo */}
        {hasPhoto ? (
          <Image source={{ uri }} style={styles.photo} />
        ) : (
          <View style={[styles.photo, styles.photoPlaceholder]}>
            <Ionicons name="image" size={40} color="#999" />
            <Text style={styles.dim}>No image</Text>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
          >
            <Ionicons name="camera" size={18} color="#fff" />
            <Text style={styles.secondaryText}>Retake</Text>
          </Pressable>

          <Pressable
            onPress={onIdentify}
            disabled={loading || !hasPhoto}
            style={({ pressed }) => [
              styles.primaryBtn,
              (pressed || loading) && styles.pressed,
              !hasPhoto && { opacity: 0.5 },
            ]}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="leaf" size={18} color="#fff" />
                <Text style={styles.primaryText}>Identify</Text>
              </>
            )}
          </Pressable>
        </View>

        {/* Predictions */}
        {preds && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Top matches</Text>
            <View style={styles.list}>
              {preds.map((p, idx) => (
                <View key={idx} style={styles.row}>
                  <Text style={styles.label}>{p.label}</Text>

                  {p.details?.common_names?.length ? (
                    <Text style={styles.dimSmall}>
                      Also known as: {p.details.common_names.slice(0, 3).join(", ")}
                    </Text>
                  ) : null}

                  <View style={styles.barWrap}>
                    <View
                      style={[
                        styles.barFill,
                        { width: `${Math.round(p.confidence * 100)}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.score}>{Math.round(p.confidence * 100)}%</Text>
                </View>
              ))}
            </View>
            <Text style={styles.note}>
              Results may be approximate. Don’t ingest plants based on app results. Check toxicity
              info and consult a local expert when in doubt.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: "#0b1015" },

  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: 12,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  topTitle: { color: "#fff", fontSize: 16, fontWeight: "700" },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },

  content: {
    paddingTop: 64,
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 16,
  },

  photo: {
    width: "100%",
    aspectRatio: 3 / 4,
    borderRadius: 16,
    backgroundColor: "#11161c",
  },
  photoPlaceholder: { alignItems: "center", justifyContent: "center" },
  dim: { color: "rgba(255,255,255,0.8)" },
  dimSmall: { color: "rgba(255,255,255,0.8)", fontSize: 12 },

  actions: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: "#2BB94F",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  primaryText: { color: "#fff", fontWeight: "800" },
  secondaryBtn: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  secondaryText: { color: "#fff", fontWeight: "700" },
  pressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },

  card: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 16,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  cardTitle: { color: "#fff", fontWeight: "800", fontSize: 16 },
  list: { gap: 12 },
  row: { gap: 6 },
  label: { color: "#fff", fontWeight: "600" },
  barWrap: {
    height: 8,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 8,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    backgroundColor: "#2BB94F",
  },
  score: { color: "rgba(255,255,255,0.8)", fontSize: 12 },
  note: { color: "rgba(255,255,255,0.7)", fontSize: 12 },
});
