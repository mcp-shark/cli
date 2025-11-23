import { consola } from "consola";
import cliBoxes from "cli-boxes";

/**
 * Display testing phase banner with rate limit information
 */
export function displayTestingBanner() {
  const box = cliBoxes.round;
  const content = [
    "⚠️  Testing Phase Notice",
    "",
    "Thank you for using Smart Scan!",
    "",
    "We're currently in our testing phase, and to ensure a smooth",
    "experience for everyone, we've set a limit of 3 scans per day",
    "per account.",
    "",
    "We appreciate your patience and understanding as we continue",
    "to improve the service.",
  ].join("\n");

  const lines = content.split("\n");
  const width = Math.max(...lines.map((line) => line.length)) + 4;

  let boxed = `${box.topLeft}${box.horizontal.repeat(width - 2)}${box.topRight}\n`;
  boxed += `${box.vertical}${" ".repeat(width - 2)}${box.vertical}\n`;

  for (const line of lines) {
    const padding = width - line.length - 2;
    const leftPad = Math.floor(padding / 2);
    const rightPad = padding - leftPad;
    boxed += `${box.vertical}${" ".repeat(leftPad)}${line}${" ".repeat(rightPad)}${box.vertical}\n`;
  }

  boxed += `${box.vertical}${" ".repeat(width - 2)}${box.vertical}\n`;
  boxed += `${box.bottomLeft}${box.horizontal.repeat(width - 2)}${box.bottomRight}`;

  consola.log(boxed);
}
