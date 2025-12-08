import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, ScrollView, Alert, BackHandler } from 'react-native';
import { Text, FAB, Card, TextInput, Button, Menu, Appbar } from 'react-native-paper';
import firestore from '@react-native-firebase/firestore';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';

export default function AdminObrasScreen() {
  // Estados para lista
  const [obras, setObras] = useState<any[]>([]);
  // Estados para formulario
  const [creando, setCreando] = useState(false); // Cambiamos 'visible' por 'creando'
  const [nombre, setNombre] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [radio, setRadio] = useState('50');
  const [supervisores, setSupervisores] = useState<any[]>([]);
  const [supervisorId, setSupervisorId] = useState('');
  const [showSuperMenu, setShowSuperMenu] = useState(false);
  
  // Fechas
  const [fechaInicio, setFechaInicio] = useState(new Date());
  const [fechaFin, setFechaFin] = useState(new Date());
  const [showPickerInicio, setShowPickerInicio] = useState(false);
  const [showPickerFin, setShowPickerFin] = useState(false);

  useEffect(() => {
    // 1. Escuchar obras
    const unsubObras = firestore().collection('obras').onSnapshot(snap => {
      const list: any[] = [];
      snap.forEach(doc => list.push({ ...doc.data(), id: doc.id }));
      setObras(list);
    });

    // 2. Cargar supervisores (Agregamos console.log para depurar)
    const unsubSuper = firestore().collection('users').where('rol', '==', 'supervisor').onSnapshot(snap => {
      const list: any[] = [];
      snap.forEach(doc => list.push({ ...doc.data(), uid: doc.id }));
      console.log("Supervisores encontrados:", list.length); // DEBUG
      setSupervisores(list);
    });

    // Manejar botón "Atrás" de Android cuando se está creando
    const backAction = () => {
      if (creando) {
        setCreando(false);
        return true;
      }
      return false;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => { unsubObras(); unsubSuper(); backHandler.remove(); };
  }, [creando]);

  const handleCreateObra = async () => {
    if (!nombre || !lat || !lng || !supervisorId) {
      Alert.alert("Error", "Todos los campos son obligatorios");
      return;
    }

    try {
      await firestore().collection('obras').add({
        nombre,
        ubicacion: { latitud: parseFloat(lat), longitud: parseFloat(lng) },
        radio: parseInt(radio),
        supervisorId,
        estatus: 'iniciando',
        fechaInicio: firestore.Timestamp.fromDate(fechaInicio),
        fechaFinEstimada: firestore.Timestamp.fromDate(fechaFin),
        fechaCreacion: firestore.FieldValue.serverTimestamp()
      });
      setCreando(false);
      resetForm();
      Alert.alert("Éxito", "Obra creada correctamente");
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "No se pudo crear la obra");
    }
  };

  const resetForm = () => {
    setNombre(''); setLat(''); setLng(''); setSupervisorId('');
    setFechaInicio(new Date()); setFechaFin(new Date());
  };

  const getSupervisorName = (id: string) => {
    const s = supervisores.find(x => x.uid === id);
    return s ? s.nombre : 'Seleccionar Supervisor';
  };

  // VISTA DE CREACIÓN (FORMULARIO)
  if (creando) {
    return (
      <View style={styles.container}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => setCreando(false)} />
          <Appbar.Content title="Nueva Obra" />
        </Appbar.Header>
        
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <TextInput label="Nombre de la Obra" value={nombre} onChangeText={setNombre} mode="outlined" style={styles.input} />
          
          <View style={styles.row}>
            <TextInput label="Latitud" value={lat} onChangeText={setLat} keyboardType="numeric" mode="outlined" style={[styles.input, {flex:1, marginRight:5}]} />
            <TextInput label="Longitud" value={lng} onChangeText={setLng} keyboardType="numeric" mode="outlined" style={[styles.input, {flex:1}]} />
          </View>
          <TextInput label="Radio (metros)" value={radio} onChangeText={setRadio} keyboardType="numeric" mode="outlined" style={styles.input} />

          {/* Menú de Supervisores (Ahora sí se verá porque no hay Modal nativo) */}
          <Menu
            visible={showSuperMenu}
            onDismiss={() => setShowSuperMenu(false)}
            anchor={
              <Button mode="outlined" onPress={() => setShowSuperMenu(true)} style={styles.input} contentStyle={{ justifyContent: 'flex-start' }}>
                {getSupervisorName(supervisorId)}
              </Button>
            }>
            {supervisores.map(sup => (
              <Menu.Item 
                key={sup.uid} 
                onPress={() => { setSupervisorId(sup.uid); setShowSuperMenu(false); }} 
                title={sup.nombre} 
              />
            ))}
          </Menu>

          {/* Fechas */}
          <View style={styles.row}>
             <Button onPress={() => setShowPickerInicio(true)} mode="outlined" style={[styles.input, {flex:1, marginRight:5}]}>
              Inicio: {format(fechaInicio, 'dd/MM/yyyy')}
            </Button>
            <Button onPress={() => setShowPickerFin(true)} mode="outlined" style={[styles.input, {flex:1}]}>
              Fin: {format(fechaFin, 'dd/MM/yyyy')}
            </Button>
          </View>

          {showPickerInicio && (
            <DateTimePicker value={fechaInicio} mode="date" onChange={(e, d) => { setShowPickerInicio(false); if(d) setFechaInicio(d); }} />
          )}
          {showPickerFin && (
            <DateTimePicker value={fechaFin} mode="date" onChange={(e, d) => { setShowPickerFin(false); if(d) setFechaFin(d); }} />
          )}

          <Button mode="contained" onPress={handleCreateObra} style={{marginTop: 20}}>
            Guardar Obra
          </Button>
        </ScrollView>
      </View>
    );
  }

  // VISTA DE LISTADO (PRINCIPAL)
  return (
    <View style={styles.container}>
      <Text variant="headlineSmall" style={styles.title}>Obras Públicas</Text>
      <FlatList
        data={obras}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <Card.Title title={item.nombre} subtitle={`Estatus: ${item.estatus}`} />
            <Card.Content>
              <Text>Lat: {item.ubicacion?.latitud}, Lng: {item.ubicacion?.longitud}</Text>
              <Text>Supervisor: {getSupervisorName(item.supervisorId)}</Text>
            </Card.Content>
          </Card>
        )}
      />
      <FAB icon="plus" style={styles.fab} onPress={() => setCreando(true)} label="Nueva Obra" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { padding: 20 },
  title: { margin: 10, fontWeight: 'bold' },
  card: { marginHorizontal: 10, marginBottom: 10, backgroundColor: '#f9f9f9' },
  fab: { position: 'absolute', margin: 16, right: 0, bottom: 0 },
  input: { marginBottom: 12 },
  row: { flexDirection: 'row' }
});