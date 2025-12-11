import React from 'react';
import { View } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from './AuthContext';

import LoginScreen from './LoginScreen';
import AdminNavigator from './AdminNavigator';
import SupervisorNavigator from './SupervisorNavigator';
import OperadorNavigator from './OperadorNavigator';

const AppContent = () => {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  switch (role) {
    case 'admin':
      return <AdminNavigator />;
    case 'supervisor':
      return <SupervisorNavigator />;
    case 'operador':
      return <OperadorNavigator />;
    default:
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text>Usuario sin rol asignado o rol desconocido.</Text>
          <Text>UID: {user.uid}</Text>
        </View>
      );
  }
};

export default function App() {
  return (
    <NavigationContainer>
      <AppContent />
    </NavigationContainer>
  );
}