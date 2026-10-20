/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Ensure no blocking alerts from third-party scripts (MediaPipe/WebRTC)
if (typeof window !== 'undefined') {
  window.alert = (message?: any) => {
    console.warn('[System Notice]:', message);
  };
}

createRoot(document.getElementById('root')!).render(<App />);
