import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  useWindowDimensions,
  FlatList,
  ViewToken,
  StatusBar,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { useRef, useState, useCallback } from "react";
import { Colors, Radius } from "@/constants/Colors";
import { useLang } from "@/context/Languagecontext";

type SlideItem = {
  id: string;
  image: number;
};

const SLIDES: SlideItem[] = [
  { id: "slide2", image: require("@/assets/images/onboard3.png") },
  { id: "slide3", image: require("@/assets/images/onboard4.png") },
];

function Dots({ count, active }: { count: number; active: number }) {
  return (
    <View style={dotStyles.row}>
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          style={[dotStyles.dot, i === active && dotStyles.dotActive]}
        />
      ))}
    </View>
  );
}

const dotStyles = StyleSheet.create({
  row: { flexDirection: "row", gap: 6, justifyContent: "center" },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  dotActive: { width: 22, backgroundColor: Colors.primary, borderRadius: 3 },
});

export default function Onboarding() {
  const { t } = useLang();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatRef = useRef<FlatList>(null);
  const autoSlideTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const isScreenFocused = useRef(false);

  const onViewRef = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0) setActiveIndex(viewableItems[0].index ?? 0);
    },
  );
  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 });

  const stopAutoSlide = useCallback(() => {
    if (autoSlideTimer.current) {
      clearInterval(autoSlideTimer.current);
      autoSlideTimer.current = null;
    }
  }, []);

  const startAutoSlide = useCallback(() => {
    stopAutoSlide();
    if (!isScreenFocused.current) return;
    autoSlideTimer.current = setInterval(() => {
      if (!isScreenFocused.current) {
        stopAutoSlide();
        return;
      }
      setActiveIndex((prev) => {
        const next = (prev + 1) % SLIDES.length;
        flatRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, 3000);
  }, [stopAutoSlide]);

  useFocusEffect(
    useCallback(() => {
      isScreenFocused.current = true;
      startAutoSlide();

      // Immediately cancel the timer as soon as the user leaves the onboarding screen
      return () => {
        isScreenFocused.current = false;
        stopAutoSlide();
      };
    }, [startAutoSlide, stopAutoSlide])
  );

  // Bottom bar height so image area = screen minus bottom bar
  const bottomBarHeight = 130 + Math.max(insets.bottom, 16);

  // Image area = full screen height minus bottom bar
  const imageAreaHeight = height - bottomBarHeight;

  return (
    <View style={{ flex: 1, backgroundColor: "#0F172A" }}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="dark-content"
      />

      <FlatList
        ref={flatRef}
        data={SLIDES}
        keyExtractor={(s) => s.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewRef.current}
        viewabilityConfig={viewConfig.current}
        renderItem={({ item }) => (
          <View
            style={{ width, height: imageAreaHeight, backgroundColor: "#0F172A" }}
          >
            <Image
              source={item.image}
              style={{ width, height: imageAreaHeight, flex: 1 }}
              resizeMode="contain"
            />
          </View>
        )}
        getItemLayout={(_, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
        onMomentumScrollEnd={() => startAutoSlide()}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width,
          height: imageAreaHeight,
        }}
        scrollEventThrottle={16}
        decelerationRate="fast"
        bounces={false}
      />

      {/* Bottom bar always anchored below image */}
      <View
        style={[
          styles.bottomBar,
          {
            top: imageAreaHeight,
            paddingBottom: Math.max(insets.bottom, 16),
          },
        ]}
      >
        <Dots count={SLIDES.length} active={activeIndex} />

        <Pressable
          style={({ pressed }) => [
            styles.btnPrimary,
            pressed && { opacity: 0.85 },
          ]}
          onPress={() => {
            stopAutoSlide();
            router.push("/(auth)/language");
          }}
        >
          <Text style={styles.btnText}>{`${t("get_started")} →`}</Text>
        </Pressable>

        <View style={styles.loginRow}>
          <Text style={styles.loginText}>{t("have_account")} </Text>
          <Pressable onPress={() => {
            stopAutoSlide();
            router.push("/(auth)/login");
          }}>
            <Text style={styles.loginLink}>{t("login")}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    gap: 12,
    paddingTop: 16,
    paddingHorizontal: 24,
    backgroundColor: "#0F172A",
  },
  btnPrimary: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: 15,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontSize: 17, fontWeight: "800" },
  loginRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 2,
  },
  loginText: { color: "rgba(255,255,255,0.75)", fontSize: 14 },
  loginLink: { color: Colors.primary, fontSize: 14, fontWeight: "700" },
});