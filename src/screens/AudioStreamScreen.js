import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Image,
  Animated,
  Easing,
  FlatList,
  Dimensions,
} from "react-native";
import TrackPlayer, {
  Capability,
  Event,
  RepeatMode,
  State,
  usePlaybackState,
} from "react-native-track-player";
import { Ionicons, Feather } from "@expo/vector-icons";
import WaveformAnimation from "../components/WaveformAnimation";
import { LinearGradient } from 'expo-linear-gradient';
import ChatInterface from "../components/ChatInterface";

// Placeholder - replace with your actual stream URL
const STREAM_URL = "https://listen.radioking.com/radio/722114/stream/787982";

// Sample News Data (Replace with actual data source if needed)
const newsData = [
  {
    id: "1",
    headline:
      "Contrôle des poids à Tiébissou en cours pour assurer la conformité aux normes UEMOA",
  },
  {
    id: "2",
    headline: "Nouveau radar installé sur l'autoroute du Nord PK 105",
  },
  {
    id: "3",
    headline:
      "Travaux de maintenance prévus ce week-end près de l'échangeur de Singrobo",
  },
  {
    id: "4",
    headline:
      "Conseils de sécurité pour les longs trajets pendant les vacances",
  },
];

const { width: screenWidth } = Dimensions.get("window");

const setupPlayer = async () => {
  try {
    await TrackPlayer.setupPlayer();
    await TrackPlayer.updateOptions({
      capabilities: [Capability.Play, Capability.Pause, Capability.Stop],
      compactCapabilities: [Capability.Play, Capability.Pause, Capability.Stop],
      // Icon for notification
      // notificationIcon: require('../path/to/your/notification-icon.png'), // Add your icon path
    });
    await TrackPlayer.add({
      url: STREAM_URL, // Your stream url
      title: "FER FM",
      artist: "La radio des routes et autoroutes",
      artwork: require('../../assets/logo-fer.png'), // Add your artwork path
      isLiveStream: true, // Important for live streams
    });
    // Set repeat mode if needed, often None for live streams
    await TrackPlayer.setRepeatMode(RepeatMode.Off);
  } catch (e) {
    console.error("Error setting up player:", e);
  }
};

