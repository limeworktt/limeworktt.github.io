(function () {
    const CONSENT_KEY = 'limework_analytics_consent_v1';
    // GA4 web stream for the Limework promotional website.
    const GOOGLE_ANALYTICS_ID = 'G-C0XJMRX293';

    const CONSENT_COOKIE = 'limework_analytics_allowed';
    const cookieOptions = '; path=/; SameSite=Lax' + (location.protocol === 'https:' ? '; Secure' : '');
    function hasConsentCookie() {
        return document.cookie.split(';').some(function (entry) {
            return entry.trim() === CONSENT_COOKIE + '=1';
        });
    }
    function writeConsentCookie(allowed) {
        document.cookie = CONSENT_COOKIE + '=' + (allowed ? '1' : '') +
            '; Max-Age=' + (allowed ? 31536000 : 0) + cookieOptions;
    }

    let analyticsStarted = false;
    let consentChoice = hasConsentCookie() ? 'accepted' : null;
    try {
        const previous = window.localStorage.getItem(CONSENT_KEY);
        // Migrate the old accepted preference once; declines stay local, not in cookies.
        if (!consentChoice && previous === 'accepted') {
            writeConsentCookie(true);
            consentChoice = hasConsentCookie() ? 'accepted' : null;
            window.localStorage.removeItem(CONSENT_KEY);
        } else if (!consentChoice && previous === 'declined') consentChoice = 'declined';
    } catch (error) {
        // Consent still works when local storage is unavailable.
    }

    function saveChoice(choice) {
        writeConsentCookie(choice === 'accepted');
        consentChoice = choice === 'accepted' && !hasConsentCookie() ? null : choice;
        try {
            if (choice === 'accepted') window.localStorage.removeItem(CONSENT_KEY);
            else window.localStorage.setItem(CONSENT_KEY, 'declined');
        } catch (error) {
            // Keep the choice for this page view when storage is unavailable.
        }
        window.dispatchEvent(new CustomEvent('limework:analytics-consent', {
            detail: { consent: consentChoice }
        }));
    }

    function clearAnalyticsCookies() {
        const domains = ['', window.location.hostname];
        if (/(^|\.)limeworktt\.com$/.test(location.hostname)) domains.push('limeworktt.com', '.limeworktt.com');
        const paths = new Set(['/']);
        const parts = location.pathname.split('/').filter(Boolean);
        let path = '';
        parts.forEach(function (part) { path += '/' + part; paths.add(path); paths.add(path + '/'); });
        const names = new Set(document.cookie.split(';').map(function (cookie) {
            return cookie.split('=')[0].trim();
        }).filter(function (name) { return /^_ga(?:_|$)/.test(name); }));
        names.add('_ga');
        names.add('_ga_' + GOOGLE_ANALYTICS_ID.slice(2));
        names.forEach(function (name) {
            domains.forEach(function (domain) {
                paths.forEach(function (cookiePath) {
                    document.cookie = name + '=; Max-Age=0; path=' + cookiePath +
                        (domain ? '; domain=' + domain : '') + '; SameSite=Lax';
                });
            });
        });
    }

    function disableAnalytics() {
        window['ga-disable-' + GOOGLE_ANALYTICS_ID] = true;
        if (typeof window.gtag === 'function') window.gtag('consent', 'update', { analytics_storage: 'denied' });
        clearAnalyticsCookies();
    }

    function loadAnalytics() {
        if (!hasConsentCookie() || !/^G-[A-Z0-9]+$/i.test(GOOGLE_ANALYTICS_ID)) return;
        // Keep local previews out of the live reports.
        if (!['limeworktt.com', 'www.limeworktt.com', 'limeworktt.github.io'].includes(window.location.hostname)) return;
        window['ga-disable-' + GOOGLE_ANALYTICS_ID] = false;
        if (analyticsStarted) {
            window.gtag('consent', 'update', { analytics_storage: 'granted' });
            return;
        }
        analyticsStarted = true;

        window.dataLayer = window.dataLayer || [];
        window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
        window.gtag('js', new Date());
        window.gtag('consent', 'default', {
            analytics_storage: 'granted', ad_storage: 'denied',
            ad_user_data: 'denied', ad_personalization: 'denied'
        });
        window.gtag('config', GOOGLE_ANALYTICS_ID, {
            allow_google_signals: false,
            allow_ad_personalization_signals: false
        });

        const script = document.createElement('script');
        script.async = true;
        script.dataset.limeworkGoogleAnalytics = 'true';
        script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GOOGLE_ANALYTICS_ID);
        document.head.appendChild(script);
    }

    const banner = document.createElement('section');
    banner.className = 'cookie_banner is-collapsed';
    banner.hidden = true;
    banner.setAttribute('role', 'region');
    banner.setAttribute('aria-label', 'Cookie and analytics choices');
    banner.innerHTML = [
        '<div class="cookie_banner_copy">',
        '<div class="cookie_banner_header">',
        '<p class="cookie_banner_title"><svg class="cookie_banner_icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M20.8 13A9 9 0 1 1 11 3.1a4 4 0 0 0 4.9 4.8 4 4 0 0 0 4.9 5.1Z"/><circle cx="8" cy="9" r="1"/><circle cx="7" cy="15" r="1"/><circle cx="13" cy="16" r="1"/><circle cx="12" cy="11" r=".7"/></svg><span>Your Privacy Matters</span></p>',
        '<button class="cookie_banner_toggle" type="button" aria-expanded="false" aria-controls="cookie-banner-description" aria-label="Expand cookie description"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 15 6-6 6 6"/></svg></button>',
        '</div>',
        '<p id="cookie-banner-description" hidden>With your permission, Limework uses Google Analytics to understand visits, approximate locations, popular pages and how people find this site. Analytics stays off unless you accept. You can change your choice on the Legal &amp; Policies page.</p>',
        '<a href="/legal/">Cookies &amp; Privacy Details</a>',
        '</div>',
        '<div class="cookie_banner_actions">',
        '<button class="cookie_button cookie_button_accept" type="button" data-cookie-choice="accepted">Accept</button>',
        '<button class="cookie_button cookie_button_decline" type="button" data-cookie-choice="declined" aria-label="Decline analytics" title="Decline analytics"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button>',
        '</div>'
    ].join('');
    document.body.appendChild(banner);

    const description = banner.querySelector('#cookie-banner-description');
    const toggle = banner.querySelector('.cookie_banner_toggle');
    toggle.addEventListener('click', async function () {
        if (toggle.disabled) return;
        const expanded = toggle.getAttribute('aria-expanded') === 'true';
        const animate = typeof banner.animate === 'function' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const before = banner.getBoundingClientRect();
        const beforePadding = getComputedStyle(banner).paddingTop;
        toggle.disabled = true;

        try {
            if (expanded && animate) {
                await description.animate([{ opacity: 1 }, { opacity: 0 }], {
                    duration: 140, easing: 'ease-in-out'
                }).finished;
            }

            description.hidden = expanded;
            banner.classList.toggle('is-collapsed', expanded);
            toggle.setAttribute('aria-expanded', String(!expanded));
            toggle.setAttribute('aria-label', expanded ? 'Expand cookie description' : 'Collapse cookie description');

            if (animate) {
                const after = banner.getBoundingClientRect();
                const afterPadding = getComputedStyle(banner).paddingTop;
                banner.classList.add('is-resizing');
                const resize = banner.animate([
                    { width: before.width + 'px', height: before.height + 'px', paddingTop: beforePadding, paddingBottom: beforePadding },
                    { width: after.width + 'px', height: after.height + 'px', paddingTop: afterPadding, paddingBottom: afterPadding }
                ], { duration: 480, easing: 'ease-in-out' });
                const animations = [resize.finished];
                if (!expanded) {
                    animations.push(description.animate([{ opacity: 0 }, { opacity: 1 }], {
                        duration: 340, delay: 140, fill: 'backwards', easing: 'ease-in-out'
                    }).finished);
                }
                await Promise.all(animations);
            }
        } finally {
            banner.classList.remove('is-resizing');
            toggle.disabled = false;
        }
    });

    function showBanner(moveFocus) {
        banner.hidden = false;
        if (moveFocus) banner.querySelector('[data-cookie-choice="accepted"]').focus();
    }

    function hideBanner() {
        banner.hidden = true;
    }

    function applyChoice(choice) {
        saveChoice(choice);
        if (consentChoice === 'accepted') {
            loadAnalytics();
        } else {
            disableAnalytics();
        }
        hideBanner();
        syncToggle();
    }

    function syncToggle() {
        document.querySelectorAll('[data-analytics-status]').forEach(function (badge) {
            const enabled = consentChoice === 'accepted';
            badge.textContent = enabled ? 'Active' : 'Disabled';
            badge.classList.toggle('policy_status_active', enabled);
            badge.classList.toggle('policy_status_disabled', !enabled);
        });
        document.querySelectorAll('[data-analytics-toggle]').forEach(function (toggle) {
            const enabled = consentChoice === 'accepted';
            toggle.setAttribute('aria-checked', String(enabled));
            toggle.querySelector('.analytics_switch_state').textContent = enabled ? 'On' : 'Off';
        });
    }
    banner.addEventListener('click', function (event) {
        const button = event.target.closest('[data-cookie-choice]');
        if (button) applyChoice(button.dataset.cookieChoice);
    });
    document.querySelectorAll('[data-analytics-toggle]').forEach(function (toggle) {
        toggle.addEventListener('click', function () {
            applyChoice(consentChoice === 'accepted' ? 'declined' : 'accepted');
            if (consentChoice === 'declined') showBanner(false);
        });
    });
    syncToggle();

    document.addEventListener('click', function (event) {
        if (event.target.closest('[data-analytics-settings]')) showBanner(true);
        const link = event.target.closest('a[href]');
        if (!link || !hasConsentCookie() || !analyticsStarted) return;
        const destination = new URL(link.href, window.location.href);
        const network = /(^|\.)instagram\.com$/.test(destination.hostname) ? 'instagram' :
            /(^|\.)linkedin\.com$/.test(destination.hostname) ? 'linkedin' : null;
        if (network) window.gtag('event', 'social_link_click', {
            social_network: network, page_path: window.location.pathname,
            link_placement: link.closest('.footer') ? 'footer' : 'navigation'
        });
    });

    if (hasConsentCookie()) loadAnalytics();
    else disableAnalytics();
    if (consentChoice !== 'accepted' && consentChoice !== 'declined') showBanner(false);
}());
