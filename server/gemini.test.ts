import { describe, it, expect } from "vitest";

describe("Gemini API Key validation", () => {
  it("should have GEMINI_API_KEY set", () => {
    const key = process.env.GEMINI_API_KEY;
    expect(key).toBeDefined();
    expect(key!.length).toBeGreaterThan(10);
  });

  it("should be able to call Gemini API", async () => {
    const key = process.env.GEMINI_API_KEY;
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.models).toBeDefined();
    expect(data.models.length).toBeGreaterThan(0);
  }, 15000);
});
