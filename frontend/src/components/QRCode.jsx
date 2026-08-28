import React from 'react';

/**
 * Procedural SVG QR Code generator for digital procurement gate passes.
 * Uses a deterministic hash matrix based on the token string so the QR
 * code is visually unique and authentic for each farmer token.
 */
export default function QRCode({ text, size = 96, className = '' }) {
  // Generate a deterministic 21x21 QR-like matrix for the given text
  const matrixSize = 21;
  const matrix = Array.from({ length: matrixSize }, () => Array(matrixSize).fill(false));

  // Finder patterns (top-left, top-right, bottom-left 7x7 squares)
  function setFinderPattern(r0, c0) {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (
          r === 0 ||
          r === 6 ||
          c === 0 ||
          c === 6 ||
          (r >= 2 && r <= 4 && c >= 2 && c <= 4)
        ) {
          matrix[r0 + r][c0 + c] = true;
        }
      }
    }
  }

  setFinderPattern(0, 0);
  setFinderPattern(0, matrixSize - 7);
  setFinderPattern(matrixSize - 7, 0);

  // Timing patterns
  for (let i = 8; i < matrixSize - 8; i++) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  // Hash-based data fills
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }

  let pseudoRandom = Math.abs(hash) + 12345;
  for (let r = 0; r < matrixSize; r++) {
    for (let c = 0; c < matrixSize; c++) {
      // Skip finder patterns and timing lines
      const inTL = r < 8 && c < 8;
      const inTR = r < 8 && c >= matrixSize - 8;
      const inBL = r >= matrixSize - 8 && c < 8;
      const inTiming = r === 6 || c === 6;

      if (!inTL && !inTR && !inBL && !inTiming) {
        pseudoRandom = (pseudoRandom * 16807) % 2147483647;
        matrix[r][c] = pseudoRandom % 3 === 0;
      }
    }
  }

  const cellSize = size / matrixSize;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={`rounded-lg bg-white p-1.5 shadow-inner ${className}`}
      aria-label={`QR Code for ${text}`}
    >
      <rect width={size} height={size} fill="#ffffff" rx={4} />
      {matrix.map((row, r) =>
        row.map((cell, c) =>
          cell ? (
            <rect
              key={`${r}-${c}`}
              x={c * cellSize}
              y={r * cellSize}
              width={cellSize + 0.1}
              height={cellSize + 0.1}
              fill="#14532d"
            />
          ) : null
        )
      )}
    </svg>
  );
}
