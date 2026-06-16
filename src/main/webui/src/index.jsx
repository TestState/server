import { render } from 'solid-js/web';
import './index.css';
import App from './App.jsx';

const root = document.getElementById('root');

if (import.meta.env.DEV && !(root instanceof HTMLElement)) {
  throw new Error(
    'Root element not found. Easy to fix: add <div id="root"></div> to your index.html'
  );
}

render(() => <App />, root);
