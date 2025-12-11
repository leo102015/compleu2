import React from 'react';
import { View, StyleSheet, NativeModules, Alert } from 'react-native';
import { Text, Button, Appbar, Icon } from 'react-native-paper';

// Obtenemos el módulo nativo que creamos
const { UnityModule } = NativeModules;

export default function OperadorARScreen() {

  const handleOpenAR = () => {
    if (UnityModule) {
      UnityModule.openUnity();
    } else {
      Alert.alert("Error", "El módulo AR no está disponible en este dispositivo.");
    }
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Content title="Módulo AR" />
      </Appbar.Header>

      <View style={styles.content}>
        <Icon source="augmented-reality" size={100} color="#6200ee" />
        
        <Text variant="headlineSmall" style={styles.title}>
          Visualización AR
        </Text>
        
        <Text style={styles.text}>
          Apunta a los señalamientos visuales para ver modelos 3D en Realidad Aumentada.
        </Text>

        <Button 
          mode="contained" 
          onPress={handleOpenAR} 
          style={styles.button}
          contentStyle={{ height: 50 }}
        >
          Iniciar Experiencia AR
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
  title: { marginTop: 20, fontWeight: 'bold' },
  text: { textAlign: 'center', marginVertical: 20, color: 'gray' },
  button: { width: '100%' }
});