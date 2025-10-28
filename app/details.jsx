// app/details.jsx
import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Image,
  FlatList,
  useWindowDimensions,
  Alert,
  Linking,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import { PLANT_ID_API_KEY } from "./plantid";
// Toggle mock data to save API credits
const USE_FAKE_RESULTS = true;

export default function Details() {
  const router = useRouter();
  const { uri } = useLocalSearchParams();
  const { width } = useWindowDimensions();

  const [loading, setLoading] = useState(true);
  const [ordered, setOrdered] = useState([]);       // all suggestions, sorted desc
  const [currentIndex, setCurrentIndex] = useState(0); // which suggestion is shown
  const [showOthers, setShowOthers] = useState(false);
  const [active, setActive] = useState(0); // gallery pager dot

  const createIdentification = async (imagesArray) => {
    const res = await fetch("https://plant.id/api/v3/identification", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Api-Key": PLANT_ID_API_KEY },
      body: JSON.stringify({ images: imagesArray, similar_images: true }),
    });
    const txt = await res.text();
    if (!res.ok) throw new Error(`Create ${res.status}: ${txt}`);
    return JSON.parse(txt);
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
      language: "en",
    }).toString();
    const res = await fetch(`https://plant.id/api/v3/identification/${token}?${params}`, {
      headers: { "Api-Key": PLANT_ID_API_KEY },
    });
    const txt = await res.text();
    if (!res.ok) throw new Error(`Retrieve ${res.status}: ${txt}`);
    return JSON.parse(txt);
  };

  const identify = useCallback(async () => {
    if (USE_FAKE_RESULTS) {
      await new Promise((r) => setTimeout(r, 500));
      const mock = [
        {
          label: "String of Buttons",
          sci: "Curio repens",
          confidence: 0.95,
          details: {
            common_names: ["String of Buttons"],
            wiki_description: { value: "A creeping succulent with blue-green, button-like leaves." },
            edible_parts: [],
            watering: { min: 0.1, max: 0.3 },
            url: "https://en.wikipedia.org/wiki/Curio_repens",
          },
          gallery: [
            "https://images.unsplash.com/photo-1545249390-5c6f2f9c2f5d?q=80&w=1200",
            "https://images.unsplash.com/photo-1520896696177-2c17c7c47a9f?q=80&w=1200",
          ],
        },
        {
          label: "Senecio serpens",
          sci: "Senecio serpens",
          confidence: 0.78,
          details: { common_names: ["Blue Chalksticks"], wiki_description: { value: "A blue-grey succulent." } },
          gallery: ["https://images.unsplash.com/photo-1604586374968-3e2fd1f3e3f5?q=80&w=1200"],
        },
        {
          label: "Crassula perforata",
          sci: "Crassula perforata",
          confidence: 0.62,
          details: { common_names: ["String of Buttons (Crassula)"], wiki_description: { value: "Stacked leaves on columns." } },
          gallery: ["https://images.unsplash.com/photo-1501004318641-b39e6451bec6?q=80&w=1200"],
        },
      ];
      setOrdered(mock);
      setCurrentIndex(0);
      setLoading(false);
      return;
    }

    if (!uri || !String(uri).startsWith("file://")) {
      throw new Error("Invalid file URI");
    }

    const base64 = await FileSystem.readAsStringAsync(String(uri), { encoding: "base64" });

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

    const token = created?.id || created?.access_token;
    const full = token ? await retrieveIdentification(token) : created;

    const suggestions =
      full?.result?.classification?.suggestions ??
      full?.result?.is_plant?.classification?.suggestions ??
      [];

    if (!suggestions.length) {
      setOrdered([]);
      setCurrentIndex(0);
      setLoading(false);
      Alert.alert("No matches", "Try a closer, well-lit photo of a single leaf/flower.");
      return;
    }

    const mapped = suggestions
      .map((s) => ({
        label: s?.name || "Unknown",
        sci: s?.name,
        confidence: Number(s?.probability ?? 0),
        details: s?.details || null,
        gallery: (s?.similar_images || []).map((img) => img?.url).filter(Boolean),
      }))
      .sort((a, b) => (b.confidence || 0) - (a.confidence || 0));

    // Fallback hero if needed
    if (!mapped[0].gallery?.length && uri) mapped[0].gallery = [String(uri)];

    setOrdered(mapped);
    setCurrentIndex(0);
    setLoading(false);
  }, [uri]);

  useEffect(() => {
    setLoading(true);
    identify().catch((e) => {
      setLoading(false);
      Alert.alert("Identification failed", String(e?.message || "Unknown error").slice(0, 300));
    });
  }, [identify]);

  const current = ordered[currentIndex];
  const others = ordered.filter((_, i) => i !== currentIndex).slice(0, 2);

  const percent = (n) => `${Math.round((Number(n) || 0) * 100)}%`;
  const careBadge = (d) => {
    if (!d?.watering) return "Moderate to Care";
    const avg = ((d.watering.min ?? 0.5) + (d.watering.max ?? 0.5)) / 2;
    return avg <= 0.25 ? "Easy Care" : avg <= 0.55 ? "Moderate to Care" : "Thirsty";
  };
  const edibleBadge = (d) => (d?.edible_parts?.length ? "Edible" : "Not edible");
  const floweringBadge = (d) =>
    d?.wiki_description?.value?.toLowerCase?.().includes("flower") ? "Flowering" : "Foliage";

  const gallery = current?.gallery || [];
  const onScrollEnd = (e) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    setActive(i);
  };

  const promote = (option) => {
    const idx = ordered.findIndex((x) => x.label === option.label);
    if (idx >= 0) {
      setCurrentIndex(idx);
      setShowOthers(false);
      setActive(0);
    }
  };

  const onBackPress = () => {
    if (currentIndex !== 0) {
      // go back to original first suggestion
      setCurrentIndex(0);
      setShowOthers(false);
    } else {
      router.back();
    }
  };

  return (
    <View style={styles.fill}>
      <SafeAreaView style={styles.topBar}>
        <Pressable onPress={onBackPress} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={26} color="#fff" />
        </Pressable>
        <Text style={styles.topTitle}>Result</Text>
        <View style={{ width: 40 }} />
      </SafeAreaView>

      {loading ? (
        <View style={[styles.fill, styles.center]}>
          <ActivityIndicator />
          <Text style={{ color: "#fff", marginTop: 8 }}>Identifying…</Text>
        </View>
      ) : !current ? (
        <View style={[styles.fill, styles.center]}>
          <Text style={{ color: "#fff" }}>No result</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Swipeable gallery */}
          <View style={{ width: "100%" }}>
            <FlatList
              data={gallery}
              keyExtractor={(u, i) => `${i}-${u}`}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={onScrollEnd}
              renderItem={({ item }) => (
                <Image source={{ uri: item }} style={[styles.hero, { width }]} />
              )}
            />
            <View style={styles.dotsRow}>
              {gallery.map((_, i) => (
                <View key={i} style={[styles.dot, i === active && styles.dotActive]} />
              ))}
            </View>
          </View>

          {/* Info section */}
          <View style={styles.info}>
            <Text style={styles.plantName}>
              {current.details?.common_names?.[0] || current.label}
            </Text>
            <Text style={styles.sciName}>{current.sci || current.label}</Text>

            <View style={styles.confRow}>
              <Text style={styles.confLabel}>Confidence</Text>
              <Text style={styles.confValue}>{percent(current.confidence)}</Text>
            </View>

            <View style={styles.chips}>
              <Chip icon="leaf" label={careBadge(current.details)} />
              <Chip icon="restaurant" label={edibleBadge(current.details)} />
              <Chip icon="flower" label={floweringBadge(current.details)} />
            </View>

            {!!current.details?.wiki_description?.value && (
              <Text style={styles.desc} numberOfLines={4}>
                {current.details.wiki_description.value}
              </Text>
            )}

            <View style={styles.ctaRow}>
              <Pressable style={styles.addBtn}>
                <Ionicons name="pricetag" size={18} color="#fff" />
                <Text style={styles.addText}>Add to My Plants</Text>
              </Pressable>

              {current.details?.url ? (
                <Pressable
                  onPress={() => Linking.openURL(current.details.url)}
                  style={styles.linkBtn}
                >
                  <Ionicons name="open-outline" size={18} color="#8ed5a1" />
                  <Text style={styles.linkBtnText}>Learn more</Text>
                </Pressable>
              ) : null}
            </View>

            {others.length > 0 && (
              <Pressable onPress={() => setShowOthers((s) => !s)} style={{ marginTop: 20 }}>
                <Text style={styles.linkText}>
                  {showOthers ? "Hide alternatives" : "Not your plant?"}
                </Text>
              </Pressable>
            )}
          </View>

          {/* Alternatives */}
          {showOthers && others.length > 0 && (
            <View style={styles.altWrap}>
              {others.map((opt, idx) => (
                <Pressable key={idx} style={styles.altCard} onPress={() => promote(opt)}>
                  <Image
                    source={{ uri: opt.gallery?.[0] || gallery?.[0] || String(uri) }}
                    style={styles.altImg}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.altTitle} numberOfLines={1}>
                      {opt.details?.common_names?.[0] || opt.label}
                    </Text>
                    <Text style={styles.altSub} numberOfLines={1}>
                      {opt.sci || opt.label}
                    </Text>
                  </View>
                  <Text style={styles.altPct}>{percent(opt.confidence)}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

/* ---- Small Chip component ---- */
function Chip({ icon, label }) {
  return (
    <View style={chipStyles.wrap}>
      <Ionicons name={icon} size={14} color="#2BB94F" />
      <Text style={chipStyles.text}>{label}</Text>
    </View>
  );
}

const chipStyles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(43,185,79,0.12)",
    borderWidth: 1,
    borderColor: "rgba(43,185,79,0.25)",
  },
  text: { color: "#cfead6", fontSize: 12, fontWeight: "600" },
});

/* ---- Styles ---- */
const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: "#0b1015" },
  scroll: { flex: 1 },
  center: { alignItems: "center", justifyContent: "center" },
  topBar: {
    position: "absolute",
    top: 0, left: 0, right: 0,
    zIndex: 10,
    paddingHorizontal: 12,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  topTitle: { color: "#fff", fontSize: 16, fontWeight: "700" },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center", justifyContent: "center",
  },
  content: { paddingTop: 64, paddingHorizontal: 16, paddingBottom: 24, gap: 16 },
  hero: { height: undefined, aspectRatio: 4 / 3, borderRadius: 16, backgroundColor: "#11161c" },
  dotsRow: {
    position: "absolute",
    bottom: 10, left: 0, right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.4)" },
  dotActive: { backgroundColor: "#fff" },
  info: {
    backgroundColor: "#0e141a",
    borderRadius: 18,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  plantName: { color: "#fff", fontSize: 24, fontWeight: "800" },
  sciName: { color: "rgba(255,255,255,0.8)", fontStyle: "italic" },
  confRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
  confLabel: { color: "rgba(255,255,255,0.8)" },
  confValue: { color: "#fff", fontWeight: "800" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  desc: { color: "rgba(255,255,255,0.9)", marginTop: 8, lineHeight: 20 },
  ctaRow: { flexDirection: "row", gap: 12, marginTop: 12, alignItems: "center" },
  addBtn: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: "#2BB94F",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: "center",
  },
  addText: { color: "#fff", fontWeight: "800" },
  linkBtn: {
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(142,213,161,0.35)",
    backgroundColor: "rgba(228,235,229,0.08)",
  },
  linkBtnText: { color: "#8ed5a1", fontWeight: "700" },
  altWrap: { marginTop: 12, gap: 10 },
  altCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  altImg: { width: 56, height: 56, borderRadius: 8, backgroundColor: "#11161c" },
  altTitle: { color: "#fff", fontWeight: "700" },
  altSub: { color: "rgba(255,255,255,0.8)", fontStyle: "italic", fontSize: 12 },
  altPct: { color: "#fff", fontWeight: "800" },
});
