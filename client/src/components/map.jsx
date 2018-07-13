import React from 'react';
import axios from 'axios';

import Datamap from './datamap.jsx';
import Bubblemap from './bubblemap.jsx';
import { country_codes } from './country-codes.js';
import ReactLoading from 'react-loading';

export default class Map extends React.Component {
  constructor() {
    super();
    this.state = {
      states: [],
	  nationalTrends: [],
	  globalTrends: [],
      selectValue: 'Top National Trends',
      colors: {},
      textbox: '',
      searched: '',
      scope: 'usa',
      isBubbles: false,
      fetchInProgress: false
    };
    this.handleDropdown = this.handleDropdown.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleSentimentSubmit = this.handleSentimentSubmit.bind(this);
    this.handleTextboxChange = this.handleTextboxChange.bind(this);
    this.toggleBubble = this.toggleBubble.bind(this);
  }
  componentWillMount() {
	this.getNationalTrends();
	this.getGlobalTrends();
    this.useAmericanStates();
  }

  changeScope(scope) {
    this.setState({
      scope: scope,
    });
    if (scope === 'world') {
      this.useCountries();
    } else {
      this.useAmericanStates();
    }
  }

  //
  // ─── GET TRENDS ─────────────────────────────────────────────────────────────────
  //
  getNationalTrends() {
    axios
      .get('/nationaltrends')
      .then((response) => {
        this.setState({
          nationalTrends: response.data,
        });
      })
      .catch((err) => {
        return console.error(err);
      });
  }

  getGlobalTrends() {
    axios
      .get('/globaltrends')
      .then((response) => {
        this.setState({
          globalTrends: response.data,
        });
      })
      .catch((err) => {
        return console.error(err);
      });
  }

  //
  // ─── GET TWEET DATA ─────────────────────────────────────────────────────────────
  //
  postStatePercentages(searchTerm) {
    console.log('Keyword:', searchTerm);
    this.state.fetchInProgress = true;
    if (searchTerm !== '') {
      axios.post('/statepercentages', { word: searchTerm }).then((response) => {
        this.state.fetchInProgress = false;
        this.setPercentages(response.data);
      });
    }
  }

  postCountryPercentages(searchTerm) {
    console.log('Keyword:', searchTerm);
    this.state.fetchInProgress = true;
    if (searchTerm !== '') {
      axios.post('/countrypercentages', { word: searchTerm }).then((response) => {
        this.state.fetchInProgress = false;
        this.setPercentages(response.data);
      });
    }
  }

  postStateSentiments(searchTerm) {
    console.log('Keyword:', searchTerm);
    if (searchTerm !== '') {
      this.state.fetchInProgress = true;
      axios.post('/statesentiments', { word: searchTerm }).then((response) => {
        this.state.fetchInProgress = false;
        this.setSentiments(response.data);
      });
    }
  }

