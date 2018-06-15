import React from 'react';
import axios from 'axios';

import Datamap from './datamap.jsx';
export default class Map extends React.Component {
  constructor() {
		super();
		this.state = {
			states: [],
			nationalTrends: [],
			selectValue: 'Top National Trends',
      colors: {},
			textbox: '',
			searched: '',
			scope: "usa",
		}
    this.handleDropdown = this.handleDropdown.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleTextboxChange = this.handleTextboxChange.bind(this);
	}
	
  componentWillMount() {
		this.getNationalTrends();
		this.useAmericanStates();
	}

	
	changeScope(scope) {
		this.setState({
			scope: scope
		});
		if (scope === "world") {
			this.setState({
				states: [],
			})
		} else {
			this.useAmericanStates();
		}
	}
		
getNationalTrends() {
			axios.get('/nationaltrends')
			.then((response) => {
				this.setState({
					nationalTrends: response.data
				});
			}).catch((err) => {
				return console.error(err);
			})
		}
		
		postStatePercentages(searchTerm) {
			console.log('Keyword:', searchTerm)
			if (searchTerm !== '') {
				axios.post('/statepercentages', {word: searchTerm})
				.then((response) => {
					this.setPercentages(response.data);
				})
			}
		}
		
		setPercentages(data) {
			let statesCopy = Object.assign({}, this.state.states);
			//Clear percentages
			for (let state in statesCopy) {
				statesCopy[state].fillKey = 0;
				statesCopy[state].text = [];
			}
			
			//Populate percentages
			for (let state in statesCopy) {
				if (data[state]) {
					statesCopy[state].fillKey = data[state].fillKey;
					statesCopy[state].text = data[state].text;
				}
			}
			this.setState({
				states: statesCopy,
			});
			this.setFills();
			setTimeout(() => console.log(this.state.states), 1000);
		}
		
		setTrends(data) {
			let statesCopy = Object.assign({}, this.state.states);
			for (let state in statesCopy) {
				statesCopy[state].trends = data[state].trends;
			}
			this.setState({states: statesCopy});
		}
		
		setFills() {
			//Find lowest and highest percentages to make color gradient
			let lowest = 100, highest = 0, sumPercentage = 0, count = 0, mean, colors;
			let colorObj = {};
			for (let state in this.state.states) {
				count++;
				sumPercentage += this.state.states[state].fillKey;
				this.state.states[state].fillKey < lowest ? lowest = this.state.states[state].fillKey : null;
				this.state.states[state].fillKey > highest ? highest = this.state.states[state].fillKey : null;
			}
			
			mean = sumPercentage / count;
			//Create color gradient based on lowest and highest percentages found
			if (lowest < highest) {
				colors = d3.scale.linear().domain([lowest, mean, highest]).range(['#fff0f0', '#ff4d4d', '#990000']);
			} else {
				colors = d3.scale.linear().domain([lowest, highest]).range(['#ABDDA4', '#ABDDA4']);
			}
			for (let state in this.state.states) {
				colorObj[this.state.states[state].fillKey] = colors(this.state.states[state].fillKey)	
			}
			this.setState({
				colors: colorObj
			})
			
		}
		
		handleDropdown(event) {
			this.postStatePercentages(event.target.value);
			this.setState({
				textbox: '',
				searched: event.target.value
			})
			event.preventDefault();
		}
		
		handleTextboxChange(event) {
			this.setState({
				textbox: event.target.value
			});
		}
		
		handleSubmit(event) {
			this.postStatePercentages(this.state.textbox);
			this.setState({
				textbox: '',
				searched: this.state.textbox
			});
			event.preventDefault();
		}
		
		makeUnderline(input, wordsToUnderline) {
			return input.replace(new RegExp('(\\b)(' + wordsToUnderline.join('|') + ')(\\b)','ig'), '$1<u>$2</u>$3');
		}
		
		useAmericanStates() {
			this.setState({
				states: {
						AZ: {}, CO: {}, DE: {}, FL: {}, GA: {}, HI: {}, ID: {}, IL: {}, IN: {}, IA: {}, 
						KS: {}, KY: {}, LA: {}, MD: {}, ME: {}, MA: {}, MN: {}, MI: {}, MS: {}, MO: {},
						MT: {}, NC: {}, NE: {}, NV: {}, NH: {}, NJ: {}, NY: {}, ND: {}, NM: {}, OH: {},
						OK: {}, OR: {}, PA: {}, RI: {}, SC: {}, SD: {}, TN: {}, TX: {}, UT: {}, WI: {},
						VA: {}, VT: {}, WA: {}, WV: {}, WY: {}, CA: {}, CT: {}, AK: {}, AR: {}, AL: {} 
				}
			});
		}
		render() {
			return (
				<div>
				<div>
          <form onSubmit={this.handleSubmit}>
              <input type="text" placeholder='Search' autoFocus='autofocus' value={this.state.textbox} onChange={this.handleTextboxChange}/>
          <input type="submit" value="Populate Map" />
        </form>
				<br></br>
				<span className={this.state.scope === "usa"
          ? 'nav-selected'
          : 'nav-unselected'}
          onClick={() => this.changeScope("usa")}>
				USA </span>
				<span className={this.state.scope === "world"
          ? 'nav-selected'
          : 'nav-unselected'}
          onClick={() => this.changeScope("world")}>
				World </span>
				<br></br>
        <br></br>
					<select defaultValue={this.state.selectValue} onChange={this.handleDropdown}>
            <option defaultValue hidden>Top National Trends</option>
						{this.state.nationalTrends.map((trend, i) => (
							<option value={trend.trend} key={i+1}>{(i+1) + '. ' + trend.trend}</option>	
						))}
					</select>
					<br></br>
					<br></br>
					<b>{this.state.searched}</b>
				</div>
				<div className='map'>
					<Datamap
						scope={this.state.scope}
						height='100%'
						width='100%'
						position='absolute'
						geographyConfig={{
							highlightBorderColor: 'lightBlue',
							highlightFillColor: 'yellow',
							popupTemplate: (geography, data) => {
								return `<div class='hoverinfo'><b><i>${data.fillKey}%</i><br>${geography.properties.name} Tweets</b> ${data.text.map((tweet, i) => {
									let underlineTweet = this.makeUnderline(tweet, [this.state.searched, this.state.searched + 's', this.state.searched + 'es']);
									return '<br><br>' + (i+1) + '. ' + underlineTweet;
								})}
								</div>`
							},
							highlightBorderWidth: 3
						}}
						fills={this.state.colors}
						data={this.state.states}
					labels />
				</div>
			</div>
			)
		}
}