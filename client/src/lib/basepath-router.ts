// src/lib/basepath-router.ts

import { useState, useEffect } from "react";

const BASENAME = "/nutriconnect-frontend";

/**
 * A custom location hook that makes Wouter behave as if the app is hosted at `/`.
 * Internally adds and removes the BASENAME when reading or setting the URL.
 */
export function useBasePathLocation(): [string, (to: string) => void] {
  // Get the current pathname and adjust it
  const getCurrentLocation = (): string => {
    const pathname = window.location.pathname;

    if (pathname === BASENAME) {
      return "/";
    }
    if (pathname.startsWith(BASENAME + "/")) {
      return pathname.slice(BASENAME.length);
    }
    if (pathname.startsWith(BASENAME)) {
      return pathname.slice(BASENAME.length) || "/";
    }
    return pathname;
  };

  const [location, setLocationState] = useState(getCurrentLocation);

  // Listen for navigation events
  useEffect(() => {
    const handleLocationChange = () => {
      setLocationState(getCurrentLocation());
    };

    // Listen for popstate events (back/forward buttons)
    window.addEventListener("popstate", handleLocationChange);

    // Listen for pushstate/replacestate (programmatic navigation)
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    window.history.pushState = function (...args) {
      originalPushState.apply(window.history, args);
      handleLocationChange();
    };

    window.history.replaceState = function (...args) {
      originalReplaceState.apply(window.history, args);
      handleLocationChange();
    };

    return () => {
      window.removeEventListener("popstate", handleLocationChange);
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
    };
  }, []);

  // Function to navigate to a new location
  const navigate = (to: string) => {
    // Ensure the path starts with /
    const normalizedPath = to.startsWith("/") ? to : `/${to}`;
    // Add the basename
    const fullPath = BASENAME + normalizedPath;

    // Use pushState to navigate
    window.history.pushState({}, "", fullPath);
    setLocationState(normalizedPath);
  };

  return [location, navigate];
}
