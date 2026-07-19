import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import PresentiaSection from '../manager/PresentiaSection.jsx';
import { crearApiKiosk } from '../kiosk/api.js';
import FicharScreen from '../kiosk/FicharScreen.jsx';
import './preview.css';

const apiKiosk = crearApiKiosk({ base: '/presentia', dispositivo: 'kiosko-demo-1' });

function App() {
  const [vista, setVista] = useState('manager');
  const [rol, setRol] = useState('local_admin');
  return (
    <div className="preview">
      <header className="preview-bar">
        <strong className="preview-marca">Presentia · preview</strong>
        <div className="preview-tabs">
          <button className={vista === 'manager' ? 'on' : ''} onClick={() => setVista('manager')}>Manager</button>
          <button className={vista === 'kiosk' ? 'on' : ''} onClick={() => setVista('kiosk')}>Kiosko</button>
        </div>
        {vista === 'manager'
          ? (
            <label className="preview-rol">Rol&nbsp;
              <select value={rol} onChange={(e) => setRol(e.target.value)}>
                <option value="local_admin">local_admin</option>
                <option value="technician">technician</option>
              </select>
            </label>
          )
          : <span className="preview-pins">PINs demo · Ana&nbsp;<code>4728</code> · Bruno&nbsp;<code>6410</code></span>}
      </header>
      <main className="preview-body">
        {vista === 'manager'
          ? <PresentiaSection key={rol} rol={rol} apiBase="/presentia" />
          : <FicharScreen key="kiosk" api={apiKiosk} />}
      </main>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
