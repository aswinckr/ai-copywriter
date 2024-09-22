import React from 'react';
import '../styles/ui.css';

function App() {
  const [toneOfVoice, setToneOfVoice] = React.useState('Professional');
  const [numVariations, setNumVariations] = React.useState(1);
  const [specialInstructions, setSpecialInstructions] = React.useState('');

  const textbox = React.useRef<HTMLInputElement>(undefined);

  const countRef = React.useCallback((element: HTMLInputElement) => {
    if (element) element.value = '5';
    textbox.current = element;
  }, []);

  const onCreate = () => {
    const count = parseInt(textbox.current.value, 10);
    parent.postMessage(
      {
        pluginMessage: {
          type: 'create-rectangles',
          count,
          toneOfVoice,
          numVariations,
          specialInstructions,
        },
      },
      '*'
    );
  };

  const onCancel = () => {
    parent.postMessage({ pluginMessage: { type: 'cancel' } }, '*');
  };

  React.useEffect(() => {
    // This is how we read messages sent from the plugin controller
    window.onmessage = (event) => {
      const { type, message } = event.data.pluginMessage;
      if (type === 'create-rectangles') {
        console.log(`Figma Says: ${message}`);
      }
    };
  }, []);

  return (
    <div className="container">
      <h2>AI Copywriter</h2>
      <div className="info-banner">Select a frame to begin</div>
      <p>
        <label>Count:</label>
        <input ref={countRef} />
      </p>
      <p>
        <label>Tone of Voice:</label>
        <select value={toneOfVoice} onChange={(e) => setToneOfVoice(e.target.value)}>
          <option value="Professional">Professional</option>
          <option value="Casual">Casual</option>
          <option value="Formal">Formal</option>
          <option value="Informed">Informed</option>
          <option value="Persuasive">Persuasive</option>
          <option value="Friendly">Friendly</option>
        </select>
      </p>
      <p>
        <label>Number of Variations:</label>
        <input
          type="number"
          value={numVariations}
          onChange={(e) => setNumVariations(parseInt(e.target.value, 10))}
          min="1"
        />
      </p>
      <p>
        <label>Special Instructions:</label>
        <textarea value={specialInstructions} onChange={(e) => setSpecialInstructions(e.target.value)} rows={3} />
      </p>
      <button id="create" onClick={onCreate}>
        Create
      </button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  );
}

export default App;
