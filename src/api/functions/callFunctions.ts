// functions/callFunctions.ts
import { 
  db, 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  serverTimestamp
} from '../config/firebase';
import { CallHistory } from '../types';

export const callFunctions = {
  // Start Voice Call
  startVoiceCall: async (
    callerId: string,
    receiverId: string
  ): Promise<{ success: boolean; message?: string; callId?: string }> => {
    try {
      const callData = {
        callerId,
        receiverId,
        type: 'voice',
        status: 'missed',
        duration: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'calls'), callData);
      
      return { 
        success: true, 
        message: 'Panggilan suara dimulai',
        callId: docRef.id
      };
    } catch (error: any) {
      return { success: false, message: error.message || 'Gagal memulai panggilan suara' };
    }
  },

  // Start Video Call
  startVideoCall: async (
    callerId: string,
    receiverId: string
  ): Promise<{ success: boolean; message?: string; callId?: string }> => {
    try {
      const callData = {
        callerId,
        receiverId,
        type: 'video',
        status: 'missed',
        duration: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'calls'), callData);
      
      return { 
        success: true, 
        message: 'Panggilan video dimulai',
        callId: docRef.id
      };
    } catch (error: any) {
      return { success: false, message: error.message || 'Gagal memulai panggilan video' };
    }
  },

  // End Call
  endCall: async (
    callId: string,
    duration: number,
    status: 'answered' | 'rejected' | 'missed'
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      await updateDoc(doc(db, 'calls', callId), {
        duration,
        status,
        updatedAt: serverTimestamp()
      });
      
      return { success: true, message: 'Panggilan selesai' };
    } catch (error: any) {
      return { success: false, message: error.message || 'Gagal mengakhiri panggilan' };
    }
  },

  // Get Call History
  getCallHistory: async (
    userId: string
  ): Promise<{ success: boolean; calls?: CallHistory[]; message?: string }> => {
    try {
      const callsRef = collection(db, 'calls');
      const q = query(
        callsRef,
        where('callerId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const calls: CallHistory[] = [];
      querySnapshot.forEach((doc) => {
        calls.push({ id: doc.id, ...doc.data() } as CallHistory);
      });
      
      return { success: true, calls };
    } catch (error: any) {
      return { success: false, message: error.message || 'Gagal mengambil riwayat panggilan' };
    }
  },

  // Get Call by ID
  getCall: async (callId: string): Promise<{ success: boolean; call?: CallHistory; message?: string }> => {
    try {
      const callDoc = await getDoc(doc(db, 'calls', callId));
      if (!callDoc.exists()) {
        return { success: false, message: 'Panggilan tidak ditemukan' };
      }
      return { success: true, call: { id: callDoc.id, ...callDoc.data() } as CallHistory };
    } catch (error: any) {
      return { success: false, message: error.message || 'Gagal mengambil panggilan' };
    }
  }
};