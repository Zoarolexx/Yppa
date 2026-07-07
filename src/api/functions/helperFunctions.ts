// functions/helperFunctions.ts
import { 
  db, 
  collection, 
  doc, 
  updateDoc, 
  getDoc, 
  getDocs, 
  query, 
  where,
  serverTimestamp,
  addDoc
} from '../config/firebase';
import { User, Report } from '../types';

export const helperFunctions = {
  // Handle Report (Helper permission)
  handleReport: async (
    reportId: string,
    helperId: string,
    action: 'resolve' | 'reject',
    note?: string
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const helperDoc = await getDoc(doc(db, 'users', helperId));
      const helperData = helperDoc.data() as User;
      
      if (helperData.role !== 'helper') {
        return { success: false, message: 'Hanya helper yang bisa menangani laporan' };
      }

      const reportRef = doc(db, 'reports', reportId);
      const reportDoc = await getDoc(reportRef);
      
      if (!reportDoc.exists()) {
        return { success: false, message: 'Laporan tidak ditemukan' };
      }
      
      await updateDoc(reportRef, {
        status: action === 'resolve' ? 'resolved' : 'rejected',
        resolvedBy: helperId,
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

  // Ban/Unban User (Helper permission)
  banUser: async (
    userId: string,
    helperId: string
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const helperDoc = await getDoc(doc(db, 'users', helperId));
      const helperData = helperDoc.data() as User;
      
      if (helperData.role !== 'helper') {
        return { success: false, message: 'Hanya helper yang bisa melakukan ini' };
      }

      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        return { success: false, message: 'User tidak ditemukan' };
      }

      const userData = userDoc.data() as User;
      
      if (userData.role === 'owner' || userData.role === 'senior' || userData.role === 'helper') {
        return { success: false, message: 'Tidak bisa memban user dengan role di atas' };
      }

      await updateDoc(userRef, {
        isBanned: true,
        bannedAt: serverTimestamp(),
        bannedBy: helperId
      });
      
      return { success: true, message: 'User berhasil di-ban' };
    } catch (error: any) {
      return { success: false, message: error.message || 'Gagal meng-ban user' };
    }
  },

  unbanUser: async (
    userId: string,
    helperId: string
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const helperDoc = await getDoc(doc(db, 'users', helperId));
      const helperData = helperDoc.data() as User;
      
      if (helperData.role !== 'helper') {
        return { success: false, message: 'Hanya helper yang bisa melakukan ini' };
      }

      await updateDoc(doc(db, 'users', userId), {
        isBanned: false,
        unbannedAt: serverTimestamp(),
        unbannedBy: helperId
      });
      
      return { success: true, message: 'User berhasil di-unban' };
    } catch (error: any) {
      return { success: false, message: error.message || 'Gagal meng-unban user' };
    }
  },

  // Get Learning Materials (from Senior)
  getLearningMaterials: async (
    helperId: string
  ): Promise<{ 
    success: boolean; 
    materials?: any[]; 
    message?: string 
  }> => {
    try {
      const helperDoc = await getDoc(doc(db, 'users', helperId));
      const helperData = helperDoc.data() as User;
      
      if (helperData.role !== 'helper') {
        return { success: false, message: 'Hanya helper yang bisa melihat materi pembelajaran' };
      }

      const teachingsRef = collection(db, 'teachings');
      const q = query(teachingsRef, where('helperId', '==', helperId));
      const querySnapshot = await getDocs(q);
      
      const materials: any[] = [];
      querySnapshot.forEach((doc) => {
        materials.push({ id: doc.id, ...doc.data() });
      });
      
      return { success: true, materials };
    } catch (error: any) {
      return { success: false, message: error.message || 'Gagal mengambil materi pembelajaran' };
    }
  },

  // Report Issue to Senior
  reportIssue: async (
    helperId: string,
    issue: {
      title: string;
      description: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      category: string;
    }
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const helperDoc = await getDoc(doc(db, 'users', helperId));
      const helperData = helperDoc.data() as User;
      
      if (helperData.role !== 'helper') {
        return { success: false, message: 'Hanya helper yang bisa melaporkan issue' };
      }

      const issueRef = collection(db, 'helperIssues');
      await addDoc(issueRef, {
        helperId,
        username: helperData.username,
        ...issue,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      return { success: true, message: 'Issue berhasil dilaporkan ke senior' };
    } catch (error: any) {
      return { success: false, message: error.message || 'Gagal melaporkan issue' };
    }
  },

  // Get All Reports (for Helper)
  getReports: async (
    helperId: string
  ): Promise<{ 
    success: boolean; 
    reports?: Report[]; 
    message?: string 
  }> => {
    try {
      const helperDoc = await getDoc(doc(db, 'users', helperId));
      const helperData = helperDoc.data() as User;
      
      if (helperData.role !== 'helper') {
        return { success: false, message: 'Hanya helper yang bisa melihat laporan' };
      }

      const reportsRef = collection(db, 'reports');
      const q = query(reportsRef, where('status', '==', 'pending'));
      const querySnapshot = await getDocs(q);
      
      const reports: Report[] = [];
      querySnapshot.forEach((doc) => {
        reports.push({ id: doc.id, ...doc.data() } as Report);
      });
      
      return { success: true, reports };
    } catch (error: any) {
      return { success: false, message: error.message || 'Gagal mengambil laporan' };
    }
  }
};