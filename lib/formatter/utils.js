import cliBoxes from "cli-boxes";
import { getApiBaseUrl } from "../api.js";

/**
 * Format an error message in a box
 */
export function formatErrorBox(title, message) {
  const box = cliBoxes.round;
  const lines = [title, "", message].filter(Boolean);
  const width = Math.max(...lines.map((line) => line.length)) + 4;

  const boxParts = [
    `${box.topLeft}${box.top.repeat(width - 2)}${box.topRight}`,
    `${box.left}${" ".repeat(width - 2)}${box.right}`,
    ...lines.map((line) => {
      const padding = width - line.length - 2;
      const leftPad = Math.floor(padding / 2);
      const rightPad = padding - leftPad;
      return `${box.left}${" ".repeat(leftPad)}${line}${" ".repeat(rightPad)}${box.right}`;
    }),
    `${box.left}${" ".repeat(width - 2)}${box.right}`,
    `${box.bottomLeft}${box.bottom.repeat(width - 2)}${box.bottomRight}`,
  ];

  return boxParts.join("\n");
}

/**
 * Generate a deep link URL for a scan result
 */
export function generateDeepLink(scanId, baseUrl = getApiBaseUrl()) {
  if (!scanId || scanId === "N/A") {
    return null;
  }
  return `${baseUrl}/scan-results?id=${encodeURIComponent(scanId)}`;
}

/**
 * Wrap text to fit within a maximum width
 */
/**
 * Break a long word into chunks
 */
function breakWord(word, maxWidth) {
  const chunks = [];
  const wordLength = word.length;
  for (const startIndex of Array.from(
    { length: Math.ceil(wordLength / maxWidth) },
    (_, i) => i * maxWidth
  )) {
    chunks.push(word.slice(startIndex, startIndex + maxWidth));
  }
  return chunks;
}

/**
 * Process words and build lines
 */
function processWords(words, maxWidth) {
  const lines = [];
  const state = { currentLine: "" };

  for (const word of words) {
    const testLine = state.currentLine ? `${state.currentLine} ${word}` : word;
    if (testLine.length <= maxWidth) {
      state.currentLine = testLine;
    } else {
      if (state.currentLine) {
        lines.push(state.currentLine);
      }
      // If a single word is longer than maxWidth, break it
      if (word.length > maxWidth) {
        lines.push(...breakWord(word, maxWidth));
        state.currentLine = "";
      } else {
        state.currentLine = word;
      }
    }
  }
  if (state.currentLine) {
    lines.push(state.currentLine);
  }
  return lines;
}

export function wrapText(text, maxWidth) {
  const words = String(text).split(" ");
  const lines = processWords(words, maxWidth);
  return lines.length > 0 ? lines : [""];
}
