import React, { useEffect, useState } from 'react';
import { Phone, PhoneOff, Video, Mic, MicOff, VideoOff } from 'lucide-react';
import { User as TelegramUser } from '../../types/telegram';

interface CallModalProps {
  user: TelegramUser;
  isVideo: boolean;
  onClose: () => void;
}

export function CallModal({ user, isVideo, onClose }: CallModalProps) {
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setDuration(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-[200] flex flex-col items-center justify-between py-12">
      {/* Header Info */}
      <div className="flex flex-col items-center mt-12">
        <h2 className="text-3xl font-medium text-white mb-2">{user.name}</h2>
        <p className="text-gray-400 mb-8">{formatTime(duration)}</p>
        
        {isVideo && !isVideoOff ? (
          <div className="w-64 h-80 bg-gray-800 rounded-2xl overflow-hidden border-2 border-gray-700 relative">
            <img src={user.avatar} className="w-full h-full object-cover opacity-50 blur-sm" alt="video feed" />
            <div className="absolute inset-0 flex items-center justify-center text-white/50">Simulated Video Feed</div>
          </div>
        ) : (
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-700">
            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-6 mb-12">
        <button 
          onClick={() => setIsMuted(!isMuted)}
          className={`p-4 rounded-full ${isMuted ? 'bg-white text-black' : 'bg-gray-800 text-white hover:bg-gray-700'} transition-colors`}
        >
          {isMuted ? <MicOff size={28} /> : <Mic size={28} />}
        </button>

        <button 
          onClick={onClose}
          className="p-5 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
        >
          <PhoneOff size={32} />
        </button>

        {isVideo ? (
          <button 
            onClick={() => setIsVideoOff(!isVideoOff)}
            className={`p-4 rounded-full ${isVideoOff ? 'bg-white text-black' : 'bg-gray-800 text-white hover:bg-gray-700'} transition-colors`}
          >
            {isVideoOff ? <VideoOff size={28} /> : <Video size={28} />}
          </button>
        ) : (
          <button className="p-4 rounded-full bg-gray-800 text-white hover:bg-gray-700 transition-colors">
            <Phone size={28} />
          </button>
        )}
      </div>
    </div>
  );
}
