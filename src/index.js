import fitInParent from './screen.ts'
import keyCodes from './keyCode.ts'
import eCore,{SCREEN_HEIGHT, SCREEN_WIDTH} from './Emulator'

import CardList from './Card'
import GamepadWheel from './GamepadWheel'

import React from 'react'
import ReactDOM from 'react-dom'

window.addEventListener('load', function() {
    fitInParent(document.getElementById('game'))

    ReactDOM.render(
        <CardList />,
        document.getElementById('gameList')
    )

    ReactDOM.render(
        <GamepadWheel />,
        document.getElementById('gamepadWheel')
    )

    /** fix styles */
    let barTogs = document.getElementsByClassName('navbar-toggler')
    if(barTogs.length!=0) {
        barTogs[0].style.borderColor = "white"
    }

})

document.querySelector('#fullScreenModal').addEventListener('touchmove', function (event) {
    event.preventDefault();
});

window.addEventListener('resize', function() {
    fitInParent(document.getElementById('game'))
})

document.getElementById('action-close').addEventListener('click', function() {
    console.log('close')
})

$("#action-upload").click(function() {
    $("#openfile").trigger("click");
})

$("#openfile").change(function() {
    let file = $("#openfile").get(0).files[0];
    let reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = function () {
        eCore.nes_load_url('game', reader.result)
    }
})

$("#action-reset").click(function() {
    eCore.nes_load_url('game', eCore.currentUrl)
})

$("#btn_resetkey").click(function() {
    let temp = eCore.controllerMap
    temp = new Map(eCore.defaultController)
    $(".switch-key").each(function(){
        if($(this).data('player')==1) {
            switch($(this).data('key')) {
            case 0:
                $(this).text('k');break
            case 1:
                $(this).text('j');break
            case 2:
                $(this).text('1');break
            case 3:
                $(this).text('2');break
            case 4:
                $(this).text('w');break
            case 5:
                $(this).text('s');break
            case 6:
                $(this).text('a');break
            case 7:
                $(this).text('d');break
            default:
                break;
            }
        }else if($(this).data('player')==2) {
            switch($(this).data('key')) {
            case 0:
                $(this).text('numpad 2');break
            case 1:
                $(this).text('numpad 1');break
            case 2:
                $(this).text('multiply');break
            case 3:
                $(this).text('subtract');break
            case 4:
                $(this).text('up arrow');break
            case 5:
                $(this).text('down arrow');break
            case 6:
                $(this).text('left arrow');break
            case 7:
                $(this).text('right arrow');break
            default:
                break;
            }
        }
    })
})

$(".switch-key").click(function() {
    $(this).addClass('btn-outline-primary')
    $(this).text('...')
    $(this).one('keydown', function(event) {
        let newKey = event.which
        let oldKey = null
        for (const [key, value] of eCore.controllerMap) {
            if($(this).data('player')==value.player && $(this).data('key')==value.button) {
                oldKey = key
                break;
            }
        }
        eCore.controllerMap.set(parseInt(newKey), eCore.controllerMap.get(oldKey))
        eCore.controllerMap.delete(parseInt(oldKey))
        
        $(this).text(keyCodes[event.which])
        $(this).removeClass('btn-outline-primary')
    })
})

$("#action-fullscreen").click(function() {

    const ratio = 1.0 * SCREEN_WIDTH / SCREEN_HEIGHT
    let fullscreenGame = document.getElementById('fullscreenGame')
    const windowRatio = 1.0 * window.innerWidth / window.innerHeight
    if(windowRatio > ratio) {
        // landscape
        fullscreenGame.style.height = `${window.innerHeight}px`
        fullscreenGame.style.width = `${window.innerHeight * ratio}px`
    } else {
        fullscreenGame.style.width = `${window.innerWidth}px`
        fullscreenGame.style.height = `${window.innerWidth / ratio}px`
    }
    eCore.changeCanvas('fullscreenGame')
    window.addEventListener('keydown', function(e) {
        if(e.key === 'Escape') {
            eCore.changeCanvas('game')
        }
    })
    window.addEventListener('resize', function() {
        const ratio = 1.0 * SCREEN_WIDTH / SCREEN_HEIGHT
        let fullscreenGame = document.getElementById('fullscreenGame')
        const windowRatio = 1.0 * window.innerWidth / window.innerHeight
        if(windowRatio > ratio) {
            // landscape
            fullscreenGame.style.height = `${window.innerHeight}px`
            fullscreenGame.style.width = `${window.innerHeight * ratio}px`
        } else {
            fullscreenGame.style.width = `${window.innerWidth}px`
            fullscreenGame.style.height = `${window.innerWidth / ratio}px`
        }
    })
    
    let mask = document.getElementById('fullscreenMask')
    mask.style.width = `${window.innerWidth * 5}px`
    mask.style.height = `${window.innerHeight * 5}px`
})

$("#action-quitFullscreen").click(function() {
    eCore.changeCanvas('game')
})

$(".gamepad").on('touchstart', function() {
    eCore.nes.buttonDown(1, $(this).data('key'))
})

$(".gamepad").on('touchend', function() {
    eCore.nes.buttonUp(1, $(this).data('key'))
})

$("#action-togglePad").click(function() {
    $("#gamepadLayer").toggle()
})

function shotMode() {
    let game = document.getElementById('game')
    game.style.width = null
    game.style.height = null

    console.log(game.toDataURL("image/png"))
}
