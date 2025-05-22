import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  RefreshControl,
  Platform,
} from "react-native";
import { AudioPro, AudioProState, useAudioPro } from "react-native-audio-pro";
import ChatInterface from "../components/ChatInterface";
// import WaveformAnimation from "../components/WaveformAnimation";
import WaveAnimation from "../components/WaveAnimation";
import actuApi from "../api/actu";
import dayjs from "dayjs";
import "dayjs/locale/fr";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.locale("fr");
dayjs.extend(relativeTime);

// Placeholder - replace with your actual stream URL
const STREAM_URL = "https://listen.radioking.com/radio/722114/stream/787982";

// Sample News Data (Replace with actual data source if needed)

const { width: screenWidth } = Dimensions.get("window");

// Define the track object for AudioPro
const streamTrack = {
  id: "live-stream-001", // Unique ID for the track
  url: STREAM_URL, // Your stream url
  title: "FER FM",
  artist: "La radio des routes et autoroutes",
  artwork: require("../../assets/logo-fer.png"), // Use require for local assets
  // Note: AudioPro doesn't have an explicit 'isLiveStream' flag like TrackPlayer,
  // but it supports streaming URLs.
};

const AudioStreamScreen = () => {
  // Use the AudioPro hook to get state
  const { state: playbackStateValue, playingTrack } = useAudioPro();
  const [isPlayerSetup, setIsPlayerSetup] = useState(false); // Keep track if initial setup is done
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

  // Initial setup effect (optional, as config is in audioSetup.js)
  useEffect(() => {
    console.log("AudioStreamScreen mounted");
    setIsPlayerSetup(true); // Assume setup is done via audioSetup.js

    return () => {
      console.log("AudioStreamScreen unmounted");
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
        duration: (containerWidth + textWidth) * 25, // Increase multiplier to slow down (e.g., from 15 to 25)
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
      }
    };
  }, [slideAnim, textWidth, containerWidth]); // Rerun effect if widths change

  const togglePlayback = async () => {
    const isPlaying = playbackStateValue === AudioProState.PLAYING;
    const isLoading = playbackStateValue === AudioProState.LOADING;

    if (isLoading) {
      console.log("Player is loading...");
      return; // Don't do anything if loading
    }

    if (isPlaying) {
      console.log("Pausing...");
      await AudioPro.pause();
    } else {
      console.log("Playing/Resuming...");
      if (playingTrack?.id !== streamTrack.id) {
        console.log("Loading and playing track...");
        await AudioPro.play(streamTrack);
      } else {
        console.log("Resuming track...");
        await AudioPro.resume(); // Use resume if already loaded
      }
    }
  };

  // Determine if the player is currently playing or loading
  const isPlaying = playbackStateValue === AudioProState.PLAYING;
  const isLoading = playbackStateValue === AudioProState.LOADING;

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
      {/* <Text style={styles.newsHeadline}>{item.headline}</Text> */}
      <Text style={styles.newsHeadline}>{item.text}</Text>
      {item.created_at && (
        <Text style={styles.newsTimestamp}>
          {dayjs(item.created_at).fromNow()}
        </Text>
      )}
    </View>
  );

  // Define the play/pause button rendering logic here
  const renderPlayPauseButton = () => {
    let iconName = isPlaying ? "pause" : "play";

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

  // Load actual news
  const [newsData, setNewsData] = useState([]);

  const loadActus = async () => {
    const actu = await actuApi.loadActus();
    if (actu.results.length > 0) {
      setNewsData(actu.results);
    } else {
      setNewsData([
        {
          id: 1,
          text: "Aucune actualité pour le moment.",
          created_at: null,
        },
      ]);
    }
  };

  useEffect(() => {
    loadActus();
  }, []);

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    loadActus();
    setRefreshing(false);
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={[styles.gradientContainer]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Image
          source={require("../../assets/blur.png")}
          style={styles.blurImage}
        />

        <View style={{ marginBottom: 0, backgroundColor: "transparent" }}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logo}>
              <Image
                source={require("../../assets/logo-fer.png")}
                style={styles.logoImage}
              />
            </View>
            <TouchableOpacity
              style={styles.chatContainer}
              onPress={() => setShowChat(true)}
            >
              <View>
                <Text style={styles.fermanText}>#FERMAN</Text>
                <Text style={styles.fermanTextTiny}>Discutez avec l'IA</Text>
              </View>
              <View
                style={{
                  backgroundColor: "#FEDA2B",
                  borderRadius: 50,
                  height: 40,
                  width: 40,
                  justifyContent: "center",
                  alignItems: "center",
                  shadowColor: "#ECCB44",
                  shadowOffset: {
                    width: 0,
                    height: 4,
                  },
                  shadowOpacity: 0.25,
                  shadowRadius: 3.84,
                  elevation: 5,
                }}
              >
                <Image
                  source={require("../../assets/chat-ai-primary.png")}
                  style={{ width: 25, height: 25 }}
                />
              </View>
            </TouchableOpacity>
          </View>

          {/* {newsData.length > 0 && ( */}
          <View style={styles.newsSectionContainer}>
            <Text style={styles.breakingNewsLabel}>
              ACTU DE DERNIÈRE MINUTE
            </Text>
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
            <View style={styles.paginationContainer}>
              {newsData.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.paginationDot,
                    index === activeNewsIndex
                      ? styles.paginationDotActive
                      : null,
                  ]}
                />
              ))}
            </View>
          </View>
          {/* )} */}
        </View>

        {/* Chat Interface Modal */}
        <ChatInterface visible={showChat} onClose={() => setShowChat(false)} />
      </ScrollView>
      {/* Player Controls */}
      <View
        style={{
          position: "absolute",
          bottom: 80,
          left: 0,
          right: 0,
        }}
      >
        <View style={{ backgroundColor: "transparent" }}>
          {/* Audio Visualization */}
          <View style={styles.visualizationContainer}>
            {/* <WaveformAnimation isPlaying={isPlaying} /> */}
            <WaveAnimation
              isPlaying={isPlaying}
              style={{ height: 200, width: "90%" }}
            />
          </View>
        </View>
        <View style={styles.playerContainer}>{renderPlayPauseButton()}</View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  gradientContainer: {
    // flex: 1,
    // backgroundColor: "yellow",
  },
  blurImage: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
  },
  content: {
    // flex: 1,
    // paddingTop: Platform.OS === "android" ? 40 : 0,
    // paddingHorizontal: 20,
    // backgroundColor: "red",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Platform.OS === "android" ? 50 : 10,
    marginBottom: 30,
    paddingHorizontal: 20,
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
  controlsContainer: {
    alignItems: "center",
    marginBottom: 30, // Add some space below controls
  },
  playButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)", // Semi-transparent white
    borderRadius: 50, // Make it circular
    padding: 20,
    marginBottom: 20, // Space between button and waveform
  },
  newsSectionContainer: {
    marginTop: 30,
    paddingHorizontal: 20,
    // maxHeight: 250,
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
    fontSize: 20,
    fontWeight: "bold",
    lineHeight: 26,
  },
  visualizationContainer: {
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 10,
  },
  waveformImage: {
    width: "100%",
    height: 120,
  },
  playerContainer: {
    paddingHorizontal: 20,
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
    fontSize: 18,
  },
  frequency: {
    color: "#333",
    fontSize: 16,
  },
  stationTagline: {
    color: "#333",
    fontSize: 12,
    opacity: 0.8,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 50, // Half of width/height
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
    // backgroundColor: "#FEDA2B",
    marginHorizontal: 4,
  },
  paginationDotActive: {
    // backgroundColor: "#FFFFFF", // Solid white
    backgroundColor: "#FEDA2B",
  },
  newsTimestamp: {
    color: "white",
    fontSize: 12,
    opacity: 0.8,
    marginTop: 10,
  },
});

export default AudioStreamScreen;
