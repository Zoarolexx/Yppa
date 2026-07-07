import React, { useState } from 'react';
import { Search, Phone, Video, MoreVertical, Paperclip, Smile, Send, Mic, Trash2, Ban, Pin, ArrowLeft, X, Edit, AlertTriangle, ShieldAlert } from 'lucide-react';
import { User, Message } from '../types/telegram';
import { CallModal } from './modals/CallModal';
import { messageFunctions } from '../api/functions/messageFunctions';
import { adminFunctions } from '../api/functions/adminFunctions';

interface ChatAreaProps {
  user: User; // other user
  currentUser: any;
  messages: Message[];
  onSendMessage: (text: string) => void;
  onBack?: () => void;
}

export function ChatArea({ user, currentUser, messages, onSendMessage, onBack }: ChatAreaProps) {
  const [inputText, setInputText] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [activeCall, setActiveCall] = useState<'voice' | 'video' | null>(null);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      if (editingMessageId) {
        await messageFunctions.editMessage(editingMessageId, currentUser.id, inputText.trim());
        setEditingMessageId(null);
        setSelectedMessageId(null);
      } else {
        onSendMessage(inputText.trim());
      }
      setInputText('');
    }
  };

  const handleVoiceNote = () => {
    setIsRecording(!isRecording);
    // Voice note logic would go here
  };

  const handleSelectMessage = (msg: Message) => {
    if (selectedMessageId === msg.id) {
      setSelectedMessageId(null);
    } else {
      setSelectedMessageId(msg.id);
    }
  };

  const handleDelete = async () => {
    if (!selectedMessageId) return;
    await messageFunctions.deleteMessage(selectedMessageId, currentUser.id);
    setSelectedMessageId(null);
  };

  const handleEdit = () => {
    if (!selectedMessageId) return;
    const msg = messages.find(m => m.id === selectedMessageId);
    if (msg && msg.text && msg.text !== 'Pesan telah dihapus') {
      setEditingMessageId(selectedMessageId);
      setInputText(msg.text);
    }
  };

  const handleReportUser = async () => {
    const reason = prompt("Reason for reporting:");
    if (reason) {
       
       const { collection, addDoc, serverTimestamp, db } = await import('../api/config/firebase');
       await addDoc(collection(db, 'reports'), {
          reporterId: currentUser.id,
          reportedId: user.id,
          reason,
          description: "User reported from chat",
          status: 'pending',
          createdAt: serverTimestamp()
       });

       alert("User reported!");
    }
    setShowMenu(false);
  };

  const selectedMsg = messages.find(m => m.id === selectedMessageId);
  const isMeSelected = selectedMsg?.senderId === 'me' || selectedMsg?.senderId === currentUser.id;
  
  let canEdit = false;
  let canDelete = false;
  if (selectedMsg && isMeSelected && selectedMsg.type === 'text' && selectedMsg.text !== 'Pesan telah dihapus') {
     const createdAt = selectedMsg.originalCreatedAt?.seconds ? selectedMsg.originalCreatedAt.seconds * 1000 : Date.now();
     const now = Date.now();
     const hoursDiff = (now - createdAt) / (1000 * 60 * 60);
     if (hoursDiff <= 3) {
        canEdit = true;
        canDelete = true;
     }
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#E5DDD5] relative" style={{ backgroundImage: 'url("https://web.telegram.org/a/chat-bg-pattern-light.png")', backgroundSize: '400px', backgroundRepeat: 'repeat', backgroundColor: '#EFEAE2', backgroundBlendMode: 'overlay' }}>
      
      {/* Selected Action Bar OR Chat Header */}
      {selectedMessageId ? (
         <div className="h-[60px] bg-blue-500 text-white flex items-center justify-between px-2 sm:px-4 border-b border-blue-600 z-10 shadow-sm relative">
            <div className="flex items-center gap-4">
              <button className="p-2 hover:bg-white/20 rounded-full transition-colors flex-shrink-0" onClick={() => { setSelectedMessageId(null); setEditingMessageId(null); setInputText(''); }}>
                <X size={20} />
              </button>
              <span className="font-medium text-lg">1 Selected</span>
            </div>
            <div className="flex items-center gap-1">
              {canEdit && (
                <button className="p-2 hover:bg-white/20 rounded-full transition-colors" title="Edit" onClick={handleEdit}>
                  <Edit size={20} />
                </button>
              )}
              
              <button className="p-2 hover:bg-white/20 rounded-full transition-colors" title="Pin" onClick={() => { alert('Message pinned!'); setSelectedMessageId(null); }}>
                <Pin size={20} />
              </button>
              {canDelete && (
                <button className="p-2 hover:bg-white/20 rounded-full transition-colors" title="Delete" onClick={handleDelete}>
                  <Trash2 size={20} />
                </button>
              )}
            </div>
         </div>
      ) : (
        <div className="h-[60px] bg-white flex items-center justify-between px-2 sm:px-4 border-b border-gray-200 z-10 shadow-sm relative">
          <div className="flex items-center gap-2 sm:gap-3 cursor-pointer hover:bg-gray-50 px-1 sm:px-2 py-1 rounded-lg transition-colors flex-1 min-w-0" onClick={() => setShowMenu(!showMenu)}>
            {onBack && (
              <button className="md:hidden p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-full flex-shrink-0" onClick={onBack}>
                <ArrowLeft size={20} />
              </button>
            )}
            <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
            <div className="min-w-0 flex-1 pr-2">
              <h2 className="font-medium text-gray-900 leading-tight truncate">{user.name}</h2>
              <p className="text-xs text-blue-500 truncate">{user.status || user.lastSeen}</p>
            </div>
          </div>
          <div className="flex items-center text-gray-500 gap-0 sm:gap-1 flex-shrink-0">
            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors hidden sm:block" title="Search"><Search size={20} /></button>
            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors" title="Voice Call" onClick={() => setActiveCall('voice')}><Phone size={20} /></button>
            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors hidden sm:block" title="Video Call" onClick={() => setActiveCall('video')}><Video size={20} /></button>
            <div className="relative">
              <button 
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                onClick={() => setShowMenu(!showMenu)}
              >
                <MoreVertical size={20} />
              </button>
              {showMenu && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50">
                  <button className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm text-gray-700" onClick={() => { setShowMenu(false); 
    import('../api/config/firebase').then(({ doc, updateDoc, arrayUnion, db }) => {
      updateDoc(doc(db, 'users', currentUser.id), {
        blockedUsers: arrayUnion(user.id)
      }).then(() => alert('User blocked!')).catch(e => alert('Failed to block'));
    });
 }}>
                    <Ban size={16} /> Block User
                  </button>
                  <button className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm text-red-600" onClick={handleReportUser}>
                    <ShieldAlert size={16} /> Report User
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2" onClick={() => setShowMenu(false)}>
        {messages.map((message) => {
          const isMe = message.senderId === 'me' || message.senderId === currentUser?.id;
          const isSelected = selectedMessageId === message.id;
          
          return (
            <div key={message.id} 
                 className={`flex ${isMe ? 'justify-end' : 'justify-start'} group/msg w-full p-1 rounded-lg transition-colors cursor-pointer ${isSelected ? 'bg-blue-500/20' : ''}`}
                 onClick={() => handleSelectMessage(message)}>
              <div
                className={`max-w-[70%] rounded-2xl px-3 py-2 shadow-sm relative group ${
                  isMe ? (isSelected ? 'bg-[#d9fdd3] rounded-br-none' : 'bg-[#d9fdd3] rounded-br-none') : (isSelected ? 'bg-blue-50 rounded-bl-none' : 'bg-white rounded-bl-none')
                }`}
              >
                <p className={`text-[15px] leading-snug break-words ${message.text === 'Pesan telah dihapus' ? 'text-gray-500 italic' : 'text-gray-900'}`}>
                  {message.text}
                </p>
                <div className="flex justify-end items-center gap-1 mt-1 -mb-1">
                  {message.isEdited && <span className="text-[11px] text-gray-400 italic mr-1">edited</span>}
                  <span className="text-[11px] text-gray-500">{message.timestamp}</span>
                  {isMe && (
                    <span className="text-blue-500">
                      {message.isRead ? (
                        <svg viewBox="0 0 18 18" width="16" height="16" fill="currentColor">
                          <path d="M17.395 4.394L16.273 3.25l-7.79 7.94-2.883-2.908-1.121 1.144 4.004 4.04 8.912-9.072zm-4.321-1.144l-1.122-1.144-4.22 4.298 1.122 1.144 4.22-4.298zM2.884 8.28l-1.122-1.143L.198 8.72l4.004 4.04 1.122-1.143-2.44-2.463z" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 18 18" width="16" height="16" fill="currentColor">
                          <path d="M16.273 3.25l-7.79 7.94-2.883-2.908-1.121 1.144 4.004 4.04 8.912-9.072z" />
                        </svg>
                      )}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input Area */}
      {selectedMessageId && !editingMessageId ? null : (
      <div className="bg-white px-2 sm:px-4 py-2 flex items-end gap-1 sm:gap-2 z-10 shadow-sm min-h-[60px]" onClick={() => setShowMenu(false)}>
        <button className="p-2 text-gray-500 hover:text-gray-600 rounded-full transition-colors mb-1 flex-shrink-0">
          <Paperclip size={24} />
        </button>
        <div className="flex-1 bg-white border border-gray-300 rounded-xl flex items-end shadow-sm relative min-w-0">
          <button className="p-2 text-gray-500 hover:text-gray-600 rounded-full transition-colors mb-0.5 ml-1 flex-shrink-0">
            <Smile size={24} />
          </button>
          <form className="flex-1 min-w-0" onSubmit={handleSend}>
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={isRecording ? "Recording voice note..." : (editingMessageId ? "Edit message..." : "Write a message...")}
              disabled={isRecording}
              className={`w-full py-3 px-2 outline-none bg-transparent text-gray-900 text-[15px] ${isRecording ? 'text-red-500 font-medium' : ''}`}
            />
          </form>
        </div>
        <button 
          onClick={inputText.trim() ? handleSend : handleVoiceNote}
          className={`p-3 text-white rounded-full transition-colors mb-0.5 flex-shrink-0 ${inputText.trim() ? 'bg-blue-500 hover:bg-blue-600' : isRecording ? 'bg-red-500 hover:bg-red-600 animate-pulse' : 'bg-blue-500 hover:bg-blue-600'}`}
        >
          {inputText.trim() ? (editingMessageId ? <Send size={20}/> : <Send size={20} />) : <Mic size={20} />}
        </button>
      </div>
      )}

      {activeCall && (
        <CallModal
          user={user}
          isVideo={activeCall === 'video'}
          onClose={() => setActiveCall(null)}
        />
      )}
    </div>
  );
}
