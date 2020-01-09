const SCREEN_WIDTH: number = 256;
const SCREEN_HEIGHT: number = 240;

function fitInParent(canvas): void {

    const w = canvas.parentNode.offsetWidth - 40;
    canvas.style.width = `${Math.round(w)}px`;
    canvas.style.height = `${Math.round(w / SCREEN_WIDTH * SCREEN_HEIGHT)}px`;
    // let test = document.getElementById('test')
    // test.innerText = w.toString()
}

export default fitInParent