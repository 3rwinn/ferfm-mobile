import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import AudioStreamScreen from './src/screens/AudioStreamScreen';
import { StatusBar } from 'expo-status-bar';

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <AudioStreamScreen />
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff', // Or your desired background color
  },
});
