import React from 'react';
import { X, Camera, Edit2 } from 'lucide-react';
import { User } from '../../api/types';

interface ProfileModalProps {
  user: User;
  onClose: () => void;
  onUpdate: (data: Partial<User>) => void;
}

export function ProfileModal({ user, onClose, onUpdate }: ProfileModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800">Profile Settings</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6">
          <div className="flex flex-col items-center mb-6">
            <div className="relative group cursor-pointer">
              <img 
                src={user.profilePicture || `https://ui-avatars.com/api/?name=${user.username}`} 
                alt="Avatar" 
                className="w-24 h-24 rounded-full object-cover border-4 border-gray-50"
              />
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="text-white" size={24} />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Username</label>
              <div className="flex items-center justify-between border-b border-gray-200 py-2">
                <span className="text-gray-900">{user.username}</span>
                <button className="text-blue-500 hover:bg-blue-50 p-1.5 rounded-lg"><Edit2 size={16} /></button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
              <div className="flex items-center justify-between border-b border-gray-200 py-2">
                <span className="text-gray-900">{user.email}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Status (Bio)</label>
              <div className="flex items-center justify-between border-b border-gray-200 py-2">
                <span className="text-gray-900">{user.status}</span>
                <button className="text-blue-500 hover:bg-blue-50 p-1.5 rounded-lg"><Edit2 size={16} /></button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Role</label>
              <div className="flex items-center justify-between py-2">
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-sm font-medium capitalize">{user.role}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
