import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { ThemeProvider } from './context/ThemeContext';
import { TrackingProvider } from './context/TrackingContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <TrackingProvider>
        <App />
      </TrackingProvider>
    </ThemeProvider>
  </React.StrictMode>
);
