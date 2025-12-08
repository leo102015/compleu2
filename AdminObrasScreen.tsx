import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, ScrollView, Alert, BackHandler } from 'react-native';
import { Text, FAB, Card, TextInput, Button, Menu, Appbar, Portal, Modal, Provider } from 'react-native-paper';
import firestore from '@react-native-firebase/firestore';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';

export default function AdminObrasScreen() {
  const [obras, setObras] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Estados Formulario (Crear/Editar)
  const [visible, setVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [nombre, setNombre] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [radio, setRadio] = useState('50');
  const [estatus, setEstatus] = useState('iniciando');
  
  const [supervisores, setSupervisores] = useState<any[]>([]);
  const [supervisorId, setSupervisorId] = useState('');
  
  // Menús y Fechas
  const [showSuperMenu, setShowSuperMenu] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [fechaInicio, setFechaInicio] = useState(new Date());
  const [fechaFin, setFechaFin] = useState(new Date());
  const [showPickerInicio, setShowPickerInicio] = useState(false);
  const [showPickerFin, setShowPickerFin] = useState(false);

  useEffect(() => {
    const unsubObras = firestore().collection('obras').onSnapshot(snap => {
      const list: any[] = [];
      snap.forEach(doc => list.push({ ...doc.data(), id: doc.id }));
      setObras(list);
    });

    const unsubSuper = firestore().collection('users').where('rol', '==', 'supervisor').onSnapshot(snap => {
      const list: any[] = [];
      snap.forEach(doc => list.push({ ...doc.data(), uid: doc.id }));
      setSupervisores(list);
    });

    return () => { unsubObras(); unsubSuper(); };
  }, []);

  const openForm = (obra?: any) => {
    if (obra) {
      setIsEditing(true);
      setEditingId(obra.id);
      setNombre(obra.nombre);
      setLat(String(obra.ubicacion.latitud));
      setLng(String(obra.ubicacion.longitud));
      setRadio(String(obra.radio));
      setSupervisorId(obra.supervisorId);
      setEstatus(obra.estatus);
      setFechaInicio(obra.fechaInicio?.toDate() || new Date());
      setFechaFin(obra.fechaFinEstimada?.toDate() || new Date());
    } else {
      setIsEditing(false);
      setEditingId(null);
      resetForm();
    }
    setVisible(true);
  };

  const resetForm = () => {
    setNombre(''); setLat(''); setLng(''); setSupervisorId('');
    setRadio('50'); setEstatus('iniciando');
    setFechaInicio(new Date()); setFechaFin(new Date());
  };

  const handleSave = async () => {
    if (!nombre || !lat || !lng || !supervisorId) {
      Alert.alert("Error", "Campos obligatorios faltantes");
      return;
    }

    const data = {
      nombre,
      ubicacion: { latitud: parseFloat(lat), longitud: parseFloat(lng) },
      radio: parseInt(radio),
      supervisorId,
      estatus,
      fechaInicio: firestore.Timestamp.fromDate(fechaInicio),
      fechaFinEstimada: firestore.Timestamp.fromDate(fechaFin),
    };

    try {
      if (isEditing && editingId) {
        await firestore().collection('obras').doc(editingId).update(data);
        Alert.alert("Éxito", "Obra actualizada");
      } else {
        await firestore().collection('obras').add({
          ...data,
          fechaCreacion: firestore.FieldValue.serverTimestamp()
        });
        Alert.alert("Éxito", "Obra creada");
      }
      setVisible(false);
    } catch (e) {
      Alert.alert("Error", "No se pudo guardar la obra");
    }
  };

  const getSupervisorName = (id: string) => {
    const s = supervisores.find(x => x.uid === id);
    return s ? s.nombre : 'Seleccionar Supervisor';
  };

  return (
    <Provider>
      <View style={styles.container}>
        <Appbar.Header>
          <Appbar.Content title="Gestión de Obras" />
        </Appbar.Header>

        <FlatList
          data={obras}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <Card style={styles.card} onPress={() => openForm(item)}>
              <Card.Title 
                title={item.nombre} 
                subtitle={`Estatus: ${item.estatus} | Sup: ${getSupervisorName(item.supervisorId)}`}
                right={(props) => <Button icon="pencil" {...props} onPress={() => openForm(item)}>Editar</Button>}
              />
            </Card>
          )}
        />

        <FAB icon="plus" style={styles.fab} onPress={() => openForm()} label="Nueva Obra" />

        <Portal>
          <Modal visible={visible} onDismiss={() => setVisible(false)} contentContainerStyle={styles.modalContent}>
            <Text variant="headlineSmall" style={{marginBottom:15}}>{isEditing ? 'Editar Obra' : 'Nueva Obra'}</Text>
            <ScrollView>
              <TextInput label="Nombre" value={nombre} onChangeText={setNombre} mode="outlined" style={styles.input} />
              
              <View style={styles.row}>
                <TextInput label="Latitud" value={lat} onChangeText={setLat} keyboardType="numeric" mode="outlined" style={[styles.input, {flex:1, marginRight:5}]} />
                <TextInput label="Longitud" value={lng} onChangeText={setLng} keyboardType="numeric" mode="outlined" style={[styles.input, {flex:1}]} />
              </View>
              
              <TextInput label="Radio (m)" value={radio} onChangeText={setRadio} keyboardType="numeric" mode="outlined" style={styles.input} />

              <Menu
                visible={showSuperMenu}
                onDismiss={() => setShowSuperMenu(false)}
                anchor={<Button mode="outlined" onPress={() => setShowSuperMenu(true)} style={styles.input}>{getSupervisorName(supervisorId)}</Button>}>
                {supervisores.map(s => <Menu.Item key={s.uid} onPress={() => { setSupervisorId(s.uid); setShowSuperMenu(false); }} title={s.nombre} />)}
              </Menu>

              <Menu
                visible={showStatusMenu}
                onDismiss={() => setShowStatusMenu(false)}
                anchor={<Button mode="outlined" onPress={() => setShowStatusMenu(true)} style={styles.input}>Estatus: {estatus}</Button>}>
                {['iniciando', 'proceso', 'terminando'].map(s => <Menu.Item key={s} onPress={() => { setEstatus(s); setShowStatusMenu(false); }} title={s.toUpperCase()} />)}
              </Menu>

              <View style={styles.row}>
                 <Button onPress={() => setShowPickerInicio(true)} mode="outlined" style={[styles.input, {flex:1, marginRight:5}]}>
                  Inicio: {format(fechaInicio, 'dd/MM/yyyy')}
                </Button>
                <Button onPress={() => setShowPickerFin(true)} mode="outlined" style={[styles.input, {flex:1}]}>
                  Fin: {format(fechaFin, 'dd/MM/yyyy')}
                </Button>
              </View>

              {showPickerInicio && <DateTimePicker value={fechaInicio} mode="date" onChange={(e,d) => { setShowPickerInicio(false); if(d) setFechaInicio(d); }} />}
              {showPickerFin && <DateTimePicker value={fechaFin} mode="date" onChange={(e,d) => { setShowPickerFin(false); if(d) setFechaFin(d); }} />}

              <View style={{flexDirection:'row', justifyContent:'flex-end', marginTop:10}}>
                <Button onPress={() => setVisible(false)}>Cancelar</Button>
                <Button mode="contained" onPress={handleSave}>Guardar</Button>
              </View>
            </ScrollView>
          </Modal>
        </Portal>
      </View>
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  card: { margin: 10, backgroundColor: 'white' },
  fab: { position: 'absolute', margin: 16, right: 0, bottom: 0 },
  modalContent: { backgroundColor: 'white', padding: 20, margin: 20, borderRadius: 10, maxHeight: '80%' },
  input: { marginBottom: 12 },
  row: { flexDirection: 'row' }
});