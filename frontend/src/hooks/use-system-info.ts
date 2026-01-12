import { useState, useEffect } from "react";
import { Environment } from "../../wailsjs/runtime/runtime";

export interface SystemInfo {
  buildType: string;
  platform: string;
  arch: string;
  isMac: boolean;
}

// Module-level cache for system info
let cachedSystemInfo: SystemInfo | null = null;
let cachePromise: Promise<SystemInfo> | null = null;

/**
 * Hook to fetch and store system information
 * Returns system info including build type, platform, and architecture
 * System info is cached at module level to avoid redundant API calls
 */
export function useSystemInfo() {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(cachedSystemInfo);
  const [loading, setLoading] = useState(!cachedSystemInfo);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // If already cached, return immediately
    if (cachedSystemInfo) {
      return;
    }

    const fetchSystemInfo = async () => {
      try {
        // If a fetch is already in progress, reuse it
        if (!cachePromise) {
          cachePromise = Environment().then((info) => ({
            ...info,
            isMac: info.platform === "darwin",
          }));
        }

        const info = await cachePromise;
        cachedSystemInfo = info;
        setSystemInfo(info);
        setError(null);
      } catch (err) {
        cachePromise = null; // Clear promise on error to allow retry
        setError(
          err instanceof Error ? err : new Error("Failed to fetch system info")
        );
        setSystemInfo(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSystemInfo();
  }, []);

  return { systemInfo, loading, error };
}
