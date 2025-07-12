'use client';

import { clsx } from 'clsx';

export interface Slide {
  title: string;
  content: string;
  type: 'title' | 'content' | 'image' | 'bullet';
  bulletPoints?: string[];
  imageDescription?: string;
}

interface SlidePreviewProps {
  slide: Slide;
  index: number;
  isSelected?: boolean;
  onClick?: () => void;
}

export default function SlidePreview({ slide, index, isSelected, onClick }: SlidePreviewProps) {
  const slideClass = clsx(
    'w-full min-h-[96px] max-h-[140px] border-2 rounded-lg p-2 cursor-pointer transition-all duration-200',
    'bg-white shadow-sm hover:shadow-md',
    {
      'border-blue-500 ring-2 ring-blue-200': isSelected,
      'border-gray-200 hover:border-gray-300': !isSelected,
      'bg-gradient-to-br from-blue-600 to-purple-600 text-white': slide.type === 'title',
    }
  );

  return (
    <div className="flex flex-col gap-1">
      <div className={slideClass} onClick={onClick} style={{ overflow: 'hidden' }}>
        <div className="h-full flex flex-col justify-center">
          <h3 className={clsx(
            'font-medium mb-1 text-center truncate',
            slide.type === 'title' ? 'text-sm text-white' : 'text-xs text-blue-700'
          )} style={{ lineHeight: '1.1', maxHeight: '2.2em', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {slide.title}
          </h3>
          <div className={clsx(
            'text-[10px] flex-1 overflow-hidden',
            slide.type === 'title' ? 'text-blue-100' : 'text-gray-600'
          )} style={{ minHeight: '1em', maxHeight: '2.2em', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {slide.type === 'bullet' && slide.bulletPoints ? (
              <ul className="list-disc list-inside space-y-0.5">
                {slide.bulletPoints.slice(0, 3).map((point, i) => (
                  <li key={i} className="truncate">{point}</li>
                ))}
                {slide.bulletPoints.length > 3 && (
                  <li className="text-gray-400">...and {slide.bulletPoints.length - 3} more</li>
                )}
              </ul>
            ) : (
              <p className="truncate">{slide.content}</p>
            )}
          </div>
        </div>
      </div>
      <div className="text-center">
        <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
          Slide {index + 1}
        </span>
      </div>
    </div>
  );
} 