import { describe, expect, it, vi } from "vitest";

const headerStore = new Map<string, string>();
vi.mock("next/headers", () => ({
  headers: () => Promise.resolve({ get: (name: string) => headerStore.get(name) ?? null }),
}));

const { clientIpKey, hashIdentifier, uidKey } = await import("./keys");

describe("rate-limit keys", () => {
  it("hashes IPs so raw addresses never become Redis keys", async () => {
    headerStore.set("x-forwarded-for", "203.0.113.9, 10.0.0.1");
    const key = await clientIpKey();
    expect(key.startsWith("ip:")).toBe(true);
    expect(key).not.toContain("203.0.113.9");
    expect(key).toBe(`ip:${hashIdentifier("203.0.113.9")}`);
  });

  it("falls back to x-real-ip, then to a shared 'unknown' bucket", async () => {
    headerStore.clear();
    headerStore.set("x-real-ip", "198.51.100.7");
    expect(await clientIpKey()).toBe(`ip:${hashIdentifier("198.51.100.7")}`);
    headerStore.clear();
    expect(await clientIpKey()).toBe(`ip:${hashIdentifier("unknown")}`);
  });

  it("namespaces user keys", () => {
    expect(uidKey("abc")).toBe("uid:abc");
  });
});
