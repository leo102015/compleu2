import { AppRegistry } from 'react-native';
import React from 'react';
import { PaperProvider } from 'react-native-paper';
import App from './App';
import { name as appName } from './app.json';
import { theme } from './theme';
import { AuthProvider } from './AuthContext';

export default function Main() {
  return (
    <AuthProvider>
      <PaperProvider theme={theme}>
        <App />
      </PaperProvider>
    </AuthProvider>
  );
}

AppRegistry.registerComponent(appName, () => Main);