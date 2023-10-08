import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SimpleBottomNavigation from './components/SimpleBottomNavigation/SimpleBottomNavigation';
import {AuthProvider} from './context/AuthProvider'

ReactDOM.render(
  // <React.StrictMode>
    <Router>
      <AuthProvider>
        <Routes>
          <Route path='/*' element={<App />}></Route>
        </Routes>
        <SimpleBottomNavigation/>
      </AuthProvider>
    </Router>,
  // </React.StrictMode>,
  document.getElementById('root')
);
