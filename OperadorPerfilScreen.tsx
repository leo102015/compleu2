import React from 'react';
import { View } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { useAuth } from './AuthContext';

export default function OperadorPerfilScreen() {
  const { signOut, user } = useAuth();
  return (
    <View style={{flex:1, justifyContent:'center', alignItems:'center', padding:20}}>
      <Text variant="headlineSmall" style={{marginBottom:10}}>Perfil de Operador</Text>
      <Text>{user?.email}</Text>
      <Button mode="contained" onPress={signOut} style={{marginTop:30}} buttonColor="red">
        Cerrar Sesión
      </Button>
    </View>
  );
}