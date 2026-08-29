/**
 * MEC Ad Manager v2
 * - Loads ad zone configs from Supabase app_settings key: 'hilltop_zones'
 * - Anti-adblocker: renders ads inside sandboxed blob: iframes
 * - Impression tracking: each view per zone is tracked in Supabase ad_impressions
 * - Click-hijack protection: iframe sandbox blocks top-level navigation
 * - Premium users see NO ads
 */
(function () {
  'use strict';

  // ── Fallback Ad Zone definitions (used if Supabase is unreachable) ──────────
  const FALLBACK_ZONES = {
    mobile_banner_2: {
      src: '//quarrelsomebitter.com/b.XxV/ssdZGClc0hY-W/cv/NeKmC9JuiZeUvlUkFPnTjcqzXNfTjQt0/MQzLcPt_Nxz/Ml1XNADXQo0CMqQt',
      w: 320, h: 50
    },
    mobile_banner_3: {
      src: '//quarrelsomebitter.com/bEXGVJs.d_GQl/0eYoWecx/_emm/9QuJZjUhlqk/P/Tuc/zzNZTLQC0/NvDlkItZNnzIMd1fN/DyQN1jMqwo',
      w: 320, h: 50
    },
    multitag_300x250: {
      src: '//quarrelsomebitter.com/blXrV_s.d/GBlo0XYZW-cI/veTmo9/uHZiUolmkmP/ThcYzzNnTYQ/0xNAjBEntvNGz/Ml1hNwDUQ/2/NMQm',
      w: 300, h: 250
    },
    multitag_300x250_2: {
      src: '//quarrelsomebitter.com/b.XyVks/d/G/l/0cYUWfcW/Aepmw9DuvZ/UxlxknPaTRcezyNlTdQI0INWz/cYtrNTzSMU1tN/DiQ/4dMmQ_',
      w: 300, h: 250
    },
    video_vast: {
      src: 'https://loyal-product.com/dDm-F.zNdaGxNWvcZ/GJUO/NeCmw9yu/Z/UUlEkWP/T/clzJNETKQo4VNtj/UHt/NRzmM/1dN/DRgS2ROnSOZLsqavWY1opedcD/0CxN',
      w: 640, h: 360
    }
  };

  let _zones = null;
  let _isPremium = false;
  let _ready = false;
  let _booted = false;

  // ── Impression Tracking ──────────────────────────────────────────────────────
  function trackImpression(zone) {
    try {
      const key = 'mec_ad_' + zone + '_' + window.location.pathname;
      const count = parseInt(sessionStorage.getItem(key) || '0') + 1;
      sessionStorage.setItem(key, count);
      // Fire-and-forget to Supabase
      if (typeof MECSupabase !== 'undefined') {
        try {
          const sb = MECSupabase.getSupabase();
          if (sb) {
            sb.from('ad_impressions').upsert({
              zone,
              page: window.location.pathname.slice(0, 200),
              session_count: count,
              updated_at: new Date().toISOString()
            }, { onConflict: 'zone,page' }).then(function(){}).catch(function(){});
          }
        } catch (e) {}
      }
    } catch (e) {}
  }

  // ── Anti-adblocker: inject via sandboxed blob iframe ────────────────────────
  // Adblockers match script[src] patterns. Blob: URLs bypass all src-based rules.
  function injectViaBlob(container, zone, zoneConfig) {
    try {
      console.log(`[AdManager] Injecting blob for zone: ${zone}`, zoneConfig);
      var src = zoneConfig.src;
      var w = zoneConfig.w || 320;
      var h = zoneConfig.h || 50;

      if (!src) {
        console.error(`[AdManager] Missing src in zoneConfig for ${zone}`, zoneConfig);
        return;
      }
      
      // Fix protocol-relative URLs inside blob iframes (blob:// is invalid)
      if (src.startsWith('//')) {
        src = 'https:' + src;
      }

      // Build inner HTML for the iframe — runs the Hilltop ad script inside a clean context
      var innerHtml = '<!DOCTYPE html><html><head>' +
        '<meta name="viewport" content="width=device-width,initial-scale=1">' +
        '<style>*{margin:0;padding:0;box-sizing:border-box;}' +
        'body{overflow:hidden;background:transparent;width:' + w + 'px;height:' + h + 'px;' +
        'display:flex;align-items:center;justify-content:center;}</style>' +
        '</head><body>' +
        '<script>(function(g){' +
        'try {' +
        'var d=document,s=d.createElement("script"),l=d.scripts[d.scripts.length-1];' +
        's.settings=g||{};' +
        's.src="' + src + '";' +
        's.async=true;' +
        's.referrerPolicy="no-referrer-when-downgrade";' +
        's.onerror = function(e) { console.error("[AdManager Iframe] Script load error for src:", "' + src + '", e); };' +
        'l.parentNode.insertBefore(s,l);' +
        '} catch(err) { console.error("[AdManager Iframe] Script injection error:", err); }' +
        '})({})<\/script>' +
        '</body></html>';

      var blob = new Blob([innerHtml], { type: 'text/html' });
      var blobUrl = URL.createObjectURL(blob);

      // Wrapper keeps the ad contained and properly sized
      var wrapper = document.createElement('div');
      wrapper.style.cssText = 'display:inline-block;width:' + w + 'px;max-width:100%;height:' + h + 'px;overflow:hidden;border-radius:8px;position:relative;';

      var iframe = document.createElement('iframe');
      iframe.src = blobUrl;
      iframe.width = w;
      iframe.height = h;
      iframe.style.cssText = 'width:' + w + 'px;max-width:100%;height:' + h + 'px;border:none;display:block;overflow:hidden;';
      iframe.setAttribute('scrolling', 'no');
      iframe.setAttribute('frameborder', '0');
      // SECURITY: allow popups (ads) but NOT top-level navigation (prevents click hijacking)
      iframe.setAttribute('sandbox', 'allow-scripts allow-popups allow-same-origin allow-forms allow-popups-to-escape-sandbox');

      iframe.onload = function () {
        try { URL.revokeObjectURL(blobUrl); } catch(e) { console.warn('[AdManager] Blob revoke error:', e); }
        trackImpression(zone);
        container.classList.add('mec-ad-loaded');
        console.log(`[AdManager] Iframe loaded successfully for zone: ${zone}`);
      };
      
      iframe.onerror = function (e) {
        console.error(`[AdManager] Iframe onerror triggered for zone: ${zone}`, e);
      };

      wrapper.appendChild(iframe);
      container.appendChild(wrapper);
    } catch (err) {
      console.error(`[AdManager] Exception in injectViaBlob for zone: ${zone}`, err);
    }
  }

  // ── Inject a single .mec-ad-slot element ────────────────────────────────────
  function injectSlot(el) {
    try {
      if (el.dataset.injected === '1') {
        console.log('[AdManager] Slot already injected, skipping:', el);
        return;
      }
      el.dataset.injected = '1';

      var zone = el.dataset.zone || 'mobile_banner_2';
      console.log(`[AdManager] Processing slot for zone: ${zone}`);
      var config = (_zones && _zones[zone]) || FALLBACK_ZONES[zone] || FALLBACK_ZONES.mobile_banner_2;

      if (!config) {
        console.error(`[AdManager] Config missing entirely for zone: ${zone}`, { _zones, FALLBACK_ZONES });
        return;
      }

      el.innerHTML = '';
      el.style.cssText = 'display:flex;align-items:center;justify-content:center;' +
        'width:100%;max-width:' + config.w + 'px;min-height:' + config.h + 'px;' +
        'margin:12px auto;overflow:hidden;border-radius:8px;background:transparent;';

      injectViaBlob(el, zone, config);
    } catch (err) {
      console.error('[AdManager] Exception in injectSlot', err, el);
    }
  }

  // ── Inject all uninjected slots on page ─────────────────────────────────────
  function injectAllSlots() {
    try {
      var slots = document.querySelectorAll('.mec-ad-slot:not([data-injected])');
      console.log(`[AdManager] Found ${slots.length} uninjected slots.`);
      for (var i = 0; i < slots.length; i++) { injectSlot(slots[i]); }
    } catch (err) {
      console.error('[AdManager] Exception in injectAllSlots', err);
    }
  }

  // ── Floating sticky footer (fallback when no inline slots exist) ─────────────
  function injectStickyFooter() {
    if (document.getElementById('mec-sticky-ad')) return;
    var zone = 'mobile_banner_2';
    var config = (_zones && _zones[zone]) || FALLBACK_ZONES[zone];

    var footer = document.createElement('div');
    footer.id = 'mec-sticky-ad';
    footer.style.cssText = 'position:fixed;bottom:0;left:0;right:0;z-index:99999;' +
      'display:flex;align-items:center;justify-content:center;padding:6px 36px 6px 6px;' +
      'background:rgba(0,0,0,0.88);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);' +
      'box-shadow:0 -2px 16px rgba(0,0,0,0.35);';

    var close = document.createElement('button');
    close.innerHTML = '&times;';
    close.title = 'Close';
    close.style.cssText = 'position:absolute;right:10px;top:50%;transform:translateY(-50%);' +
      'background:#555;color:#fff;border:none;border-radius:50%;width:24px;height:24px;' +
      'font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;z-index:1;';
    close.onclick = function () { footer.style.display = 'none'; };
    footer.appendChild(close);

    injectViaBlob(footer, zone, config);
    document.body.appendChild(footer);
  }

  // ── Main runner ──────────────────────────────────────────────────────────────
  async function run() {
    if (_ready) return;

    // 1. Check premium status
    try {
      if (typeof MECSupabase !== 'undefined') {
        var sb = MECSupabase.getSupabase();
        if (sb) {
          var user = await MECSupabase.getCurrentUser();
          if (user) {
            var result = await sb.from('profiles').select('is_premium').eq('id', user.id).single();
            if (result && result.data && result.data.is_premium === true) {
              _isPremium = true;
              window.MECAdManager.isPremium = true;
              console.log('[AdManager] Premium user — ads skipped.');
              return;
            }
          }
          // 2. Load zone configs from Supabase
          try {
            console.log('[AdManager] Fetching hilltop_zones from app_settings...');
            var settingResult = await sb.from('app_settings').select('value').eq('key', 'hilltop_zones').single();
            if (settingResult && settingResult.data && settingResult.data.value) {
              console.log('[AdManager] Successfully fetched hilltop_zones:', settingResult.data.value);
              _zones = typeof settingResult.data.value === 'string'
                ? JSON.parse(settingResult.data.value)
                : settingResult.data.value;
            } else {
              console.warn('[AdManager] hilltop_zones not found or empty in app_settings');
            }
          } catch (e) {
            console.error('[AdManager] Error fetching hilltop_zones:', e);
          }
        } else {
          console.warn('[AdManager] MECSupabase.getSupabase() returned null');
        }
      } else {
        console.warn('[AdManager] MECSupabase is undefined');
      }
    } catch (e) {
      console.error('[AdManager] Global error in run():', e);
    }

    _ready = true;

    // 3. Inject existing inline slots
    injectAllSlots();

    // 4. Fallback sticky footer if no inline slots present
    if (!document.querySelector('.mec-ad-slot')) {
      injectStickyFooter();
    }

    // 5. Watch for new slots added dynamically (e.g., after question pagination)
    var observer = new MutationObserver(function () { injectAllSlots(); });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  // ── Public API ───────────────────────────────────────────────────────────────
  window.MECAdManager = {
    isPremium: false,
    injectSlot: injectSlot,
    injectAllSlots: injectAllSlots,
    refreshSlots: function () { if (!_isPremium) injectAllSlots(); },
    run: run
  };

  // ── Boot after genuine interaction OR 4 seconds max ─────────────────────────
  var boot = function () {
    if (_booted) return;
    _booted = true;
    setTimeout(run, 600);
  };

  ['click', 'scroll', 'touchstart', 'keydown', 'mousemove'].forEach(function (evt) {
    window.addEventListener(evt, boot, { once: true, passive: true });
  });
  setTimeout(boot, 4000);

})();


