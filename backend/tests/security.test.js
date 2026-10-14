const test = require("node:test");
const assert = require("node:assert/strict");
const { isBlockedIp } = require("../utils/validateUrl");
const { validateAlias } = require("../validators/alias");

test("blocks private and special-purpose IPv4 ranges", () => {
  for (const ip of ["10.0.0.1", "172.16.0.1", "192.168.1.1", "127.0.0.1", "169.254.1.1", "100.64.0.1", "198.18.0.1", "224.0.0.1", "240.0.0.1"]) {
    assert.equal(isBlockedIp(ip), true, ip + " should be blocked");
  }
});

test("allows public IPv4 addresses", () => {
  for (const ip of ["1.1.1.1", "8.8.8.8", "93.184.216.34"]) {
    assert.equal(isBlockedIp(ip), false, ip + " should be allowed");
  }
});

test("blocks local and special-purpose IPv6 addresses", () => {
  for (const ip of ["::", "::1", "fc00::1", "fd00::1", "fe80::1", "ff02::1", "2001:db8::1", "::ffff:127.0.0.1"]) {
    assert.equal(isBlockedIp(ip), true, ip + " should be blocked");
  }
});

test("allows public IPv6 addresses", () => {
  assert.equal(isBlockedIp("2001:4860:4860::8888"), false);
});

test("rejects reserved aliases case-insensitively", () => {
  assert.equal(validateAlias("API").valid, false);
  assert.equal(validateAlias("dashboard").valid, false);
});

test("accepts valid aliases and rejects malformed aliases", () => {
  assert.deepEqual(validateAlias("my-link"), { valid: true, value: "my-link" });
  assert.equal(validateAlias("ab").valid, false);
  assert.equal(validateAlias("not valid").valid, false);
});