  //
  // ─── MANIPULATE VIEW DATA ───────────────────────────────────────────────────────
  //
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
    this.setPercentageFills();
    setTimeout(() => console.log(this.state.states), 1000);
  }

  setSentiments(data) {
    let statesCopy = Object.assign({}, this.state.states);
    //Clear percentages
    for (let state in statesCopy) {
      statesCopy[state].fillKey = 0;
      statesCopy[state].text = [];
    }

    //Populate percentages
    for (let state in statesCopy) {
      if (data[state]) {
        console.log(data[state].fillKey);
        statesCopy[state].fillKey = data[state].fillKey;
      }
    }
    this.setState({
      states: statesCopy,
    });
    this.setSentimentFills();
    setTimeout(() => console.log(this.state.states), 1000);
  }

  setTrends(data) {
    let statesCopy = Object.assign({}, this.state.states);
    //Clear percentages
    for (let state in statesCopy) {
      statesCopy[state].fillKey = 0;
      statesCopy[state].text = [];
    }

    //Populate percentages
    for (let state in statesCopy) {
      if (data[state]) {
        console.log(data[state].fillKey);
        statesCopy[state].fillKey = data[state].fillKey;
      }
    }
    this.setState({
      states: statesCopy,
    });
    this.setSentimentFills();
    setTimeout(() => console.log(this.state.states), 1000);
  }

  setTrends(data) {
    let statesCopy = Object.assign({}, this.state.states);
    for (let state in statesCopy) {
      statesCopy[state].trends = data[state].trends;
    }
    this.setState({ states: statesCopy });
  }

  setPercentageFills() {
    //Find lowest and highest percentages to make color gradient
    let lowest = 100,
      highest = 0,
      sumPercentage = 0,
      count = 0,
      mean,
      colors;
    let colorObj = {};
    for (let state in this.state.states) {
      count++;
      sumPercentage += this.state.states[state].fillKey;
      this.state.states[state].fillKey < lowest
        ? (lowest = this.state.states[state].fillKey)
        : null;
      this.state.states[state].fillKey > highest
        ? (highest = this.state.states[state].fillKey)
        : null;
    }

    mean = sumPercentage / count;
    //Create color gradient based on lowest and highest percentages found
    if (lowest < highest) {
      colors = d3.scale
        .linear()
        .domain([lowest, mean, highest])
        .range(['#e6f2ff', '#80bfff', '#004d99']);
    } else {
      colors = d3.scale
        .linear()
        .domain([lowest, highest])
        .range(['#ABDDA4', '#ABDDA4']);
    }
    for (let state in this.state.states) {
      colorObj[this.state.states[state].fillKey] = colors(this.state.states[state].fillKey);
    }
    this.setState({
      colors: colorObj,
    });
  }

  setSentimentFills() {
    let colorObj = {};
    //Create static gradient based on positive and negative sentiments
    let colors = d3.scale
      .linear()
      .domain([-1, 0, 1])
      .range(['#d10000', '#dbdbdb', '#00bc03']);
    for (let state in this.state.states) {
      colorObj[this.state.states[state].fillKey] = colors(this.state.states[state].fillKey);
    }
    console.log('COLOROBJ', colorObj);
    this.setState({
      colors: colorObj,
    });
  }

  //
  // ─── HANDLE UI ELEMENTS ─────────────────────────────────────────────────────────
  //
  handleDropdown(event) {
    this.state.scope === 'usa'
      ? this.postStatePercentages(event.target.value)
      : this.postCountryPercentages(event.target.value);
    this.setState({
      textbox: '',
      searched: event.target.value,
    });
    event.preventDefault();
  }

  handleTextboxChange(event) {
    this.setState({
      textbox: event.target.value,
    });
  }

  handleSubmit(event) {
    if (this.props.loggedIn)
      axios.post('/postterm', { term: this.state.textbox }).then(console.log);
    this.state.scope === 'usa'
      ? this.postStatePercentages(this.state.textbox)
      : this.postCountryPercentages(this.state.textbox);
    this.setState({
      textbox: '',
      searched: this.state.textbox,
    });
    event.preventDefault();
  }

  handleSentimentSubmit(event) {
    let searchTerm = this.state.textbox.length ? this.state.textbox : this.state.searched;
    this.postStateSentiments(searchTerm);
    this.setState({
      textbox: '',
      searched: searchTerm,
    });
    event.preventDefault();
  }

  makeUnderline(input, wordsToUnderline) {
    return input.replace(
      new RegExp('(\\b)(' + wordsToUnderline.join('|') + ')(\\b)', 'ig'),
      '$1<u>$2</u>$3'
    );
  }

  toggleBubble(event) {
    if (event.target.value === 'By City') {
      this.setState({
        isBubbles: true,
      });
    } else if (event.target.value === 'By State' || event.target.value === 'By Country') {
      this.setState({
        isBubbles: false,
      });
      this.postStatePercentages(this.state.searched);
    }
  }

  useAmericanStates() {
    this.setState({
      states: {
        AZ: {},
        CO: {},
        DE: {},
        FL: {},
        GA: {},
        HI: {},
        ID: {},
        IL: {},
        IN: {},
        IA: {},
        KS: {},
        KY: {},
        LA: {},
        MD: {},
        ME: {},
        MA: {},
        MN: {},
        MI: {},
        MS: {},
        MO: {},
        MT: {},
        NC: {},
        NE: {},
        NV: {},
        NH: {},
        NJ: {},
        NY: {},
        ND: {},
        NM: {},
        OH: {},
        OK: {},
        OR: {},
        PA: {},
        RI: {},
        SC: {},
        SD: {},
        TN: {},
        TX: {},
        UT: {},
        WI: {},
        VA: {},
        VT: {},
        WA: {},
        WV: {},
        WY: {},
        CA: {},
        CT: {},
        AK: {},
        AR: {},
        AL: {},
      },
    });
  }

  useCountries() {
    this.setState({
      states: country_codes,
    });
  }
  //
  // ─── RENDER ─────────────────────────────────────────────────────────────────────
  //
  render() {
    let sentimentAnalysisButton =
      (this.state.scope === 'usa' && !this.state.isBubbles) ? (
        <button onClick={this.handleSentimentSubmit}>Sentiment Analysis</button>
      ) : (
        ''
      );
    return (
      <div className="main">
        <div>
          <form onSubmit={this.handleSubmit}>
            <input
              type="text"
              placeholder="Search"
              autoFocus="autofocus"
              value={this.state.textbox}
              onChange={this.handleTextboxChange}
            />
            <input type="submit" value="Populate Map" />
            {sentimentAnalysisButton}
          </form>
          <br />
          <span
            className={this.state.scope === 'usa' ? 'nav-selected' : 'nav-unselected'}
            onClick={() => this.changeScope('usa')}
          >
            USA{' '}
          </span>
          <span
            className={this.state.scope === 'world' ? 'nav-selected' : 'nav-unselected'}
            onClick={() => this.changeScope('world')}
          >
            World{' '}
          </span>
          <br />
          <br />
          {this.state.scope === "usa"
			?(<select defaultValue={this.state.selectValue} onChange={this.handleDropdown}>
				<option defaultValue hidden>Top National Trends</option>
				{this.state.nationalTrends.map((trend, i) => (
					<option value={trend.trend} key={i + 1}>{(i + 1) + '. ' + trend.trend}</option>
				))}
				</select>)
			:(<select defaultValue={this.state.selectValue} onChange={this.handleDropdown}>
				<option defaultValue hidden>Top Global Trends</option>
				{this.state.globalTrends.map((trend, i) => (
					<option value={trend.trend} key={i + 1}>{(i + 1) + '. ' + trend.trend}</option>
				))}
				</select>)}
          <select defaultValue={this.state.selectValue} onChange={this.toggleBubble}>
            <option>By {this.state.scope === 'usa' ? 'State' : 'Country'}</option>
            <option>By City</option>
          </select>
          <br />
          <br />
          <b>{this.state.searched}</b>
        </div>
        {this.state.fetchInProgress ? <ReactLoading type="bubbles" width="300px" className="center" color="#4e4e4e"/> :
        <div className="map">
          <Bubblemap
            height={this.state.isBubbles ? '100%' : '0%'}
            width={this.state.isBubbles ? '100%' : '0%'}
            scope={this.state.scope}
            position="absolute"
            geographyConfig={{
              highlightBorderColor: 'lightBlue',
              highlightFillColor: 'yellow',
            }}
            searched={this.state.searched}
            isBubbles={this.state.isBubbles}
            fetchInProgress={this.state.fetchInProgress}
          />
          <Datamap
            scope={this.state.scope}
            height={this.state.isBubbles ? '0%' : '100%'}
            width={this.state.isBubbles ? '0%' : '100%'}
            position="absolute"
            geographyConfig={{
              highlightBorderColor: 'lightBlue',
              highlightFillColor: 'yellow',
              popupTemplate: (geography, data) => {
                return `<div class='hoverinfo'><b><i>${data.fillKey}%</i><br>${
                  geography.properties.name
                } Tweets</b> ${data.text.map((tweet, i) => {
                  let underlineTweet = this.makeUnderline(tweet, [
                    this.state.searched,
                    this.state.searched + 's',
                    this.state.searched + 'es',
                  ]);
                  return '<br><br>' + (i + 1) + '. ' + underlineTweet;
                })}
              </div>`;
              },
              highlightBorderWidth: 3,
            }}
            fills={this.state.colors}
            data={this.state.states}
            isBubbles={this.state.isBubbles}
          />
        </div>
          }
      </div>
    );
  }
}
