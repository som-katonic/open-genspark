"use client";

import { useState } from 'react';

interface FlowButtonProps {
  text: string;
  onClick?: () => void;
  className?: string;
}

export function FlowButton({ text, onClick, className = "" }: FlowButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      className={`relative overflow-hidden rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-4 text-white font-semibold shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 ${className}`}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Animated background */}
      <div
        className={`absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 transition-all duration-300 ${
          isHovered ? 'opacity-100' : 'opacity-90'
        }`}
      />
      
      {/* Glow effect */}
      <div
        className={`absolute inset-0 rounded-full transition-all duration-300 ${
          isHovered 
            ? 'opacity-30 shadow-[0_0_20px_rgba(139,92,246,0.5)]' 
            : 'opacity-0'
        }`}
      />
      
      {/* Text */}
      <span className="relative z-10">{text}</span>
      
      {/* Shimmer effect */}
      <div
        className={`absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 transition-opacity duration-300 ${
          isHovered ? 'opacity-20' : ''
        }`}
        style={{
          transform: 'translateX(-100%)',
          animation: isHovered ? 'shimmer 1.5s infinite' : 'none'
        }}
      />
      
      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </button>
  );
} 