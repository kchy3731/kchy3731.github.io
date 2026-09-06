const pointer = document.getElementById("pointer");

function movePointer(x, y) {
    pointer.style.left = `${x}px`;
    pointer.style.top = `${y}px`;
}

function main() {
    window.addEventListener("mousemove", (e) => movePointer(e.clientX, e.clientY));
}

main();