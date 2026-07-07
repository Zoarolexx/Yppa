// functions/adminFunctions.ts
import { 
  db, 
  collection, 
  doc, 
  updateDoc, 
  getDoc, 
  getDocs, 
  query, 
  where,
  serverTimestamp
} from '../config/firebase';
import { User, UserStats, Report } from '../types';

export const adminFunctions = {
  // Ban User
  banUser: async (
    userId: string,
    adminId: string
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      // Check if admin has permission
      const adminDoc = await getDoc(doc(db, 'users', adminId));
      const adminData = adminDoc.data() as User;
      
      if (adminData.role !== 'owner' && adminData.role !== 'admin' && adminData.role !== 'senior' && adminData.role !== 'helper') {
        return { success: false, message: 'Anda tidak memiliki izin untuk ban user' };
      }
      
      await updateDoc(doc(db, 'users', userId), {
        isBanned: true,
        bannedAt: serverTimestamp(),
        bannedBy: adminId
      });
      
      return { success: true, message: 'User berhasil di-ban' };
    } catch (error: any) {
      return { success: false, message: error.message || 'Gagal meng-ban user' };
    }
  },

  // Unban User
  unbanUser: async (
    userId: string,
    adminId: string
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const adminDoc = await getDoc(doc(db, 'users', adminId));
      const adminData = adminDoc.data() as User;
      
      if (adminData.role !== 'owner' && adminData.role !== 'admin' && adminData.role !== 'senior' && adminData.role !== 'helper') {
        return { success: false, message: 'Anda tidak memiliki izin untuk unban user' };
      }
      
      await updateDoc(doc(db, 'users', userId), {
        isBanned: false,
        unbannedAt: serverTimestamp(),
        unbannedBy: adminId
      });
      
      return { success: true, message: 'User berhasil di-unban' };
    } catch (error: any) {
      return { success: false, message: error.message || 'Gagal meng-unban user' };
    }
  },

  // Get User Statistics
  getUserStats: async (): Promise<{ success: boolean; stats?: UserStats; message?: string }> => {
    try {
      const usersRef = collection(db, 'users');
      const querySnapshot = await getDocs(usersRef);
      
      let totalUsers = 0;
      let activeUsers = 0;
      let bannedUsers = 0;
      
      querySnapshot.forEach((doc) => {
        const data = doc.data() as User;
        totalUsers++;
        if (data.isOnline) activeUsers++;
        if (data.isBanned) bannedUsers++;
      });
      
      // Get pending reports
      const reportsRef = collection(db, 'reports');
      const reportsQuery = query(reportsRef, where('status', '==', 'pending'));
      const reportsSnapshot = await getDocs(reportsQuery);
      
      // Get messages today
      const messagesRef = collection(db, 'messages');
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const messagesQuery = query(
        messagesRef,
        where('createdAt', '>=', today)
      );
      const messagesSnapshot = await getDocs(messagesQuery);
      
      const stats: UserStats = {
        totalUsers,
        activeUsers,
        bannedUsers,
        reportsPending: reportsSnapshot.size,
        messagesToday: messagesSnapshot.size
      };
      
      return { success: true, stats };
    } catch (error: any) {
      return { success: false, message: error.message || 'Gagal mengambil statistik user' };
    }
  },

  // Handle Report
  handleReport: async (
    reportId: string,
    adminId: string,
    action: 'resolve' | 'reject',
    note?: string
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const reportRef = doc(db, 'reports', reportId);
      const reportDoc = await getDoc(reportRef);
      
      if (!reportDoc.exists()) {
        return { success: false, message: 'Laporan tidak ditemukan' };
      }
      
      await updateDoc(reportRef, {
        status: action === 'resolve' ? 'resolved' : 'rejected',
        resolvedBy: adminId,
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

  // Get All Reports
  getReports: async (): Promise<{ success: boolean; reports?: Report[]; message?: string }> => {
    try {
      const reportsRef = collection(db, 'reports');
      const querySnapshot = await getDocs(reportsRef);
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