const AudioStreamScreen = () => {
  const { state: playbackStateValue } = usePlaybackState();
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [textWidth, setTextWidth] = useState(null);
  const [containerWidth, setContainerWidth] = useState(null);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const animationRef = useRef(null);
  // Refs to track initial measurement
  const textMeasuredRef = useRef(false);
  const containerMeasuredRef = useRef(false);
  const [activeNewsIndex, setActiveNewsIndex] = useState(0);
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;
  const flatListRef = useRef(null); // Ref for FlatList
  const intervalRef = useRef(null); // Ref to store interval ID
  const userInteracting = useRef(false); // Ref to track manual interaction

  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function initializePlayer() {
      await setupPlayer();
      if (isMounted) {
        setIsPlayerReady(true);
      }
    }
    initializePlayer();

    return () => {
      isMounted = false;
      // Optional: Clean up player on unmount
      // TrackPlayer.destroy();
    };
  }, []);

  useEffect(() => {
    // Don't start animation until widths are measured
    if (textWidth === null || containerWidth === null) {
      return;
    }

    // Ensure previous animation is stopped if widths change
    if (animationRef.current) {
      animationRef.current.stop();
    }

    // Start position: off-screen right (previously left)
    slideAnim.setValue(containerWidth);

    // Create the animation
    animationRef.current = Animated.loop(
      Animated.timing(slideAnim, {
        toValue: -textWidth, // End position: off-screen left (previously right)
        duration: (containerWidth + textWidth) * 15, // Speed remains the same
        useNativeDriver: true,
        easing: Easing.linear, // Constant speed
      })
    );

    // Start the animation
    animationRef.current.start();

    // Cleanup function: Stop the animation stored in the ref
    return () => {
      if (animationRef.current) {
        animationRef.current.stop();
        // Optional: set ref to null if component unmounts fully
        // animationRef.current = null;
      }
    };
  }, [slideAnim, textWidth, containerWidth]); // Rerun effect if widths change

  const togglePlayback = async () => {
    if (!isPlayerReady) return;

    const currentTrack = await TrackPlayer.getCurrentTrack();
    if (currentTrack == null) {
      // Handle case where track isn't loaded yet or setup failed
      console.log("Track not ready or setup failed.");
      await setupPlayer(); // Try to setup again
      await TrackPlayer.play();
    } else {
      if (
        playbackStateValue === State.Paused ||
        playbackStateValue === State.Ready ||
        playbackStateValue === State.Stopped ||
        playbackStateValue === State.None
      ) {
        await TrackPlayer.play();
      } else {
        await TrackPlayer.pause();
      }
    }
  };

  // Determine if the player is currently playing
  const isPlaying = playbackStateValue === State.Playing;

  // Function to scroll to the next slide
  const scrollToNext = useCallback(() => {
    if (
      userInteracting.current ||
      !flatListRef.current ||
      newsData.length === 0
    )
      return;

    const nextIndex = (activeNewsIndex + 1) % newsData.length;
    flatListRef.current.scrollToIndex({
      index: nextIndex,
      animated: true,
    });
    // Note: setActiveNewsIndex will be updated by onViewableItemsChanged
    // If onViewableItemsChanged proves unreliable with auto-scroll, uncomment below:
    // setActiveNewsIndex(nextIndex);
  }, [activeNewsIndex]);

  // Effect for auto-scrolling
  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    // Start new interval if not manually interacting
    if (!userInteracting.current) {
      intervalRef.current = setInterval(scrollToNext, 10000); // Adjust interval duration (4000ms = 4s)
    }

    // Cleanup: clear interval on unmount or when dependencies change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [scrollToNext]); // Re-run if scrollToNext changes (due to activeNewsIndex changing)

  // Callback to update active index based on viewable items
  const onViewableItemsChanged = useCallback(({ viewableItems }) => {
    if (viewableItems.length > 0 && !userInteracting.current) {
      // Only update if not interacting
      setActiveNewsIndex(viewableItems[0].index ?? 0);
    }
  }, []);

  // Pause auto-scroll on manual drag start
  const onScrollBeginDrag = () => {
    userInteracting.current = true;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  // Resume auto-scroll after manual drag end (with a delay)
  const onScrollEndDrag = () => {
    // Set timeout to re-enable after a short delay
    setTimeout(() => {
      userInteracting.current = false;
      // Restart interval using the effect dependency change
      scrollToNext(); // Trigger immediate scroll to sync state potentially
      if (intervalRef.current) clearInterval(intervalRef.current); // Clear just in case
      intervalRef.current = setInterval(scrollToNext, 4000);
    }, 1000); // 1 second delay before resuming
  };

  // Function to render each news slide
  const renderNewsItem = ({ item }) => (
    <View style={styles.newsSlide}>
      <Text style={styles.newsHeadline}>{item.headline}</Text>
    </View>
  );

  const renderPlayPauseButton = () => {
    const isLoading =
      !isPlayerReady ||
      playbackStateValue === State.Buffering ||
      playbackStateValue === State.Connecting;

    let iconName = isPlaying ? "pause" : "play";

    // if (isLoading) {
    //   return <ActivityIndicator size="large" color="#FFF" />;
    // }

    return (
      <TouchableOpacity
        onPress={togglePlayback}
        style={styles.playButton}
        disabled={isLoading}
      >
        <View style={styles.playButtonContent}>
          <View style={styles.iconCircle}>
            <Ionicons name={iconName} size={24} color="#333" />
          </View>
          <View
            style={styles.stationInfo}
            onLayout={(event) => {
              if (!containerMeasuredRef.current) {
                const newWidth = event.nativeEvent.layout.width;
                setContainerWidth(newWidth);
                containerMeasuredRef.current = true; // Mark as measured
              }
            }}
          >
            <Text style={styles.stationName}>FER FM</Text>
            <Text style={styles.frequency}>101.3 MHz</Text>
            <Animated.Text
              style={[
                styles.stationTagline,
                {
                  transform: [{ translateX: slideAnim }],
                  width: textWidth,
                  opacity: textWidth !== null ? 1 : 0,
                },
              ]}
              numberOfLines={1}
              onLayout={(event) => {
                if (!textMeasuredRef.current) {
                  const newWidth = event.nativeEvent.layout.width;
                  setTextWidth(newWidth);
                  textMeasuredRef.current = true; // Mark as measured
                }
              }}
            >
              La radio des routes et autoroutes
            </Animated.Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <LinearGradient
      colors={['#262354', '#000000']}
      style={styles.gradientContainer}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logo}>
              <Image
                source={require("../../assets/logo-fer.png")}
                style={styles.logoImage}
              />
            </View>
            <TouchableOpacity style={styles.chatContainer} onPress={() => setShowChat(true)}>
              <View>
                <Text style={styles.fermanText}>Ferman</Text>
                <Text style={styles.fermanTextTiny}>notre agent IA</Text>
              </View>
              <View>
                <Image
                  source={require("../../assets/chat-ai.png")}
                  style={{ width: 25, height: 25 }}
                />
              </View>
            </TouchableOpacity>
          </View>

          {/* News Section - Carousel */}
          <View style={styles.newsSectionContainer}>
            <Text style={styles.breakingNewsLabel}>ACTU DE DERNIÈRE MINUTE</Text>
            <FlatList
              ref={flatListRef}
              data={newsData}
              renderItem={renderNewsItem}
              keyExtractor={(item) => item.id}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onViewableItemsChanged={onViewableItemsChanged}
              viewabilityConfig={viewabilityConfig}
              style={styles.newsCarousel}
              onScrollBeginDrag={onScrollBeginDrag}
              onScrollEndDrag={onScrollEndDrag}
            />
            {/* Pagination Dots */}
            <View style={styles.paginationContainer}>
              {newsData.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.paginationDot,
                    index === activeNewsIndex ? styles.paginationDotActive : null,
                  ]}
                />
              ))}
            </View>
          </View>

          {/* Audio Visualization */}
          <View style={styles.visualizationContainer}>
            <WaveformAnimation isPlaying={isPlaying} />
          </View>

          {/* Player Controls */}
          <View style={styles.playerContainer}>{renderPlayPauseButton()}</View>
        </View>
      </SafeAreaView>
      <ChatInterface visible={showChat} onClose={() => setShowChat(false)} />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 30,
    // paddingHorizontal: 20,
  },
  logo: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoText: {
    color: "#FEDA2B",
    fontWeight: "bold",
    fontSize: 18,
  },
  chatContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  fermanText: {
    color: "#FEDA2B",
    fontWeight: "bold",
    fontSize: 18,
  },
  fermanTextTiny: {
    color: "white",
    fontWeight: "regular",
    fontSize: 10,
  },
  newsSectionContainer: {
    marginTop: 60,
    marginBottom: 20,
  },
  breakingNewsLabel: {
    color: "#FF3B30",
    fontWeight: "bold",
    marginBottom: 15,
    fontSize: 14,
  },
  newsCarousel: {
    marginBottom: 10,
  },
  newsSlide: {
    width: screenWidth - 40,
  },
  newsHeadline: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
    lineHeight: 32,
  },
  visualizationContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 10,
  },
  waveformImage: {
    width: "100%",
    height: 120,
  },
  playerContainer: {
    marginBottom: 40,
  },
  playButton: {
    backgroundColor: "#FEDA2B",
    borderRadius: 30,
    padding: 15,
  },
  playButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },
  stationInfo: {
    flex: 1,
    overflow: "hidden",
  },
  stationName: {
    color: "#333",
    fontWeight: "bold",
    fontSize: 16,
  },
  frequency: {
    color: "#333",
    fontSize: 14,
  },
  stationTagline: {
    color: "#333",
    fontSize: 12,
    opacity: 0.8,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20, // Half of width/height
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "left",
    alignItems: "center",
    marginTop: 10,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FFFFFF80", // Semi-transparent white
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: "#FFFFFF", // Solid white
  },
});

export default AudioStreamScreen;
