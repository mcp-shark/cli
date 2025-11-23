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
export function wrapText(text, maxWidth) {
  const words = String(text).split(" ");
  const lines = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (testLine.length <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) {
        lines.push(currentLine);
      }
      // If a single word is longer than maxWidth, break it
      if (word.length > maxWidth) {
        for (let i = 0; i < word.length; i += maxWidth) {
          lines.push(word.slice(i, i + maxWidth));
        }
        currentLine = "";
      } else {
        currentLine = word;
      }
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines.length > 0 ? lines : [""];
}
