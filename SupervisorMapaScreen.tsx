import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions, Alert } from 'react-native';
import { FAB, Text, ActivityIndicator } from 'react-native-paper';
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import firestore from '@react-native-firebase/firestore';
import { useAuth } from './AuthContext';

const { width, height } = Dimensions.get('window');

export default function SupervisorMapaScreen() {
  const { user, signOut } = useAuth();
  const [obras, setObras] = useState<any[]>([]);
  const [operadores, setOperadores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Obtener Obras asignadas al Supervisor (Pines Estáticos)
  useEffect(() => {
    if (!user) return;

    const unsubObras = firestore()
      .collection('obras')
      .where('supervisorId', '==', user.uid)
      .onSnapshot(snap => {
        const list: any[] = [];
        snap.forEach(doc => {
          const data = doc.data();
          // Validar que tenga coordenadas para no romper el mapa
          if (data.ubicacion && data.ubicacion.latitud && data.ubicacion.longitud) {
            list.push({ ...data, id: doc.id });
          }
        });
        setObras(list);
        setLoading(false);
      });

    return () => unsubObras();
  }, [user]);

  // 2. Obtener Ubicaciones de Operadores (Pines Dinámicos)
  useEffect(() => {
    // Escuchamos TODA la colección de ubicaciones en tiempo real
    // (En una app real filtraríamos por operadores asignados, aquí veremos a todos)
    const unsubOps = firestore()
      .collection('ubicaciones_tiempo_real')
      .onSnapshot(snap => {
        const list: any[] = [];
        snap.forEach(doc => {
          const data = doc.data();
          // Filtramos solo los que tengan datos recientes (opcional, aquí traemos todo)
          if (data.latitud && data.longitud) {
            list.push({ ...data, id: doc.id });
          }
        });
        setOperadores(list);
      });

    return () => unsubOps();
  }, []);

  const handleLogout = () => {
    Alert.alert("Cerrar Sesión", "¿Estás seguro?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Salir", onPress: signOut }
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Cargando mapa...</Text>
      </View>
    );
  }

  // Coordenada inicial (Centrado en la primera obra o CDMX por defecto)
  const initialRegion = obras.length > 0 ? {
    latitude: obras[0].ubicacion.latitud,
    longitude: obras[0].ubicacion.longitud,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  } : {
    latitude: 19.4326, // CDMX default
    longitude: -99.1332,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation={true} // Muestra punto azul del supervisor
        showsMyLocationButton={true}
      >
        {/* RENDERIZAR OBRAS (Color ROJO) */}
        {obras.map(obra => (
          <React.Fragment key={obra.id}>
            <Marker
              coordinate={{
                latitude: obra.ubicacion.latitud,
                longitude: obra.ubicacion.longitud
              }}
              title={`Obra: ${obra.nombre}`}
              description={`Radio: ${obra.radio}m`}
              pinColor="red"
            />
            <Circle
              center={{
                latitude: obra.ubicacion.latitud,
                longitude: obra.ubicacion.longitud
              }}
              radius={obra.radio}
              fillColor="rgba(255, 0, 0, 0.2)"
              strokeColor="rgba(255, 0, 0, 0.5)"
            />
          </React.Fragment>
        ))}

        {/* RENDERIZAR OPERADORES (Color AZUL/VERDE) */}
        {operadores.map(op => (
          <Marker
            key={op.id}
            coordinate={{
              latitude: op.latitud,
              longitude: op.longitud
            }}
            title="Operador Activo"
            description={`Última act: ${op.timestamp ? new Date(op.timestamp.toDate()).toLocaleTimeString() : '...'}`}
            pinColor="blue" // Diferente color para distinguir
            opacity={0.9}
          />
        ))}
      </MapView>

      {/* Botón flotante para salir */}
      <FAB
        icon="logout"
        style={styles.fab}
        label="Salir"
        onPress={handleLogout}
      />
      
      {/* Panel informativo inferior */}
      <View style={styles.infoPanel}>
        <Text style={{fontWeight: 'bold'}}>Mapa en vivo</Text>
        <Text style={{fontSize: 12}}>🔴 Obras asignadas: {obras.length}</Text>
        <Text style={{fontSize: 12}}>🔵 Operadores en línea: {operadores.length}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  map: { width: width, height: height },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    top: 40,
    backgroundColor: 'white'
  },
  infoPanel: {
    position: 'absolute',
    bottom: 80, // Arriba del tab bar
    left: 10,
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 10,
    borderRadius: 8,
    elevation: 3
  }
});