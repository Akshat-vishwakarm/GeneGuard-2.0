import React, { useEffect, useRef } from 'react';

/**
 * GeneGuardBackgroundVideo
 * 
 * Implements the single fixed DNA background video visual layer for GeneGuard.
 * Features:
 * - Uses web-standard H.264 (AVC) and WebM (VP9) assets with faststart moov atom
 * - Strictly visual only: autoplay, loop, muted, playsInline, pointer-events: none, no controls, no audio
 * - ONE fixed background layer behind the UI (Layer 0) with subtle dark overlay (Layer 1)
 * - Displayed ONLY on:
 *   1. My Health Data ('input')
 *   2. Family Network ('family')
 *   3. Analysis Dashboard ('dashboard')
 *   4. Final Combined Report ('report')
 * - Preserves playback continuity across the 4 pages without unnecessary reloads or restarts
 * - Robust Chromium autoplay handling via explicit DOM property `video.muted = true`
 */

const VIDEO_ENABLED_TABS = new Set(['input', 'family', 'dashboard', 'report']);

export default function GeneGuardBackgroundVideo({ activeTab = 'input' }) {
  const videoRef = useRef(null);
  const isVideoPage = VIDEO_ENABLED_TABS.has(activeTab);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Critical for Chromium / Edge / Safari autoplay:
    // React's JSX `muted` attribute does not set DOM property `video.muted = true` reliably.
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;

    const attemptPlay = () => {
      if (video && isVideoPage) {
        video.muted = true;
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              // Video playback started successfully
            })
            .catch((err) => {
              console.warn('[GeneGuard DNA Video] Autoplay delayed or waiting for interaction:', err);
            });
        }
      }
    };

    if (isVideoPage) {
      attemptPlay();
    } else {
      video.pause();
    }

    // User gesture fallback for browsers with strict interaction-gated autoplay policies
    const handleFirstGesture = () => {
      if (video && isVideoPage && video.paused) {
        attemptPlay();
      }
    };

    window.addEventListener('click', handleFirstGesture, { once: true });
    window.addEventListener('touchstart', handleFirstGesture, { once: true });
    window.addEventListener('keydown', handleFirstGesture, { once: true });

    return () => {
      window.removeEventListener('click', handleFirstGesture);
      window.removeEventListener('touchstart', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
    };
  }, [isVideoPage]);

  return (
    <>
      {/* LAYER 0: Single Fixed DNA Background Video */}
      <video
        ref={videoRef}
        className="background-video"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        onCanPlay={() => {
          const video = videoRef.current;
          if (video && isVideoPage && video.paused) {
            video.muted = true;
            video.play().catch(() => {});
          }
        }}
        style={{
          position: 'fixed',
          inset: 0,
          width: '100vw',
          height: '100vh',
          objectFit: 'cover',
          zIndex: 0,
          pointerEvents: 'none',
          display: isVideoPage ? 'block' : 'none'
        }}
      >
        <source src="/video/GeneGuard_DNA_exact_loop_no_flicker.mp4" type="video/mp4" />
        <source src="/video/GeneGuard_DNA_exact_loop_no_flicker (1).mp4" type="video/mp4" />
        <source src="/GeneGuard_DNA_exact_loop_no_flicker.mp4" type="video/mp4" />
        <source src="/video/GeneGuard_DNA_black_background_clean.mp4" type="video/mp4" />
      </video>

      {/* LAYER 1: Subtle Dark Smoked Glass Overlay (0.38 dark tint softens harsh DNA specular highlights while keeping motion visible) */}
      <div
        className="background-overlay"
        style={{
          position: 'fixed',
          inset: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: isVideoPage ? 'rgba(0, 0, 0, 0.38)' : '#000000',
          zIndex: 1,
          pointerEvents: 'none',
          transition: 'background-color 0.3s ease'
        }}
      />
    </>
  );
}
