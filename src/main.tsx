import { createRoot } from 'react-dom/client';
import App from './App';
import { NarrationProvider } from './components/audio/NarrationContext';
import './styles/index.css';

function hideInitialLoader() {
  window.requestAnimationFrame(() => {
    const loader = document.getElementById('app-loader');
    if (!loader) return;
    loader.classList.add('is-hidden');
    window.setTimeout(() => loader.remove(), 450);
  });
}

// StrictMode is intentionally omitted because its dev double effects caused
// narration to start twice and stutter at the beginning.
const root = createRoot(document.getElementById('root')!);
root.render(
  <NarrationProvider>
    <App />
  </NarrationProvider>,
);
hideInitialLoader();
