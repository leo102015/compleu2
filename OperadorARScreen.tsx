import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Icon } from 'react-native-paper';

export default function OperadorARScreen() {
  return (
    <View style={styles.container}>
      <Icon source="view-in-ar" size={80} color="#6200ee" />
      <Text variant="headlineMedium" style={styles.title}>Módulo AR</Text>
      <Text style={styles.subtitle}>
        Aquí se implementará la visualización de obras en Realidad Aumentada.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 20,
    backgroundColor: '#fff' 
  },
  title: {
    marginTop: 20,
    fontWeight: 'bold'
  },
  subtitle: {
    marginTop: 10,
    textAlign: 'center',
    color: 'gray'
  }
});