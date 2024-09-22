import React from 'react';
import '../styles/ui.css';

function App() {
  const [toneOfVoice, setToneOfVoice] = React.useState('Professional');
  const [numVariations, setNumVariations] = React.useState(1);
  const [specialInstructions, setSpecialInstructions] = React.useState('');
  const [apiKey, setApiKey] = React.useState('');
  const [extractedTexts, setExtractedTexts] = React.useState<string[]>([]);

  const onGenerate = () => {
    parent.postMessage(
      {
        pluginMessage: {
          type: 'create-rectangles',
          apiKey,
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
    window.onmessage = (event) => {
      const { type, texts } = event.data.pluginMessage;
      if (type === 'frame-selected') {
        const filteredTexts = texts.filter((text) => text.split(' ').length > 3);
        setExtractedTexts(filteredTexts);
      }
    };
  }, []);

  return (
    <div className="container">
      <h2>AI Copywriter</h2>
      {extractedTexts.length > 0 ? (
        <>
          <div className="info-banner">Select text fields to modify:</div>
          <div className="checklist">
            {extractedTexts.map((text, index) => (
              <label key={index} className="checklist-item">
                <input type="checkbox" />
                <span className="checklist-item-text">{text}</span>
              </label>
            ))}
          </div>
        </>
      ) : (
        <div className="info-banner">Select a frame to begin</div>
      )}
      <p>
        <label>OpenAI API Key:</label>
        <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
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
      <button id="create" onClick={onGenerate}>
        Generate
      </button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  );
}

export default App;
