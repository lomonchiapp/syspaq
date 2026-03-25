import { hashApiKey, safeEqualHex } from "./api-key-hash";

describe("hashApiKey", () => {
  it("produces deterministic hash with pepper", () => {
    const a = hashApiKey("spq_live_test", "pepper-one");
    const b = hashApiKey("spq_live_test", "pepper-one");
    expect(a).toBe(b);
    expect(a).toHaveLength(64);
  });

  it("changes when pepper changes", () => {
    const a = hashApiKey("same-key", "p1");
    const b = hashApiKey("same-key", "p2");
    expect(a).not.toBe(b);
  });
});

describe("safeEqualHex", () => {
  it("compares equal hex strings", () => {
    expect(safeEqualHex("aa", "aa")).toBe(true);
    expect(safeEqualHex("aa", "ab")).toBe(false);
  });
});
