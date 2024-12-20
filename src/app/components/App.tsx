import React from 'react';
import '../styles/ui.css';
import OpenAI from 'openai';

function App() {
  const [toneOfVoice, setToneOfVoice] = React.useState('Professional');
  const [numVariations, setNumVariations] = React.useState<number>(1);
  const [specialInstructions, setSpecialInstructions] = React.useState('');
  const [apiKey, setApiKey] = React.useState('');
  const [extractedTexts, setExtractedTexts] = React.useState<string[]>([]);
  const [generatedText, setGeneratedText] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [selectedTexts, setSelectedTexts] = React.useState<string[]>([]);

  const onGenerate = async () => {
    setIsLoading(true);
    try {
      const openai = new OpenAI({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true,
      });

      // Combine selected texts into a single string
      const selectedText = selectedTexts.join('. ');

      // Create the new prompt
      const prompt = `Generate ${numVariations} unique variants of the following input text: ${selectedText}

Consider the following instructions:
Tone: ${toneOfVoice}.
Special instructions: ${specialInstructions}

Please output the variants in JSON format.

Each sentence in the variant should maintain a word count close to the corresponding sentence in the input text. For example, if the first sentence of the input text has 6 words, the first sentence of each variant should also have around 6 words. Similarly, if the second sentence has 20 words, the second sentence of each variant should also have around 20 words.

Ensure the number of sentences in each variant matches the number of sentences in the input text.

For example, if the input has 2 sentences and 2 variations are requested, the output should be:
{
  "variation1": {
    "text_1": "Variant 1 of the first sentence",
    "text_2": "Variant 1 of the second sentence"
  },
  "variation2": {
    "text_1": "Variant 2 of the first sentence",
    "text_2": "Variant 2 of the second sentence"
  }
}`;

      console.log('Final prompt:', prompt);

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
      });

      const generatedContent = completion.choices[0].message.content;
      console.log('Raw generated content:', generatedContent);

      // Clean and parse the generated content
      const cleanedContent = generatedContent
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .replace(/json/gi, '')
        .trim();
      try {
        const parsedContent = JSON.parse(cleanedContent);
        console.log('Parsed generated content:', parsedContent);
        setGeneratedText(JSON.stringify(parsedContent, null, 2));

        // After successful text generation, create copies
        parent.postMessage(
          {
            pluginMessage: {
              type: 'generate-copies',
              numVariations,
            },
          },
          '*'
        );

        // Replace text in the copies
        parent.postMessage(
          {
            pluginMessage: {
              type: 'replace-text',
              generatedText: JSON.stringify(parsedContent),
            },
          },
          '*'
        );
      } catch (parseError) {
        console.error('Error parsing generated content:', parseError);
        setGeneratedText('Error parsing generated content. Please try again.');
      }
    } catch (error) {
      console.error('Error generating text:', error);
      setGeneratedText('Error generating text. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const onCancel = () => {
    parent.postMessage({ pluginMessage: { type: 'cancel' } }, '*');
  };

  React.useEffect(() => {
    window.onmessage = (event) => {
      const { type, texts, message } = event.data.pluginMessage;
      if (type === 'frame-selected') {
        const filteredTexts = texts.filter((text) => text.split(' ').length > 3);
        setExtractedTexts(filteredTexts);
        setSelectedTexts([]); // Reset selected texts when a new frame is selected
      } else if (type === 'copies-created' || type === 'error') {
        // You can use this to show a notification to the user
        console.log(message);
      }
    };
  }, []);

  const handleCheckboxChange = (text: string, isChecked: boolean) => {
    setSelectedTexts((prev) => (isChecked ? [...prev, text] : prev.filter((t) => t !== text)));
  };

  const handleNumVariationsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    setNumVariations(isNaN(value) ? 1 : Math.max(1, value));
  };

  return (
    <div className="container">
      <h2>AI Copywriter</h2>
      {extractedTexts.length > 0 ? (
        <>
          <div className="info-banner">Select text fields to modify:</div>
          <div className="checklist">
            {extractedTexts.map((text, index) => (
              <label key={index} className="checklist-item">
                <input
                  type="checkbox"
                  onChange={(e) => handleCheckboxChange(text, e.target.checked)}
                  checked={selectedTexts.includes(text)}
                />
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
        <input type="number" value={numVariations} onChange={handleNumVariationsChange} min="1" />
      </p>
      <p>
        <label>Special Instructions:</label>
        <textarea value={specialInstructions} onChange={(e) => setSpecialInstructions(e.target.value)} rows={3} />
      </p>
      <button id="create" onClick={onGenerate} disabled={isLoading || selectedTexts.length === 0 || !apiKey}>
        {isLoading ? 'Generating...' : 'Generate'}
      </button>
      <button onClick={onCancel}>Cancel</button>
      {generatedText && (
        <div className="generated-text">
          <h3>Generated Text:</h3>
          <p>{generatedText}</p>
        </div>
      )}
    </div>
  );
}

export default App;
