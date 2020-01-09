// import jsnes from '@bfirsh/jsnes'

export const SCREEN_WIDTH = 256;
export const SCREEN_HEIGHT = 240;
const FRAMEBUFFER_SIZE = SCREEN_WIDTH*SCREEN_HEIGHT;

const AUDIO_BUFFERING = 512;
const SAMPLE_COUNT = 4*1024;
const SAMPLE_MASK = SAMPLE_COUNT - 1;

export class EmulatorCore {

    gameCanvas = null
    canvas_ctx = null
    image = null

    pending = false
    framebuffer_u8 = null
    framebuffer_u32 = null
    
    audio_samples_L = new Float32Array(SAMPLE_COUNT)
    audio_samples_R = new Float32Array(SAMPLE_COUNT)
    audio_write_cursor = 0
    audio_read_cursor = 0

    nes = null
    currentUrl = ''

    defaultController = new Map([
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
    controllerMap = new Map(this.defaultController)

    constructor() {

    }

    frameCb = (framebuffer) => {
        for(let i = 0; i < FRAMEBUFFER_SIZE; i++) {
            this.framebuffer_u32[i] = 0xFF000000 | framebuffer[i];
        }
    }

    sampleCb = (l, r) => {
        this.audio_samples_L[this.audio_write_cursor] = l;
        this.audio_samples_R[this.audio_write_cursor] = r;
        this.audio_write_cursor = (this.audio_write_cursor + 1) & SAMPLE_MASK;
    }

    onAnimationFrame = () => {
        window.requestAnimationFrame(this.onAnimationFrame);
        if(this.pending) return;
        this.image.data.set(this.framebuffer_u8);
        this.canvas_ctx.putImageData(this.image, 0, 0);
        this.nes.frame();
    }

    audio_remain = () => {
        return (this.audio_write_cursor - this.audio_read_cursor) & SAMPLE_MASK;
    }

    audio_callback = event => {
        var dst = event.outputBuffer;
        var len = dst.length;
        
        // Attempt to avoid buffer underruns.
        if(this.audio_remain() < AUDIO_BUFFERING) this.nes.frame();
        
        var dst_l = dst.getChannelData(0);
        var dst_r = dst.getChannelData(1);
        for(var i = 0; i < len; i++){
            var src_idx = (this.audio_read_cursor + i) & SAMPLE_MASK;
            dst_l[i] = this.audio_samples_L[src_idx];
            dst_r[i] = this.audio_samples_R[src_idx];
        }
        
        this.audio_read_cursor = (this.audio_read_cursor + len) & SAMPLE_MASK;
    }

    keyboard = (callback, event) => {
        for (const [key, value] of this.controllerMap) {
            if(event.keyCode==key) {
                callback(value.player, value.button)
            }
        }
    }

    nes_init = (canvas_id) => {
        if(this.nes!=null) return;
        
        this.nes = new jsnes.NES({
            onFrame: this.frameCb,
            onAudioSample: this.sampleCb
        });

        document.addEventListener('keydown', (event) => {
            this.keyboard(this.nes.buttonDown, event)
        })
        document.addEventListener('keyup', (event) => {
            this.keyboard(this.nes.buttonUp, event)
        })
    
        let canvas = document.getElementById(canvas_id);
        this.canvas_ctx = canvas.getContext("2d");
        this.image = this.canvas_ctx.getImageData(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
        
        this.canvas_ctx.fillStyle = "black";
        this.canvas_ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
        
        // Allocate framebuffer array.
        let buffer = new ArrayBuffer(this.image.data.length);
        this.framebuffer_u8 = new Uint8ClampedArray(buffer);
        this.framebuffer_u32 = new Uint32Array(buffer);
        
        // Setup audio.
        let audio_ctx = new window.AudioContext();
        let script_processor = audio_ctx.createScriptProcessor(AUDIO_BUFFERING, 0, 2);
        script_processor.onaudioprocess = this.audio_callback;
        script_processor.connect(audio_ctx.destination);
    }

    changeCanvas = (canvasId) => {
        this.gameCanvas = document.getElementById(canvasId);
        this.canvas_ctx = this.gameCanvas.getContext("2d");
        this.image = this.canvas_ctx.getImageData(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
        
        this.canvas_ctx.fillStyle = "black";
        this.canvas_ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    }

    nes_boot = (rom_data) => {
        this.nes.loadROM(rom_data);
        window.requestAnimationFrame(this.onAnimationFrame);
    }

    nes_load_url = (canvas_id, path) => {
        if(canvas_id == '') return;
        if(path == '') return;
        this.nes_init(canvas_id);
        this.pending = true
        let loadingImg = new Image()
        let self = this
        loadingImg.onload = function() {
            self.canvas_ctx.drawImage(loadingImg, 0, 0)
        }
        loadingImg.src = '/nesbox/res/images/loading.png'
        
        
        // console.log('waiting...')
        // let start = (new Date()).getTime();
        // while ((new Date()).getTime() - start < 2000) {
        //     continue;
        // }
        // console.log('complete!')

        let req = new XMLHttpRequest();
        req.open("GET", path);
        req.overrideMimeType("text/plain; charset=x-user-defined");
        req.onerror = () => console.log(`Error loading ${path}: ${req.statusText}`);
        
        req.onload = function() {
            if (this.status === 200) {
                self.currentUrl = path
                self.pending = false
                if(self.nes.romData!=null) {
                    self.nes.loadROM(this.responseText);
                }else {
                    self.nes_boot(this.responseText);
                }
            } else if (this.status === 0) {
                // Aborted, so ignore error
            } else {
                req.onerror();
            }
        };
        
        req.send();
    }

    buttonDown = (player, key) => {
        switch(key) {
            case 'a':
            this.nes.buttonDown(player, 0)
            break
            case 'b':
            this.nes.buttonDown(player, 1)
            break
            case 'se':
            this.nes.buttonDown(player, 2)
            break
            case 'st':
            this.nes.buttonDown(player, 3)
            break
            case 'up':
            this.nes.buttonDown(player, 4)
            break
            case 'dn':
            this.nes.buttonDown(player, 5)
            break
            case 'lt':
            this.nes.buttonDown(player, 6)
            break
            case 'rt':
            this.nes.buttonDown(player, 7)
            break
            default:
            break
        }
        // eCore.nes.buttonDown(1, $(this).data('key'))
    }

    buttonUp = (player, key) => {
        switch(key) {
            case 'a':
            this.nes.buttonUp(player, 0)
            break
            case 'b':
            this.nes.buttonUp(player, 1)
            break
            case 'se':
            this.nes.buttonUp(player, 2)
            break
            case 'st':
            this.nes.buttonUp(player, 3)
            break
            case 'up':
            this.nes.buttonUp(player, 4)
            break
            case 'dn':
            this.nes.buttonUp(player, 5)
            break
            case 'lt':
            this.nes.buttonUp(player, 6)
            break
            case 'rt':
            this.nes.buttonUp(player, 7)
            break
            default:
            break
        }
        // eCore.nes.buttonDown(1, $(this).data('key'))
    }
}

let eCore = new EmulatorCore()
export default eCore
