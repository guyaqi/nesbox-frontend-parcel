const SCREEN_WIDTH: number = 256;
const SCREEN_HEIGHT: number = 240;

function fitInParent(canvas: HTMLCanvasElement): void {
    const parent = <HTMLElement>canvas.parentNode
    const w = parent.offsetWidth - 40;
    canvas.style.width = `${Math.round(w)}px`;
    canvas.style.height = `${Math.round(w / SCREEN_WIDTH * SCREEN_HEIGHT)}px`;
}

export default fitInParent