import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, Image, Linking, Alert } from 'react-native';
import { Text, Card, Button, Appbar, Menu, Chip } from 'react-native-paper';
import firestore from '@react-native-firebase/firestore';
import { format } from 'date-fns';

export default function AdminEvidenciasScreen() {
  // Filtros
  const [obras, setObras] = useState<any[]>([]);
  const [selectedObraId, setSelectedObraId] = useState<string | null>(null);
  const [selectedObraNombre, setSelectedObraNombre] = useState('Seleccionar Obra');
  const [showMenu, setShowMenu] = useState(false);

  // Datos
  const [evidencias, setEvidencias] = useState<any[]>([]);
  
  // 1. Cargar lista de obras para el filtro
  useEffect(() => {
    const unsub = firestore().collection('obras').onSnapshot(snap => {
      const list: any[] = [];
      snap.forEach(doc => list.push({ id: doc.id, nombre: doc.data().nombre }));
      setObras(list);
    });
    return () => unsub();
  }, []);

  // 2. Cargar evidencias al seleccionar obra
  useEffect(() => {
    if (!selectedObraId) {
      setEvidencias([]);
      return;
    }
    const unsub = firestore().collection('evidencias')
      .where('obraId', '==', selectedObraId)
      .orderBy('fecha', 'desc')
      .onSnapshot(snap => {
        const list: any[] = [];
        snap.forEach(doc => list.push({ ...doc.data(), id: doc.id }));
        setEvidencias(list);
      });
    return () => unsub();
  }, [selectedObraId]);

  const handleDownload = (url: string) => {
    if(url) {
      Linking.openURL(url).catch(err => Alert.alert("Error", "No se pudo abrir el enlace de descarga"));
    }
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Content title="Repositorio de Evidencias" />
      </Appbar.Header>

      <View style={styles.filterContainer}>
        <Text style={{marginBottom: 5}}>Filtrar por Obra:</Text>
        <Menu
          visible={showMenu}
          onDismiss={() => setShowMenu(false)}
          anchor={
            <Button mode="outlined" onPress={() => setShowMenu(true)} icon="chevron-down" contentStyle={{flexDirection: 'row-reverse'}}>
              {selectedObraNombre}
            </Button>
          }>
          {obras.map(obra => (
            <Menu.Item 
              key={obra.id} 
              onPress={() => { setSelectedObraId(obra.id); setSelectedObraNombre(obra.nombre); setShowMenu(false); }} 
              title={obra.nombre} 
            />
          ))}
        </Menu>
      </View>

      <FlatList
        data={evidencias}
        keyExtractor={item => item.id}
        numColumns={1} // Podría ser 2 si quisieras grid
        contentContainerStyle={{padding: 10}}
        ListEmptyComponent={
          <View style={{padding: 40, alignItems: 'center'}}>
            <Text style={{color: 'gray'}}>
              {selectedObraId ? 'No hay evidencias en esta obra.' : 'Selecciona una obra para ver sus evidencias.'}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <View style={{flexDirection:'row'}}>
              {/* Miniatura si es foto */}
              <View style={styles.mediaPreview}>
                {item.tipo === 'foto' ? (
                  <Image source={{ uri: item.urlArchivo }} style={{width: 100, height: 100, borderRadius: 5}} />
                ) : (
                  <View style={[styles.center, {backgroundColor: 'black', width: 100, height: 100}]}>
                    <Text style={{color: 'white'}}>VIDEO</Text>
                  </View>
                )}
              </View>

              {/* Info */}
              <View style={{flex: 1, padding: 10, justifyContent: 'space-between'}}>
                <View>
                  <Text style={{fontWeight: 'bold'}}>{item.tipo === 'foto' ? 'Fotografía' : 'Video de Reporte'}</Text>
                  <Text style={{fontSize: 12, color: 'gray'}}>{item.fecha ? format(item.fecha.toDate(), 'dd/MM/yyyy HH:mm') : '-'}</Text>
                  <Text numberOfLines={2} style={{marginTop: 5, fontSize: 13}}>{item.descripcion}</Text>
                </View>
                
                <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 5}}>
                  <Chip style={{height: 30}} textStyle={{fontSize: 10}} icon={item.estado === 'aprobado' ? 'check' : 'clock'}>{item.estado}</Chip>
                  <Button mode="contained-tonal" compact icon="download" onPress={() => handleDownload(item.urlArchivo)}>
                    Descargar
                  </Button>
                </View>
              </View>
            </View>
          </Card>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  filterContainer: { padding: 15, backgroundColor: 'white', elevation: 2 },
  card: { marginBottom: 10, backgroundColor: 'white' },
  mediaPreview: { padding: 5 },
  center: { justifyContent: 'center', alignItems: 'center' }
});