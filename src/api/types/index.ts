// types/index.ts
export interface User {
  id: string;
  username: string;
  email: string;
  phoneNumber: string;
  profilePicture?: string;
  status?: string;
  lastSeen?: Date;
  isOnline: boolean;
  role: 'owner' | 'admin' | 'senior' | 'helper' | 'user';
  isBanned: boolean;
  blockedUsers: string[];
  pinnedContacts: string[];
  contacts?: string[];
  groups: string[];
  createdAt: Date;
  deviceToken?: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  type: 'text' | 'voice' | 'image' | 'video' | 'document';
  voiceDuration?: number;
  isDeleted: boolean;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
  replyTo?: string;
}

export interface Group {
  id: string;
  name: string;
  avatar?: string;
  adminIds: string[];
  members: string[];
  createdAt: Date;
  createdBy: string;
  isActive: boolean;
  description?: string;
}

export interface Report {
  id: string;
  reporterId: string;
  reportedId: string;
  reason: string;
  description: string;
  status: 'pending' | 'resolved' | 'rejected';
  createdAt: Date;
  resolvedBy?: string;
  resolvedAt?: Date;
}

export interface CallHistory {
  id: string;
  callerId: string;
  receiverId: string;
  type: 'voice' | 'video';
  duration: number;
  status: 'missed' | 'answered' | 'rejected';
  createdAt: Date;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  bannedUsers: number;
  reportsPending: number;
  messagesToday: number;
}