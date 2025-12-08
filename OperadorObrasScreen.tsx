import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, Alert, Image, ScrollView, Platform, PermissionsAndroid } from 'react-native';
import { Text, Card, Button, Appbar, TextInput, SegmentedButtons, ActivityIndicator, ProgressBar } from 'react-native-paper';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import { launchCamera } from 'react-native-image-picker';
import Geolocation from 'react-native-geolocation-service';
import { useAuth } from './AuthContext';

export default function OperadorObrasScreen() {
  const { user } = useAuth();
  const [assignedObras, setAssignedObras] = useState<any[]>([]);
  const [selectedObra, setSelectedObra] = useState<any>(null);

  // Estados del Formulario de Evidencia
  const [descripcion, setDescripcion] = useState('');
  const [mediaType, setMediaType] = useState('photo'); // 'photo' | 'video'
  const [fileUri, setFileUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [transferred, setTransferred] = useState(0);

  // 1. Escuchar Ubicación en Tiempo Real (Rastreo)
  useEffect(() => {
    if (!user) return;
    
    // Solicitar permiso de ubicación
    const requestLocationPermission = async () => {
      if (Platform.OS === 'android') {
        await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );
      }
    };
    requestLocationPermission();

    // Iniciar rastreo
    const watchId = Geolocation.watchPosition(
      (position) => {
        // Actualizar Firestore con la ubicación actual
        firestore().collection('ubicaciones_tiempo_real').doc(user.uid).set({
            usuarioId: user.uid,
            latitud: position.coords.latitude,
            longitud: position.coords.longitude,
            timestamp: firestore.FieldValue.serverTimestamp(),
            obraActualId: selectedObra ? selectedObra.id : 'sin_obra_activa'
        });
      },
      (error) => {
        console.log(error.code, error.message);
      },
      { enableHighAccuracy: true, distanceFilter: 10, interval: 10000, fastestInterval: 5000 }
    );

    return () => Geolocation.clearWatch(watchId);
  }, [user, selectedObra]); // Se actualiza si cambia de obra

  // 2. Cargar Obras Asignadas
  useEffect(() => {
    if (!user) return;

    // Primero obtenemos el documento del usuario para ver sus IDs asignados
    const unsubUser = firestore().collection('users').doc(user.uid).onSnapshot(async (doc) => {
      const userData = doc.data();
      const ids = userData?.obrasAsignadas || [];
      
      if (ids.length > 0) {
        // Consultar los detalles de esas obras
        // Firestore 'in' query soporta hasta 10 items. Si son más, se necesita lógica extra.
        const obrasSnap = await firestore().collection('obras').where(firestore.FieldPath.documentId(), 'in', ids).get();
        const list: any[] = [];
        obrasSnap.forEach(o => list.push({ ...o.data(), id: o.id }));
        setAssignedObras(list);
      } else {
        setAssignedObras([]);
      }
    });

    return () => unsubUser();
  }, [user]);

  // Lógica de Captura Multimedia
  const handleCapture = async () => {
    const options: any = {
      mediaType: mediaType,
      quality: 0.8,
      videoQuality: 'high',
    };

    const result = await launchCamera(options);

    if (result.assets && result.assets.length > 0) {
      setFileUri(result.assets[0].uri || null);
    }
  };

  // Lógica de Subida
  const handleSubmitEvidencia = async () => {
    if (!fileUri || !descripcion) {
      Alert.alert("Faltan datos", "Debes capturar una foto/video y añadir una descripción.");
      return;
    }

    // Confirmación Nativa
    Alert.alert(
      "Confirmar Envío",
      "¿Estás seguro de subir esta evidencia?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Subir", onPress: uploadToFirebase }
      ]
    );
  };

  const uploadToFirebase = async () => {
    setUploading(true);
    setTransferred(0);

    try {
      // 1. Obtener Ubicación actual precisa para la evidencia
      Geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          // 2. Subir Archivo a Storage
          const filename = `${selectedObra.id}_${user?.uid}_${Date.now()}`;
          const reference = storage().ref(`evidencias/${filename}`);
          
          const task = reference.putFile(fileUri!);

          task.on('state_changed', snapshot => {
            setTransferred(
              Math.round(snapshot.bytesTransferred / snapshot.totalBytes) * 10000
            );
          });

          await task;
          const url = await reference.getDownloadURL();

          // 3. Guardar en Firestore
          await firestore().collection('evidencias').add({
            obraId: selectedObra.id,
            usuarioId: user?.uid,
            tipo: mediaType,
            urlArchivo: url,
            ubicacionCaptura: { latitud: latitude, longitud: longitude },
            descripcion: descripcion,
            fecha: firestore.FieldValue.serverTimestamp(),
            estado: 'pendiente',
            supervisorAproboId: null
          });

          setUploading(false);
          Alert.alert("Éxito", "Evidencia enviada correctamente");
          setSelectedObra(null); // Regresar a lista
          setFileUri(null);
          setDescripcion('');
        },
        (error) => {
          setUploading(false);
          Alert.alert("Error Ubicación", "No se pudo obtener la ubicación para la evidencia.");
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );

    } catch (e) {
      console.error(e);
      setUploading(false);
      Alert.alert("Error", "Falló la subida del archivo");
    }
  };

  // VISTA: FORMULARIO DE EVIDENCIA
  if (selectedObra) {
    return (
      <View style={styles.container}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => setSelectedObra(null)} />
          <Appbar.Content title={selectedObra.nombre} subtitle="Nueva Evidencia" />
        </Appbar.Header>

        <ScrollView contentContainerStyle={{padding: 20}}>
          <Text style={{marginBottom: 10}}>Selecciona tipo de evidencia:</Text>
          <SegmentedButtons
            value={mediaType}
            onValueChange={setMediaType}
            buttons={[
              { value: 'photo', label: 'Fotografía', icon: 'camera' },
              { value: 'video', label: 'Video', icon: 'video' },
            ]}
            style={{marginBottom: 20}}
          />

          <View style={styles.previewContainer}>
            {fileUri ? (
              mediaType === 'photo' ? 
                <Image source={{ uri: fileUri }} style={styles.preview} /> :
                <View style={[styles.preview, {justifyContent:'center', alignItems:'center', backgroundColor:'#000'}]}>
                   <Text style={{color:'white'}}>Video Capturado</Text>
                </View>
            ) : (
              <View style={[styles.preview, {justifyContent:'center', alignItems:'center', backgroundColor:'#e0e0e0'}]}>
                <Text style={{color:'gray'}}>Sin captura</Text>
              </View>
            )}
          </View>

          <Button mode="contained-tonal" icon="camera" onPress={handleCapture} style={{marginBottom: 20}}>
            Capturar {mediaType === 'photo' ? 'Foto' : 'Video'}
          </Button>

          <TextInput
            label="Descripción de la evidencia"
            value={descripcion}
            onChangeText={setDescripcion}
            mode="outlined"
            multiline
            numberOfLines={3}
            style={{marginBottom: 20}}
          />

          {uploading ? (
            <View>
              <Text style={{textAlign:'center', marginBottom:5}}>Subiendo... {transferred / 100}%</Text>
              <ProgressBar progress={transferred / 10000} color="#6200ee" />
            </View>
          ) : (
            <Button mode="contained" onPress={handleSubmitEvidencia} contentStyle={{paddingVertical: 5}}>
              Enviar Evidencia
            </Button>
          )}

        </ScrollView>
      </View>
    );
  }

  // VISTA: LISTA DE OBRAS ASIGNADAS
  return (
    <View style={styles.container}>
       <Appbar.Header>
        <Appbar.Content title="Obras Asignadas" />
      </Appbar.Header>
      
      <FlatList
        data={assignedObras}
        keyExtractor={item => item.id}
        ListEmptyComponent={
          <View style={{padding:20, alignItems:'center'}}>
            <Text>No tienes obras asignadas.</Text>
            <Text style={{color:'gray', textAlign:'center', marginTop:10}}>Solicita a tu supervisor que te asigne una obra.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Card style={styles.card} onPress={() => setSelectedObra(item)}>
            <Card.Title title={item.nombre} subtitle={`Estatus: ${item.estatus}`} left={(props) => <Button icon="hard-hat" {...props}/>} />
            <Card.Content>
              <Text>Ubicación: {item.ubicacion?.latitud}, {item.ubicacion?.longitud}</Text>
              <Button mode="text" style={{marginTop: 10}}>Reportar Avance</Button>
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
  previewContainer: { alignItems: 'center', marginBottom: 20 },
  preview: { width: '100%', height: 200, borderRadius: 10, resizeMode: 'cover' }
});