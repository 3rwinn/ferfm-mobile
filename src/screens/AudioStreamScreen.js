import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import TrackPlayer, {
  Capability,
  Event,
  RepeatMode,
  State,
  usePlaybackState,
} from 'react-native-track-player';
import { Ionicons } from '@expo/vector-icons';

// Placeholder - replace with your actual stream URL
const STREAM_URL = 'https://listen.radioking.com/radio/722114/stream/787982';

const setupPlayer = async () => {
  try {
    await TrackPlayer.setupPlayer();
    await TrackPlayer.updateOptions({
      capabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.Stop,
      ],
      compactCapabilities: [Capability.Play, Capability.Pause, Capability.Stop],
      // Icon for notification
      // notificationIcon: require('../path/to/your/notification-icon.png'), // Add your icon path
    });
    await TrackPlayer.add({
      url: STREAM_URL, // Your stream url
      title: 'Radio Stream',
      artist: 'Live',
      // artwork: require('../path/to/your/artwork.png'), // Add your artwork path
      isLiveStream: true, // Important for live streams
    });
     // Set repeat mode if needed, often None for live streams
     await TrackPlayer.setRepeatMode(RepeatMode.Off);
  } catch (e) {
    console.error('Error setting up player:', e);
  }
};

const AudioStreamScreen = () => {
  const { state: playbackStateValue } = usePlaybackState();
  const [isPlayerReady, setIsPlayerReady] = useState(false);

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

  const togglePlayback = async () => {
    if (!isPlayerReady) return;

    const currentTrack = await TrackPlayer.getCurrentTrack();
    if (currentTrack == null) {
      // Handle case where track isn't loaded yet or setup failed
      console.log('Track not ready or setup failed.');
       await setupPlayer(); // Try to setup again
       await TrackPlayer.play();
    } else {
      if (playbackStateValue === State.Paused || playbackStateValue === State.Ready || playbackStateValue === State.Stopped || playbackStateValue === State.None) {
        await TrackPlayer.play();
      } else {
        await TrackPlayer.pause();
      }
    }
  };

  const renderPlayPauseButton = () => {
    const isLoading = !isPlayerReady || playbackStateValue === State.Buffering || playbackStateValue === State.Connecting;
    const isPlaying = playbackStateValue === State.Playing;

    let iconName = isPlaying ? 'pause' : 'play';

    if (isLoading) {
      return <ActivityIndicator size="large" color="#0000ff" />;
    }

    return (
      <TouchableOpacity onPress={togglePlayback} style={styles.playButtonContainer} disabled={isLoading}>
        <Ionicons name={iconName} size={64} color="#333" />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>FER RADIO</Text>
      {renderPlayPauseButton()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ADD8E6',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 40,
    color: '#333',
  },
  playButtonContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  }
});

export default AudioStreamScreen; 