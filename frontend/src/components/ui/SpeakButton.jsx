import React, { useState, useRef } from 'react';
import { Volume2, VolumeX, Loader2 } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext.jsx';

export default function SpeakButton({ text, lang }) {
  const { language } = useLanguage();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef(null);

  const activeLang = lang || language || 'en';

  const handleToggle = async () => {
    if (isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setIsPlaying(false);
      return;
    }

    setIsLoading(true);
    
    try {
      const url = `/api/tts?text=${encodeURIComponent(text)}&lang=${encodeURIComponent(activeLang)}`;
      
      if (!audioRef.current) {
        audioRef.current = new Audio();
      }
      
      audioRef.current.src = url;
      
      audioRef.current.onended = () => {
        setIsPlaying(false);
      };

      audioRef.current.onerror = () => {
        setIsLoading(false);
        setIsPlaying(false);
      };

      await audioRef.current.play();
      setIsPlaying(true);
    } catch (err) {
      console.error('Failed to play audio:', err);
      setIsLoading(false);
      setIsPlaying(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isLoading}
      className={`inline-flex items-center justify-center p-1.5 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 ${
        isPlaying 
          ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' 
          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
      }`}
      title={isPlaying ? "Stop speaking" : "Speak aloud"}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-slate-600" />
      ) : isPlaying ? (
        <VolumeX className="w-4 h-4" />
      ) : (
        <Volume2 className="w-4 h-4" />
      )}
    </button>
  );
}
