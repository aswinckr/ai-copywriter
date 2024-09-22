figma.showUI(__html__);

figma.on('selectionchange', () => {
  const selectedFrame = figma.currentPage.selection[0];
  if (selectedFrame && selectedFrame.type === 'FRAME') {
    const texts = extractTextsFromFrame(selectedFrame);
    figma.ui.postMessage({ type: 'frame-selected', texts });
  }
});

function extractTextsFromFrame(frame) {
  const texts = [];
  frame
    .findAll((node) => node.type === 'TEXT')
    .forEach((textNode) => {
      texts.push(textNode.characters);
    });
  return texts;
}

figma.showUI(__html__, { width: 400, height: 600 });

async function loadFonts(textNodes) {
  const fontPromises = textNodes.map((node) =>
    figma.loadFontAsync({ family: node.fontName.family, style: node.fontName.style })
  );
  await Promise.all(fontPromises);
}

figma.ui.onmessage = async (msg) => {
  if (msg.type === 'generate-copies') {
    const selectedFrame = figma.currentPage.selection[0];
    if (selectedFrame && selectedFrame.type === 'FRAME') {
      const copies = [];
      for (let i = 0; i < msg.numVariations; i++) {
        const copy = selectedFrame.clone();
        copy.x = selectedFrame.x + (selectedFrame.width + 100) * (i + 1);
        figma.currentPage.appendChild(copy);
        copies.push(copy);
      }
      figma.currentPage.selection = copies;
      figma.viewport.scrollAndZoomIntoView(copies);

      figma.ui.postMessage({
        type: 'copies-created',
        message: `Created ${msg.numVariations} copies of the selected frame`,
      });
    } else {
      figma.ui.postMessage({
        type: 'error',
        message: 'Please select a frame before generating copies',
      });
    }
  } else if (msg.type === 'replace-text') {
    const selection = figma.currentPage.selection;
    if (selection.length === 0) {
      figma.ui.postMessage({ type: 'error', message: 'No frames selected' });
      return;
    }

    try {
      const parsedText = JSON.parse(msg.generatedText);
      const variations = Object.keys(parsedText);

      for (let i = 0; i < variations.length; i++) {
        const frame = selection[i];
        if (frame && frame.type === 'FRAME') {
          const variationKey = variations[i];
          const variationTexts = parsedText[variationKey];

          // Find all text nodes in the frame
          const textNodes = frame.findAll((node) => node.type === 'TEXT');

          // Replace text in each text node
          for (let j = 0; j < textNodes.length; j++) {
            const textNode = textNodes[j] as TextNode;
            const newText = variationTexts[`text_${j + 1}`];
            if (newText) {
              await figma.loadFontAsync(textNode.fontName as FontName);
              textNode.characters = newText;
            }
          }
        }
      }

      figma.ui.postMessage({ type: 'success', message: 'Text replaced successfully' });
    } catch (error) {
      console.error('Error replacing text:', error);
      figma.ui.postMessage({ type: 'error', message: 'Error replacing text' });
    }
  } else if (msg.type === 'cancel') {
    figma.closePlugin();
  }
};

// Keep the plugin open
// figma.closePlugin();
