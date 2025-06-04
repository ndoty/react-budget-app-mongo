// client/src/index.js
import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import 'bootstrap/dist/css/bootstrap.min.css';

// Log environment variables related to WebSockets to see what the application gets
console.log('[index.js] Environment Variables for WebSockets:');
console.log('[index.js] process.env.WDS_SOCKET_URL:', process.env.WDS_SOCKET_URL);
console.log('[index.js] process.env.WDS_SOCKET_HOST:', process.env.WDS_SOCKET_HOST);
console.log('[index.js] process.env.WDS_SOCKET_PATH:', process.env.WDS_SOCKET_PATH);
console.log('[index.js] process.env.WDS_SOCKET_PORT:', process.env.WDS_SOCKET_PORT);
console.log('[index.js] process.env.HTTPS:', process.env.HTTPS);


ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);
