import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from 'react-native-paper';

// Importamos las pantallas
import SupervisorObrasScreen from './SupervisorObrasScreen';
import SupervisorOperadoresScreen from './SupervisorOperadoresScreen';
import SupervisorMapaScreen from './SupervisorMapaScreen'; // Lo crearemos como placeholder por ahora

const Tab = createBottomTabNavigator();

export default function SupervisorNavigator() {
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
        component={SupervisorObrasScreen} 
        options={{
          tabBarLabel: 'Mis Obras',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="clipboard-list" color={color} size={26} />
          ),
        }}
      />
      <Tab.Screen 
        name="Operadores" 
        component={SupervisorOperadoresScreen} 
        options={{
          tabBarLabel: 'Operadores',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="account-hard-hat" color={color} size={26} />
          ),
        }}
      />
      <Tab.Screen 
        name="Mapa" 
        component={SupervisorMapaScreen} 
        options={{
          tabBarLabel: 'Mapa en Vivo',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="map-marker-radius" color={color} size={26} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}