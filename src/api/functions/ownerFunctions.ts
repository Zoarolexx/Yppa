// functions/ownerFunctions.ts
import { 
  db, 
  collection, 
  doc, 
  updateDoc, 
  getDoc, 
  getDocs, 
  deleteDoc,
  query,
  where,
  serverTimestamp
} from '../config/firebase';
import { User } from '../types';

export const ownerFunctions = {
  // Manage Role Admin
  manageAdminRole: async (
    userId: string,
    action: 'promote' | 'demote',
    ownerId: string
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      // Verify owner
      const ownerDoc = await getDoc(doc(db, 'users', ownerId));
      const ownerData = ownerDoc.data() as User;
      
      if (ownerData.role !== 'owner') {
        return { success: false, message: 'Hanya owner yang bisa mengelola role admin' };
      }

      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        return { success: false, message: 'User tidak ditemukan' };
      }

      const userData = userDoc.data() as User;
      
      if (action === 'promote') {
        if (userData.role === 'owner') {
          return { success: false, message: 'Tidak bisa mempromosikan owner' };
        }
        await updateDoc(userRef, {
          role: 'senior',
          promotedAt: serverTimestamp(),
          promotedBy: ownerId
        });
        return { success: true, message: 'User berhasil dipromosikan menjadi admin' };
      } else {
        if (userData.role === 'owner') {
          return { success: false, message: 'Tidak bisa mendemote owner' };
        }
        await updateDoc(userRef, {
          role: 'user',
          demotedAt: serverTimestamp(),
          demotedBy: ownerId
        });
        return { success: true, message: 'Admin berhasil didemote menjadi user biasa' };
      }
    } catch (error: any) {
      return { success: false, message: error.message || 'Gagal mengelola role admin' };
    }
  },

  // View User Statistics (Detailed)
  getDetailedUserStats: async (): Promise<{ 
    success: boolean; 
    stats?: {
      totalUsers: number;
      activeUsers: number;
      bannedUsers: number;
      ownerCount: number;
      seniorCount: number;
      helperCount: number;
      userCount: number;
      reportsToday: number;
      messagesToday: number;
      groupsCount: number;
    };
    message?: string 
  }> => {
    try {
      const usersRef = collection(db, 'users');
      const querySnapshot = await getDocs(usersRef);
      
      let totalUsers = 0;
      let activeUsers = 0;
      let bannedUsers = 0;
      let ownerCount = 0;
      let seniorCount = 0;
      let helperCount = 0;
      let userCount = 0;
      
      querySnapshot.forEach((doc) => {
        const data = doc.data() as User;
        totalUsers++;
        if (data.isOnline) activeUsers++;
        if (data.isBanned) bannedUsers++;
        
        switch(data.role) {
          case 'owner': ownerCount++; break;
          case 'senior': seniorCount++; break;
          case 'helper': helperCount++; break;
          default: userCount++;
        }
      });
      
      // Get today's reports
      const reportsRef = collection(db, 'reports');
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const reportsQuery = query(
        reportsRef,
        where('createdAt', '>=', today)
      );
      const reportsSnapshot = await getDocs(reportsQuery);
      
      // Get today's messages
      const messagesRef = collection(db, 'messages');
      const messagesQuery = query(
        messagesRef,
        where('createdAt', '>=', today)
      );
      const messagesSnapshot = await getDocs(messagesQuery);
      
      // Get groups count
      const groupsRef = collection(db, 'groups');
      const groupsSnapshot = await getDocs(groupsRef);
      
      const stats = {
        totalUsers,
        activeUsers,
        bannedUsers,
        ownerCount,
        seniorCount,
        helperCount,
        userCount,
        reportsToday: reportsSnapshot.size,
        messagesToday: messagesSnapshot.size,
        groupsCount: groupsSnapshot.size
      };
      
      return { success: true, stats };
    } catch (error: any) {
      return { success: false, message: error.message || 'Gagal mengambil statistik detail' };
    }
  },

  // Kick/Invite Admin
  manageAdminMembership: async (
    userId: string,
    action: 'kick' | 'invite',
    ownerId: string
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const ownerDoc = await getDoc(doc(db, 'users', ownerId));
      const ownerData = ownerDoc.data() as User;
      
      if (ownerData.role !== 'owner') {
        return { success: false, message: 'Hanya owner yang bisa mengelola admin' };
      }

      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        return { success: false, message: 'User tidak ditemukan' };
      }

      const userData = userDoc.data() as User;
      
      if (action === 'kick') {
        if (userData.role === 'owner') {
          return { success: false, message: 'Tidak bisa mengkick owner' };
        }
        await updateDoc(userRef, {
          role: 'user',
          kickedAt: serverTimestamp(),
          kickedBy: ownerId
        });
        return { success: true, message: 'Admin berhasil dikick' };
      } else {
        if (userData.role === 'owner') {
          return { success: false, message: 'Owner sudah menjadi admin' };
        }
        await updateDoc(userRef, {
          role: 'helper',
          invitedAt: serverTimestamp(),
          invitedBy: ownerId
        });
        return { success: true, message: 'User berhasil diundang menjadi admin' };
      }
    } catch (error: any) {
      return { success: false, message: error.message || 'Gagal mengelola admin' };
    }
  },

  // Reset Database
  resetDatabase: async (
    ownerId: string,
    confirm: boolean
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      if (!confirm) {
        return { success: false, message: 'Konfirmasi reset database diperlukan' };
      }

      const ownerDoc = await getDoc(doc(db, 'users', ownerId));
      const ownerData = ownerDoc.data() as User;
      
      if (ownerData.role !== 'owner') {
        return { success: false, message: 'Hanya owner yang bisa mereset database' };
      }

      // Delete all messages
      const messagesRef = collection(db, 'messages');
      const messagesSnapshot = await getDocs(messagesRef);
      for (const docSnapshot of messagesSnapshot.docs) {
        await deleteDoc(doc(db, 'messages', docSnapshot.id));
      }

      // Delete all calls
      const callsRef = collection(db, 'calls');
      const callsSnapshot = await getDocs(callsRef);
      for (const docSnapshot of callsSnapshot.docs) {
        await deleteDoc(doc(db, 'calls', docSnapshot.id));
      }

      // Delete all reports
      const reportsRef = collection(db, 'reports');
      const reportsSnapshot = await getDocs(reportsRef);
      for (const docSnapshot of reportsSnapshot.docs) {
        await deleteDoc(doc(db, 'reports', docSnapshot.id));
      }

      // Delete all groups
      const groupsRef = collection(db, 'groups');
      const groupsSnapshot = await getDocs(groupsRef);
      for (const docSnapshot of groupsSnapshot.docs) {
        await deleteDoc(doc(db, 'groups', docSnapshot.id));
      }

      // Reset users (keep users but reset their data)
      const usersRef = collection(db, 'users');
      const usersSnapshot = await getDocs(usersRef);
      for (const docSnapshot of usersSnapshot.docs) {
        const data = docSnapshot.data() as User;
        if (data.role === 'owner') {
          // Keep owner data
          continue;
        }
        await updateDoc(doc(db, 'users', docSnapshot.id), {
          groups: [],
          pinnedContacts: [],
          status: 'Pengguna baru',
          isOnline: false,
          lastSeen: new Date()
        });
      }

      return { success: true, message: 'Database berhasil direset' };
    } catch (error: any) {
      return { success: false, message: error.message || 'Gagal mereset database' };
    }
  },

  // Report Handle (Full Access)
  handleAllReports: async (
    reportId: string,
    ownerId: string,
    action: 'resolve' | 'reject',
    note?: string
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const ownerDoc = await getDoc(doc(db, 'users', ownerId));
      const ownerData = ownerDoc.data() as User;
      
      if (ownerData.role !== 'owner') {
        return { success: false, message: 'Hanya owner yang bisa menangani semua laporan' };
      }

      const reportRef = doc(db, 'reports', reportId);
      const reportDoc = await getDoc(reportRef);
      
      if (!reportDoc.exists()) {
        return { success: false, message: 'Laporan tidak ditemukan' };
      }
      
      await updateDoc(reportRef, {
        status: action === 'resolve' ? 'resolved' : 'rejected',
        resolvedBy: ownerId,
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
  }
};