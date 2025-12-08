import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { TextInput, Button, Text, ActivityIndicator } from 'react-native-paper';
import { useAuth } from './AuthContext';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  const { signIn } = useAuth();

  const handleLogin = async () => {
    if (email.length === 0 || password.length === 0) {
      Alert.alert("Error", "Por favor ingrese correo y contraseña");
      return;
    }

    setLoggingIn(true);
    try {
      await signIn(email, password);
      // La navegación cambiará automáticamente en App.tsx al detectar el usuario
    } catch (error: any) {
      console.error(error);
      let msg = "Error al iniciar sesión";
      if (error.code === 'auth/invalid-email') msg = "Correo inválido";
      if (error.code === 'auth/user-not-found') msg = "Usuario no encontrado";
      if (error.code === 'auth/wrong-password') msg = "Contraseña incorrecta";
      Alert.alert("Error de acceso", msg);
    } finally {
      setLoggingIn(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>Bienvenido a ContObra</Text>
      <TextInput
        label="Correo Electrónico"
        value={email}
        onChangeText={setEmail}
        mode="outlined"
        keyboardType="email-address"
        autoCapitalize="none"
        style={styles.input}
      />
      <TextInput
        label="Contraseña"
        value={password}
        onChangeText={setPassword}
        mode="outlined"
        secureTextEntry
        style={styles.input}
      />
      
      {loggingIn ? (
        <ActivityIndicator animating={true} size="large" style={styles.loader} />
      ) : (
        <Button mode="contained" onPress={handleLogin} style={styles.button}>
          Iniciar Sesión
        </Button>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    textAlign: 'center',
    marginBottom: 40,
    fontWeight: 'bold',
  },
  input: {
    marginBottom: 15,
  },
  button: {
    marginTop: 10,
    paddingVertical: 5,
  },
  loader: {
    marginTop: 20,
  }
});