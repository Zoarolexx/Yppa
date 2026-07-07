// functions/profileFunctions.ts
import { 
  db, 
  doc, 
  updateDoc, 
  getDoc,
  collection,
  getDocs,
  ref,
  storage,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from '../config/firebase';
import { User } from '../types';

export const profileFunctions = {
  // Update Profile
  updateProfile: async (
    userId: string,
    data: Partial<User>
  ): Promise<{ success: boolean; message?: string; user?: User }> => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        ...data,
        updatedAt: new Date()
      });
      
      const updatedDoc = await getDoc(userRef);
      const userData = updatedDoc.data() as User;
      
      return { 
        success: true, 
        message: 'Profil berhasil diperbarui',
        user: userData
      };
    } catch (error: any) {
      return { success: false, message: error.message || 'Gagal memperbarui profil' };
    }
  },

  // Upload Profile Picture
  uploadProfilePicture: async (
    userId: string,
    file: File
  ): Promise<{ success: boolean; message?: string; url?: string }> => {
    try {
      const fileName = `profile-pictures/${userId}_${Date.now()}.jpg`;
      const storageRef = ref(storage, fileName);
      
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      
      const userDoc = await getDoc(doc(db, 'users', userId));
      const userData = userDoc.data() as User;
      if (userData.profilePicture) {
        const oldRef = ref(storage, userData.profilePicture);
        await deleteObject(oldRef).catch(() => {});
      }
      
      await updateDoc(doc(db, 'users', userId), {
        profilePicture: downloadURL,
        updatedAt: new Date()
      });
      
      return { 
        success: true, 
        message: 'Foto profil berhasil diunggah',
        url: downloadURL
      };
    } catch (error: any) {
      return { success: false, message: error.message || 'Gagal mengunggah foto profil' };
    }
  },

  // Update Status
  updateStatus: async (
    userId: string,
    status: string
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        status,
        updatedAt: new Date()
      });
      return { success: true, message: 'Status berhasil diperbarui' };
    } catch (error: any) {
      return { success: false, message: error.message || 'Gagal memperbarui status' };
    }
  },

  // Get User Profile
  getUserProfile: async (userId: string): Promise<{ success: boolean; user?: User; message?: string }> => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (!userDoc.exists()) {
        return { success: false, message: 'Pengguna tidak ditemukan' };
      }
      return { success: true, user: userDoc.data() as User };
    } catch (error: any) {
      return { success: false, message: error.message || 'Gagal mengambil profil' };
    }
  },

  // Get All Users
  getAllUsers: async (): Promise<{ success: boolean; users?: User[]; message?: string }> => {
    try {
      const usersRef = collection(db, 'users');
      const querySnapshot = await getDocs(usersRef);
      const users: User[] = [];
      querySnapshot.forEach((docSnap: any) => {
        users.push({ id: docSnap.id, ...docSnap.data() } as User);
      });
      return { success: true, users };
    } catch (error: any) {
      return { success: false, message: error.message || 'Gagal mengambil daftar pengguna' };
    }
  }
};