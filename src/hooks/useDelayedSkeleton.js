import { useState, useEffect, useRef } from 'react';

const SKELETON_DELAY_MS = 250;
const SKELETON_FADEOUT_MS = 150;

/**
 * Only show skeleton if loading takes longer than 200–300ms.
 * Fast responses render instantly; slow loads show skeleton after delay.
 * Returns { showSkeleton, skeletonExiting } for conditional render + fade-out.
 * @param {boolean} loading - Current loading state
 * @param {boolean} hasCachedData - True if we have data to show (stale-while-revalidate)
 */
export function useDelayedSkeleton(loading, hasCachedData) {
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [skeletonExiting, setSkeletonExiting] = useState(false);
  const wasShowingSkeletonRef = useRef(false);

  if (showSkeleton) wasShowingSkeletonRef.current = true;

  // Delay skeleton: show only after SKELETON_DELAY_MS if still loading and no cached data
  useEffect(() => {
    if (!loading) {
      if (wasShowingSkeletonRef.current) {
        setShowSkeleton(false);
        setSkeletonExiting(true);
        wasShowingSkeletonRef.current = false;
      }
      return () => {};
    }
    if (hasCachedData) return () => {};
    const timer = setTimeout(() => setShowSkeleton(true), SKELETON_DELAY_MS);
    return () => clearTimeout(timer);
  }, [loading, hasCachedData]);

  // Fade-out: when skeletonExiting, remove skeleton from DOM after transition
  useEffect(() => {
    if (!skeletonExiting) return () => {};
    const t = setTimeout(() => setSkeletonExiting(false), SKELETON_FADEOUT_MS);
    return () => clearTimeout(t);
  }, [skeletonExiting]);

  const isRevalidating = loading && hasCachedData;

  return {
    showSkeleton: showSkeleton || skeletonExiting,
    skeletonExiting,
    skeletonFadeClass: skeletonExiting ? 'skeleton-fade-out' : '',
    isRevalidating,
  };
}

export { SKELETON_DELAY_MS, SKELETON_FADEOUT_MS };
