import React from 'react'
import eCore from './Emulator.ts'

const boxShadow = {
    boxShadow: '0 0 7px #888888'
}

const noUnderline = {
    textDecoration: 'none',
    color: '#000'
}

export class Card extends React.Component {

    constructor(props) {
        super(props)
        this.state = {
            desc: "No description."
        }
    }

    componentDidMount() {
        const self = this
        fetch(self.props.desc)
            .then(res => res.text())
            .then(res => {
                self.setState({
                    desc: res
                })
            })
    }

    render() {
        return (
            <a href='#' className='action-game' style={noUnderline} data-url = {this.props.game} onClick={()=>{this.props.action()}}>
                <div className='card' style={boxShadow}>
                    <img src={this.props.shot} className='card-img-top'></img>
                    <div className='card-body'>
                        <p className='card-text'>
                            <b>{this.state.desc}</b>
                        </p>
                    </div>
                </div>
            </a>
        )
    }
}

export default class CardList extends React.Component {

    constructor(props) {
        super(props)
        this.state = {
            allCard:[]
        }
    }

    componentDidMount() {
        let self = this
        fetch('/api/nesbox-games')
            .then(res => res.json())
            .then(res => {
                let gamelist = res
                let mount = document.getElementById('list-games')
                let alist = []
                for(let game of gamelist.list) {
                    let gamePath = game
                    gamePath = '/nesbox-games/' + gamePath
                    // console.warn(gamePath)
                    let col = (
                        <div className='col-lg-3 col-md-4 col-sm-6 mb-4 px-4' key={alist.length}>
                            <Card
                                shot={gamePath + '/' + "shot.png"}
                                desc={gamePath + '/' + "desc.txt"}
                                game={gamePath + '/' + "game.nes"}
                                action = {()=>{
                                    eCore.nes_load_url('game', gamePath + '/' + "game.nes")
                                }}
                            />
                        </div>
                    )
                    alist.push(col)
                }
                self.setState({allCard: alist})
            })
    }

    render() {
        return (
            <div className="container">
                <div className="row">
                    <div className="col">
                        <h1>Games</h1>
                        <hr />
                    </div>
                </div>
                <div id="list-games" className="row">
                    {this.state.allCard}
                </div>
            </div>
        )
    }
}