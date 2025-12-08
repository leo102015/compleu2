import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { useAuth } from './AuthContext';

export default function SupervisorMapaScreen() {
  const { signOut } = useAuth();

  return (
    <View style={styles.container}>
      <Text variant="headlineSmall" style={{marginBottom: 20}}>Mapa de Obras</Text>
      <Text style={{marginBottom: 40, color:'gray'}}>
        (El mapa se configurará en la siguiente fase)
      </Text>
      
      {/* Botón temporal para cerrar sesión */}
      <Button 
        mode="contained" 
        onPress={signOut} 
        buttonColor="#B00020" // Color rojo de error para destacar
        icon="logout"
      >
        Cerrar Sesión
      </Button>
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
  }
});