import cliBoxes from "cli-boxes";
import { consola } from "consola";
import { formatSimpleFallback } from "./table-fallback.js";
import { wrapText } from "./utils.js";

/**
 * Render a table row with wrapping support
 */
export function renderRow(box, label, valueStr, col1Width, col2Width, maxCol2Width) {
  const lines = [];
  const hasNewlines = valueStr.includes("\n");
  const needsWrapping = valueStr.length > maxCol2Width;
  const allWrappedLines = [];

  if (hasNewlines || needsWrapping) {
    const linesByNewline = valueStr.split("\n");
    for (const line of linesByNewline) {
      if (line.trim()) {
        if (needsWrapping || line.length > maxCol2Width) {
          allWrappedLines.push(...wrapText(line, maxCol2Width));
        } else {
          allWrappedLines.push(line);
        }
      }
    }
  } else if (valueStr.length > maxCol2Width) {
    allWrappedLines.push(...wrapText(valueStr, maxCol2Width));
  } else {
    allWrappedLines.push(valueStr);
  }

  const firstLinePadding = " ".repeat(Math.max(0, col1Width - label.length));
  for (const [index, line] of allWrappedLines.entries()) {
    const padding2 = " ".repeat(Math.max(0, col2Width - line.length));
    lines.push(
      index === 0
        ? `${box.left} ${label}${firstLinePadding} │ ${line}${padding2} ${box.right}`
        : `${box.left} ${" ".repeat(col1Width)} │ ${line}${padding2} ${box.right}`
    );
  }
  return lines;
}

/**
 * Format a single scan result as a table
 */
export function formatSingleScanTable(scanResult, serverName, buildRowsFn) {
  try {
    const { rows } = buildRowsFn(scanResult, serverName);
    if (rows.length === 0) {
      consola.warn("No data to display in table");
      formatSimpleFallback(scanResult, serverName);
      return;
    }

    const col1Width = Math.max(...rows.map((row) => row[0].length), 1);
    const terminalWidth = process.stdout.columns || 80;
    const maxCol2Width = Math.max(
      1,
      Math.min(
        Math.max(...rows.map((row) => String(row[1]).length), 1),
        terminalWidth - col1Width - 10
      )
    );
    const col2Width = Math.max(
      1,
      ...rows.map((row) => {
        const value = String(row[1]);
        if (row[2] === true && value.length > maxCol2Width) {
          return maxCol2Width;
        }
        return Math.min(value.length, maxCol2Width);
      })
    );

    const box = cliBoxes.single;
    const tableLines = [];
    tableLines.push(
      `${box.topLeft}${box.top.repeat(Math.max(0, col1Width + 2))}┬${box.top.repeat(Math.max(0, col2Width + 2))}${box.topRight}`
    );

    for (const row of rows) {
      const [label, value, shouldWrap] = row;
      const valueStr = String(value);
      const needsWrapping = shouldWrap && valueStr.length > maxCol2Width;
      tableLines.push(
        ...renderRow(
          box,
          label,
          valueStr,
          col1Width,
          col2Width,
          needsWrapping ? maxCol2Width : col2Width
        )
      );
    }

    tableLines.push(
      `${box.bottomLeft}${box.bottom.repeat(Math.max(0, col1Width + 2))}┴${box.bottom.repeat(Math.max(0, col2Width + 2))}${box.bottomRight}`
    );
    console.log(tableLines.join("\n"));
  } catch (error) {
    consola.debug("Table formatting error:", error.message);
    formatSimpleFallback(scanResult, serverName);
  }
}
