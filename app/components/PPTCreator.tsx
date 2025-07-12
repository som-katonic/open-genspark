'use client';

import { useState } from 'react';
import { FiDownload, FiRefreshCw, FiSliders, FiZap } from 'react-icons/fi';
import SlidePreview, { Slide } from './SlidePreview';

interface PPTCreatorProps {
  initialSlides?: Slide[];
  userId?: string | null;
}

export default function PPTCreator({ initialSlides = [], userId }: PPTCreatorProps) {
  const [topic, setTopic] = useState('');
  const [slideCount, setSlideCount] = useState(5);
  const [style, setStyle] = useState('professional');
  const [slides, setSlides] = useState<Slide[]>(initialSlides);
  const [selectedSlide, setSelectedSlide] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState('');

  const generateSlides = async () => {
    if (!topic.trim()) {
      setError('Please enter a topic for your presentation');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      const response = await fetch('/api/generate-slides', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: topic.trim(),
          slideCount,
          style,
          userId: userId
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate slides');
      }

      const data = await response.json();
      setSlides(data.slides);
      setSelectedSlide(0);
    } catch (err) {
      setError('Failed to generate slides. Please try again.');
      console.error('Error generating slides:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadAsPPT = async () => {
    if (slides.length === 0) {
      setError('No slides to download');
      return;
    }

    setIsConverting(true);
    setError('');

    try {
      const response = await fetch('/api/convert-to-ppt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          slides,
          title: topic || 'My Presentation',
          userId: userId,
          style: style // Pass the selected style
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to convert to PowerPoint');
      }

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${(topic || 'presentation').replace(/[^a-zA-Z0-9]/g, '_')}.pptx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError('Failed to download presentation. Please try again.');
      console.error('Error downloading presentation:', err);
    } finally {
      setIsConverting(false);
    }
  };

  const currentSlide = slides[selectedSlide];

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          AI PowerPoint Creator
        </h1>
        <p className="text-gray-600">
          Generate professional presentations with AI in seconds
        </p>
      </div>

      {/* Generation Form */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Presentation Topic
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Digital Marketing Strategy, Climate Change, AI in Healthcare"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Number of Slides
            </label>
            <select
              value={slideCount}
              onChange={(e) => setSlideCount(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {[3, 5, 7, 10, 15].map(count => (
                <option key={count} value={count}>{count} slides</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Style
            </label>
            <select
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="professional">Professional</option>
              <option value="creative">Creative</option>
              <option value="minimal">Minimal</option>
              <option value="academic">Academic</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={generateSlides}
            disabled={isGenerating || !topic.trim()}
            className="flex items-center justify-center px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <FiRefreshCw className="animate-spin mr-2" />
            ) : (
              <FiZap className="mr-2" />
            )}
            {isGenerating ? 'Generating...' : 'Generate Slides'}
          </button>

          {slides.length > 0 && (
            <button
              onClick={downloadAsPPT}
              disabled={isConverting}
              className="flex items-center justify-center px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isConverting ? (
                <FiRefreshCw className="animate-spin mr-2" />
              ) : (
                <FiDownload className="mr-2" />
              )}
              {isConverting ? 'Creating PPT...' : 'Download as PowerPoint'}
            </button>
          )}
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
      </div>

      {/* Slides Display */}
      {slides.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Slide Thumbnails */}
          <div className="lg:col-span-1">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <FiSliders className="mr-2" />
              Slides ({slides.length})
            </h3>
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {slides.map((slide, index) => (
                <SlidePreview
                  key={index}
                  slide={slide}
                  index={index}
                  isSelected={selectedSlide === index}
                  onClick={() => setSelectedSlide(index)}
                />
              ))}
            </div>
          </div>

          {/* Current Slide Preview */}
          <div className="lg:col-span-3">
            <h3 className="text-lg font-semibold mb-4">
              Preview - Slide {selectedSlide + 1}
            </h3>
            {currentSlide && (
              <div className="bg-white rounded-lg shadow-lg border-2 border-gray-200 max-h-[500px] overflow-y-auto">
                <div className={`p-8 flex flex-col justify-center ${
                  currentSlide.type === 'title' 
                    ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white text-center rounded-lg' 
                    : ''
                }`} style={{ minHeight: '400px' }}>
                  <h2 className={`font-bold mb-6 ${
                    currentSlide.type === 'title' 
                      ? 'text-4xl text-white' 
                      : 'text-2xl text-blue-600 text-center'
                  }`}>
                    {currentSlide.title}
                  </h2>
                  
                  <div className={`text-lg leading-relaxed ${
                    currentSlide.type === 'title' ? 'text-blue-100' : 'text-gray-700'
                  }`}>
                    {currentSlide.type === 'bullet' && currentSlide.bulletPoints ? (
                      <ul className="space-y-3 text-left">
                        {currentSlide.bulletPoints.map((point, i) => (
                          <li key={i} className="flex items-start">
                            <span className="text-blue-500 mr-3 mt-1">•</span>
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-center">{currentSlide.content}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 