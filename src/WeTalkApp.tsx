import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { Message, Chat } from './types/telegram';
import { useAuth } from './contexts/AuthContext';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { LayoutDashboard, LogOut, User as UserIcon } from 'lucide-react';
import { ProfileModal } from './components/modals/ProfileModal';
import { AddFriendModal } from './components/modals/AddFriendModal';
import { profileFunctions } from './api/functions/profileFunctions';
import { messageFunctions } from './api/functions/messageFunctions';
import { User } from './api/types';
import { UserPlus } from 'lucide-react';

export function WeTalkApp() {
  const { user, loading, login, logout } = useAuth();
  
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);

  const activeChat = chats.find(c => c.id === activeChatId) || null;
  const activeMessages = activeChat ? (messages[activeChat.user.id] || []) : [];

  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Load chats (other users)
  const loadFriends = () => {
    if (user) {
      profileFunctions.getUserProfile(user.id).then(userRes => {
        if (userRes.success && userRes.user) {
          const userContacts = userRes.user.contacts || [];
          
          profileFunctions.getAllUsers().then(res => {
            if (res.success && res.users) {
              const loadedChats: Chat[] = res.users
                .filter(u => u.id !== user.id && userContacts.includes(u.id))
                .map(u => ({
                  id: u.id,
                  user: {
                    id: u.id,
                    name: u.username || 'User',
                    avatar: u.profilePicture || `https://ui-avatars.com/api/?name=${u.username || 'User'}`,
                    isOnline: u.isOnline,
                    lastSeen: u.lastSeen ? new Date((u.lastSeen as any).seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
                  },
                  unreadCount: 0
                }));
              setChats(loadedChats);
            }
          });
        }
      });
    }
  };

  useEffect(() => {
    loadFriends();
  }, [user]);

  // Listen for messages when a chat is active
  useEffect(() => {
    if (user && activeChatId) {
      const unsubscribe = messageFunctions.listenMessages(user.id, activeChatId, (firebaseMessages: any[]) => {
        // map firebase messages to our app's Message format
        const formattedMessages: Message[] = firebaseMessages.map(m => ({
          id: m.id,
          senderId: m.senderId === user.id ? 'me' : m.senderId,
          text: m.type === 'text' ? m.content : '',
          timestamp: m.createdAt ? new Date((m.createdAt as any).seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isRead: m.isRead,
          voiceUrl: m.type === 'voice' ? m.content : undefined,
          originalCreatedAt: m.createdAt,
          type: m.type,
          isEdited: m.isEdited,
        }));
        
        setMessages(prev => ({
          ...prev,
          [activeChatId]: formattedMessages
        }));

        // Also update last message in chats
        if (formattedMessages.length > 0) {
          const lastMsg = formattedMessages[formattedMessages.length - 1];
          setChats(prev => prev.map(c => {
            if (c.id === activeChatId) {
              return { ...c, lastMessage: lastMsg };
            }
            return c;
          }));
        }
      });
      return () => unsubscribe();
    }
  }, [user, activeChatId]);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setLoginError(null);
    const res = await login();
    if (!res.success) {
      setLoginError(res.message || "Failed to login");
    }
    setIsLoggingIn(false);
  };

  if (loading) {
    return <div className="flex h-screen w-full items-center justify-center bg-gray-50"><p className="text-gray-500 animate-pulse">Loading...</p></div>;
  }

  if (!user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-sm w-full text-center">
          <h1 className="text-2xl font-bold mb-6 text-gray-900">WeTalk</h1>
          {loginError && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm text-left">
              {loginError}
              {loginError.includes('auth/operation-not-allowed') && (
                <div className="mt-2 text-xs font-semibold">
                  Please enable Google Authentication Provider in your Firebase Console.
                </div>
              )}
              {loginError.includes('offline') && (
                <div className="mt-2 text-xs font-semibold">
                  <p className="mb-2">Firestore connection failed. Please ensure:</p>
                  <ul className="list-disc pl-4 text-left">
                    <li>You are opening this app in a <b>new tab</b> (icon top right).</li>
                    <li>Your Firestore Database <b>Rules</b> are correctly set to allow read/write.</li>
                  </ul>
                  <p className="mt-2">To fix rules, go to Firebase Console &gt; Firestore &gt; Rules, and paste <b>exactly</b> this (replace all existing text):</p>
                  <pre className="mt-1 bg-red-50 p-2 rounded text-[10px] overflow-x-auto">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}`}
                  </pre>
                </div>
              )}
            </div>
          )}
          <button 
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="w-full py-3 px-4 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            {isLoggingIn ? "Signing in..." : "Sign in with Google"}
          </button>
        </div>
      </div>
    );
  }

  const handleSendMessage = async (text: string) => {
    if (!activeChat || !user) return;
    
    // Call real firebase API
    await messageFunctions.sendTextMessage(user.id, activeChat.user.id, text);
  };

  const handleSelectChat = (chatId: string) => {
    setActiveChatId(chatId);
    setShowAdminDashboard(false);
    setChats(prev => prev.map(c => {
      if (c.id === chatId) {
        return { ...c, unreadCount: 0 };
      }
      return c;
    }));
  };

  return (
    <div className="flex h-screen w-full bg-white overflow-hidden font-sans relative">
      <div className={`flex h-full relative ${((showAdminDashboard || activeChat) && !showMobileNav) ? 'hidden md:flex' : 'w-full md:w-auto absolute md:relative z-40 md:z-auto'}`}>
        
        {/* Mobile Navigation Overlay */}
        {showMobileNav && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity"
            onClick={() => setShowMobileNav(false)}
          />
        )}

        {/* Main sidebar containing navigation (Drawer on mobile) */}
        <div className={`fixed inset-y-0 left-0 z-50 md:relative w-64 md:w-[60px] bg-gray-100 border-r border-gray-200 flex flex-col md:items-center py-4 gap-2 transition-transform duration-300 ease-in-out ${showMobileNav ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
          <div className="flex items-center gap-3 px-4 md:px-0 mb-6 md:mb-2">
            <img 
              src={user.profilePicture || `https://ui-avatars.com/api/?name=${user.username}`} 
              alt="Avatar" 
              className="w-10 h-10 rounded-full cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0" 
              onClick={() => {
                setShowProfile(true);
                setShowMobileNav(false);
              }}
            />
            <div className="md:hidden min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">{user.username}</h3>
              <p className="text-xs text-gray-500 capitalize truncate">{user.role}</p>
            </div>
          </div>
          
          <button 
            onClick={() => {
              setShowAdminDashboard(false);
              setShowMobileNav(false);
            }}
            className={`px-4 md:px-0 py-3 mx-2 md:mx-0 md:p-3 rounded-xl transition-colors flex items-center gap-3 ${!showAdminDashboard ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-200'}`}
          >
            <div className="flex-shrink-0">
              <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
            </div>
            <span className="md:hidden font-medium">Chats</span>
          </button>
          
          <button 
            onClick={() => {
              setShowAddFriend(true);
              setShowMobileNav(false);
            }}
            className="px-4 md:px-0 py-3 mx-2 md:mx-0 md:p-3 rounded-xl transition-colors text-gray-500 hover:bg-gray-200 flex items-center gap-3"
            title="Add Friend"
          >
            <UserPlus size={24} className="flex-shrink-0" />
            <span className="md:hidden font-medium">Add Friend</span>
          </button>
          
          <button 
            onClick={() => {
              setShowProfile(true);
              setShowMobileNav(false);
            }}
            className="px-4 md:px-0 py-3 mx-2 md:mx-0 md:p-3 rounded-xl transition-colors text-gray-500 hover:bg-gray-200 flex items-center gap-3"
            title="Profile"
          >
            <UserIcon size={24} className="flex-shrink-0" />
            <span className="md:hidden font-medium">Profile</span>
          </button>

          {['owner', 'admin', 'senior', 'helper'].includes(user.role) && (
            <button 
              onClick={() => {
                setShowAdminDashboard(true);
                setShowMobileNav(false);
              }}
              className={`px-4 md:px-0 py-3 mx-2 md:mx-0 md:p-3 rounded-xl transition-colors flex items-center gap-3 ${showAdminDashboard ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-200'}`}
              title="Admin Dashboard"
            >
              <LayoutDashboard size={24} className="flex-shrink-0" />
              <span className="md:hidden font-medium">Admin Dashboard</span>
            </button>
          )}

          <div className="mt-auto">
            <button 
              onClick={logout}
              className="px-4 md:px-0 py-3 mx-2 md:mx-0 md:p-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors flex items-center gap-3 w-[calc(100%-16px)] md:w-auto"
              title="Log out"
            >
              <LogOut size={24} className="flex-shrink-0" />
              <span className="md:hidden font-medium">Log out</span>
            </button>
          </div>
        </div>

        {!showAdminDashboard && (
          <Sidebar 
            chats={chats} 
            activeChatId={activeChatId} 
            onSelectChat={handleSelectChat}
            onMenuClick={() => setShowMobileNav(true)}
          />
        )}
      </div>

      {showAdminDashboard ? (
        <div className="flex-1 w-full h-full flex flex-col min-w-0">
          <AdminDashboard user={user} onMenuClick={() => setShowMobileNav(true)} />
        </div>
      ) : activeChat ? (
        <div className="flex-1 w-full h-full flex flex-col min-w-0">
          <ChatArea 
             user={activeChat.user} 
             currentUser={user}
             messages={activeMessages} 
             onSendMessage={handleSendMessage}
             onBack={() => setActiveChatId(null)}
          />
        </div>
      ) : (
        <div className="flex-1 hidden md:flex flex-col items-center justify-center bg-[#e4eef6]" style={{ backgroundImage: 'url("https://web.telegram.org/a/chat-bg-pattern-light.png")', backgroundSize: '400px', backgroundRepeat: 'repeat', backgroundBlendMode: 'overlay' }}>
          <div className="bg-white/50 backdrop-blur px-6 py-4 flex flex-col items-center rounded-2xl text-gray-500 font-medium">
            {chats.length === 0 ? (
              <>
                <p className="mb-4 text-center">You don't have any friends yet.<br/>Add someone to start messaging!</p>
                <button 
                  onClick={() => setShowAddFriend(true)}
                  className="py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                >
                  <UserPlus size={18} />
                  Add Friend
                </button>
              </>
            ) : (
              "Select a chat to start messaging"
            )}
          </div>
        </div>
      )}

      {showProfile && (
        <ProfileModal 
          user={user} 
          onClose={() => setShowProfile(false)} 
          onUpdate={(data) => {
            // Update profile logic would go here
            console.log("Update profile", data);
          }} 
        />
      )}

      {showAddFriend && (
        <AddFriendModal
          userId={user.id}
          onClose={() => setShowAddFriend(false)}
          onSuccess={() => {
            setShowAddFriend(false);
            loadFriends();
          }}
        />
      )}
    </div>
  );
}
