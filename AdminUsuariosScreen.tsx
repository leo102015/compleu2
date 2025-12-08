import React, { useEffect, useState } from 'react';
import { View, FlatList, Alert, StyleSheet } from 'react-native';
import { Text, Card, Avatar, Button, Menu, Divider, Provider, Portal, Dialog, RadioButton } from 'react-native-paper';
import firestore from '@react-native-firebase/firestore';
import { useAuth } from './AuthContext';

export default function AdminUsuariosScreen() {
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [visible, setVisible] = useState(false); // Dialog visibility
  const [newRole, setNewRole] = useState('operador');
  const { signOut } = useAuth(); // Para el botón de cerrar sesión del admin

  useEffect(() => {
    const unsubscribe = firestore()
      .collection('users')
      .onSnapshot(querySnapshot => {
        const usersList: any[] = [];
        querySnapshot.forEach(documentSnapshot => {
          usersList.push({
            ...documentSnapshot.data(),
            uid: documentSnapshot.id,
          });
        });
        setUsers(usersList);
      });
    return () => unsubscribe();
  }, []);

  const openEditDialog = (user: any) => {
    setSelectedUser(user);
    setNewRole(user.rol || 'operador');
    setVisible(true);
  };

  const handleUpdateRole = async () => {
    if (!selectedUser) return;
    try {
      await firestore().collection('users').doc(selectedUser.uid).update({
        rol: newRole
      });
      setVisible(false);
      Alert.alert('Éxito', 'Rol actualizado correctamente');
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar el rol');
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <Card style={styles.card} onPress={() => openEditDialog(item)}>
      <Card.Title
        title={item.nombre || 'Sin Nombre'}
        subtitle={`${item.correo} - ${item.rol?.toUpperCase()}`}
        left={(props) => <Avatar.Icon {...props} icon="account" />}
        right={(props) => <MaterialCommunityIcons {...props} name="pencil" size={20} style={{ marginRight: 16 }} />}
      />
    </Card>
  );

  return (
    <Provider>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text variant="headlineSmall">Gestión de Usuarios</Text>
          <Button mode="outlined" onPress={signOut} compact>Salir</Button>
        </View>
        <Text style={styles.subtext}>Toca un usuario para cambiar su rol</Text>

        <FlatList
          data={users}
          keyExtractor={(item) => item.uid}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 20 }}
        />

        <Portal>
          <Dialog visible={visible} onDismiss={() => setVisible(false)}>
            <Dialog.Title>Editar Rol de {selectedUser?.nombre}</Dialog.Title>
            <Dialog.Content>
              <RadioButton.Group onValueChange={newValue => setNewRole(newValue)} value={newRole}>
                <View style={styles.radioRow}><RadioButton value="admin" /><Text>Administrador</Text></View>
                <View style={styles.radioRow}><RadioButton value="supervisor" /><Text>Supervisor</Text></View>
                <View style={styles.radioRow}><RadioButton value="operador" /><Text>Operador</Text></View>
              </RadioButton.Group>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setVisible(false)}>Cancelar</Button>
              <Button onPress={handleUpdateRole}>Guardar</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </View>
    </Provider>
  );
}

import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, backgroundColor: '#f5f5f5' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  subtext: { marginBottom: 10, color: 'gray' },
  card: { marginBottom: 10 },
  radioRow: { flexDirection: 'row', alignItems: 'center' }
});