import React, { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX, Loader2 } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext.jsx';

const BROWSER_LANG_MAP = {
  mr: 'mr-IN',
  hi: 'hi-IN',
  pa: 'pa-IN',
  gu: 'gu-IN',
  te: 'te-IN',
  kn: 'kn-IN',
  en: 'en-IN',
};

export default function SpeakButton({ text, lang: propLang }) {
  const { lang: contextLang } = useLanguage();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef(null);

  const activeLang = propLang || contextLang || 'en';

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const stopPlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setIsLoading(false);
  };

  const handleToggle = async () => {
    if (isPlaying || isLoading) {
      stopPlayback();
      return;
    }

    if (!text || !text.trim()) return;

    setIsLoading(true);

    try {
      const url = `/api/tts?text=${encodeURIComponent(text)}&lang=${encodeURIComponent(activeLang)}`;
      
      if (!audioRef.current) {
        audioRef.current = new Audio();
      }

      audioRef.current.src = url;

      audioRef.current.oncanplay = () => {
        setIsLoading(false);
      };

      audioRef.current.onended = () => {
        setIsPlaying(false);
        setIsLoading(false);
      };

      audioRef.current.onerror = () => {
        // Fallback to browser Web Speech Synthesis if cloud stream is blocked
        console.warn('TTS streaming encountered an error, trying Web Speech Synthesis fallback...');
        playWithWebSpeech(text, activeLang);
      };

      await audioRef.current.play();
      setIsLoading(false);
      setIsPlaying(true);
    } catch (err) {
      console.warn('Audio play exception, attempting Web Speech fallback:', err);
      playWithWebSpeech(text, activeLang);
    }
  };

  const playWithWebSpeech = (speakText, languageCode) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      setIsLoading(false);
      setIsPlaying(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(speakText);
    utterance.lang = BROWSER_LANG_MAP[languageCode] || 'en-IN';
    utterance.rate = 0.95;

    utterance.onstart = () => {
      setIsLoading(false);
      setIsPlaying(true);
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setIsLoading(false);
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      setIsLoading(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={`inline-flex items-center justify-center p-2 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 touch-manipulation ${
        isPlaying 
          ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-300' 
          : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100/80 border border-emerald-200'
      }`}
      title={isPlaying ? "Stop audio readout" : "Listen to token & queue status (Audio Readout)"}
      aria-label={isPlaying ? "Stop audio readout" : "Listen to token & queue status"}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-emerald-800" />
      ) : isPlaying ? (
        <VolumeX className="w-4 h-4 text-white animate-pulse" />
      ) : (
        <Volume2 className="w-4 h-4 text-emerald-800" />
      )}
    </button>
  );
}
