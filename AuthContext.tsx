import React, { createContext, useState, useEffect, useContext } from 'react';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

type Role = 'admin' | 'supervisor' | 'operador' | null;

interface AuthContextData {
  user: FirebaseAuthTypes.User | null;
  role: Role;
  loading: boolean;
  signIn: (email: string, pass: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [role, setRole] = useState<Role>(null);
  const [loading, setLoading] = useState(true);

  // Escuchar cambios de sesión
  useEffect(() => {
    const subscriber = auth().onAuthStateChanged(async (userState) => {
      if (userState) {
        setUser(userState);
        // Si hay usuario, buscamos su rol en Firestore
        try {
          const userDoc = await firestore().collection('users').doc(userState.uid).get();
          if (userDoc.exists) {
            const userData = userDoc.data();
            setRole(userData?.rol as Role); // 'admin', 'supervisor', 'operador'
          } else {
            console.error("Usuario autenticado pero sin registro en colección 'users'");
            setRole(null);
          }
        } catch (error) {
          console.error("Error obteniendo rol:", error);
          setRole(null);
        }
      } else {
        setUser(null);
        setRole(null);
      }
      setLoading(false);
    });
    return subscriber; // cancelar suscripción
  }, []);

  const signIn = async (email: string, pass: string) => {
    try {
      await auth().signInWithEmailAndPassword(email, pass);
    } catch (error) {
      throw error;
    }
  };

  const signOut = async () => {
    await auth().signOut();
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);