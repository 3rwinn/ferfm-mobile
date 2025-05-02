import TrackPlayer, { Event } from 'react-native-track-player';

module.exports = async function() {
    TrackPlayer.addEventListener(Event.RemotePlay, () => TrackPlayer.play());

    TrackPlayer.addEventListener(Event.RemotePause, () => TrackPlayer.pause());

    TrackPlayer.addEventListener(Event.RemoteStop, () => TrackPlayer.pause());

    // Add other listeners you need, like RemoteNext, RemotePrevious, etc.

    // This event is needed for Android notifications to work correctly
    TrackPlayer.addEventListener(Event.RemoteDuck, (e) => {
        // Handle audio ducking (e.g., lower volume)
        console.log('Remote Duck:', e);
        // Example: Pause playback
        // if (e.paused) {
        //     TrackPlayer.pause();
        // } else {
        //     TrackPlayer.play();
        // }
    });
}; 