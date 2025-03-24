/**
 * Generates an FFmpeg atempo filter chain for modifying audio speed.
 *
 * FFmpeg's `atempo` filter only accepts values between 0.5 and 2.
 * If a speed change outside this range is needed (e.g., 0.1x or 5x),
 * multiple `atempo` filters must be chained together to achieve the desired effect.
 *
 * This function decomposes the velocity factor into a series of multiplications
 * within the 0.5 to 2 range, ensuring that the final effect is correctly applied.
 *
 * @param {number} velocity - The speed factor (0.1x to 5x). Values <1 slow down the audio, values >1 speed it up.
 * @returns {string} - The FFmpeg atempo filter string, e.g., "atempo=2,atempo=1.5"
 */
export function buildAtempoChain(velocity: number): string {
  let v = velocity;
  const factors: number[] = [];

  if (v < 1) {
    // Break down values lower than 1 into 0.5 multiplications
    while (v < 0.5) {
      factors.push(0.5);
      v /= 0.5;
    }
    factors.push(v);
  } else if (v > 1) {
    // Break down values higher than 1 into 2 multiplications
    while (v > 2) {
      factors.push(2);
      v /= 2;
    }
    factors.push(v);
  } else {
    factors.push(1);
  }

  return factors.map((f) => `atempo=${f}`).join(",");
}
