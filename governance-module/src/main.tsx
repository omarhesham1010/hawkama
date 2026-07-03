import { createRoot } from 'react-dom/client';
import App from './App';
import { NarrationProvider } from './components/audio/NarrationContext';
import './styles/index.css';

// NOTE: StrictMode intentionally omitted — its dev double-invocation of effects
// caused the narration to start twice (a stutter at the start of the voice).
createRoot(document.getElementById('root')!).render(
  <NarrationProvider>
    <App />
  </NarrationProvider>,
);
