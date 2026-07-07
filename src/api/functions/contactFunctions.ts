// functions/contactFunctions.ts
import { 
  db, 
  doc, 
  updateDoc, 
  getDoc,
  arrayUnion,
  arrayRemove,
  collection,
  query,
  where,
  getDocs
} from '../config/firebase';
import { User } from '../types';

export const contactFunctions = {
  // Add Friend By Email
  addFriendByEmail: async (
    userId: string,
    email: string
  ): Promise<{ success: boolean; message?: string; friend?: User }> => {
    try {
      // Find user by email
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email.toLowerCase()));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return { success: false, message: 'Pengguna dengan email tersebut tidak ditemukan' };
      }
      
      const friendDoc = querySnapshot.docs[0];
      const friendId = friendDoc.id;
      
      if (friendId === userId) {
        return { success: false, message: 'Anda tidak dapat menambahkan diri sendiri' };
      }
      
      // Update contacts array for current user
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data() as User;
      
      if (userData.contacts?.includes(friendId)) {
        return { success: false, message: 'Pengguna ini sudah ada di daftar kontak Anda' };
      }
      
      await updateDoc(userRef, {
        contacts: arrayUnion(friendId)
      });
      
      return { 
        success: true, 
        message: 'Teman berhasil ditambahkan',
        friend: { id: friendId, ...friendDoc.data() } as User
      };
    } catch (error: any) {
      return { success: false, message: error.message || 'Gagal menambahkan teman' };
    }
  },

  // Block User
  blockUser: async (
    userId: string,
    blockUserId: string
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        blockedUsers: arrayUnion(blockUserId)
      });
      return { success: true, message: 'Pengguna berhasil diblokir' };
    } catch (error: any) {
      return { success: false, message: error.message || 'Gagal memblokir pengguna' };
    }
  },

  // Unblock User
  unblockUser: async (
    userId: string,
    unblockUserId: string
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        blockedUsers: arrayRemove(unblockUserId)
      });
      return { success: true, message: 'Pengguna berhasil dibuka blokirnya' };
    } catch (error: any) {
      return { success: false, message: error.message || 'Gagal membuka blokir pengguna' };
    }
  },

  // Pin Contact
  pinContact: async (
    userId: string,
    contactId: string
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data() as any;
      
      if (userData.pinnedContacts?.includes(contactId)) {
        return { success: false, message: 'Kontak sudah dipin' };
      }
      
      await updateDoc(userRef, {
        pinnedContacts: arrayUnion(contactId)
      });
      return { success: true, message: 'Kontak berhasil dipin' };
    } catch (error: any) {
      return { success: false, message: error.message || 'Gagal mempin kontak' };
    }
  },

  // Unpin Contact
  unpinContact: async (
    userId: string,
    contactId: string
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        pinnedContacts: arrayRemove(contactId)
      });
      return { success: true, message: 'Kontak berhasil dilepas dari pin' };
    } catch (error: any) {
      return { success: false, message: error.message || 'Gagal melepas pin kontak' };
    }
  },

  // Check if user is blocked
  isUserBlocked: async (
    userId: string,
    checkUserId: string
  ): Promise<{ success: boolean; isBlocked: boolean; message?: string }> => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      const userData = userDoc.data() as any;
      return { 
        success: true, 
        isBlocked: userData.blockedUsers?.includes(checkUserId) || false 
      };
    } catch (error: any) {
      return { 
        success: false, 
        isBlocked: false,
        message: error.message || 'Gagal mengecek status blokir'
      };
    }
  }
};