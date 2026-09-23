function change_look() {
    var nav_btn = document.getElementById('hamburger');
    var nav = document.getElementById('nav_side_holder');
    var backdrop = document.getElementById('mobile_nav_backdrop');
    var is_open = nav.classList.toggle('is-open');

    nav_btn.classList.toggle('open', is_open);
    backdrop.classList.toggle('is-open', is_open);
    nav_btn.setAttribute('aria-expanded', is_open);
    nav_btn.setAttribute('aria-label', is_open ? 'Close navigation menu' : 'Open navigation menu');
}

document.getElementById('hamburger').addEventListener('click', change_look);
document.getElementById('mobile_nav_backdrop').addEventListener('click', change_look);