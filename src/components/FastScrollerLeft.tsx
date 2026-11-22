import React, { useState, useEffect, useRef, useCallback } from 'react';

interface FastScrollerLeftProps {
  totalItems: number;
  isKtc?: boolean;
  edge?: 'left' | 'right';
  minThumbHeightPx?: number;
  bottomPaddingPx?: number;
  children: React.ReactNode;
}

/**
 * Custom FastScrollerLeft wrapper component matching the reference screenshot:
 * - Clean grey pill thumb (#9E9E9E) on a minimal light track without dark/black borders.
 * - Dynamically calculates track & thumb position based on totalItems, visibleItems, and exact scroll offset.
 * - Ensures thumb stays pinned precisely at the bottom when scrolled to the end without jumping.
 * - Supports pointerInput drag & tap gestures along the left or right edge.
 */
export const FastScrollerLeft: React.FC<FastScrollerLeftProps> = ({
  totalItems,
  edge = 'left',
  minThumbHeightPx = 19,
  bottomPaddingPx = 8,
  children,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const isDraggingRef = useRef(false);
  const fadeTimeoutRef = useRef<number | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const [thumbMetrics, setThumbMetrics] = useState({
    thumbHeightPx: 19,
    thumbOffsetY: 0,
    isScrollable: false,
  });

  const triggerActiveFade = useCallback(() => {
    setIsScrolling(true);
    if (fadeTimeoutRef.current) {
      window.clearTimeout(fadeTimeoutRef.current);
    }
    fadeTimeoutRef.current = window.setTimeout(() => {
      if (!isDraggingRef.current) {
        setIsScrolling(false);
      }
    }, 1200);
  }, []);

  const recalculateMetrics = useCallback(() => {
    const container = scrollContainerRef.current;
    const track = trackRef.current;
    if (!container || !track) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const trackHeight = track.clientHeight;

    if (trackHeight <= 0) return;

    const thumbHeightPx = Math.min(trackHeight, minThumbHeightPx);
    const maxScrollPx = Math.max(0, scrollHeight - clientHeight);
    const isScrollable = maxScrollPx > 2 && totalItems > 0;

    if (!isScrollable) {
      setThumbMetrics({
        thumbHeightPx,
        thumbOffsetY: 0,
        isScrollable: false,
      });
      return;
    }

    // Estimate visible items vs total items (maxScrollIndex = totalItems - visibleItems)
    const avgItemHeight = scrollHeight / Math.max(1, totalItems);
    const visibleItems = Math.max(1, clientHeight / Math.max(1, avgItemHeight));
    const maxScrollIndex = Math.max(1, totalItems - visibleItems);
    const currentVirtualIndex = Math.min(
      maxScrollIndex,
      (scrollTop / maxScrollPx) * maxScrollIndex
    );

    const availableTrackSpace = Math.max(0, trackHeight - thumbHeightPx);

    // Ensure thumb stays pinned at bottom when scrolled to the end
    const isAtBottom = scrollTop >= maxScrollPx - 1.5;
    const scrollFraction = isAtBottom
      ? 1
      : Math.max(0, Math.min(1, currentVirtualIndex / maxScrollIndex));

    const thumbOffsetY = scrollFraction * availableTrackSpace;

    setThumbMetrics({
      thumbHeightPx,
      thumbOffsetY,
      isScrollable: true,
    });
  }, [totalItems, minThumbHeightPx]);

  useEffect(() => {
    recalculateMetrics();
    const container = scrollContainerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver(() => {
      recalculateMetrics();
    });
    resizeObserver.observe(container);
    if (trackRef.current) {
      resizeObserver.observe(trackRef.current);
    }

    return () => {
      resizeObserver.disconnect();
      if (fadeTimeoutRef.current) {
        window.clearTimeout(fadeTimeoutRef.current);
      }
    };
  }, [recalculateMetrics, totalItems]);

  const scrollToPointerY = useCallback(
    (clientY: number) => {
      const container = scrollContainerRef.current;
      const track = trackRef.current;
      if (!container || !track) return;

      const rect = track.getBoundingClientRect();
      if (rect.height <= 0) return;

      const thumbHalf = thumbMetrics.thumbHeightPx / 2;
      const clampedY = Math.max(
        0,
        Math.min(rect.height - thumbMetrics.thumbHeightPx, clientY - rect.top - thumbHalf)
      );
      const availableSpace = Math.max(1, rect.height - thumbMetrics.thumbHeightPx);
      const dragFraction = Math.max(0, Math.min(1, clampedY / availableSpace));

      const maxScrollPx = Math.max(0, container.scrollHeight - container.clientHeight);
      container.scrollTop = dragFraction * maxScrollPx;
      recalculateMetrics();
      triggerActiveFade();
    },
    [thumbMetrics.thumbHeightPx, recalculateMetrics, triggerActiveFade]
  );

  const isActive = isDragging || isScrolling;

  return (
    <div
      className={`flex-1 min-h-0 flex items-stretch ${
        edge === 'right' ? 'flex-row-reverse' : 'flex-row'
      }`}
    >
      {/* Left-Side Scroller Track & Clean 0.5cm Grey Pill Thumb with minimal spacing */}
      <div
        style={{ paddingBottom: `${bottomPaddingPx}px` }}
        className="shrink-0 -ml-1.5 mr-[3px] flex flex-col select-none touch-none"
      >
        <div
          ref={trackRef}
          onPointerDown={(e) => {
            isDraggingRef.current = true;
            setIsDragging(true);
            e.currentTarget.setPointerCapture(e.pointerId);
            scrollToPointerY(e.clientY);
          }}
          onPointerMove={(e) => {
            if (!isDraggingRef.current) return;
            scrollToPointerY(e.clientY);
          }}
          onPointerUp={(e) => {
            if (isDraggingRef.current) {
              isDraggingRef.current = false;
              setIsDragging(false);
              triggerActiveFade();
              try {
                e.currentTarget.releasePointerCapture(e.pointerId);
              } catch {
                // ignore
              }
            }
          }}
          onPointerCancel={() => {
            isDraggingRef.current = false;
            setIsDragging(false);
            triggerActiveFade();
          }}
          style={{
            opacity: isActive ? 1 : 0.88,
            transition: 'opacity 220ms cubic-bezier(0.22, 1, 0.36, 1)',
          }}
          className="w-[6px] flex-1 flex justify-center relative cursor-pointer overflow-hidden"
          title="Scroll List"
        >
          <div
            style={{
              height: `${thumbMetrics.thumbHeightPx}px`,
              transform: `translate3d(0, ${thumbMetrics.thumbOffsetY}px, 0)`,
              transition: isDragging
                ? 'background-color 120ms ease'
                : 'transform 90ms cubic-bezier(0.22, 1, 0.36, 1), height 150ms ease, background-color 120ms ease',
            }}
            className={`w-[5px] rounded-full ${
              isDragging ? 'bg-[#828282]' : 'bg-[#9E9E9E] hover:bg-[#8E8E8E]'
            }`}
          />
        </div>
      </div>

      {/* Wrapped Scrollable Content */}
      <div
        ref={scrollContainerRef}
        onScroll={() => {
          recalculateMetrics();
          triggerActiveFade();
        }}
        className="flex-1 min-w-0 overflow-y-auto overscroll-y-contain no-scrollbar pb-6"
      >
        {children}
      </div>
    </div>
  );
};
