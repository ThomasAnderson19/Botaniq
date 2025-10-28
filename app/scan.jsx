// app/scan.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, Pressable, StyleSheet, Image, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function Scan() {
  const router = useRouter();
  const cameraRef = useRef(null);

  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState("back"); // 'front' | 'back'
  const [flash, setFlash] = useState("off");    // 'off' | 'on' | 'auto' | 'torch'
  const [isCapturing, setIsCapturing] = useState(false);
  const [previewUri, setPreviewUri] = useState(null);

  useEffect(() => {
    if (!permission) requestPermission();
  }, []);

  if (!permission) {
    // still loading permission state
    return (
      <SafeAreaView style={[styles.fill, styles.center]}>
        <ActivityIndicator />
        <Text style={styles.textDim}>Preparing camera…</Text>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={[styles.fill, styles.center, { padding: 24 }]}>
        <Ionicons name="camera" size={48} color="#fff" />
        <Text style={styles.title}>Camera access needed</Text>
        <Text style={styles.textDim}>
          NatureScan needs your camera to scan plants and trees.
        </Text>
        <Pressable onPress={requestPermission} style={styles.primaryBtn}>
          <Text style={styles.primaryBtnText}>Allow Camera</Text>
        </Pressable>
        <Pressable onPress={() => router.back()} style={styles.secondaryBtn}>
          <Text style={styles.secondaryBtnText}>Go Back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

 const onCapture = async () => {
  if (!cameraRef.current || isCapturing) return;
  try {
    setIsCapturing(true);
    const photo = await cameraRef.current.takePictureAsync({
      quality: 0.9,
      exif: false,
      skipProcessing: true,
    });

    // Go to result screen with the image URI
    router.push({ pathname: "/preview", params: { uri: photo?.uri ?? "" } });
  } catch (e) {
    console.warn("capture failed", e);
  } finally {
    setIsCapturing(false);
  }
};


  return (
    <View style={styles.fill}>
      {/* Live camera preview */}
      <CameraView
        ref={cameraRef}
        style={styles.fill}
        facing={facing}
        flash={flash}
        animateShutter
        // optional: enable barcode scanner etc. later
      />

      {/* Top bar */}
      <SafeAreaView style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </Pressable>

        <View style={{ flexDirection: "row", gap: 12 }}>
          <Pressable
            onPress={() => setFlash((f) => (f === "off" ? "on" : "off"))}
            style={styles.iconBtn}
          >
            <Ionicons name={flash === "off" ? "flash-off" : "flash"} size={22} color="#fff" />
          </Pressable>
          <Pressable
            onPress={() => setFacing((f) => (f === "back" ? "front" : "back"))}
            style={styles.iconBtn}
          >
            <Ionicons name="camera-reverse" size={22} color="#fff" />
          </Pressable>
        </View>
      </SafeAreaView>

      {/* Bottom capture UI */}
      <SafeAreaView style={styles.bottomBar}>
        {/* Last shot thumbnail (for now just a preview) */}
        <View style={styles.thumbWrap}>
          {previewUri ? (
            <Image source={{ uri: previewUri }} style={styles.thumb} />
          ) : (
            <View style={[styles.thumb, styles.thumbPlaceholder]}>
              <Ionicons name="image" size={16} color="#aaa" />
            </View>
          )}
        </View>

        <Pressable
          onPress={onCapture}
          style={({ pressed }) => [
            styles.shutter,
            pressed && { transform: [{ scale: 0.96 }], opacity: 0.9 },
          ]}
        >
          {isCapturing ? <ActivityIndicator /> : <View style={styles.shutterInner} />}
        </Pressable>

        {/* spacer to balance layout */}
        <View style={styles.thumbWrap} />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: "black" },
  center: { alignItems: "center", justifyContent: "center", gap: 12 },
  title: { color: "white", fontSize: 20, fontWeight: "700", marginTop: 8 },
  textDim: { color: "rgba(255,255,255,0.8)", textAlign: "center", marginTop: 6 },
  primaryBtn: {
    backgroundColor: "#2BB94F",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 16,
  },
  primaryBtnText: { color: "white", fontWeight: "700" },
  secondaryBtn: { paddingHorizontal: 12, paddingVertical: 10, marginTop: 8 },
  secondaryBtnText: { color: "rgba(255,255,255,0.8)" },

  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconBtn: {
    height: 40,
    width: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },

  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 24,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  shutter: {
    height: 80,
    width: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.85)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: "rgba(255,255,255,0.6)",
  },
  shutterInner: {
    height: 54,
    width: 54,
    borderRadius: 27,
    backgroundColor: "white",
  },

  thumbWrap: { width: 52, height: 52 },
  thumb: { width: "100%", height: "100%", borderRadius: 8 },
  thumbPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
});
