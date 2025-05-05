import { StatusBar } from "expo-status-bar";
import React from "react";
import { SafeAreaView, StyleSheet } from "react-native";
import AudioStreamScreen from "./src/screens/AudioStreamScreen";

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <AudioStreamScreen />
      <StatusBar style="light" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000", // Or your desired background color
  },
});
