// functions/seniorFunctions.ts
import { 
  db, 
  collection, 
  doc, 
  updateDoc, 
  getDoc, 
  getDocs,
  addDoc,
  query, 
  where,
  serverTimestamp
} from '../config/firebase';
import { User, Report } from '../types';

export const seniorFunctions = {
  // Ban/Unban User (Senior permission)
  banUser: async (
    userId: string,
    seniorId: string
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const seniorDoc = await getDoc(doc(db, 'users', seniorId));
      const seniorData = seniorDoc.data() as User;
      
      if (seniorData.role !== 'senior') {
        return { success: false, message: 'Hanya senior yang bisa melakukan ini' };
      }

      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        return { success: false, message: 'User tidak ditemukan' };
      }

      const userData = userDoc.data() as User;
      
      if (userData.role === 'owner' || userData.role === 'senior') {
        return { success: false, message: 'Tidak bisa memban user dengan role di atas' };
      }

      await updateDoc(userRef, {
        isBanned: true,
        bannedAt: serverTimestamp(),
        bannedBy: seniorId
      });
      
      return { success: true, message: 'User berhasil di-ban' };
    } catch (error: any) {
      return { success: false, message: error.message || 'Gagal meng-ban user' };
    }
  },

  unbanUser: async (
    userId: string,
    seniorId: string
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const seniorDoc = await getDoc(doc(db, 'users', seniorId));
      const seniorData = seniorDoc.data() as User;
      
      if (seniorData.role !== 'senior') {
        return { success: false, message: 'Hanya senior yang bisa melakukan ini' };
      }

      await updateDoc(doc(db, 'users', userId), {
        isBanned: false,
        unbannedAt: serverTimestamp(),
        unbannedBy: seniorId
      });
      
      return { success: true, message: 'User berhasil di-unban' };
    } catch (error: any) {
      return { success: false, message: error.message || 'Gagal meng-unban user' };
    }
  },

  // Handle Report (Senior permission)
  handleReport: async (
    reportId: string,
    seniorId: string,
    action: 'resolve' | 'reject',
    note?: string
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const seniorDoc = await getDoc(doc(db, 'users', seniorId));
      const seniorData = seniorDoc.data() as User;
      
      if (seniorData.role !== 'senior') {
        return { success: false, message: 'Hanya senior yang bisa menangani laporan' };
      }

      const reportRef = doc(db, 'reports', reportId);
      const reportDoc = await getDoc(reportRef);
      
      if (!reportDoc.exists()) {
        return { success: false, message: 'Laporan tidak ditemukan' };
      }
      
      await updateDoc(reportRef, {
        status: action === 'resolve' ? 'resolved' : 'rejected',
        resolvedBy: seniorId,
        resolvedAt: serverTimestamp(),
        note: note || ''
      });
      
      return { 
        success: true, 
        message: `Laporan berhasil ${action === 'resolve' ? 'diselesaikan' : 'ditolak'}`
      };
    } catch (error: any) {
      return { success: false, message: error.message || 'Gagal menangani laporan' };
    }
  },

  // Helper Handle - Teach Helper
  teachHelper: async (
    helperId: string,
    seniorId: string,
    topic: string,
    content: string
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const seniorDoc = await getDoc(doc(db, 'users', seniorId));
      const seniorData = seniorDoc.data() as User;
      
      if (seniorData.role !== 'senior') {
        return { success: false, message: 'Hanya senior yang bisa mengajari helper' };
      }

      const helperDoc = await getDoc(doc(db, 'users', helperId));
      const helperData = helperDoc.data() as User;
      
      if (helperData.role !== 'helper') {
        return { success: false, message: 'User bukan helper' };
      }

      // Save teaching record
      const teachingRef = collection(db, 'teachings');
      await addDoc(teachingRef, {
        helperId,
        seniorId,
        topic,
        content,
        createdAt: serverTimestamp(),
        status: 'completed'
      });

      // Update helper's learning progress
      await updateDoc(doc(db, 'users', helperId), {
        'learningProgress': {
          lastTopic: topic,
          lastTaughtBy: seniorId,
          updatedAt: serverTimestamp()
        }
      });

      return { success: true, message: 'Helper berhasil diajari' };
    } catch (error: any) {
      return { success: false, message: error.message || 'Gagal mengajari helper' };
    }
  },

  // Request Role Promotion to Owner
  requestPromotion: async (
    seniorId: string,
    requestData: {
      reason: string;
      achievements: string[];
      yearsOfService: number;
    }
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const seniorDoc = await getDoc(doc(db, 'users', seniorId));
      const seniorData = seniorDoc.data() as User;
      
      if (seniorData.role !== 'senior') {
        return { success: false, message: 'Hanya senior yang bisa mengajukan promosi' };
      }

      // Save promotion request
      const promotionRef = collection(db, 'promotionRequests');
      await addDoc(promotionRef, {
        userId: seniorId,
        username: seniorData.username,
        reason: requestData.reason,
        achievements: requestData.achievements,
        yearsOfService: requestData.yearsOfService,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      return { 
        success: true, 
        message: 'Permohonan promosi berhasil diajukan ke owner' 
      };
    } catch (error: any) {
      return { success: false, message: error.message || 'Gagal mengajukan promosi' };
    }
  },

  // Get All Helpers (for Senior)
  getHelpers: async (seniorId: string): Promise<{ 
    success: boolean; 
    helpers?: User[]; 
    message?: string 
  }> => {
    try {
      const seniorDoc = await getDoc(doc(db, 'users', seniorId));
      const seniorData = seniorDoc.data() as User;
      
      if (seniorData.role !== 'senior') {
        return { success: false, message: 'Hanya senior yang bisa melihat daftar helper' };
      }

      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('role', '==', 'helper'));
      const querySnapshot = await getDocs(q);
      
      const helpers: User[] = [];
      querySnapshot.forEach((doc) => {
        helpers.push({ id: doc.id, ...doc.data() } as User);
      });
      
      return { success: true, helpers };
    } catch (error: any) {
      return { success: false, message: error.message || 'Gagal mengambil daftar helper' };
    }
  }
};