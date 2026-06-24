import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import '@mantine/core/styles.css';
import '@mantine/carousel/styles.css';
import './index.css';
import App from './App';
import { store } from './store/store';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);
