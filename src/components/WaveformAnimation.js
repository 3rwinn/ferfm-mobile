import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Dimensions, Animated, Easing } from 'react-native';
import Svg, { Path } from 'react-native-svg';

// Get screen width, set desired height for the visualization
const { width } = Dimensions.get('window');
const VISUALIZATION_HEIGHT = 150;
const MID_POINT = VISUALIZATION_HEIGHT / 2;

// Wave properties
const WAVE_COUNT = 3;
// const WAVE_COLORS = ['#FF1493', '#00FFFF', '#ADD8E6']; // DeepPink, Aqua, LightBlue
const WAVE_COLORS = ['#FEDA2B', '#FEDA2B', '#FEDA2B']; // DeepPink, Aqua, LightBlue
const WAVE_FREQUENCIES = [2, 2.5, 1.5];
const WAVE_AMPLITUDES = [30, 25, 35];
const WAVE_PHASES = [0, Math.PI / 3, Math.PI * 0.8];
const WAVE_Y_OFFSETS = [0, 5, -5]; // Slight vertical offset for visual separation
const ANIMATION_DURATION_AMP = 1800; // Duration for amplitude change
const ANIMATION_DURATION_PHASE = 8000; // Duration for phase shift (sliding)
const HORIZONTAL_RESOLUTION = 5; // Lower value = more points = smoother curve, but more calculation

// Function to generate a sine wave SVG path data string
const createWavePath = (amplitude, phase, frequency, yOffset) => {
  let path = `M 0 ${MID_POINT + yOffset}`;
  for (let x = 0; x <= width; x += HORIZONTAL_RESOLUTION) {
    // Calculate angle based on position, frequency, and phase
    const angle = (x / width) * (frequency * Math.PI) + phase;
    // Calculate y position using sine function
    const y = Math.sin(angle) * amplitude + MID_POINT + yOffset;
    path += ` L ${x.toFixed(0)} ${y.toFixed(2)}`;
  }
  return path;
};

// Component for a single animated wave
const Wave = ({ color, frequency, initialAmplitude, initialPhase, yOffset }) => {
  // Refs for animation values
  const amplitudeAnim = useRef(new Animated.Value(initialAmplitude)).current;
  const phaseAnim = useRef(new Animated.Value(initialPhase)).current;
  const pathRef = useRef();

  // Effect to CREATE animations & ATTACH listeners (runs once)
  useEffect(() => {
    // Define animations
    const amplitudeAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(amplitudeAnim, {
          toValue: initialAmplitude * 0.6,
          duration: ANIMATION_DURATION_AMP,
          useNativeDriver: false,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(amplitudeAnim, {
          toValue: initialAmplitude,
          duration: ANIMATION_DURATION_AMP,
          useNativeDriver: false,
          easing: Easing.inOut(Easing.ease),
        }),
      ])
    );
    const phaseAnimation = Animated.loop(
      Animated.timing(phaseAnim, {
        toValue: initialPhase + 2 * Math.PI,
        duration: ANIMATION_DURATION_PHASE,
        useNativeDriver: false,
        easing: Easing.linear,
      })
    );

    // Define listener function
    const updatePath = () => {
      if (pathRef.current) {
        const currentAmplitude = amplitudeAnim.__getValue();
        const currentPhase = phaseAnim.__getValue();
        const newPath = createWavePath(currentAmplitude, currentPhase, frequency, yOffset);
        pathRef.current.setNativeProps({ d: newPath });
      }
    }

    // Attach listeners
    const ampListenerId = amplitudeAnim.addListener(updatePath);
    const phaseListenerId = phaseAnim.addListener(updatePath);

    // Start animations immediately on mount
    amplitudeAnimation.start();
    phaseAnimation.start();

    // Cleanup listeners & animations on unmount
    return () => {
      amplitudeAnim.removeListener(ampListenerId);
      phaseAnim.removeListener(phaseListenerId);
      amplitudeAnimation.stop();
      phaseAnimation.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array: runs only once

  // Calculate the initial path data string for first render
  const initialPath = createWavePath(initialAmplitude, initialPhase, frequency, yOffset);

  return (
    <Path
      ref={pathRef}
      d={initialPath}
      fill="none"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
};

// Main component to render the SVG canvas and multiple waves
const WaveformAnimation = ({ isPlaying }) => {
  // Animated value for opacity
  const opacityAnim = useRef(new Animated.Value(isPlaying ? 1 : 0)).current;

  // Effect to animate opacity when isPlaying changes
  useEffect(() => {
    Animated.timing(opacityAnim, {
      toValue: isPlaying ? 1 : 0, // Target opacity
      duration: 300, // Fade duration (adjust as needed)
      useNativeDriver: true, // Opacity can use native driver
      easing: Easing.easeOut, // Optional easing
    }).start();
  }, [isPlaying, opacityAnim]);

  return (
    // Apply animated opacity to this container view
    <Animated.View style={[styles.container, { opacity: opacityAnim }]}>
      <Svg width={width} height={VISUALIZATION_HEIGHT} viewBox={`0 0 ${width} ${VISUALIZATION_HEIGHT}`}>
        {WAVE_COLORS.map((color, index) => (
          <Wave
            key={index}
            color={color}
            frequency={WAVE_FREQUENCIES[index]}
            initialAmplitude={WAVE_AMPLITUDES[index]}
            initialPhase={WAVE_PHASES[index]}
            yOffset={WAVE_Y_OFFSETS[index]}
          />
        ))}
      </Svg>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: VISUALIZATION_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    // backgroundColor: '#000', // Optional: Set background color if needed
  },
});

export default WaveformAnimation; 