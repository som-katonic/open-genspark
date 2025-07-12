import { useEffect, useRef, useState, useCallback } from 'react';

interface UseAutoScrollOptions {
  smooth?: boolean;
  content?: React.ReactNode;
}

export function useAutoScroll({ smooth = false, content }: UseAutoScrollOptions = {}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto',
      });
    }
  }, [smooth]);

  const checkIfAtBottom = useCallback(() => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      const threshold = 100; // pixels from bottom
      const atBottom = scrollTop + clientHeight >= scrollHeight - threshold;
      setIsAtBottom(atBottom);
    }
  }, []);

  const disableAutoScroll = useCallback(() => {
    setAutoScrollEnabled(false);
    setTimeout(() => setAutoScrollEnabled(true), 1000); // Re-enable after 1 second
  }, []);

  // Auto-scroll when content changes and auto-scroll is enabled
  useEffect(() => {
    if (autoScrollEnabled && isAtBottom) {
      scrollToBottom();
    }
  }, [content, autoScrollEnabled, isAtBottom, scrollToBottom]);

  // Check scroll position on scroll
  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;

    const handleScroll = () => {
      checkIfAtBottom();
    };

    element.addEventListener('scroll', handleScroll);
    return () => element.removeEventListener('scroll', handleScroll);
  }, [checkIfAtBottom]);

  // Initial check
  useEffect(() => {
    checkIfAtBottom();
  }, [checkIfAtBottom]);

  return {
    scrollRef,
    isAtBottom,
    autoScrollEnabled,
    scrollToBottom,
    disableAutoScroll,
  };
} 