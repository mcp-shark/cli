import cliBoxes from "cli-boxes";
import { consola } from "consola";

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

  const boxed = boxParts.join("\n");

  consola.log(boxed);
}
