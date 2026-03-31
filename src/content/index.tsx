import React from 'react';
import ReactDOM from 'react-dom/client';
import SpreadCard from './SpreadCard';

// Função para injetar a interface de forma não destrutiva
const injectWTM = () => {
  // Evita injetar duas vezes
  if (document.getElementById('wtm-root-injector')) return;

  const container = document.createElement('div');
  container.id = 'wtm-root-injector';
  document.body.appendChild(container);

  ReactDOM.createRoot(container).render(
    <React.StrictMode>
      <SpreadCard />
    </React.StrictMode>
  );
};

// Garante que o script só rode depois que a página base estiver pronta
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  injectWTM();
} else {
  window.addEventListener('DOMContentLoaded', injectWTM);
}