import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, ProgressBar, Divider, Appbar, ActivityIndicator } from 'react-native-paper';
import firestore from '@react-native-firebase/firestore';
import { format, differenceInDays } from 'date-fns';

export default function AdminEstadisticasScreen() {
  const [stats, setStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Obtener todas las obras
    const unsub = firestore().collection('obras').onSnapshot(async (obrasSnap) => {
      const obrasData: any[] = [];
      
      // Promesas para obtener evidencias de cada obra
      const promises = obrasSnap.docs.map(async (doc) => {
        const obra = doc.data();
        const obraId = doc.id;
        
        // Obtener conteo de evidencias
        const evSnap = await firestore().collection('evidencias').where('obraId', '==', obraId).get();
        let total = 0;
        let aprobadas = 0;
        let rechazadas = 0;
        let pendientes = 0;

        evSnap.forEach(ev => {
          total++;
          const data = ev.data();
          if (data.estado === 'aprobado') aprobadas++;
          else if (data.estado === 'rechazado') rechazadas++;
          else pendientes++;
        });

        // Calcular progreso de tiempo
        const inicio = obra.fechaInicio?.toDate() || new Date();
        const fin = obra.fechaFinEstimada?.toDate() || new Date();
        const hoy = new Date();
        
        const totalDias = differenceInDays(fin, inicio);
        const diasPasados = differenceInDays(hoy, inicio);
        let progresoTiempo = totalDias > 0 ? diasPasados / totalDias : 0;
        if (progresoTiempo < 0) progresoTiempo = 0;
        if (progresoTiempo > 1) progresoTiempo = 1;

        return {
          id: obraId,
          nombre: obra.nombre,
          estatus: obra.estatus,
          total, aprobadas, rechazadas, pendientes,
          progresoTiempo,
          diasRestantes: differenceInDays(fin, hoy)
        };
      });

      const results = await Promise.all(promises);
      setStats(results);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" /><Text>Calculando estadísticas...</Text></View>;

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Content title="Estadísticas de Avance" />
      </Appbar.Header>

      <FlatList
        data={stats}
        keyExtractor={item => item.id}
        contentContainerStyle={{padding: 10}}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <Card.Title title={item.nombre} subtitle={`Estatus: ${item.estatus.toUpperCase()}`} />
            <Card.Content>
              
              <Text variant="titleSmall" style={{marginTop: 10}}>Progreso de Tiempo ({Math.round(item.progresoTiempo * 100)}%)</Text>
              <ProgressBar progress={item.progresoTiempo} color={item.progresoTiempo > 0.9 ? 'red' : '#6200ee'} style={{height: 10, borderRadius: 5, marginVertical: 5}} />
              <Text style={{fontSize: 12, color: 'gray'}}>Días restantes estimados: {item.diasRestantes}</Text>

              <Divider style={{marginVertical: 15}} />

              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={[styles.bigNum, {color: '#6200ee'}]}>{item.total}</Text>
                  <Text style={styles.label}>Evidencias</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.bigNum, {color: 'green'}]}>{item.aprobadas}</Text>
                  <Text style={styles.label}>Aprobadas</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.bigNum, {color: 'orange'}]}>{item.pendientes}</Text>
                  <Text style={styles.label}>Pendientes</Text>
                </View>
              </View>

            </Card.Content>
          </Card>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { marginBottom: 15, backgroundColor: 'white' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center' },
  bigNum: { fontSize: 24, fontWeight: 'bold' },
  label: { fontSize: 12, color: 'gray' }
});