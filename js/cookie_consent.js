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
    banner.className = 'cookie_banner';
    banner.hidden = true;
    banner.setAttribute('role', 'region');
    banner.setAttribute('aria-label', 'Cookie and analytics choices');
    banner.innerHTML = [
        '<div class="cookie_banner_copy">',
        '<p class="cookie_banner_title">Your Privacy Matters</p>',
        '<p id="cookie-banner-description">To better understand our customers and offer limework services to more people, our website uses optional Google Analytics which are disabled by default, only if you opt in then our analytics will be enabled.</p>',
        '<a href="/legal/">Cookie &amp; privacy details</a>',
        '<p class="cookie_banner_status" aria-live="polite"></p>',
        '</div>',
        '<div class="cookie_banner_actions">',
        '<button class="cookie_button cookie_button_accept" type="button" data-cookie-choice="accepted">Accept</button>',
        '<button class="cookie_button cookie_button_decline" type="button" data-cookie-choice="declined">Decline</button>',
        '</div>'
    ].join('');
    document.body.appendChild(banner);

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

    document.querySelectorAll('.cookie-settings-trigger').forEach(function (trigger) {
        trigger.addEventListener('click', function () { showBanner(true); });
    });

    if (consentChoice === 'accepted') loadAnalytics();
    if (consentChoice !== 'accepted' && consentChoice !== 'declined') showBanner(false);
}());
