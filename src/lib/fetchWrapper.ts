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

  // Always resolve relative URLs against the current application origin
  return window.location.origin;
}

// Intercept global fetch safely to support environments with read-only window properties
try {
  const originalFetch = window.fetch;

  const customFetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    let url = typeof input === "string" ? input : (input instanceof URL ? input.toString() : (input as Request).url);

    // If it's a relative API path, rewrite it
    if (url.startsWith("/api/")) {
      const baseUrl = getApiBaseUrl();
      const targetUrl = `${baseUrl}${url}`;
      console.log(`[Finity OS Interceptor] Rewrote relative API call ${url} -> ${targetUrl}`);

      const startTime = Date.now();
      try {
        let response: Response;
        if (typeof input === "string") {
          response = await originalFetch(targetUrl, init);
        } else if (input instanceof URL) {
          response = await originalFetch(new URL(targetUrl), init);
        } else {
          // It's a Request object. Build a new Request with updated URL but same parameters
          const newRequest = new Request(targetUrl, input);
          response = await originalFetch(newRequest, init);
        }
        const duration = Date.now() - startTime;
        console.log(`[Finity OS Diagnostics] API Response: ${targetUrl} | Status: ${response.status} | Duration: ${duration}ms`);
        return response;
      } catch (error) {
        const duration = Date.now() - startTime;
        console.error(`[Finity OS Diagnostics] API Failure: ${targetUrl} | Error: ${error} | Duration: ${duration}ms`);
        throw error;
      }
    }

    // Completely transparent fallback for non-API fetch calls
    return originalFetch(input, init);
  };

  try {
    window.fetch = customFetch;
  } catch (e) {
    // Fallback: Try using Object.defineProperty if direct assignment throws a TypeError
    Object.defineProperty(window, "fetch", {
      value: customFetch,
      configurable: true,
      writable: true,
      enumerable: true
    });
  }
} catch (error) {
  console.warn("[Finity OS] Global fetch is read-only in this environment. Interceptor bypassed, using native fetch. Detail:", error);
}

console.log("[Finity OS] Global fetch interceptor and diagnostics initialized.");
