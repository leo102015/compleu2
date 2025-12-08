import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, Avatar, Button, Dialog, Portal, Checkbox, List, FAB, TextInput, Modal, Provider } from 'react-native-paper';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import firebase from '@react-native-firebase/app'; // Necesario para la instancia secundaria
import { useAuth } from './AuthContext';

export default function SupervisorOperadoresScreen() {
  const { user } = useAuth();
  const [operadores, setOperadores] = useState<any[]>([]);
  const [misObras, setMisObras] = useState<any[]>([]);
  
  // Dialogo de Asignación de Obras
  const [assignVisible, setAssignVisible] = useState(false);
  const [selectedOperador, setSelectedOperador] = useState<any>(null);
  const [obrasSeleccionadas, setObrasSeleccionadas] = useState<string[]>([]);

  // Modal de Crear/Editar Operador
  const [formVisible, setFormVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [opNombre, setOpNombre] = useState('');
  const [opCorreo, setOpCorreo] = useState('');
  const [opPassword, setOpPassword] = useState('');
  const [loadingForm, setLoadingForm] = useState(false);

  // 1. Cargar Operadores
  useEffect(() => {
    const unsub = firestore().collection('users').where('rol', '==', 'operador').onSnapshot(snap => {
      const list: any[] = [];
      snap.forEach(doc => list.push({ ...doc.data(), uid: doc.id }));
      setOperadores(list);
    });
    return () => unsub();
  }, []);

  // 2. Cargar Mis Obras
  useEffect(() => {
    if(!user) return;
    const unsub = firestore().collection('obras').where('supervisorId', '==', user.uid).onSnapshot(snap => {
      const list: any[] = [];
      snap.forEach(doc => list.push({ id: doc.id, nombre: doc.data().nombre }));
      setMisObras(list);
    });
    return () => unsub();
  }, [user]);

  // --- LÓGICA DE ASIGNACIÓN ---
  const openAssignDialog = (operador: any) => {
    setSelectedOperador(operador);
    setObrasSeleccionadas(operador.obrasAsignadas || []);
    setAssignVisible(true);
  };

  const toggleObra = (obraId: string) => {
    if (obrasSeleccionadas.includes(obraId)) {
      setObrasSeleccionadas(obrasSeleccionadas.filter(id => id !== obraId));
    } else {
      setObrasSeleccionadas([...obrasSeleccionadas, obraId]);
    }
  };

  const saveAssignments = async () => {
    if (!selectedOperador) return;
    try {
      await firestore().collection('users').doc(selectedOperador.uid).update({
        obrasAsignadas: obrasSeleccionadas
      });
      setAssignVisible(false);
      Alert.alert("Éxito", "Asignaciones actualizadas");
    } catch (e) {
      Alert.alert("Error", "No se pudo asignar obras");
    }
  };

  // --- LÓGICA DE ALTA/EDICIÓN DE OPERADOR ---
  const openCreateForm = () => {
    setIsEditing(false);
    setOpNombre(''); setOpCorreo(''); setOpPassword('');
    setFormVisible(true);
  };

  const openEditForm = (operador: any) => {
    setIsEditing(true);
    setSelectedOperador(operador);
    setOpNombre(operador.nombre);
    setOpCorreo(operador.correo);
    setOpPassword(''); // No editamos password aquí por seguridad simple
    setFormVisible(true);
  };

  const handleSaveOperador = async () => {
    if (!opNombre || !opCorreo) {
      Alert.alert("Error", "Nombre y correo son obligatorios");
      return;
    }

    setLoadingForm(true);

    try {
      if (isEditing) {
        // ACTUALIZAR INFORMACIÓN
        await firestore().collection('users').doc(selectedOperador.uid).update({
          nombre: opNombre,
          correo: opCorreo
          // No actualizamos correo en Auth aquí para simplificar, solo en Firestore visual
        });
        Alert.alert("Éxito", "Operador actualizado");
      } else {
        // CREAR NUEVO (ALTA)
        if (!opPassword || opPassword.length < 6) {
          Alert.alert("Error", "La contraseña debe tener al menos 6 caracteres");
          setLoadingForm(false);
          return;
        }

        // TRUCO: Usar una app secundaria para crear usuario sin desloguear al supervisor
        let secondaryApp = firebase.apps.find(app => app.name === 'SecondaryApp');
        if (!secondaryApp) {
             secondaryApp = await firebase.initializeApp(firebase.app().options, 'SecondaryApp');
        }

        const userCred = await secondaryApp.auth().createUserWithEmailAndPassword(opCorreo, opPassword);
        const newUid = userCred.user.uid;

        // Crear documento en Firestore
        await firestore().collection('users').doc(newUid).set({
          nombre: opNombre,
          correo: opCorreo,
          rol: 'operador',
          obrasAsignadas: []
        });

        // Limpiar app secundaria
        await secondaryApp.delete(); 
        
        Alert.alert("Éxito", "Operador creado correctamente");
      }
      setFormVisible(false);
    } catch (e: any) {
      console.error(e);
      Alert.alert("Error", e.message || "Hubo un problema al guardar");
    } finally {
      setLoadingForm(false);
    }
  };

  return (
    <Provider>
      <View style={styles.container}>
        <Text variant="headlineSmall" style={styles.title}>Operadores</Text>

        <FlatList
          data={operadores}
          keyExtractor={item => item.uid}
          renderItem={({ item }) => (
            <Card style={styles.card}>
              <Card.Title
                title={item.nombre}
                subtitle={item.correo}
                left={(props) => <Avatar.Icon {...props} icon="account-hard-hat" />}
              />
              <Card.Actions>
                <Button onPress={() => openEditForm(item)}>Editar Info</Button>
                <Button mode="contained-tonal" onPress={() => openAssignDialog(item)}>Asignar Obras</Button>
              </Card.Actions>
            </Card>
          )}
        />

        <FAB icon="plus" style={styles.fab} label="Nuevo Operador" onPress={openCreateForm} />

        {/* DIALOGO DE ASIGNACIÓN */}
        <Portal>
          <Dialog visible={assignVisible} onDismiss={() => setAssignVisible(false)}>
            <Dialog.Title>Asignar Obras</Dialog.Title>
            <Dialog.ScrollArea>
              <ScrollView contentContainerStyle={{paddingHorizontal: 0, paddingVertical: 10}}>
                {misObras.length === 0 ? <Text>No tienes obras para asignar.</Text> : misObras.map(obra => (
                  <List.Item
                    key={obra.id}
                    title={obra.nombre}
                    onPress={() => toggleObra(obra.id)}
                    right={() => <Checkbox status={obrasSeleccionadas.includes(obra.id) ? 'checked' : 'unchecked'} />}
                  />
                ))}
              </ScrollView>
            </Dialog.ScrollArea>
            <Dialog.Actions>
              <Button onPress={() => setAssignVisible(false)}>Cerrar</Button>
              <Button onPress={saveAssignments}>Guardar</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>

        {/* MODAL DE CREAR/EDITAR OPERADOR */}
        <Portal>
          <Modal visible={formVisible} onDismiss={() => setFormVisible(false)} contentContainerStyle={styles.modalContent}>
            <Text variant="headlineSmall" style={{marginBottom:15}}>
              {isEditing ? 'Editar Operador' : 'Nuevo Operador'}
            </Text>
            
            <TextInput label="Nombre Completo" value={opNombre} onChangeText={setOpNombre} mode="outlined" style={styles.input} />
            <TextInput label="Correo Electrónico" value={opCorreo} onChangeText={setOpCorreo} mode="outlined" keyboardType="email-address" autoCapitalize="none" style={styles.input} disabled={isEditing} />
            
            {!isEditing && (
              <TextInput label="Contraseña" value={opPassword} onChangeText={setOpPassword} mode="outlined" secureTextEntry style={styles.input} />
            )}

            <View style={styles.row}>
              <Button onPress={() => setFormVisible(false)} disabled={loadingForm}>Cancelar</Button>
              <Button mode="contained" onPress={handleSaveOperador} loading={loadingForm} disabled={loadingForm}>
                {isEditing ? 'Actualizar' : 'Crear Usuario'}
              </Button>
            </View>
          </Modal>
        </Portal>

      </View>
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, backgroundColor: '#f5f5f5' },
  title: { fontWeight: 'bold', marginBottom: 10 },
  card: { marginBottom: 10 },
  fab: { position: 'absolute', margin: 16, right: 0, bottom: 0 },
  modalContent: { backgroundColor: 'white', padding: 20, margin: 20, borderRadius: 10 },
  input: { marginBottom: 15 },
  row: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 }
});