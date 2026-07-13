/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Diagnostic utility and global fetch interceptor for Finity.
 * It resolves relative API URLs to the production Cloud Run server when running
 * in a mobile environment (Capacitor) or when custom server URLs are configured.
 */

export function getApiBaseUrl(): string {
  const savedUrl = localStorage.getItem("finity-api-url");
  if (savedUrl) {
    return savedUrl.trim().replace(/\/$/, "");
  }

  // Detect if we are running in a Capacitor WebView on Android/iOS
  const isCapacitor = 
    window.location.protocol === "capacitor:" || 
    window.location.protocol === "http-extension:" ||
    (window.location.hostname === "localhost" && !window.location.port) ||
    navigator.userAgent.toLowerCase().includes("android") ||
    !!(window as any).Capacitor;

  if (isCapacitor) {
    // Return the production server URL
    return "https://ais-pre-ukieqcyvafzk2w56lzifwb-230947666768.europe-west2.run.app";
  }

  // On standard browsers, relative URLs resolve correctly against the current origin
  return window.location.origin;
}

// Intercept global fetch
const originalFetch = window.fetch;

window.fetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  let url = typeof input === "string" ? input : (input instanceof URL ? input.toString() : (input as Request).url);

  // If it's a relative API path, rewrite it
  if (url.startsWith("/api/")) {
    const baseUrl = getApiBaseUrl();
    url = `${baseUrl}${url}`;
    console.log(`[Finity OS Interceptor] Rewrote relative API call ${input} -> ${url}`);
  }

  const startTime = Date.now();
  try {
    const response = await originalFetch(url, init);
    const duration = Date.now() - startTime;
    console.log(`[Finity OS Diagnostics] API Response: ${url} | Status: ${response.status} | Duration: ${duration}ms`);
    return response;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[Finity OS Diagnostics] API Failure: ${url} | Error: ${error} | Duration: ${duration}ms`);
    throw error;
  }
};

console.log("[Finity OS] Global fetch interceptor and diagnostics initialized.");
