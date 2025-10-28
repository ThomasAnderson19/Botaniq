// app/preview.jsx
import React from "react";
import { View, Text, Image, StyleSheet, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function Preview() {
  const router = useRouter();
  const { uri } = useLocalSearchParams();
  const hasPhoto = typeof uri === "string" && uri.length > 0;

  return (
    <View style={styles.fill}>
      <SafeAreaView style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={26} color="#fff"/>
        </Pressable>
        <View style={{ width: 40 }} />
      </SafeAreaView>

      <View style={styles.content}>
        {hasPhoto ? (
          <Image source={{ uri }} style={styles.photo} />
        ) : (
          <View style={[styles.photo, styles.placeholder]}>
            <Ionicons name="image" size={40} color="#888" />
            <Text style={{ color: "#bbb" }}>No image</Text>
          </View>
        )}

        <View style={styles.actions}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
          >
            <Ionicons name="camera" size={18} color="#fff" />
            <Text style={styles.secondaryText}>Retake</Text>
          </Pressable>

          <Pressable
            onPress={() => router.push({ pathname: "/details", params: { uri } })}
            disabled={!hasPhoto}
            style={({ pressed }) => [
              styles.primaryBtn,
              pressed && styles.pressed,
              !hasPhoto && { opacity: 0.5 },
            ]}
          >
            <Ionicons name="leaf" size={18} color="#fff" />
            <Text style={styles.primaryText}>Identify</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: "#6f9bc7ff" },
  topBar: {
    position: "absolute", top: 0, left: 0, right: 0, zIndex: 10,
    paddingHorizontal: 12, paddingBottom: 8,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  topTitle: { color: "#fff", fontSize: 16, fontWeight: "700" },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center", justifyContent: "center",
  },
  content: { flex: 1, paddingTop: 64, paddingHorizontal: 16, gap: 16 },
  photo: { width: "100%", aspectRatio: 3 / 4, borderRadius: 16, backgroundColor: "#11161c" },
  placeholder: { alignItems: "center", justifyContent: "center" },
  actions: { flexDirection: "row", gap: 12, marginTop: 8 },
  primaryBtn: {
    flex: 1, backgroundColor: "#2BB94F", paddingVertical: 14, borderRadius: 14,
    alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8,
  },
  primaryText: { color: "#fff", fontWeight: "800" },
  secondaryBtn: {
    flex: 1, backgroundColor: "rgba(255,255,255,0.1)", paddingVertical: 14,
    borderRadius: 14, alignItems: "center", justifyContent: "center",
    flexDirection: "row", gap: 8, borderWidth: 1, borderColor: "rgba(255,255,255,0.12)",
  },
  secondaryText: { color: "#fff", fontWeight: "700" },
  pressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
});
