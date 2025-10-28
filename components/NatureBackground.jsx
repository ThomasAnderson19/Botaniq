// components/NatureBackground.jsx
import React from "react";
import { View, StyleSheet, Platform } from "react-native";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";

export default function NatureBackground({
  children,
  statusBar = "dark", // or "light"
}) {
  return (
    <View style={styles.fill}>
      <StatusBar translucent backgroundColor="transparent" style={statusBar} />

      {/* Full-bleed gradient */}
      <LinearGradient
        colors={["#e9f7ef", "#d6f0e0", "#cbead7"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.absoluteFill}
      />

      {/* Decorative blobs */}
      <View pointerEvents="none" style={styles.absoluteFill}>
        <View style={[styles.blob, styles.blobA]} />
        <View style={[styles.blob, styles.blobB]} />
        <View style={[styles.blob, styles.blobC]} />
      </View>

      {/* Content */}
      <SafeAreaView style={styles.absoluteFill} edges={["left", "right"]}>
        {children}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: "#e9f7ef" },
  absoluteFill: StyleSheet.absoluteFillObject,
  blob: {
    position: "absolute",
    backgroundColor: "#bfe8cf",
    opacity: 0.25,
    borderRadius: 200,
    transform: [{ rotate: "12deg" }],
  },
  blobA: { width: 220, height: 220, top: -40, left: -60 },
  blobB: {
    width: 160,
    height: 160,
    top: 120,
    right: -50,
    transform: [{ rotate: "-8deg" }],
  },
  blobC: {
    width: 260,
    height: 260,
    bottom: -70,
    left: -40,
    transform: [{ rotate: "18deg" }],
  },
});
