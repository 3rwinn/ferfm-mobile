import React from "react";
import LottieView from "lottie-react-native";
import { StyleSheet } from "react-native";

const WaveAnimation = ({
  source = require("../../assets/animations/wave.json"), // Expects require('../path/to/animation.json')
  isPlaying = true,
  loop = true,
  style,
}) => {
  if (!source) {
    // Optionally, render a placeholder or null if no source is provided
    console.warn("WaveAnimation: 'source' prop is required.");
    return null;
  }

  if (!isPlaying) {
    return null; // Render nothing if not playing
  }

  return (
    <LottieView
      source={source}
      autoPlay={true} // Animation will play when rendered
      loop={loop}
      style={[styles.defaultStyle, style]} // Apply default styles and allow overriding
    />
  );
};

const styles = StyleSheet.create({
  defaultStyle: {
    width: 200, // Default width, can be overridden by props
    height: 200, // Default height, can be overridden by props
  },
});

export default WaveAnimation;
