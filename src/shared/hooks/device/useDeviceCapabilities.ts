/**
 * useDeviceCapabilities - Detect device capabilities for adaptive rendering
 *
 * Provides information about the device to enable performance optimizations:
 * - Mobile vs desktop detection
 * - Low-end device detection (for reduced quality settings)
 * - GPU capabilities estimation
 */

import { useState, useEffect, useMemo } from 'react';

export interface DeviceCapabilities {
  /** True if device has touch capabilities (mobile/tablet) */
  isMobile: boolean;
  /** True if device is likely low-end (reduce quality for better perf) */
  isLowEnd: boolean;
  /** Device pixel ratio (capped for performance) */
  pixelRatio: number;
  /** Recommended shadow map size based on device capability */
  shadowMapSize: 512 | 1024 | 2048;
  /** Whether to enable shadows at all */
  enableShadows: boolean;
  /** Whether to enable anti-aliasing */
  enableAntialias: boolean;
}

/**
 * Detect if device is mobile based on touch capability
 */
function detectMobile(): boolean {
  if (typeof navigator === 'undefined') return false;
  return navigator.maxTouchPoints > 0;
}

/**
 * Estimate if device is low-end based on available signals
 * - Low memory (< 4GB reported)
 * - Low CPU cores (< 4)
 * - Low device pixel ratio (< 2)
 * - Mobile with older GPU
 */
function detectLowEnd(): boolean {
  if (typeof navigator === 'undefined') return false;

  // Check device memory if available (Chrome)
  const deviceMemory = (navigator as { deviceMemory?: number }).deviceMemory;
  if (deviceMemory !== undefined && deviceMemory < 4) {
    return true;
  }

  // Check CPU cores if available
  const hardwareConcurrency = navigator.hardwareConcurrency;
  if (hardwareConcurrency !== undefined && hardwareConcurrency < 4) {
    return true;
  }

  // Mobile with low DPR is likely older device
  const isMobile = detectMobile();
  if (isMobile && window.devicePixelRatio < 2) {
    return true;
  }

  return false;
}

/**
 * Hook to detect device capabilities for adaptive rendering
 */
export function useDeviceCapabilities(): DeviceCapabilities {
  // Use state to handle SSR - initial render assumes desktop
  const [isMobile, setIsMobile] = useState(false);
  const [isLowEnd, setIsLowEnd] = useState(false);

  // Detect on mount (client-side only)
  useEffect(() => {
    setIsMobile(detectMobile());
    setIsLowEnd(detectLowEnd());
  }, []);

  // Compute derived values based on device detection
  const capabilities = useMemo((): DeviceCapabilities => {
    // Cap pixel ratio for performance (higher DPR = more pixels to render)
    const pixelRatio = isLowEnd ? 1 : Math.min(window.devicePixelRatio ?? 1, isMobile ? 1.5 : 2);

    // Shadow map size based on capability
    let shadowMapSize: 512 | 1024 | 2048;
    if (isLowEnd) {
      shadowMapSize = 512;
    } else if (isMobile) {
      shadowMapSize = 1024;
    } else {
      shadowMapSize = 2048;
    }

    return {
      isMobile,
      isLowEnd,
      pixelRatio,
      shadowMapSize,
      enableShadows: !isLowEnd, // Disable shadows on low-end devices
      enableAntialias: !isMobile, // Disable anti-aliasing on mobile
    };
  }, [isMobile, isLowEnd]);

  return capabilities;
}

/**
 * Get device capabilities synchronously (for non-hook contexts)
 * Note: May not work correctly during SSR
 */
export function getDeviceCapabilities(): DeviceCapabilities {
  const isMobile = detectMobile();
  const isLowEnd = detectLowEnd();
  const pixelRatio = isLowEnd ? 1 : Math.min(window.devicePixelRatio ?? 1, isMobile ? 1.5 : 2);

  let shadowMapSize: 512 | 1024 | 2048;
  if (isLowEnd) {
    shadowMapSize = 512;
  } else if (isMobile) {
    shadowMapSize = 1024;
  } else {
    shadowMapSize = 2048;
  }

  return {
    isMobile,
    isLowEnd,
    pixelRatio,
    shadowMapSize,
    enableShadows: !isLowEnd,
    enableAntialias: !isMobile,
  };
}
