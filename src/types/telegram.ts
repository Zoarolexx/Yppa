export interface User {
  id: string;
  name: string;
  avatar: string;
  status?: string;
  lastSeen?: string;
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
  isRead: boolean;
  originalCreatedAt?: any;
  type?: string;
  isEdited?: boolean;
}

export interface Chat {
  id: string;
  user: User;
  lastMessage?: Message;
  unreadCount: number;
}
