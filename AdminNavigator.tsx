import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from 'react-native-paper';

// Importamos las pantallas que crearemos a continuación
import AdminObrasScreen from './AdminObrasScreen';
import AdminUsuariosScreen from './AdminUsuariosScreen';
import AdminEstadisticasScreen from './AdminEstadisticasScreen';
import AdminEvidenciasScreen from './AdminEvidenciasScreen';

const Tab = createBottomTabNavigator();

export default function AdminNavigator() {
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
        name="Obras" 
        component={AdminObrasScreen} 
        options={{
          tabBarLabel: 'Obras',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="hard-hat" color={color} size={26} />
          ),
        }}
      />
      <Tab.Screen 
        name="Usuarios" 
        component={AdminUsuariosScreen} 
        options={{
          tabBarLabel: 'Usuarios',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="account-group" color={color} size={26} />
          ),
        }}
      />
      <Tab.Screen 
        name="Estadisticas" 
        component={AdminEstadisticasScreen} 
        options={{
          tabBarLabel: 'Avance',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="chart-bar" color={color} size={26} />
          ),
        }}
      />
      <Tab.Screen 
        name="Evidencias" 
        component={AdminEvidenciasScreen} 
        options={{
          tabBarLabel: 'Evidencias',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="image-multiple" color={color} size={26} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}