import {
  AudioPro,
  AudioProContentType,
  AudioProEventType,
} from "react-native-audio-pro";

// TODO: Implement logic to determine and play the next/previous track if needed
function determineNextTrack() {
  console.log("Determine next track logic needed");
  return null; // Return the next AudioProTrack object or null
}

function determinePreviousTrack() {
  console.log("Determine previous track logic needed");
  return null; // Return the previous AudioProTrack object or null
}

export function setupAudio() {
  // Configure audio settings
  AudioPro.configure({
    contentType: AudioProContentType.MUSIC, // Assuming MUSIC, change if needed (e.g., SPEECH for podcasts)
    debug: __DEV__, // Enable debug logging in development
    debugIncludesProgress: false, // Don't flood logs with progress events
    progressIntervalMs: 1000, // Default progress update interval
    showNextPrevControls: false, // Hide next/prev buttons for single stream
  });

  // Set up event listeners that persist for the app's lifetime
  AudioPro.addEventListener((event) => {
    console.log("AudioPro Event:", event.type, event.payload);

    switch (event.type) {
      case AudioProEventType.TRACK_ENDED:
        // Handle track ending (e.g., play next, stop, etc.)
        // For a live stream, this might indicate an interruption or end of the stream.
        console.log("Track ended");
        // Example: Stop the player if the track ends
        // AudioPro.stop();
        break;

      case AudioProEventType.REMOTE_NEXT:
        // Handle next button press from lock screen/notification
        // This might not be relevant for a single live stream
        console.log("User pressed Next button");
        // const nextTrackFromRemote = determineNextTrack();
        // if (nextTrackFromRemote) {
        //   AudioPro.play(nextTrackFromRemote);
        // }
        break;

      case AudioProEventType.REMOTE_PREV:
        // Handle previous button press from lock screen/notification
        // This might not be relevant for a single live stream
        console.log("User pressed Previous button");
        // const previousTrackFromRemote = determinePreviousTrack();
        // if (previousTrackFromRemote) {
        //   AudioPro.play(previousTrackFromRemote);
        // }
        break;

      case AudioProEventType.PLAYBACK_ERROR:
        console.error(
          "Playback Error:",
          event.payload?.error,
          "Code:",
          event.payload?.errorCode
        );
        // Handle error (e.g., show message to user, attempt retry)
        break;

      case AudioProEventType.STATE_CHANGED:
        console.log("State changed to:", event.payload?.state);
        // Handle state changes if needed globally
        break;

      // Add other cases as needed (e.g., PROGRESS, SEEK_COMPLETE)
    }
  });

  console.log("AudioPro setup complete.");
}
