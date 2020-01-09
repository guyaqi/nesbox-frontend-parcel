const SCREEN_WIDTH = 256;
const SCREEN_HEIGHT = 240;
const FRAMEBUFFER_SIZE = SCREEN_WIDTH*SCREEN_HEIGHT;

const AUDIO_BUFFERING = 512;
const SAMPLE_COUNT = 4*1024;
const SAMPLE_MASK = SAMPLE_COUNT - 1;

let canvas_ctx, image;
let framebuffer_u8, framebuffer_u32;

let audio_samples_L = new Float32Array(SAMPLE_COUNT);
let audio_samples_R = new Float32Array(SAMPLE_COUNT);
let audio_write_cursor = 0, audio_read_cursor = 0;

export let nes = null
export let currentUrl = null

// @gyq creating
export const defaultController = new Map([
	[87, {'player': 1, 'button': jsnes.Controller.BUTTON_UP}],
	[83, {'player': 1, 'button': jsnes.Controller.BUTTON_DOWN}],
	[65, {'player': 1, 'button': jsnes.Controller.BUTTON_LEFT}],
	[68, {'player': 1, 'button': jsnes.Controller.BUTTON_RIGHT}],
	[74, {'player': 1, 'button': jsnes.Controller.BUTTON_B}],
	[75, {'player': 1, 'button': jsnes.Controller.BUTTON_A}],
	[49, {'player': 1, 'button': jsnes.Controller.BUTTON_SELECT}],
	[50, {'player': 1, 'button': jsnes.Controller.BUTTON_START}],

	[38, {'player': 2, 'button': jsnes.Controller.BUTTON_UP}],
	[40, {'player': 2, 'button': jsnes.Controller.BUTTON_DOWN}],
	[37, {'player': 2, 'button': jsnes.Controller.BUTTON_LEFT}],
	[39, {'player': 2, 'button': jsnes.Controller.BUTTON_RIGHT}],
	[97, {'player': 2, 'button': jsnes.Controller.BUTTON_B}],
	[98, {'player': 2, 'button': jsnes.Controller.BUTTON_A}],
	[106, {'player': 2, 'button': jsnes.Controller.BUTTON_SELECT}],
	[109, {'player': 2, 'button': jsnes.Controller.BUTTON_START}]
])

// @gyq creating
export let controllerMap = new Map(defaultController)

// @gyq refactoring
// callback for write buffer
function frameCb(framebuffer) {
	for(let i = 0; i < FRAMEBUFFER_SIZE; i++) {
		framebuffer_u32[i] = 0xFF000000 | framebuffer[i];
	}
}

// @gyq refactoring
// callback for audio play
function sampleCb(l, r){
	audio_samples_L[audio_write_cursor] = l;
	audio_samples_R[audio_write_cursor] = r;
	audio_write_cursor = (audio_write_cursor + 1) & SAMPLE_MASK;
}

function onAnimationFrame(){
	window.requestAnimationFrame(onAnimationFrame);
	
	image.data.set(framebuffer_u8);
	canvas_ctx.putImageData(image, 0, 0);
	nes.frame();
}

function audio_remain(){
	return (audio_write_cursor - audio_read_cursor) & SAMPLE_MASK;
}

function audio_callback(event){
	var dst = event.outputBuffer;
	var len = dst.length;
	
	// Attempt to avoid buffer underruns.
	if(audio_remain() < AUDIO_BUFFERING) nes.frame();
	
	var dst_l = dst.getChannelData(0);
	var dst_r = dst.getChannelData(1);
	for(var i = 0; i < len; i++){
		var src_idx = (audio_read_cursor + i) & SAMPLE_MASK;
		dst_l[i] = audio_samples_L[src_idx];
		dst_r[i] = audio_samples_R[src_idx];
	}
	
	audio_read_cursor = (audio_read_cursor + len) & SAMPLE_MASK;
}

function keyboard(callback, event){
	for (const [key, value] of controllerMap) {
		if(event.keyCode==key) {
			callback(value.player, value.button)
		}
	}
}

function nes_init(canvas_id){
	if(nes!=null) return;
	
	nes = new jsnes.NES({
		onFrame: frameCb,
		onAudioSample: sampleCb
	});

	var canvas = document.getElementById(canvas_id);
	canvas_ctx = canvas.getContext("2d");
	image = canvas_ctx.getImageData(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
	
	canvas_ctx.fillStyle = "black";
	canvas_ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
	
	// Allocate framebuffer array.
	var buffer = new ArrayBuffer(image.data.length);
	framebuffer_u8 = new Uint8ClampedArray(buffer);
	framebuffer_u32 = new Uint32Array(buffer);
	
	// Setup audio.
	var audio_ctx = new window.AudioContext();
	var script_processor = audio_ctx.createScriptProcessor(AUDIO_BUFFERING, 0, 2);
	script_processor.onaudioprocess = audio_callback;
	script_processor.connect(audio_ctx.destination);
}
export function changeCanvas(canvasId) {
	let canvas = document.getElementById(canvasId);
	canvas_ctx = canvas.getContext("2d");
	image = canvas_ctx.getImageData(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
	
	canvas_ctx.fillStyle = "black";
	canvas_ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
}

function nes_boot(rom_data){
	nes.loadROM(rom_data);
	window.requestAnimationFrame(onAnimationFrame);
}

// @gyq: unused
// function nes_load_data(canvas_id, rom_data){
// 	nes_init(canvas_id);
// 	nes_boot(rom_data);
// }

export function nes_load_url(canvas_id, path){
	nes_init(canvas_id);
	
	var req = new XMLHttpRequest();
	req.open("GET", path);
	req.overrideMimeType("text/plain; charset=x-user-defined");
	req.onerror = () => console.log(`Error loading ${path}: ${req.statusText}`);
	
	req.onload = function() {
		if (this.status === 200) {
			currentUrl = path
			if(nes.romData!=null) {
				nes.loadROM(this.responseText);
			}else {
				nes_boot(this.responseText);
			}
		} else if (this.status === 0) {
			// Aborted, so ignore error
		} else {
			req.onerror();
		}
	};
	
	req.send();
}

document.addEventListener('keydown', (event) => {keyboard(nes.buttonDown, event)});
document.addEventListener('keyup', (event) => {keyboard(nes.buttonUp, event)});
