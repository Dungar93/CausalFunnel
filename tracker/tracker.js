/**
 * CausalFunnel Analytics Tracking Library
 * Lightweight, privacy-focused client-side analytics tracker.
 *
 * Captures page views, user clicks with document-relative coordinates,
 * and maintains continuous session identity across page loads.
 */
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.AnalyticsTracker = factory();
  }
})(typeof window !== 'undefined' ? window : this, function () {
  'use strict';

  var STORAGE_KEY = 'cf_analytics_session_id';
  var inMemorySessionId = null;

  var config = {
    apiUrl: 'http://localhost:5000/api/events',
    debug: false,
    trackClicks: true,
    trackPageViews: true,
  };

  var state = {
    initialized: false,
    pageViewSent: false,
    listenerAttached: false,
  };

  /**
   * Generates a RFC4122 v4 UUID or secure fallback string
   */
  function generateUUID() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return 'sess_' + crypto.randomUUID();
    }

    // High-entropy fallback using crypto.getRandomValues if available
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      var bytes = new Uint8Array(16);
      crypto.getRandomValues(bytes);
      bytes[6] = (bytes[6] & 0x0f) | 0x40;
      bytes[8] = (bytes[8] & 0x3f) | 0x80;
      var hex = Array.prototype.map
        .call(bytes, function (b) {
          return ('0' + b.toString(16)).slice(-2);
        })
        .join('');
      return 'sess_' + hex;
    }

    // Standard Math.random fallback
    return (
      'sess_' +
      'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = (Math.random() * 16) | 0;
        var v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      })
    );
  }

  /**
   * Safely access localStorage with error handling for private/incognito modes
   */
  function getStoredSession() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(STORAGE_KEY);
      }
    } catch (e) {
      if (config.debug) console.warn('[AnalyticsTracker] LocalStorage unavailable:', e.message);
    }
    return inMemorySessionId;
  }

  function setStoredSession(id) {
    inMemorySessionId = id;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(STORAGE_KEY, id);
      }
    } catch (e) {
      if (config.debug) console.warn('[AnalyticsTracker] Could not persist to LocalStorage:', e.message);
    }
  }

  /**
   * Retrieves or initializes persistent session ID
   */
  function getOrCreateSessionId() {
    var existingId = getStoredSession();
    if (existingId && typeof existingId === 'string' && existingId.trim().length > 0) {
      return existingId;
    }
    var newId = generateUUID();
    setStoredSession(newId);
    return newId;
  }

  /**
   * Captures viewport dimensions
   */
  function getViewportDimensions() {
    if (typeof window === 'undefined') return { width: 0, height: 0 };
    return {
      width: window.innerWidth || (document.documentElement && document.documentElement.clientWidth) || 0,
      height: window.innerHeight || (document.documentElement && document.documentElement.clientHeight) || 0,
    };
  }

  /**
   * Computes document-relative coordinates from MouseEvent
   * Document-relative coordinate system accounts for document scroll position:
   * x = pageX (or clientX + scrollLeft)
   * y = pageY (or clientY + scrollTop)
   */
  function getDocumentRelativeCoordinates(event) {
    if (typeof event.pageX === 'number' && typeof event.pageY === 'number') {
      return {
        x: Math.round(event.pageX),
        y: Math.round(event.pageY),
      };
    }

    var doc = document.documentElement || document.body;
    var scrollLeft = window.pageXOffset || doc.scrollLeft || 0;
    var scrollTop = window.pageYOffset || doc.scrollTop || 0;

    return {
      x: Math.round((event.clientX || 0) + scrollLeft),
      y: Math.round((event.clientY || 0) + scrollTop),
    };
  }

  /**
   * Transmits tracking event to backend API
   */
  function sendEvent(payload) {
    if (!config.apiUrl) {
      if (config.debug) console.error('[AnalyticsTracker] Missing apiUrl in configuration.');
      return;
    }

    var jsonString = JSON.stringify(payload);

    if (config.debug) {
      console.log('[AnalyticsTracker] Tracking Event:', payload);
    }

    // Try modern fetch with keepalive first (reliable across page unload)
    if (typeof fetch === 'function') {
      fetch(config.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: jsonString,
        keepalive: true,
      }).catch(function (err) {
        if (config.debug) {
          console.warn('[AnalyticsTracker] Failed to send event via fetch:', err.message);
        }
      });
      return;
    }

    // Fallback to XMLHttpRequest
    try {
      var xhr = new XMLHttpRequest();
      xhr.open('POST', config.apiUrl, true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(jsonString);
    } catch (err) {
      if (config.debug) {
        console.warn('[AnalyticsTracker] Failed to send event via XHR:', err.message);
      }
    }
  }

  /**
   * Records a page view
   */
  function trackPageView() {
    var payload = {
      session_id: getOrCreateSessionId(),
      event_type: 'page_view',
      page_url: window.location.href,
      timestamp: new Date().toISOString(),
      viewport: getViewportDimensions(),
    };
    sendEvent(payload);
    state.pageViewSent = true;
  }

  /**
   * Handles user click event
   */
  function handleClick(e) {
    try {
      // Ignore right clicks or middle clicks (button 0 = primary/left click)
      if (e.button !== 0 && e.button !== undefined) return;

      var coords = getDocumentRelativeCoordinates(e);

      var payload = {
        session_id: getOrCreateSessionId(),
        event_type: 'click',
        page_url: window.location.href,
        timestamp: new Date().toISOString(),
        coordinates: coords,
        viewport: getViewportDimensions(),
      };

      sendEvent(payload);
    } catch (err) {
      if (config.debug) {
        console.warn('[AnalyticsTracker] Click tracking encountered an error:', err);
      }
    }
  }

  /**
   * Attaches event listeners safely without duplicate binding
   */
  function attachListeners() {
    if (state.listenerAttached) return;

    if (config.trackClicks && typeof document !== 'undefined') {
      document.addEventListener('click', handleClick, true); // Use capture phase for guaranteed tracking
      state.listenerAttached = true;
    }
  }

  return {
    /**
     * Initializes the tracking script
     * @param {Object} options Configuration options
     */
    init: function (options) {
      if (state.initialized) {
        if (config.debug) console.warn('[AnalyticsTracker] Tracker is already initialized.');
        return this;
      }

      if (!options || typeof options !== 'object') {
        throw new Error('[AnalyticsTracker] Configuration object is required for init(options).');
      }

      if (options.apiUrl) {
        config.apiUrl = options.apiUrl;
      }
      if (typeof options.debug === 'boolean') {
        config.debug = options.debug;
      }
      if (typeof options.trackClicks === 'boolean') {
        config.trackClicks = options.trackClicks;
      }
      if (typeof options.trackPageViews === 'boolean') {
        config.trackPageViews = options.trackPageViews;
      }

      state.initialized = true;

      // Ensure session is generated/restored immediately
      var sessionId = getOrCreateSessionId();
      if (config.debug) {
        console.log('[AnalyticsTracker] Initialized with session ID:', sessionId);
      }

      // Track initial page view
      if (config.trackPageViews && !state.pageViewSent) {
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', function () {
            trackPageView();
          });
        } else {
          trackPageView();
        }
      }

      // Attach click listeners
      attachListeners();

      return this;
    },

    /**
     * Public method to retrieve current session ID
     */
    getSessionId: function () {
      return getOrCreateSessionId();
    },

    /**
     * Public method to reset session ID (e.g. on logout or testing)
     */
    resetSession: function () {
      var newId = generateUUID();
      setStoredSession(newId);
      if (config.debug) {
        console.log('[AnalyticsTracker] Session reset to:', newId);
      }
      return newId;
    },

    /**
     * Manually trigger a custom page view or click
     */
    trackPageView: trackPageView,
  };
});
