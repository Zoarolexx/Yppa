import React, { useState } from 'react';
import { X, UserPlus, Loader2 } from 'lucide-react';
import { contactFunctions } from '../../api/functions/contactFunctions';

interface AddFriendModalProps {
  userId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddFriendModal({ userId, onClose, onSuccess }: AddFriendModalProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError('');
    setSuccess('');

    const res = await contactFunctions.addFriendByEmail(userId, email.trim());
    
    if (res.success) {
      setSuccess(res.message || 'Friend added successfully');
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } else {
      setError(res.message || 'Failed to add friend');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-xl animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Add Friend</h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="friend@example.com"
              required
            />
          </div>

          {error && <div className="mb-4 text-sm text-red-600 bg-red-50 p-2 rounded">{error}</div>}
          {success && <div className="mb-4 text-sm text-green-600 bg-green-50 p-2 rounded">{success}</div>}

          <button
            type="submit"
            disabled={loading || !email.trim()}
            className="w-full py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18} />}
            Add Friend
          </button>
        </form>
      </div>
    </div>
  );
}
