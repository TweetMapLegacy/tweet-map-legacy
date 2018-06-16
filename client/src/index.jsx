import React from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';
import CssBaseline from '@material-ui/core/CssBaseline';

import Search from './components/Search.jsx';
import Tables from './components/tables.jsx'
import Map from './components/map.jsx'
import ReactLoading from 'react-loading';

//
// ─── MATERIAL UI THEMING ────────────────────────────────────────────────────────
//
const theme = createMuiTheme({
  palette: {
    type: 'dark',
    primary: {
      main: '#212121',
      light: '#ffffff',
      dark: '#bcbcbc'
    },
    secondary: {
      main: '#eeeeee',
      light: '#8e8e8e',
      dark: '#373737'
    },
    contrastThreshold: 3,
    tonalOffset: 0.2,
  },
});

const styles = theme => ({
  root: {
    flexGrow: 1,
  },
  paper: {
    padding: theme.spacing.unit * 2,
    textAlign: 'center',
    color: theme.palette.text.secondary,
  },
});


//
// ─── APP ────────────────────────────────────────────────────────────────────────
//
class App extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      view: 'map',
      currArtistName: null,
      currAlbumUrls: [],
      currAttributes: null,

      welcome: true,
      loading: false,

      loggedIn: false,
      loggedInUsername: null,
      loginError: false,
    };
  }

  changeView(option) {
    this.setState({
      view: option
    });
  }

  componentDidMount() {
    console.log('PAGE RELOADED');
    axios.get('/checklogin')
      .then(res => {
        console.log(res);
        if (res.data.user) {
          console.log('Logged in as:', res.data.user.username);
          this.setState({
            loggedIn: true,
            loggedInUsername: res.data.user.username,
            loginError: false,
          });
        }
      });
  }


  //
  // ─── USER AUTH ──────────────────────────────────────────────────────────────────
  //
  subscribe(email, username, password) {
    console.log(`Subscribe with ${username} and ${password}`);
    axios.get('/subscribe', {
      params: {
        email,
        username,
        password
      }
    })
      .then(
        this.setState({
          loggedIn: true,
          loggedInUsername: username
        }))
      .catch(console.log);
  }

  login(username, password) {
    console.log(`Login with ${username} and ${password}`);
    axios.post('/login', {
      username,
      password
    })
      .then(res => {
        console.log('DATA', res);
        if (res.config.data) {
          console.log('Logged in as:', JSON.parse(res.config.data).username);
          this.setState({
            loggedIn: true,
            loggedInUsername: JSON.parse(res.config.data).username
          });
        }
      })
      .catch(
        (error => {
          console.log(this);
          this.setState({
            loginError: true
          });
        })()
      );
  }

  logout() {
    axios.get('/logout')
      .then(res => {
        console.log('Logging out');
        this.setState({
          loggedIn: false,
          loginError: false
        });
      })
  }




  render() {
    return (
      <MuiThemeProvider theme={theme}>
        <div className='App'>
          <Search
            // keyUp={this.search.bind(this)}
            // login={this.login.bind(this)}
            // logout={this.logout.bind(this)}
            // subscribe={this.subscribe.bind(this)}
            loggedIn={this.state.loggedIn}
            username={this.state.loggedInUsername}
            error={this.state.loginError} />
          <span className={this.state.view === 'map'
            ? 'nav-selected'
            : 'nav-unselected'}
            onClick={() => this.changeView('map')}>
            Map
        </span>
          <span className={this.state.view === 'tables'
            ? 'nav-selected'
            : 'nav-unselected'}
            onClick={() => this.changeView('tables')}>
            Tables
          <br></br>
            <br></br>
          </span>

          {this.state.view === 'map'
            ? <Map />
            : <Tables />}
        </div>
      </MuiThemeProvider>
    );
  }
}

ReactDOM.render(<App />, document.getElementById('app'));
