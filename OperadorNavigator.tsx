import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from 'react-native-paper';

import OperadorObrasScreen from './OperadorObrasScreen';
import OperadorPerfilScreen from './OperadorPerfilScreen'; // Placeholder simple

const Tab = createBottomTabNavigator();

export default function OperadorNavigator() {
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarStyle: { paddingBottom: 5, height: 60 },
      }}
    >
      <Tab.Screen 
        name="MisObras" 
        component={OperadorObrasScreen} 
        options={{
          tabBarLabel: 'Obras Activas',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="briefcase-check" color={color} size={26} />
          ),
        }}
      />
      <Tab.Screen 
        name="Perfil" 
        component={OperadorPerfilScreen} 
        options={{
          tabBarLabel: 'Mi Perfil',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="account-circle" color={color} size={26} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}