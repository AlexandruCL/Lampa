// The tests assert English copy; without this they follow the machine's language (ro-RO fails lamp.test.tsx).
Object.defineProperty(navigator, "language", { value: "en-US", configurable: true });
