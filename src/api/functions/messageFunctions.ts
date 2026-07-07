// functions/messageFunctions.ts
import { 
  db, 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  or,
  and,
  serverTimestamp,
  ref,
  storage,
  uploadBytes,
  getDownloadURL
} from '../config/firebase';
import { Message } from '../types';

export const messageFunctions = {
  // Delete Message
  editMessage: async (
    messageId: string,
    userId: string,
    newContent: string
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const messageRef = doc(db, 'messages', messageId);
      const messageDoc = await getDoc(messageRef);
      
      if (!messageDoc.exists()) {
        return { success: false, message: 'Pesan tidak ditemukan' };
      }

      const messageData = messageDoc.data() as Message;
      
      if (messageData.senderId !== userId) {
        return { success: false, message: 'Anda tidak memiliki izin mengedit pesan ini' };
      }

      // Check 3 hours logic
      if (messageData.createdAt) {
         const createdAt = (messageData.createdAt as any).seconds * 1000;
         const now = Date.now();
         const hoursDiff = (now - createdAt) / (1000 * 60 * 60);
         if (hoursDiff > 3) {
            return { success: false, message: 'Pesan sudah lebih dari 3 jam, tidak bisa diedit' };
         }
      }

      await updateDoc(messageRef, { 
        content: newContent,
        isEdited: true,
        updatedAt: serverTimestamp()
      });
      
      return { success: true, message: 'Pesan berhasil diedit' };
    } catch (error: any) {
      return { success: false, message: error.message || 'Gagal mengedit pesan' };
    }
  },

  // Delete Message
  deleteMessage: async (
    messageId: string, 
    userId: string
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const messageRef = doc(db, 'messages', messageId);
      const messageDoc = await getDoc(messageRef);
      
      if (!messageDoc.exists()) {
        return { success: false, message: 'Pesan tidak ditemukan' };
      }

      const messageData = messageDoc.data() as Message;
      
      if (messageData.senderId !== userId) {
        return { success: false, message: 'Anda tidak memiliki izin menghapus pesan ini' };
      }

      if (messageData.createdAt) {
         const createdAt = (messageData.createdAt as any).seconds * 1000;
         const now = Date.now();
         const hoursDiff = (now - createdAt) / (1000 * 60 * 60);
         if (hoursDiff > 3) {
            return { success: false, message: 'Pesan sudah lebih dari 3 jam, tidak bisa dihapus' };
         }
      }

      await updateDoc(messageRef, { 
        isDeleted: true,
        content: 'Pesan telah dihapus'
      });
      
      return { success: true, message: 'Pesan berhasil dihapus' };
    } catch (error: any) {
      return { success: false, message: error.message || 'Gagal menghapus pesan' };
    }
  },

  // Send Voice Message
  sendVoiceMessage: async (
    senderId: string,
    receiverId: string,
    voiceBlob: Blob,
    duration: number
  ): Promise<{ success: boolean; message?: string; data?: Message }> => {
    try {
      const fileName = `voice/${Date.now()}_${senderId}.mp3`;
      const storageRef = ref(storage, fileName);
      
      await uploadBytes(storageRef, voiceBlob);
      const voiceUrl = await getDownloadURL(storageRef);
      
      const newMessage = {
        senderId,
        receiverId,
        content: voiceUrl,
        type: 'voice',
        voiceDuration: duration,
        isDeleted: false,
        isRead: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'messages'), newMessage);
      
      const savedMessage: Message = {
        id: docRef.id,
        ...newMessage,
        createdAt: new Date(),
        updatedAt: new Date()
      } as Message;
      
      return { 
        success: true, 
        message: 'Pesan suara berhasil dikirim',
        data: savedMessage
      };
    } catch (error: any) {
      return { success: false, message: error.message || 'Gagal mengirim pesan suara' };
    }
  },

  // Send Text Message
  sendTextMessage: async (
    senderId: string,
    receiverId: string,
    content: string
  ): Promise<{ success: boolean; message?: string; data?: Message }> => {
    try {
      const newMessage = {
        senderId,
        receiverId,
        content,
        type: 'text',
        isDeleted: false,
        isRead: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'messages'), newMessage);
      
      const savedMessage: Message = {
        id: docRef.id,
        ...newMessage,
        createdAt: new Date(),
        updatedAt: new Date()
      } as Message;
      
      return { 
        success: true, 
        message: 'Pesan berhasil dikirim',
        data: savedMessage
      };
    } catch (error: any) {
      return { success: false, message: error.message || 'Gagal mengirim pesan' };
    }
  },

  // Get Messages
  getMessages: async (
    userId1: string,
    userId2: string
  ): Promise<{ success: boolean; messages?: Message[]; message?: string }> => {
    try {
      const messagesRef = collection(db, 'messages');
      const q = query(
        messagesRef,
        or(
          and(where('senderId', '==', userId1), where('receiverId', '==', userId2)),
          and(where('senderId', '==', userId2), where('receiverId', '==', userId1))
        )
      );
      
      const querySnapshot = await getDocs(q);
      const messages: Message[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (!data.isDeleted) {
          messages.push({ id: doc.id, ...data } as Message);
        }
      });
      messages.sort((a, b) => {
        const timeA = (a.createdAt as any)?.seconds || 0;
        const timeB = (b.createdAt as any)?.seconds || 0;
        return timeA - timeB;
      });
      
      return { success: true, messages };
    } catch (error: any) {
      return { success: false, message: error.message || 'Gagal mengambil pesan' };
    }
  },

  // Listen to Messages (Real-time)
  listenMessages: (
    userId1: string,
    userId2: string,
    callback: (messages: Message[]) => void
  ): (() => void) => {
    const messagesRef = collection(db, 'messages');
    const q = query(
      messagesRef,
      or(
        and(where('senderId', '==', userId1), where('receiverId', '==', userId2)),
        and(where('senderId', '==', userId2), where('receiverId', '==', userId1))
      )
    );
    
    return onSnapshot(q, (snapshot) => {
      const messages: Message[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (!data.isDeleted) {
          messages.push({ id: doc.id, ...data } as Message);
        }
      });
      messages.sort((a, b) => {
        const timeA = (a.createdAt as any)?.seconds || 0;
        const timeB = (b.createdAt as any)?.seconds || 0;
        return timeA - timeB;
      });
      callback(messages);
    });
  },

  // Mark Message as Read
  markAsRead: async (messageId: string): Promise<{ success: boolean; message?: string }> => {
    try {
      await updateDoc(doc(db, 'messages', messageId), { 
        isRead: true,
        updatedAt: serverTimestamp()
      });
      return { success: true, message: 'Pesan ditandai telah dibaca' };
    } catch (error: any) {
      return { success: false, message: error.message || 'Gagal menandai pesan' };
    }
  }
};