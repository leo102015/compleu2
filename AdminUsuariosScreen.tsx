import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, Alert, ScrollView } from 'react-native';
import { Text, Card, Avatar, Button, Menu, Portal, Modal, Provider, TextInput, FAB, RadioButton, Appbar } from 'react-native-paper';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import firebase from '@react-native-firebase/app';
import { useAuth } from './AuthContext';

export default function AdminUsuariosScreen() {
  const { signOut } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  
  // Estados Modal
  const [visible, setVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  
  // Campos Formulario
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState('operador');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = firestore().collection('users').onSnapshot(snap => {
      const list: any[] = [];
      snap.forEach(doc => list.push({ ...doc.data(), uid: doc.id }));
      setUsers(list);
    });
    return () => unsubscribe();
  }, []);

  const openCreate = () => {
    setIsEditing(false);
    resetForm();
    setVisible(true);
  };

  const openEdit = (user: any) => {
    setIsEditing(true);
    setSelectedUser(user);
    setNombre(user.nombre);
    setCorreo(user.correo);
    setRol(user.rol);
    setPassword(''); // No mostramos pass
    setVisible(true);
  };

  const resetForm = () => {
    setNombre(''); setCorreo(''); setPassword(''); setRol('operador');
  };

  const handleSave = async () => {
    if (!nombre || !correo) {
      Alert.alert("Error", "Nombre y correo requeridos");
      return;
    }
    setLoading(true);

    try {
      if (isEditing && selectedUser) {
        // ACTUALIZAR
        await firestore().collection('users').doc(selectedUser.uid).update({
          nombre,
          rol,
          // Nota: El correo en Auth no se actualiza aquí por simplicidad, solo en Firestore visual
          correo 
        });
        Alert.alert("Éxito", "Usuario actualizado");
      } else {
        // CREAR NUEVO (Con App Secundaria)
        if (!password || password.length < 6) {
          Alert.alert("Error", "Contraseña mínima de 6 caracteres");
          setLoading(false); return;
        }

        let secondaryApp = firebase.apps.find(app => app.name === 'SecondaryApp');
        if (!secondaryApp) {
             // Obtenemos las opciones de la app principal
             const mainOptions = firebase.app().options;
             
             // Creamos opciones para la secundaria, AGREGANDO MANUALMENTE databaseURL
             const secondaryOptions = {
                 ...mainOptions,
                 databaseURL: `https://comple-5c182.firebaseio.com` 
             };
             
             console.log("Inicializando SecondaryApp con:", secondaryOptions); // Debug
             secondaryApp = await firebase.initializeApp(secondaryOptions, 'SecondaryApp');
        }
        
        const userCred = await secondaryApp.auth().createUserWithEmailAndPassword(correo, password);
        
        await firestore().collection('users').doc(userCred.user.uid).set({
          nombre,
          correo,
          rol,
          obrasAsignadas: [] // Inicializar array vacío
        });

        await secondaryApp.delete();
        Alert.alert("Éxito", "Usuario creado correctamente");
      }
      setVisible(false);
    } catch (e: any) {
      Alert.alert("Error", e.message || "Ocurrió un error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Provider>
      <View style={styles.container}>
        <Appbar.Header>
          <Appbar.Content title="Usuarios del Sistema" />
          <Appbar.Action icon="logout" onPress={signOut} />
        </Appbar.Header>

        <FlatList
          data={users}
          keyExtractor={item => item.uid}
          renderItem={({ item }) => (
            <Card style={styles.card} onPress={() => openEdit(item)}>
              <Card.Title
                title={item.nombre}
                subtitle={`${item.rol.toUpperCase()} - ${item.correo}`}
                left={(props) => <Avatar.Icon {...props} icon="account" />}
                right={(props) => <Button icon="pencil" onPress={() => openEdit(item)}>Edit</Button>}
              />
            </Card>
          )}
        />

        <FAB icon="plus" style={styles.fab} onPress={openCreate} label="Nuevo Usuario" />

        <Portal>
          <Modal visible={visible} onDismiss={() => setVisible(false)} contentContainerStyle={styles.modalContent}>
            <Text variant="headlineSmall" style={{marginBottom:15}}>{isEditing ? 'Editar Usuario' : 'Nuevo Usuario'}</Text>
            
            <TextInput label="Nombre" value={nombre} onChangeText={setNombre} mode="outlined" style={styles.input} />
            <TextInput label="Correo" value={correo} onChangeText={setCorreo} mode="outlined" keyboardType="email-address" autoCapitalize="none" style={styles.input} disabled={isEditing} />
            
            {!isEditing && (
              <TextInput label="Contraseña" value={password} onChangeText={setPassword} mode="outlined" secureTextEntry style={styles.input} />
            )}

            <Text style={{marginTop:10}}>Rol Asignado:</Text>
            <RadioButton.Group onValueChange={setRol} value={rol}>
              <View style={styles.radioRow}><RadioButton value="admin" /><Text>Administrador</Text></View>
              <View style={styles.radioRow}><RadioButton value="supervisor" /><Text>Supervisor</Text></View>
              <View style={styles.radioRow}><RadioButton value="operador" /><Text>Operador</Text></View>
            </RadioButton.Group>

            <View style={styles.row}>
              <Button onPress={() => setVisible(false)} disabled={loading}>Cancelar</Button>
              <Button mode="contained" onPress={handleSave} loading={loading} disabled={loading}>Guardar</Button>
            </View>
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
  modalContent: { backgroundColor: 'white', padding: 20, margin: 20, borderRadius: 10 },
  input: { marginBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 15 },
  radioRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 }
});