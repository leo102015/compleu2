import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, Image, ScrollView, Alert, BackHandler } from 'react-native';
import { Text, Card, Button, Chip, Appbar, ActivityIndicator, Divider } from 'react-native-paper';
import firestore from '@react-native-firebase/firestore';
import { useAuth } from './AuthContext';
import { format } from 'date-fns';

export default function SupervisorObrasScreen() {
  const { user } = useAuth();
  const [obras, setObras] = useState<any[]>([]);
  const [selectedObra, setSelectedObra] = useState<any>(null);
  const [evidencias, setEvidencias] = useState<any[]>([]);
  const [loadingEvidencias, setLoadingEvidencias] = useState(false);

  // 1. Cargar obras asignadas a este supervisor
  useEffect(() => {
    if (!user) return;
    const unsubscribe = firestore()
      .collection('obras')
      .where('supervisorId', '==', user.uid)
      .onSnapshot(snap => {
        const list: any[] = [];
        snap.forEach(doc => list.push({ ...doc.data(), id: doc.id }));
        setObras(list);
      });
    return () => unsubscribe();
  }, [user]);

  // 2. Manejar botón atrás físico (Android)
  useEffect(() => {
    const backAction = () => {
      if (selectedObra) {
        setSelectedObra(null);
        return true;
      }
      return false;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [selectedObra]);

  // 3. Cargar evidencias cuando se selecciona una obra
  useEffect(() => {
    if (!selectedObra) return;
    setLoadingEvidencias(true);
    const unsub = firestore()
      .collection('evidencias')
      .where('obraId', '==', selectedObra.id)
      .orderBy('fecha', 'desc')
      .onSnapshot(snap => {
        const list: any[] = [];
        snap.forEach(doc => list.push({ ...doc.data(), id: doc.id }));
        setEvidencias(list);
        setLoadingEvidencias(false);
      });
    return () => unsub();
  }, [selectedObra]);

  const handleUpdateEstado = async (evidenciaId: string, nuevoEstado: 'aprobado' | 'rechazado') => {
    try {
      await firestore().collection('evidencias').doc(evidenciaId).update({
        estado: nuevoEstado,
        supervisorAproboId: user?.uid,
        fechaRevision: firestore.FieldValue.serverTimestamp()
      });
      Alert.alert("Actualizado", `Evidencia ${nuevoEstado}`);
    } catch (error) {
      Alert.alert("Error", "No se pudo actualizar el estado");
    }
  };

  // VISTA: DETALLE DE OBRA Y EVIDENCIAS
  if (selectedObra) {
    return (
      <View style={styles.container}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => setSelectedObra(null)} />
          <Appbar.Content title={selectedObra.nombre} subtitle="Revisión de Evidencias" />
        </Appbar.Header>

        {loadingEvidencias ? <ActivityIndicator style={{marginTop:20}} /> : (
          <FlatList
            data={evidencias}
            keyExtractor={item => item.id}
            ListEmptyComponent={<Text style={{padding:20, textAlign:'center'}}>No hay evidencias subidas aún.</Text>}
            renderItem={({ item }) => (
              <Card style={styles.cardEvidence}>
                <Card.Title 
                  title={item.tipo === 'foto' ? 'Fotografía' : 'Video'} 
                  subtitle={item.fecha ? format(item.fecha.toDate(), 'dd/MM/yyyy HH:mm') : ''}
                  right={(props) => (
                    <Chip 
                      mode="outlined" 
                      icon={item.estado === 'aprobado' ? 'check' : item.estado === 'rechazado' ? 'close' : 'clock'}
                      style={{marginRight: 10}}
                    >
                      {item.estado.toUpperCase()}
                    </Chip>
                  )}
                />
                
                {/* Visualizador simple de imagen (si es video mostraríamos un icono por ahora) */}
                {item.tipo === 'foto' && item.urlArchivo ? (
                  <Card.Cover source={{ uri: item.urlArchivo }} />
                ) : (
                  <Card.Content><Text>Video (Reproducción pendiente)</Text></Card.Content>
                )}

                <Card.Content style={{marginTop: 10}}>
                  <Text style={{fontWeight:'bold'}}>Descripción:</Text>
                  <Text>{item.descripcion}</Text>
                  <Text style={{fontSize:12, color:'gray', marginTop:5}}>
                    Lat: {item.ubicacionCaptura?.latitud}, Lng: {item.ubicacionCaptura?.longitud}
                  </Text>
                </Card.Content>

                {item.estado === 'pendiente' && (
                  <Card.Actions style={{justifyContent:'flex-end'}}>
                    <Button textColor="red" onPress={() => handleUpdateEstado(item.id, 'rechazado')}>Rechazar</Button>
                    <Button onPress={() => handleUpdateEstado(item.id, 'aprobado')}>Aprobar</Button>
                  </Card.Actions>
                )}
              </Card>
            )}
          />
        )}
      </View>
    );
  }

  // VISTA: LISTA DE OBRAS
  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Content title="Mis Obras Asignadas" />
      </Appbar.Header>
      
      <FlatList
        data={obras}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <Card style={styles.card} onPress={() => setSelectedObra(item)}>
            <Card.Title title={item.nombre} subtitle={item.estatus} left={(props) => <Button icon="folder" {...props} />} />
            <Card.Content>
               <Text>Radio: {item.radio}m</Text>
               <Text>Fecha Fin: {item.fechaFinEstimada ? format(item.fechaFinEstimada.toDate(), 'dd/MM/yyyy') : '--'}</Text>
            </Card.Content>
          </Card>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  card: { margin: 10, backgroundColor: 'white' },
  cardEvidence: { margin: 10, marginBottom: 20 }
});