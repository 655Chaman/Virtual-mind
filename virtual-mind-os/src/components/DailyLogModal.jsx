import React, { useState } from 'react';

const DailyLogModal = ({ onClose, onSubmit }) => {
  const [text, setText] = useState('');
  const [selectedPillars, setSelectedPillars] = useState([]);

  const PILLARS = [
    { id: 0, name: 'DEEN' },
    { id: 1, name: 'ELESIUM' },
    { id: 2, name: 'INFLUENCE' },
    { id: 3, name: 'SELF' },
  ];

  const togglePillar = (id) => {
    if (selectedPillars.includes(id)) {
      setSelectedPillars(selectedPillars.filter(p => p !== id));
    } else {
      setSelectedPillars([...selectedPillars, id]);
    }
  };

  const handleSubmit = () => {
    if (!text.trim()) return;
    onSubmit({ text, folders: selectedPillars });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <header className="modal-header">
          <h2 className="heading-imperal">DAILY COMMAND LOG</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </header>

        <div className="modal-body">
          <p className="prompt">What did you actually do today? No lies here.</p>
          <textarea 
            className="log-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Command transcript..."
            autoFocus
          />

          <div className="pillar-selector">
            <p className="label">ACTIVE PILLARS</p>
            <div className="pillar-options">
              {PILLARS.map(p => (
                <div 
                  key={p.id} 
                  className={`pillar-option ${selectedPillars.includes(p.id) ? 'active' : ''}`}
                  onClick={() => togglePillar(p.id)}
                >
                  {p.name}
                </div>
              ))}
            </div>
          </div>
        </div>

        <footer className="modal-footer">
          <button className="submit-log" onClick={handleSubmit} disabled={!text.trim()}>
            COMMIT TO RECORD
          </button>
        </footer>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.9);
          backdrop-filter: blur(10px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .modal-content {
          background: var(--surface);
          border: 1px solid var(--gold);
          width: 90%;
          max-width: 600px;
          padding: 2.5rem;
          display: flex;
          flex-direction: column;
          gap: 2rem;
          box-shadow: 0 0 50px rgba(201, 168, 76, 0.1);
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .close-btn {
          border: none;
          background: none;
          color: var(--text-muted);
          font-size: 2rem;
          padding: 0;
          line-height: 1;
        }
        .prompt {
          font-family: var(--font-heading);
          color: var(--text);
          margin-bottom: 1rem;
          letter-spacing: 0.05em;
        }
        .log-input {
          width: 100%;
          height: 200px;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: var(--text);
          padding: 1.5rem;
          font-family: var(--font-mono);
          font-size: 1rem;
          resize: none;
          outline: none;
          transition: border-color 0.3s;
        }
        .log-input:focus {
          border-color: var(--gold);
        }
        .pillar-selector {
          margin-top: 1.5rem;
        }
        .label {
          font-size: 0.7rem;
          letter-spacing: 0.2em;
          color: var(--text-muted);
          margin-bottom: 1rem;
        }
        .pillar-options {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }
        .pillar-option {
          padding: 0.5rem 1rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
          font-family: var(--font-mono);
          font-size: 0.8rem;
          cursor: pointer;
          transition: all 0.3s;
        }
        .pillar-option.active {
          background: var(--gold);
          color: var(--obsidian);
          border-color: var(--gold);
        }
        .submit-log {
          width: 100%;
          background: var(--gold);
          color: var(--obsidian);
          font-weight: 700;
        }
        .submit-log:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default DailyLogModal;
