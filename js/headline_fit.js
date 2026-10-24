(function () {
document.querySelectorAll('[data-headline-top]').forEach(function (headlineTop) {
    const headlineBottom = headlineTop.parentElement.querySelector('[data-headline-bottom]');
    function fitHeadline() {
        if (!headlineTop || !headlineBottom) return;
        headlineTop.style.fontSize = '';
        headlineBottom.style.fontSize = '';
        const available = headlineTop.parentElement.clientWidth;
        const topSize = parseFloat(getComputedStyle(headlineTop).fontSize);
        const topWidth = headlineTop.getBoundingClientRect().width;
        if (!available || !topWidth) return;
        const target = Math.min(available, topWidth);
        headlineTop.style.fontSize = topSize * target / topWidth + 'px';
        const bottomSize = parseFloat(getComputedStyle(headlineBottom).fontSize);
        const bottomWidth = headlineBottom.getBoundingClientRect().width;
        if (bottomWidth) headlineBottom.style.fontSize = bottomSize * target / bottomWidth + 'px';
    }
    fitHeadline();
    if (document.fonts) document.fonts.ready.then(fitHeadline);
    if (headlineTop && 'ResizeObserver' in window) {
        new ResizeObserver(fitHeadline).observe(headlineTop.parentElement.parentElement);
    }
    window.addEventListener('resize', fitHeadline);

    });
}());
