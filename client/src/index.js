// client/src/index.js
import React from 'react';
import ReactDOM from 'react-dom';
import App from './App'; // This line requires a default export from App.js
import 'bootstrap/dist/css/bootstrap.min.css';

// Optional: Log to verify REACT_APP_API_URL is picked up
console.log('----------------------------------------------------------');
console.log('[Client Startup - index.js] Environment Variables:');
console.log(`[Client Startup - index.js] process.env.REACT_APP_API_URL: ${process.env.REACT_APP_API_URL}`);
console.log(`[Client Startup - index.js] process.env.NODE_ENV: ${process.env.NODE_ENV}`);
console.log('----------------------------------------------------------');

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);
