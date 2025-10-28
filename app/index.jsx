// app/index.jsx
import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  Easing,
  Platform,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

const BUTTON_SIZE = 180;

export default function Home() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // --- pulse glow for main Scan button ---
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulse]);

  const glowStyle = {
    transform: [
      { scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.15] }) },
    ],
    opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0] }),
  };

  const onPressScan = () => router.push("/scan");
  const onPressPlants = () => router.push("/plants");

  return (
    <View style={styles.container}>
      <StatusBar style="dark" translucent backgroundColor="transparent" />

      {/* Soft nature gradient background */}
      <LinearGradient
        colors={["#e9f7ef", "#d6f0e0", "#cbead7"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Organic leaf-like blobs (decorative, low opacity) */}
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <View style={[styles.blob, styles.blobA]} />
        <View style={[styles.blob, styles.blobB]} />
        <View style={[styles.blob, styles.blobC]} />
      </View>

      <SafeAreaView style={StyleSheet.absoluteFill} edges={["left", "right"]}>
        {/* App Bar */}
        <View style={[styles.appBar, { marginTop: insets.top + 4 }]}>
          <View style={styles.appTitleRow}>
            <Ionicons name="leaf" size={22} color="#2c7a4b" style={{ marginRight: 8 }} />
            <Text style={styles.appTitle}>Plant Scanner</Text>
          </View>

          {/* Quick access to My Plants in the top-right */}
          <Pressable
            onPress={onPressPlants}
            android_ripple={{ borderless: true, radius: 22 }}
            style={({ pressed }) => [
              styles.topMyPlants,
              pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Open My Plants"
          >
            <Ionicons name="pricetag" size={18} color="#2c7a4b" />
            <Text style={styles.topMyPlantsText}>My Plants</Text>
          </Pressable>
        </View>

        {/* Main area */}
        <View style={styles.center}>
          {/* Calm “nature” hint with icon + text */}
          <View style={styles.headerCopy}>
            <Text style={styles.title}>Identify plants with a scan</Text>
            <Text style={styles.subtitle}>
              Simple and beginner-friendly — better light means better matches.
            </Text>
          </View>

          {/* Large Scan button with leafy outline */}
          <View style={styles.buttonWrap}>
            <Animated.View style={[styles.glow, glowStyle]}>
              <LinearGradient
                colors={["rgba(64,180,109,0.35)", "rgba(64,180,109,0.0)"]}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>

            <View style={styles.leafyRing} />

            <Pressable
              onPress={onPressScan}
              android_ripple={{ borderless: true, radius: Math.round(BUTTON_SIZE / 2) }}
              style={({ pressed }) => [
                styles.scanButton,
                pressed && { transform: [{ scale: 0.98 }], opacity: 0.96 },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Scan a plant"
            >
              <Ionicons name="camera" size={56} color="#fff" />
            </Pressable>
          </View>
        </View>

        {/* Bottom bar with two clear actions */}
        <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <Pressable
            onPress={onPressScan}
            style={({ pressed }) => [
              styles.primaryAction,
              pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] },
            ]}
            android_ripple={{ color: "rgba(0,0,0,0.06)", radius: 140 }}
            accessibilityRole="button"
            accessibilityLabel="Scan a plant"
          >
            <Ionicons name="camera" size={22} color="#fff" />
            <Text style={styles.primaryActionText}>Scan</Text>
          </Pressable>

          <Pressable
            onPress={onPressPlants}
            style={({ pressed }) => [
              styles.secondaryAction,
              pressed && { opacity: 0.95, transform: [{ scale: 0.99 }] },
            ]}
            android_ripple={{ color: "rgba(44,122,75,0.08)", radius: 140 }}
            accessibilityRole="button"
            accessibilityLabel="Go to My Plants"
          >
            <Ionicons name="leaf-outline" size={22} color="#2c7a4b" />
            <Text style={styles.secondaryActionText}>My Plants</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#e9f7ef" },

  // App bar
  appBar: {
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  appTitleRow: { flexDirection: "row", alignItems: "center" },
  appTitle: {
    color: "#215a37",
    fontSize: 20,
    fontWeight: Platform.select({ ios: "700", android: "bold" }),
    letterSpacing: 0.3,
  },
  topMyPlants: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderWidth: 1,
    borderColor: "rgba(44,122,75,0.18)",
  },
  topMyPlantsText: {
    marginLeft: 6,
    color: "#2c7a4b",
    fontSize: 14,
    fontWeight: "600",
  },

  // Decorative blobs (organic shapes)
  blob: {
    position: "absolute",
    backgroundColor: "#bfe8cf",
    opacity: 0.25,
    borderRadius: 200,
    transform: [{ rotate: "12deg" }],
  },
  blobA: { width: 220, height: 220, top: -40, left: -60 },
  blobB: { width: 160, height: 160, top: 120, right: -50, transform: [{ rotate: "-8deg" }] },
  blobC: { width: 260, height: 260, bottom: -70, left: -40, transform: [{ rotate: "18deg" }] },

  // Center section
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  headerCopy: { alignItems: "center", marginBottom: 10, paddingHorizontal: 8 },
  title: {
    color: "#1f4d31",
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: 0.2,
    textAlign: "center",
  },
  subtitle: {
    color: "rgba(33,90,55,0.8)",
    marginTop: 8,
    fontSize: 14,
    textAlign: "center",
  },

  // Big scan button area
  buttonWrap: {
    width: BUTTON_SIZE + 64,
    height: BUTTON_SIZE + 64,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    marginTop: 8,
  },
  glow: { ...StyleSheet.absoluteFillObject, borderRadius: 999, overflow: "hidden" },

  // Leafy ring: subtle wood/leaf outline vibe
  leafyRing: {
    position: "absolute",
    height: BUTTON_SIZE + 24,
    width: BUTTON_SIZE + 24,
    borderRadius: 999,
    borderWidth: 8,
    borderColor: "rgba(44,122,75,0.12)",
    shadowColor: "#2BB94F",
    shadowOpacity: Platform.select({ ios: 0.15, android: 0.2 }),
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },

  scanButton: {
    height: BUTTON_SIZE,
    width: BUTTON_SIZE,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2BB94F",
    borderWidth: 6,
    borderColor: "rgba(255,255,255,0.75)",
  },
  scanLabel: {
    color: "#fff",
    marginTop: 8,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },

  // Bottom actions
  bottomBar: {
    paddingTop: 10,
    paddingHorizontal: 16,
    flexDirection: "row",
    gap: 10,
  },
  primaryAction: {
    flex: 1,
    backgroundColor: "#2BB94F",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    shadowColor: "#2BB94F",
    shadowOpacity: Platform.select({ ios: 0.25, android: 0.3 }),
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  primaryActionText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  secondaryAction: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(44,122,75,0.18)",
  },
  secondaryActionText: {
    color: "#2c7a4b",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
});
