// functions/authFunctions.ts
import { 
  auth, 
  signInWithPopup, 
  googleProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  db,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp
} from '../config/firebase';
import { User } from '../types';

export const authFunctions = {
  registerWithEmail: async (
    email: string, 
    password: string, 
    username: string,
    phoneNumber: string
  ): Promise<{ success: boolean; message?: string; user?: User }> => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const newUser: User = {
        id: user.uid,
        username,
        email,
        phoneNumber,
        profilePicture: '',
        status: 'Hai, saya menggunakan WhatsApp Clone',
        lastSeen: new Date(),
        isOnline: true,
        role: 'user',
        isBanned: false,
        blockedUsers: [],
        pinnedContacts: [],
        groups: [],
        createdAt: new Date()
      };

      await setDoc(doc(db, 'users', user.uid), newUser);
      
      return { 
        success: true, 
        message: 'Registrasi berhasil',
        user: newUser
      };
    } catch (error: any) {
      return { 
        success: false, 
        message: error.message || 'Registrasi gagal'
      };
    }
  },

  loginWithEmail: async (
    email: string, 
    password: string
  ): Promise<{ success: boolean; message?: string; user?: User }> => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      await updateDoc(doc(db, 'users', user.uid), {
        isOnline: true,
        lastSeen: new Date()
      });

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data() as User;
      
      return { 
        success: true, 
        message: 'Login berhasil',
        user: userData
      };
    } catch (error: any) {
      return { 
        success: false, 
        message: error.message || 'Login gagal'
      };
    }
  },

  loginWithGoogle: async (): Promise<{ success: boolean; message?: string; user?: User }> => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDoc.exists()) {
        const newUser: User = {
          id: user.uid,
          username: user.displayName || user.email?.split('@')[0] || 'User',
          email: user.email || '',
          phoneNumber: user.phoneNumber || '',
          profilePicture: user.photoURL || '',
          status: 'Hai, saya menggunakan WhatsApp Clone',
          lastSeen: new Date(),
          isOnline: true,
          role: user.email === 'nanzzmodepoco@gmail.com' ? 'owner' : 'user',
          isBanned: false,
          blockedUsers: [],
          pinnedContacts: [],
          groups: [],
          createdAt: new Date()
        };
        await setDoc(doc(db, 'users', user.uid), newUser);
        return { success: true, message: 'Login berhasil', user: newUser };
      }

      const userData = userDoc.data() as User;
      await updateDoc(doc(db, 'users', user.uid), {
        isOnline: true,
        lastSeen: new Date()
      });

      return { success: true, message: 'Login berhasil', user: userData };
    } catch (error: any) {
      console.error("Login Error:", error);
      let errorMessage = error.message || 'Login dengan Google gagal';
      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Popup tertutup. Silakan buka aplikasi di tab baru (klik ikon di pojok kanan atas) dan coba lagi.';
      } else if (error.code === 'auth/network-request-failed' || error.message?.includes('client is offline')) {
        errorMessage = `Koneksi Firestore gagal (${error.code || 'offline'}). Coba buka di tab baru dan matikan AdBlocker.`;
      }
      return { 
        success: false, 
        message: errorMessage
      };
    }
  },

  signOut: async (): Promise<{ success: boolean; message?: string }> => {
    try {
      const user = auth.currentUser;
      if (user) {
        await updateDoc(doc(db, 'users', user.uid), {
          isOnline: false,
          lastSeen: new Date()
        });
      }
      await firebaseSignOut(auth);
      return { success: true, message: 'Logout berhasil' };
    } catch (error: any) {
      return { 
        success: false, 
        message: error.message || 'Logout gagal'
      };
    }
  },

  getCurrentUser: async (): Promise<User | null> => {
    return new Promise((resolve) => {
      onAuthStateChanged(auth, async (user) => {
        if (user) {
          try {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
              resolve(userDoc.data() as User);
            } else {
              resolve(null);
            }
          } catch (error: any) {
            console.error("Error getting user document:", error);
            resolve(null);
          }
        } else {
          resolve(null);
        }
      });
    });
  }
};