"use client";

import { useEffect, useState } from 'react';

interface Meteor {
  id: number;
  x: number;
  y: number;
  delay: number;
  duration: number;
}

interface MeteorsProps {
  number?: number;
}

export function Meteors({ number = 20 }: MeteorsProps) {
  const [meteors, setMeteors] = useState<Meteor[]>([]);

  useEffect(() => {
    const generateMeteors = () => {
      const newMeteors: Meteor[] = [];
      for (let i = 0; i < number; i++) {
        newMeteors.push({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          delay: Math.random() * 2,
          duration: Math.random() * 2 + 1
        });
      }
      setMeteors(newMeteors);
    };

    generateMeteors();
    const interval = setInterval(generateMeteors, 3000);

    return () => clearInterval(interval);
  }, [number]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {meteors.map((meteor) => (
        <div
          key={meteor.id}
          className="absolute w-0.5 h-0.5 bg-white rounded-full shadow-[0_0_6px_1px_rgba(255,255,255,0.8)]"
          style={{
            left: `${meteor.x}%`,
            top: `${meteor.y}%`,
            animationDelay: `${meteor.delay}s`,
            animationDuration: `${meteor.duration}s`
          }}
        />
      ))}
      
      <style jsx>{`
        @keyframes meteor {
          0% {
            transform: rotate(215deg) translateX(0);
            opacity: 1;
          }
          70% {
            opacity: 1;
          }
          100% {
            transform: rotate(215deg) translateX(-500px);
            opacity: 0;
          }
        }
        
        div {
          animation: meteor linear infinite;
        }
      `}</style>
    </div>
  );
} 