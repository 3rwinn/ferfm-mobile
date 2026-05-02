import { registerRootComponent } from "expo";
// Remove TrackPlayer import
// import TrackPlayer from 'react-native-track-player';

import App from "./App";
// Remove PlayerService import
// import PlayerService from './service'; // Import the service
import { setupAudio } from "./audioSetup"; // Import the new setup function

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);

// Remove registration of the old playback service
// TrackPlayer.registerPlaybackService(() => PlayerService);

// Initialize audio logic OUTSIDE of React lifecycle
setupAudio();
