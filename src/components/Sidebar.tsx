import React, { useState } from 'react';
import { Menu, Search, Users } from 'lucide-react';
import { Chat } from '../types/telegram';

interface SidebarProps {
  chats: Chat[];
  activeChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onMenuClick?: () => void;
}

export function Sidebar({ chats, activeChatId, onSelectChat, onMenuClick }: SidebarProps) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="w-full md:w-[350px] lg:w-[400px] h-full flex flex-col bg-white border-r border-gray-200 relative">
      {/* Search Header */}
      <div className="flex items-center px-4 py-3 gap-3">
        <div className="relative">
          <button 
            className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
            onClick={() => {
              if (onMenuClick) onMenuClick();
              else setShowMenu(!showMenu);
            }}
          >
            <Menu size={20} />
          </button>
          
          {showMenu && !onMenuClick && (
            <div className="absolute left-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50">
              <button 
                className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm text-gray-700"
                onClick={() => {
                  setShowMenu(false);
                  // Create group logic
                  alert('Create Group dialog would open here');
                }}
              >
                <Users size={16} /> New Group
              </button>
            </div>
          )}
        </div>
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <Search size={18} />
          </div>
          <input
            type="text"
            className="w-full bg-gray-100 text-sm text-gray-900 rounded-full pl-10 pr-4 py-2 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all border border-transparent"
            placeholder="Search"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto" onClick={() => setShowMenu(false)}>
        {chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 text-gray-500">
            <p className="text-sm">No friends added yet.</p>
          </div>
        ) : (
          chats.map((chat) => {
            const isActive = chat.id === activeChatId;
            return (
              <div
                key={chat.id}
                onClick={() => onSelectChat(chat.id)}
                className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors ${
                  isActive ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'
                }`}
              >
                <img
                  src={chat.user.avatar}
                  alt={chat.user.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className={`font-medium text-sm truncate ${isActive ? 'text-white' : 'text-gray-900'}`}>
                      {chat.user.name}
                    </h3>
                    <span className={`text-xs whitespace-nowrap ml-2 ${isActive ? 'text-blue-100' : 'text-gray-500'}`}>
                      {chat.lastMessage?.timestamp || ''}
                    </span>
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <p className={`text-sm truncate ${isActive ? 'text-blue-100' : 'text-gray-500'}`}>
                      {chat.lastMessage?.senderId === 'me' && <span className="font-medium">You: </span>}
                      {chat.lastMessage?.text || 'No messages yet'}
                    </p>
                    {chat.unreadCount > 0 && !isActive && (
                      <span className="bg-gray-400 text-white text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0">
                        {chat.unreadCount}
                      </span>
                    )}
                    {chat.unreadCount > 0 && isActive && (
                      <span className="bg-white text-blue-500 text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0">
                        {chat.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
