import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, Alert, BackHandler, Image, Linking } from 'react-native';
import { Text, Card, Button, Chip, Appbar, ActivityIndicator, TextInput, Menu, Portal, Modal, Provider } from 'react-native-paper';
import firestore from '@react-native-firebase/firestore';
import { useAuth } from './AuthContext';
import { format } from 'date-fns';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export default function SupervisorObrasScreen() {
  const { user } = useAuth();
  const [obras, setObras] = useState<any[]>([]);
  const [selectedObra, setSelectedObra] = useState<any>(null);
  
  // Estados para Evidencias
  const [evidencias, setEvidencias] = useState<any[]>([]);
  const [loadingEvidencias, setLoadingEvidencias] = useState(false);

  // Estados para Edición de Obra
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editNombre, setEditNombre] = useState('');
  const [editRadio, setEditRadio] = useState('');
  const [editEstatus, setEditEstatus] = useState('');
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  // 1. Cargar obras
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

  // 2. BackHandler
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

  // 3. Cargar evidencias
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

  const handleUpdateEstadoEvidencia = async (evidenciaId: string, nuevoEstado: 'aprobado' | 'rechazado') => {
    try {
      await firestore().collection('evidencias').doc(evidenciaId).update({
        estado: nuevoEstado,
        supervisorAproboId: user?.uid,
        fechaRevision: firestore.FieldValue.serverTimestamp()
      });
    } catch (error) {
      Alert.alert("Error", "No se pudo actualizar la evidencia");
    }
  };

  // --- LÓGICA DE EDICIÓN DE OBRA ---
  const openEditModal = () => {
    setEditNombre(selectedObra.nombre);
    setEditRadio(String(selectedObra.radio));
    setEditEstatus(selectedObra.estatus);
    setEditModalVisible(true);
  };

  const handleSaveObra = async () => {
    try {
      await firestore().collection('obras').doc(selectedObra.id).update({
        nombre: editNombre,
        radio: parseInt(editRadio),
        estatus: editEstatus
      });
      setSelectedObra({ ...selectedObra, nombre: editNombre, radio: parseInt(editRadio), estatus: editEstatus });
      setEditModalVisible(false);
      Alert.alert("Éxito", "Información de la obra actualizada");
    } catch (e) {
      Alert.alert("Error", "No se pudo actualizar la obra");
    }
  };

  // Función auxiliar para abrir multimedia
  const openMedia = (url: string) => {
    if (url) {
      Linking.openURL(url).catch(err => Alert.alert("Error", "No se pudo abrir el archivo"));
    }
  };

  // VISTA: DETALLE CON EVIDENCIAS
  if (selectedObra) {
    return (
      <Provider>
        <View style={styles.container}>
          <Appbar.Header>
            <Appbar.BackAction onPress={() => setSelectedObra(null)} />
            <Appbar.Content title={selectedObra.nombre} subtitle={selectedObra.estatus.toUpperCase()} />
            <Appbar.Action icon="pencil" onPress={openEditModal} />
          </Appbar.Header>

          {loadingEvidencias ? <ActivityIndicator style={{ marginTop: 20 }} /> : (
            <FlatList
              data={evidencias}
              keyExtractor={item => item.id}
              ListHeaderComponent={
                <View style={styles.infoBox}>
                   <Text style={{fontWeight:'bold'}}>Detalles de la Obra:</Text>
                   <Text>Radio: {selectedObra.radio}m | Estatus: {selectedObra.estatus}</Text>
                   <Text>Ubicación: {selectedObra.ubicacion.latitud}, {selectedObra.ubicacion.longitud}</Text>
                </View>
              }
              ListEmptyComponent={<Text style={{ padding: 20, textAlign: 'center' }}>No hay evidencias aún.</Text>}
              renderItem={({ item }) => (
                <Card style={styles.cardEvidence}>
                  <Card.Title
                    title={item.tipo === 'foto' ? 'Fotografía' : 'Video'}
                    subtitle={item.fecha ? format(item.fecha.toDate(), 'dd/MM/yyyy HH:mm') : ''}
                    right={(props) => (
                      <Chip mode="outlined" icon={item.estado === 'aprobado' ? 'check' : item.estado === 'rechazado' ? 'close' : 'clock'} style={{marginRight: 10}}>
                        {item.estado.toUpperCase()}
                      </Chip>
                    )}
                  />

                  {/* ZONA MULTIMEDIA */}
                  <View style={styles.mediaContainer}>
                    {item.tipo === 'foto' ? (
                      <Image 
                        source={{ uri: item.urlArchivo }} 
                        style={styles.mediaImage} 
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.mediaVideoPlaceholder}>
                        <MaterialCommunityIcons name="video" size={50} color="white" />
                        <Text style={{color: 'white', marginTop: 5}}>Video de Evidencia</Text>
                      </View>
                    )}
                    
                    {/* Botón para abrir en pantalla completa o reproductor */}
                    <Button 
                      mode="contained-tonal" 
                      icon="open-in-new" 
                      onPress={() => openMedia(item.urlArchivo)}
                      style={{marginTop: 5}}
                    >
                      {item.tipo === 'foto' ? 'Ver Foto Completa' : 'Reproducir Video'}
                    </Button>
                  </View>

                  <Card.Content style={{ marginTop: 10 }}>
                    <Text style={{fontWeight: 'bold'}}>Descripción:</Text>
                    <Text>{item.descripcion}</Text>
                  </Card.Content>

                  {item.estado === 'pendiente' && (
                    <Card.Actions style={{ justifyContent: 'flex-end' }}>
                      <Button textColor="red" onPress={() => handleUpdateEstadoEvidencia(item.id, 'rechazado')}>Rechazar</Button>
                      <Button onPress={() => handleUpdateEstadoEvidencia(item.id, 'aprobado')}>Aprobar</Button>
                    </Card.Actions>
                  )}
                </Card>
              )}
            />
          )}

          {/* MODAL EDITAR OBRA */}
          <Portal>
            <Modal visible={editModalVisible} onDismiss={() => setEditModalVisible(false)} contentContainerStyle={styles.modalContent}>
              <Text variant="headlineSmall" style={{marginBottom:15}}>Editar Obra</Text>
              <TextInput label="Nombre" value={editNombre} onChangeText={setEditNombre} mode="outlined" style={styles.input} />
              <TextInput label="Radio (metros)" value={editRadio} onChangeText={setEditRadio} keyboardType="numeric" mode="outlined" style={styles.input} />
              
              <Menu
                visible={showStatusMenu}
                onDismiss={() => setShowStatusMenu(false)}
                anchor={
                  <Button mode="outlined" onPress={() => setShowStatusMenu(true)} style={styles.input} contentStyle={{justifyContent:'flex-start'}}>
                    Estatus: {editEstatus}
                  </Button>
                }>
                <Menu.Item onPress={() => { setEditEstatus('iniciando'); setShowStatusMenu(false); }} title="Iniciando" />
                <Menu.Item onPress={() => { setEditEstatus('proceso'); setShowStatusMenu(false); }} title="En Proceso" />
                <Menu.Item onPress={() => { setEditEstatus('terminando'); setShowStatusMenu(false); }} title="Terminando" />
              </Menu>

              <View style={styles.row}>
                <Button onPress={() => setEditModalVisible(false)}>Cancelar</Button>
                <Button mode="contained" onPress={handleSaveObra}>Guardar</Button>
              </View>
            </Modal>
          </Portal>
        </View>
      </Provider>
    );
  }

  // VISTA: LISTA DE OBRAS
  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Content title="Gestionar Obras" />
      </Appbar.Header>
      <FlatList
        data={obras}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <Card style={styles.card} onPress={() => setSelectedObra(item)}>
            <Card.Title title={item.nombre} subtitle={`Estatus: ${item.estatus}`} left={(props) => <Button icon="folder-edit" {...props} />} />
          </Card>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  infoBox: { padding: 10, backgroundColor:'#e3f2fd', marginBottom:10 },
  card: { margin: 10, backgroundColor: 'white' },
  cardEvidence: { margin: 10, marginBottom: 20, paddingBottom: 10 },
  modalContent: { backgroundColor: 'white', padding: 20, margin: 20, borderRadius: 10 },
  input: { marginBottom: 15 },
  row: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 },
  // Estilos Multimedia Nuevos
  mediaContainer: { paddingHorizontal: 15, alignItems: 'center' },
  mediaImage: { width: '100%', height: 200, borderRadius: 8, marginBottom: 5, backgroundColor: '#eee' },
  mediaVideoPlaceholder: { width: '100%', height: 200, borderRadius: 8, marginBottom: 5, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }
});