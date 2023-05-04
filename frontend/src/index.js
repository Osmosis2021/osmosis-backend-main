import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import { BrowserRouter as Router, Link } from 'react-router-dom';
import Bubbles from './components/Bubbles/Bubbles';
import SimpleBottomNavigation from './components/SimpleBottomNavigation/SimpleBottomNavigation';

ReactDOM.render(
  <React.StrictMode>
    <Router>
      {/* <Bubbles /> */}
      <App />
      <SimpleBottomNavigation/>
    </Router>
  </React.StrictMode>,
  document.getElementById('root')
);
