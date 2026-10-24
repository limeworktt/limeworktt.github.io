(function () {
    const video = document.querySelector('[data-hero-video]');
    if (!video) return;

    const header = document.querySelector('.desktop_nav_container');
    function sizeHero() {
        if (header) document.documentElement.style.setProperty('--home-nav-height', header.getBoundingClientRect().height + 'px');
    }
    sizeHero();
    if (header && 'ResizeObserver' in window) new ResizeObserver(sizeHero).observe(header);
    else window.addEventListener('resize', sizeHero);

    const fallback = document.querySelector('[data-hero-fallback]');
    function showPoster() {
        video.pause();
        video.controls = false;
        video.hidden = true;
        if (fallback) fallback.hidden = false;
    }

    video.controls = false;
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        showPoster();
        return;
    }

    // Use H.264 with the page background in Safari; other browsers retain VP9 alpha.
    const safari = /Apple/.test(navigator.vendor) && /Safari/.test(navigator.userAgent) && !/CriOS|FxiOS|EdgiOS/.test(navigator.userAgent);
    const initialSource = safari ? video.dataset.safariSrc : video.dataset.webmSrc;
    let usingCompatibleSource = safari;
    let downloadReady = false;
    let objectURL = null;

    function startPlayback() {
        if (!downloadReady) return;
        video.hidden = false;
        if (fallback) fallback.hidden = true;
        const request = video.play();
        if (request && typeof request.catch === 'function') request.catch(showPoster);
    }

    async function downloadVideo(source) {
        downloadReady = false;
        showPoster();
        // The timeout preserves the poster; the download continues in the background.
        const cutoff = setTimeout(function () {
            if (!downloadReady) showPoster();
        }, 10000);
        try {
            const response = await fetch(source, { priority: 'high' });
            if (!response.ok) throw new Error('Video download failed');
            const blob = await response.blob();
            clearTimeout(cutoff);
            if (objectURL) URL.revokeObjectURL(objectURL);
            objectURL = URL.createObjectURL(blob);
            video.src = objectURL;
            video.load();
        } catch (error) {
            clearTimeout(cutoff);
            showPoster();
        }
    }

    video.addEventListener('loadeddata', function () {
        downloadReady = true;
        startPlayback();
    });
    video.addEventListener('error', function () {
        if (!usingCompatibleSource) {
            usingCompatibleSource = true;
            downloadVideo(video.dataset.safariSrc);
        } else showPoster();
    });
    // Retry blocked autoplay on a later interaction, once the download is ready.
    document.addEventListener('pointerdown', function () {
        if (video.hidden && downloadReady && !video.error) startPlayback();
    });
    showPoster();
    if (!(navigator.connection && navigator.connection.saveData)) {
        downloadVideo(initialSource);
    }
}());
