import { describe, it, expect, vi } from "vitest";
import {
  sanitizeText,
  segmentText,
  isSilenceMarker,
  extractSilenceDuration,
  preprocessText,
} from "./textProcessor";

// Stub for apiClient.phonemize: returns UPPERCASE text to simulate processing.
vi.mock("$lib/shared/phonemizer", () => ({
  phonemize: async (text: string, _: string) => text.toUpperCase(),
}));

// Test for sanitization stage
describe("sanitizeText", () => {
  it("should replace punctuation and newlines with silence markers", () => {
    const input = "Hello, world! How are you?\nI'm fine.";
    const expected = "Hello[0.2s]world![0.1s]How are you?[0.1s]I'm fine.";
    expect(sanitizeText(input)).toBe(expected);
  });

  it("should trim extra whitespace", () => {
    const input = "  Hello, world!  ";
    const expected = "Hello[0.2s]world![0.1s]";
    expect(sanitizeText(input)).toBe(expected);
  });
});

// Test for segmentation stage
describe("segmentText", () => {
  it("should split a sanitized string into segments and silence markers", () => {
    const sanitized = "Hello[0.1s]world[0.1s]How are you";
    const segments = segmentText(sanitized);
    expect(segments).toEqual([
      "Hello",
      "[0.1s]",
      "world",
      "[0.1s]",
      "How are you",
    ]);
  });
});

// Tests for silence marker utilities
describe("isSilenceMarker & extractSilenceDuration", () => {
  it("should recognize valid silence markers", () => {
    expect(isSilenceMarker("[1s]")).toBe(true);
    expect(isSilenceMarker("[1.25s]")).toBe(true);
  });

  it("should reject invalid markers", () => {
    expect(isSilenceMarker("[s1]")).toBe(false);
    expect(isSilenceMarker("1s")).toBe(false);
    expect(isSilenceMarker("[]")).toBe(false);
  });

  it("should extract duration correctly", () => {
    expect(extractSilenceDuration("[2s]")).toBe(2);
    expect(extractSilenceDuration("[1.75s]")).toBe(1.75);
  });
});

// Test for token limit enforcement via preprocessText (indirectly testing splitting)
// We use a small tokensPerChunk to force splitting of phonemized text.
describe("preprocessText", () => {
  it("should process text with silence markers and text segments", async () => {
    // The phonemizer stub will return uppercase of the segment.
    const input = "Hello, world! How are you?";
    // Sanitization changes:
    // "Hello, world! How are you?" => "HELLO[0.1s]WORLD[0.1s]HOW ARE YOU[0.1s]"
    // Now, tokens (based on our stub tokenize which splits per character) will be an array of char codes.
    const tokensPerChunk = 10; // set low to force splitting if needed

    const chunks = await preprocessText(input, "en", tokensPerChunk);

    // Check that we have both text and silence chunks.
    expect(chunks).toBeInstanceOf(Array);
    // All silence chunks should be present as separate objects.
    const silenceChunks = chunks.filter((c) => c.type === "silence");
    expect(silenceChunks.length).toBeGreaterThan(0);
    // All text chunks should have tokens length not exceeding tokensPerChunk.
    const textChunks = chunks.filter((c) => c.type === "text") as {
      tokens: number[];
    }[];
    textChunks.forEach((tc) => {
      expect(tc.tokens.length).toBeLessThanOrEqual(tokensPerChunk);
    });
  });

  it("should handle input that is only text (no silence markers)", async () => {
    const input = "This is a test";
    const tokensPerChunk = 50; // High limit so no splitting occurs
    const chunks = await preprocessText(input, "en", tokensPerChunk);
    // Expect one text chunk with phonemized content (uppercase)
    expect(chunks).toHaveLength(1);
    const textChunk = chunks[0];
    expect(textChunk.type).toBe("text");
    // Since our phonemizer returns uppercase, check that content is uppercase.
    if (textChunk.type === "text") {
      expect(textChunk.content).toBe("THIS IS A TEST");
    }
  });

  it("should correctly split long phonemized text into sub-chunks", async () => {
    // Input that after phonemization becomes long (uppercased).
    const input = "aaaaaaaaaa"; // 10 a's
    const tokensPerChunk = 5;
    const chunks = await preprocessText(input, "en", tokensPerChunk);
    // Since phonemizer returns "AAAAAAAAAA", and our splitting is per character,
    // We expect the text chunk to be split into 2 parts, each with length 5.
    const textChunks = chunks.filter((c) => c.type === "text") as {
      content: string;
      tokens: number[];
    }[];
    // Total text chunks should be 2
    expect(textChunks.length).toBe(2);
    textChunks.forEach((tc) => {
      expect(tc.content.length).toBeLessThanOrEqual(5);
      expect(tc.content).toMatch(/^[A]+$/);
    });
  });

  it("should preserve silence markers between text segments", async () => {
    const input = "Wait, pause! Continue.";
    const tokensPerChunk = 20;
    const chunks = await preprocessText(input, "en", tokensPerChunk);
    // Sanitization: "Wait, pause! Continue." =>
    // "WAIT[0.1s]PAUSE[0.1s]CONTINUE[0.2s]"
    // Expect alternating text and silence chunks.
    expect(chunks[0].type).toBe("text");
    expect(chunks[1].type).toBe("silence");
    expect(chunks[2].type).toBe("text");
    expect(chunks[3].type).toBe("silence");
    expect(chunks[4].type).toBe("text");
  });
});
