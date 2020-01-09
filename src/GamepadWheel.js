import React from 'react'

import eCore from './Emulator'

const blockStyle = {
    width: 120,
    height: 120,
    borderRadius: 120,
    border: "10px solid lightgrey",
    background: 'grey',
}

function dot(x, y) {
    let dot = document.createElement('div')
    dot.style.width = '1px'
    dot.style.height = '1px'
    dot.style.background = 'green'

    dot.style.position = 'absolute'
    dot.style.zIndex = '10000000'
    dot.style.left = x + "px"
    dot.style.top = y + "px"

    document.body.appendChild(dot)
}

export default class GamepadWheel extends React.Component {

    nowDir = 0
    lastDir = 0

    centerX = 0
    centerY = 0

    constructor(props) {
        super(props)
        this.state = {
            dir: 0
        }
    }

    setDir = e => {
        let touches = e.changedTouches
        let last = touches[touches.length-1]
        
        if((last.clientY-this.centerY)*(last.clientY-this.centerY) + (last.clientX-this.centerX)*(last.clientX-this.centerX) > 180*180) return;
        
        let degree = Math.atan2(last.clientY-this.centerY, last.clientX-this.centerX)
        let d = 0
        /**
         *8  1  2    6  5  4  
         *7     3 -> 7     3      
         *6  5  4    8  1  2  
         */

        let part = Math.PI/8
        if(degree>part*3 &&degree<part*5) {
            d = 1
        } else if(degree>part*1 && degree<part*3) {
            d = 2
        } else if(degree>part*-1 && degree<part*1) {
            d = 3
        } else if(degree>part*-3 && degree<part*-1) {
            d = 4
        } else if(degree>part*-5 && degree<part*-3) {
            d = 5
        } else if(degree>part*-7 && degree<part*-5) {
            d = 6
        } else if(degree>part*7 || degree<part*-7) {
            d = 7
        } else if(degree>part*5 && degree<part*7) {
            d = 8
        }

        this.setState({
            dir: d
        })
        this.nowDir = d

        if(this.nowDir != this.lastDir) {
            switch(this.nowDir) {
                case 1:
                eCore.buttonDown(1, 'dn')
                eCore.buttonUp(1, 'up')
                eCore.buttonUp(1, 'lt')
                eCore.buttonUp(1, 'rt')
                break
                case 2:
                eCore.buttonDown(1, 'dn')
                eCore.buttonDown(1, 'rt')
                eCore.buttonUp(1, 'up')
                eCore.buttonUp(1, 'lt')
                break
                case 3:
                eCore.buttonDown(1, 'rt')
                eCore.buttonUp(1, 'up')
                eCore.buttonUp(1, 'lt')
                eCore.buttonUp(1, 'dn')
                break
                case 4:
                eCore.buttonDown(1, 'up')
                eCore.buttonDown(1, 'rt')
                eCore.buttonUp(1, 'dn')
                eCore.buttonUp(1, 'lt')
                break
                case 5:
                eCore.buttonDown(1, 'up')
                eCore.buttonUp(1, 'dn')
                eCore.buttonUp(1, 'lt')
                eCore.buttonUp(1, 'rt')
                break
                case 6:
                eCore.buttonDown(1, 'up')
                eCore.buttonDown(1, 'lt')
                eCore.buttonUp(1, 'dn')
                eCore.buttonUp(1, 'rt')
                break
                case 7:
                eCore.buttonDown(1, 'lt')
                eCore.buttonUp(1, 'up')
                eCore.buttonUp(1, 'dn')
                eCore.buttonUp(1, 'rt')
                break
                case 8:
                eCore.buttonDown(1, 'dn')
                eCore.buttonDown(1, 'lt')
                eCore.buttonUp(1, 'up')
                eCore.buttonUp(1, 'rt')
                break
            }
            this.lastDir = this.nowDir
        }
    }

    clearDir = () => {

        eCore.buttonUp(1, 'up')
        eCore.buttonUp(1, 'dn')
        eCore.buttonUp(1, 'lt')
        eCore.buttonUp(1, 'rt')

        this.setState({
            dir: 0
        })
        this.nowDir = 0
        this.lastDir = 0
    }

    buttonDown = n => {
        switch(n) {
            case 1:

        }
    }

    measure = () => {
        let rect = document.querySelector('#wheel').getBoundingClientRect()
        this.centerX = rect.x + blockStyle.width/2
        this.centerY = rect.y + blockStyle.height/2
    }

    render() {
        return (
            <div id='wheel' style={blockStyle} onTouchStart={this.measure} onTouchMove={this.setDir} onTouchEnd={this.clearDir}>
                {this.state.out}
            </div>
        )
    }
}