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

figma.ui.onmessage = async (msg) => {
  if (msg.type === 'generate-copies') {
    const selectedFrame = figma.currentPage.selection[0];
    if (selectedFrame && selectedFrame.type === 'FRAME') {
      const copies = [];
      for (let i = 0; i < msg.numVariations; i++) {
        const copy = selectedFrame.clone();
        copy.x = selectedFrame.x + (selectedFrame.width + 100) * (i + 1); // Add some spacing between copies
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
  }

  // Keep the plugin open
  // figma.closePlugin();
};
