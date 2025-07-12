'use client';

import { useState, useEffect } from 'react';
import { 
  FiShare2, FiBookmark, FiExternalLink, FiCopy, FiDownload, 
  FiEdit3, FiStar, FiTrendingUp, FiUsers, FiCalendar 
} from 'react-icons/fi';
import { clsx } from 'clsx';

interface SparkPage {
  id: string;
  title: string;
  content: string;
  summary: string;
  tags: string[];
  createdAt: Date;
  views: number;
  likes: number;
  isPublic: boolean;
  category: 'research' | 'analysis' | 'report' | 'presentation' | 'other';
}

interface SparkPagesProps {
  className?: string;
}

const sampleSparkPages: SparkPage[] = [
  {
    id: '1',
    title: 'AI Market Analysis 2025',
    content: 'Comprehensive analysis of AI market trends, key players, and growth projections for 2025...',
    summary: 'AI market expected to reach $1.8 trillion by 2030 with 40% CAGR. Key drivers include enterprise adoption and breakthrough models.',
    tags: ['AI', 'Market Research', 'Technology', 'Investment'],
    createdAt: new Date('2024-01-15'),
    views: 1247,
    likes: 89,
    isPublic: true,
    category: 'analysis'
  },
  {
    id: '2',
    title: 'Climate Change Impact Report',
    content: 'Detailed analysis of climate change effects on global economies, agriculture, and society...',
    summary: 'Climate change will cost global economy $23 trillion by 2100. Renewable energy adoption critical for mitigation.',
    tags: ['Climate', 'Environment', 'Economy', 'Sustainability'],
    createdAt: new Date('2024-01-10'),
    views: 892,
    likes: 156,
    isPublic: true,
    category: 'report'
  },
  {
    id: '3',
    title: 'Quantum Computing Breakthroughs',
    content: 'Latest developments in quantum computing including Google\'s Willow chip and IBM\'s roadmap...',
    summary: 'Quantum computing achieving new milestones with 1000+ qubit systems. Commercial applications emerging in 2025.',
    tags: ['Quantum', 'Computing', 'Technology', 'Innovation'],
    createdAt: new Date('2024-01-12'),
    views: 634,
    likes: 78,
    isPublic: true,
    category: 'research'
  }
];

export default function SparkPages({ className }: SparkPagesProps) {
  const [sparkPages, setSparkPages] = useState<SparkPage[]>(sampleSparkPages);
  const [selectedPage, setSelectedPage] = useState<SparkPage | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { id: 'all', name: 'All Categories', count: sparkPages.length },
    { id: 'research', name: 'Research', count: sparkPages.filter(p => p.category === 'research').length },
    { id: 'analysis', name: 'Analysis', count: sparkPages.filter(p => p.category === 'analysis').length },
    { id: 'report', name: 'Reports', count: sparkPages.filter(p => p.category === 'report').length },
    { id: 'presentation', name: 'Presentations', count: sparkPages.filter(p => p.category === 'presentation').length },
  ];

  const filteredPages = sparkPages.filter(page => {
    const matchesSearch = page.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         page.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || page.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleShare = (page: SparkPage) => {
    const shareUrl = `${window.location.origin}/spark/${page.id}`;
    navigator.clipboard.writeText(shareUrl);
    // In a real app, you'd show a toast notification here
    console.log('Share URL copied to clipboard:', shareUrl);
  };

  const handleLike = (pageId: string) => {
    setSparkPages(prev => prev.map(page => 
      page.id === pageId ? { ...page, likes: page.likes + 1 } : page
    ));
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'research': return 'bg-blue-100 text-blue-800';
      case 'analysis': return 'bg-green-100 text-green-800';
      case 'report': return 'bg-purple-100 text-purple-800';
      case 'presentation': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={clsx('min-h-screen bg-gray-50', className)}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Spark Pages</h1>
              <p className="text-gray-600 mt-1">Create and share AI-generated insights and summaries</p>
            </div>
            <button
              onClick={() => setIsCreating(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <FiEdit3 className="w-4 h-4" />
              <span>Create Spark Page</span>
            </button>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search spark pages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name} ({category.count})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Spark Pages Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPages.map((page) => (
            <div
              key={page.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedPage(page)}
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                      {page.title}
                    </h3>
                    <span className={clsx(
                      'inline-block px-2 py-1 text-xs font-medium rounded-full',
                      getCategoryColor(page.category)
                    )}>
                      {page.category}
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleShare(page);
                    }}
                    className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    <FiShare2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Summary */}
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {page.summary}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {page.tags.slice(0, 3).map(tag => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                  {page.tags.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                      +{page.tags.length - 3} more
                    </span>
                  )}
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center space-x-4">
                    <span className="flex items-center space-x-1">
                      <FiUsers className="w-4 h-4" />
                      <span>{page.views}</span>
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLike(page.id);
                      }}
                      className="flex items-center space-x-1 hover:text-red-500 transition-colors"
                    >
                      <FiStar className="w-4 h-4" />
                      <span>{page.likes}</span>
                    </button>
                  </div>
                  <div className="flex items-center space-x-1">
                    <FiCalendar className="w-4 h-4" />
                    <span>{formatDate(page.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredPages.length === 0 && (
          <div className="text-center py-12">
            <FiBookmark className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No spark pages found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm ? 'Try adjusting your search terms' : 'Create your first spark page to get started'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setIsCreating(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Spark Page
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modal for selected page */}
      {selectedPage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {selectedPage.title}
                  </h2>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span className="flex items-center space-x-1">
                      <FiUsers className="w-4 h-4" />
                      <span>{selectedPage.views} views</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <FiStar className="w-4 h-4" />
                      <span>{selectedPage.likes} likes</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <FiCalendar className="w-4 h-4" />
                      <span>{formatDate(selectedPage.createdAt)}</span>
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedPage(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiExternalLink className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="prose max-w-none">
                <p className="text-gray-700 leading-relaxed">{selectedPage.content}</p>
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-2">
                    {selectedPage.tags.map(tag => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleShare(selectedPage)}
                      className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                    >
                      <FiShare2 className="w-5 h-5" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-green-600 transition-colors">
                      <FiDownload className="w-5 h-5" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-purple-600 transition-colors">
                      <FiBookmark className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 