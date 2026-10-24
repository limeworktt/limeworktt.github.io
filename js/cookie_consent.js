(function () {
    const CONSENT_KEY = 'limework_analytics_consent_v1';
    // Add the GA4 Measurement ID here when Analytics is ready to go live.
    const GOOGLE_ANALYTICS_ID = '';

    let consentChoice = null;
    try {
        consentChoice = window.localStorage.getItem(CONSENT_KEY);
    } catch (error) {
        consentChoice = null;
    }

    function saveChoice(choice) {
        consentChoice = choice;
        try {
            window.localStorage.setItem(CONSENT_KEY, choice);
        } catch (error) {
            // Keep the choice for this page view when browser storage is unavailable.
        }
        window.dispatchEvent(new CustomEvent('limework:analytics-consent', {
            detail: { consent: choice }
        }));
    }

    function clearAnalyticsCookies() {
        document.cookie.split(';').forEach(function (cookie) {
            const name = cookie.split('=')[0].trim();
            if (!/^_ga(?:_|$)/.test(name)) return;
            document.cookie = name + '=; Max-Age=0; path=/; SameSite=Lax';
            document.cookie = name + '=; Max-Age=0; path=/; domain=' + window.location.hostname + '; SameSite=Lax';
            document.cookie = name + '=; Max-Age=0; path=/; domain=.limeworktt.com; SameSite=Lax';
        });
    }

    function loadAnalytics() {
        if (!/^G-[A-Z0-9]+$/i.test(GOOGLE_ANALYTICS_ID)) return;
        if (document.querySelector('script[data-limework-google-analytics]')) return;

        window.dataLayer = window.dataLayer || [];
        window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
        window.gtag('js', new Date());
        window.gtag('consent', 'default', { analytics_storage: 'granted' });
        window.gtag('config', GOOGLE_ANALYTICS_ID);

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
        '<p id="cookie-banner-description" hidden>To better understand our customers and offer limework services to more people, our website uses optional Google Analytics which are disabled by default, only if you opt in then our analytics will be enabled.</p>',
        '<a href="/legal/">Cookies &amp; Privacy Details</a>',
        '<p class="cookie_banner_status" aria-live="polite"></p>',
        '</div>',
        '<div class="cookie_banner_actions">',
        '<button class="cookie_button cookie_button_accept" type="button" data-cookie-choice="accepted">Accept</button>',
        '<button class="cookie_button cookie_button_decline" type="button" data-cookie-choice="declined">Decline</button>',
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

    const status = banner.querySelector('.cookie_banner_status');
    function showBanner(moveFocus) {
        banner.hidden = false;
        if (consentChoice === 'accepted') {
            status.textContent = 'Your current choice: analytics allowed.';
        } else if (consentChoice === 'declined') {
            status.textContent = 'Your current choice: analytics declined.';
        } else {
            status.textContent = '';
        }
        if (moveFocus) banner.querySelector('[data-cookie-choice="accepted"]').focus();
    }

    function hideBanner() {
        banner.hidden = true;
    }

    banner.addEventListener('click', function (event) {
        const button = event.target.closest('[data-cookie-choice]');
        if (!button) return;
        const choice = button.dataset.cookieChoice;
        saveChoice(choice);
        if (choice === 'accepted') {
            loadAnalytics();
        } else {
            if (typeof window.gtag === 'function') {
                window.gtag('consent', 'update', { analytics_storage: 'denied' });
            }
            clearAnalyticsCookies();
        }
        hideBanner();
    });

    if (consentChoice === 'accepted') loadAnalytics();
    if (consentChoice !== 'accepted' && consentChoice !== 'declined') showBanner(false);
}());
