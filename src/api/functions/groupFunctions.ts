// functions/groupFunctions.ts
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
  arrayUnion, 
  arrayRemove,
  serverTimestamp
} from '../config/firebase';
import { Group } from '../types';

export const groupFunctions = {
  // Create Group
  createGroup: async (
    name: string,
    createdBy: string,
    members: string[],
    description?: string,
    avatar?: string
  ): Promise<{ success: boolean; message?: string; group?: Group }> => {
    try {
      const newGroup = {
        name,
        description: description || '',
        avatar: avatar || '',
        adminIds: [createdBy],
        members: [createdBy, ...members],
        createdBy,
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'groups'), newGroup);
      
      const allMembers = [createdBy, ...members];
      for (const memberId of allMembers) {
        await updateDoc(doc(db, 'users', memberId), {
          groups: arrayUnion(docRef.id)
        });
      }
      
      const savedGroup: Group = {
        id: docRef.id,
        ...newGroup,
        createdAt: new Date(),
        updatedAt: new Date()
      } as Group;
      
      return { 
        success: true, 
        message: 'Grup berhasil dibuat',
        group: savedGroup
      };
    } catch (error: any) {
      return { success: false, message: error.message || 'Gagal membuat grup' };
    }
  },

  // Add Member to Group
  addMemberToGroup: async (
    groupId: string,
    userId: string,
    adminId: string
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const groupRef = doc(db, 'groups', groupId);
      const groupDoc = await getDoc(groupRef);
      const groupData = groupDoc.data() as Group;
      
      if (!groupData.adminIds.includes(adminId)) {
        return { success: false, message: 'Anda bukan admin grup ini' };
      }
      
      if (groupData.members.includes(userId)) {
        return { success: false, message: 'Pengguna sudah menjadi anggota grup' };
      }
      
      await updateDoc(groupRef, {
        members: arrayUnion(userId),
        updatedAt: serverTimestamp()
      });
      
      await updateDoc(doc(db, 'users', userId), {
        groups: arrayUnion(groupId)
      });
      
      return { success: true, message: 'Anggota berhasil ditambahkan' };
    } catch (error: any) {
      return { success: false, message: error.message || 'Gagal menambahkan anggota' };
    }
  },

  // Remove Member from Group
  removeMemberFromGroup: async (
    groupId: string,
    userId: string,
    adminId: string
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const groupRef = doc(db, 'groups', groupId);
      const groupDoc = await getDoc(groupRef);
      const groupData = groupDoc.data() as Group;
      
      if (!groupData.adminIds.includes(adminId)) {
        return { success: false, message: 'Anda bukan admin grup ini' };
      }
      
      if (!groupData.members.includes(userId)) {
        return { success: false, message: 'Pengguna bukan anggota grup' };
      }
      
      await updateDoc(groupRef, {
        members: arrayRemove(userId),
        updatedAt: serverTimestamp()
      });
      
      await updateDoc(doc(db, 'users', userId), {
        groups: arrayRemove(groupId)
      });
      
      return { success: true, message: 'Anggota berhasil dihapus' };
    } catch (error: any) {
      return { success: false, message: error.message || 'Gagal menghapus anggota' };
    }
  },

  // Make Admin
  makeAdmin: async (
    groupId: string,
    userId: string,
    adminId: string
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const groupRef = doc(db, 'groups', groupId);
      const groupDoc = await getDoc(groupRef);
      const groupData = groupDoc.data() as Group;
      
      if (!groupData.adminIds.includes(adminId)) {
        return { success: false, message: 'Anda bukan admin grup ini' };
      }
      
      if (groupData.adminIds.includes(userId)) {
        return { success: false, message: 'Pengguna sudah menjadi admin' };
      }
      
      await updateDoc(groupRef, {
        adminIds: arrayUnion(userId),
        updatedAt: serverTimestamp()
      });
      
      return { success: true, message: 'Admin berhasil ditambahkan' };
    } catch (error: any) {
      return { success: false, message: error.message || 'Gagal menambahkan admin' };
    }
  },

  // Remove Admin
  removeAdmin: async (
    groupId: string,
    userId: string,
    adminId: string
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const groupRef = doc(db, 'groups', groupId);
      const groupDoc = await getDoc(groupRef);
      const groupData = groupDoc.data() as Group;
      
      if (!groupData.adminIds.includes(adminId)) {
        return { success: false, message: 'Anda bukan admin grup ini' };
      }
      
      if (userId === groupData.createdBy) {
        return { success: false, message: 'Tidak bisa menghapus admin utama' };
      }
      
      await updateDoc(groupRef, {
        adminIds: arrayRemove(userId),
        updatedAt: serverTimestamp()
      });
      
      return { success: true, message: 'Admin berhasil dihapus' };
    } catch (error: any) {
      return { success: false, message: error.message || 'Gagal menghapus admin' };
    }
  },

  // Delete Group
  deleteGroup: async (
    groupId: string,
    userId: string
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const groupRef = doc(db, 'groups', groupId);
      const groupDoc = await getDoc(groupRef);
      const groupData = groupDoc.data() as Group;
      
      if (groupData.createdBy !== userId) {
        return { success: false, message: 'Hanya pembuat grup yang bisa menghapus grup' };
      }
      
      // Remove group from all members
      for (const memberId of groupData.members) {
        await updateDoc(doc(db, 'users', memberId), {
          groups: arrayRemove(groupId)
        });
      }
      
      await deleteDoc(groupRef);
      
      return { success: true, message: 'Grup berhasil dihapus' };
    } catch (error: any) {
      return { success: false, message: error.message || 'Gagal menghapus grup' };
    }
  },

  // Get Group by ID
  getGroup: async (groupId: string): Promise<{ success: boolean; group?: Group; message?: string }> => {
    try {
      const groupDoc = await getDoc(doc(db, 'groups', groupId));
      if (!groupDoc.exists()) {
        return { success: false, message: 'Grup tidak ditemukan' };
      }
      return { success: true, group: { id: groupDoc.id, ...groupDoc.data() } as Group };
    } catch (error: any) {
      return { success: false, message: error.message || 'Gagal mengambil grup' };
    }
  },

  // Get User Groups
  getUserGroups: async (userId: string): Promise<{ success: boolean; groups?: Group[]; message?: string }> => {
    try {
      const groupsRef = collection(db, 'groups');
      const q = query(groupsRef, where('members', 'array-contains', userId));
      const querySnapshot = await getDocs(q);
      const groups: Group[] = [];
      querySnapshot.forEach((doc) => {
        groups.push({ id: doc.id, ...doc.data() } as Group);
      });
      return { success: true, groups };
    } catch (error: any) {
      return { success: false, message: error.message || 'Gagal mengambil daftar grup' };
    }
  }
};