import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Avatar, Button, Dialog, Portal, Checkbox, List } from 'react-native-paper';
import firestore from '@react-native-firebase/firestore';
import { useAuth } from './AuthContext';

export default function SupervisorOperadoresScreen() {
  const { user } = useAuth(); // Supervisor actual
  const [operadores, setOperadores] = useState<any[]>([]);
  const [misObras, setMisObras] = useState<any[]>([]);
  
  // Estados para el Dialogo de Asignación
  const [visible, setVisible] = useState(false);
  const [selectedOperador, setSelectedOperador] = useState<any>(null);
  const [obrasSeleccionadas, setObrasSeleccionadas] = useState<string[]>([]);

  // 1. Cargar Operadores
  useEffect(() => {
    const unsub = firestore().collection('users').where('rol', '==', 'operador').onSnapshot(snap => {
      const list: any[] = [];
      snap.forEach(doc => list.push({ ...doc.data(), uid: doc.id }));
      setOperadores(list);
    });
    return () => unsub();
  }, []);

  // 2. Cargar Mis Obras (solo las que este supervisor puede asignar)
  useEffect(() => {
    if(!user) return;
    const unsub = firestore().collection('obras').where('supervisorId', '==', user.uid).onSnapshot(snap => {
      const list: any[] = [];
      snap.forEach(doc => list.push({ id: doc.id, nombre: doc.data().nombre }));
      setMisObras(list);
    });
    return () => unsub();
  }, [user]);

  const openAssignDialog = (operador: any) => {
    setSelectedOperador(operador);
    // Cargar las obras que ya tiene asignadas este operador (si existen)
    setObrasSeleccionadas(operador.obrasAsignadas || []);
    setVisible(true);
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
      setVisible(false);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineSmall" style={styles.title}>Gestión de Operadores</Text>
      <Text style={styles.subtitle}>Selecciona un operador para asignarle obras</Text>

      <FlatList
        data={operadores}
        keyExtractor={item => item.uid}
        renderItem={({ item }) => (
          <Card style={styles.card} onPress={() => openAssignDialog(item)}>
            <Card.Title
              title={item.nombre}
              subtitle={item.correo}
              left={(props) => <Avatar.Icon {...props} icon="account-hard-hat" />}
              right={(props) => <Button {...props}>Asignar</Button>}
            />
            <Card.Content>
              <Text variant="bodySmall">Obras asignadas: {item.obrasAsignadas?.length || 0}</Text>
            </Card.Content>
          </Card>
        )}
      />

      <Portal>
        <Dialog visible={visible} onDismiss={() => setVisible(false)}>
          <Dialog.Title>Asignar Obras a {selectedOperador?.nombre}</Dialog.Title>
          <Dialog.ScrollArea>
            <ScrollView contentContainerStyle={{paddingHorizontal: 0}}>
              {misObras.length === 0 ? (
                <Text>No tienes obras asignadas para delegar.</Text>
              ) : (
                misObras.map(obra => (
                  <List.Item
                    key={obra.id}
                    title={obra.nombre}
                    onPress={() => toggleObra(obra.id)}
                    right={() => <Checkbox status={obrasSeleccionadas.includes(obra.id) ? 'checked' : 'unchecked'} />}
                  />
                ))
              )}
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setVisible(false)}>Cancelar</Button>
            <Button onPress={saveAssignments}>Guardar</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, backgroundColor: '#f5f5f5' },
  title: { fontWeight: 'bold', marginBottom: 5 },
  subtitle: { marginBottom: 15, color: 'gray' },
  card: { marginBottom: 10 }
});