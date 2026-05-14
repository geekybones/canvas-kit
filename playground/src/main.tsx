import { createRoot } from 'react-dom/client';
import { App } from '@/App';
import '@/styles/style.css';

createRoot(document.getElementById('root') as HTMLElement).render(
  <div className="app">
    <App />
  </div>,
);
