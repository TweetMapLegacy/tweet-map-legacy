import React from 'react';

import axios from 'axios';

export default function Account(props) {
  const accountStyle = {
    justifyContent: 'flex-end',
    marginTop: '50px'
  };
  return (
    <div style={accountStyle}>
      {props.loggedIn ? (
        <div>
           <h2>Search History</h2>
          {props.history.map(item => <p>{item}</p>)}
        </div>
      ) : (
        <form action="/auth/twitter" method="GET">
          <button>Login</button>
        </form>
      )}
    </div>
  );
}
