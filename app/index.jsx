// app/index.jsx
import React, { useEffect, useRef } from "react";
import {
  SafeAreaView,
  View,
  Text,
  Pressable,
  StyleSheet,
  ImageBackground,
  Animated,
  Easing,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";

const BUTTON_SIZE = 180;

export default function Home() {
  const router = useRouter();

  // --- Pulse setup ---
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
      {
        scale: pulse.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.18],
        }),
      },
    ],
    opacity: pulse.interpolate({
      inputRange: [0, 1],
      outputRange: [0.35, 0],
    }),
  };
  // --- end pulse setup ---

  const onPressScan = () => router.push("/scan");

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <ImageBackground
        source={require("../assets/baugrund.png")}
        resizeMode="cover"
        style={styles.bg}
      >
        {/* Dark-to-transparent overlay for readability */}
        <LinearGradient
          colors={[
            "rgba(12,17,22,0.85)",
            "rgba(12,17,22,0.65)",
            "rgba(12,17,22,0.35)",
          ]}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.header}>
          <Text style={styles.title}>Botaniq</Text>
          <Text style={styles.subtitle}>Identify plants, flowers & trees</Text>
        </View>

        <View style={styles.center}>
          {/* Wrap glow + button so glow can be absolutely positioned behind */}
          <View style={styles.buttonWrap}>
            {/* Animated glow behind the button */}
            <Animated.View style={[styles.glow, glowStyle]}>
              <LinearGradient
                colors={["rgba(56,220,105,0.35)", "rgba(56,220,105,0.0)"]}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>

            <Pressable
              onPress={onPressScan}
              android_ripple={{ borderless: true, radius: 140 }}
              style={({ pressed }) => [
                styles.cameraButton,
                pressed && { transform: [{ scale: 0.98 }], opacity: 0.95 },
              ]}
            >
              <Ionicons name="camera" size={56} color="#fff" />
            </Pressable>
          </View>

          <Text style={styles.ctaLabel}>Tap to Scan</Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Tip: good light = better matches</Text>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0c1116" },
  bg: { flex: 1 },
  header: { alignItems: "center", marginTop: 36 },
  title: { color: "white", fontSize: 34, fontWeight: "800", letterSpacing: 0.3 },
  subtitle: { color: "rgba(255,255,255,0.85)", marginTop: 8, fontSize: 16 },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 18,
  },

  // Container for button + glow
  buttonWrap: {
    width: BUTTON_SIZE + 60,
    height: BUTTON_SIZE + 60,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  // The glow fills buttonWrap and gets animated
  glow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 999,
    overflow: "hidden",
  },

  cameraButton: {
    height: BUTTON_SIZE,
    width: BUTTON_SIZE,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2BB94F",
    borderWidth: 6,
    borderColor: "rgba(255,255,255,0.28)",
    shadowColor: "#2BB94F",
    shadowOpacity: 0.75,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },

  ctaLabel: { color: "white", fontSize: 18, opacity: 0.95 },
  footer: { alignItems: "center", marginBottom: 28 },
  footerText: { color: "rgba(255,255,255,0.75)", fontSize: 12 },
});
