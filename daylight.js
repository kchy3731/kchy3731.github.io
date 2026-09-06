const daylight = document.getElementById('daylight');

function arrangeDaylight() {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        daylight.style.display = "none";
        night = true;
    } else {
        daylight.style.display = "initial"; // absolute daylight o.o
        night = false;
    }
}

window.addEventListener('focus', arrangeDaylight);

arrangeDaylight();