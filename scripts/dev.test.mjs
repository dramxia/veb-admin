import assert from 'node:assert/strict';
import test from 'node:test';

import { parseDevPort, selectDevPorts } from './dev.mjs';

function createFakeReservation(occupiedPorts = []) {
  const occupied = new Set(occupiedPorts);
  const reserved = new Set();

  return {
    reserve: async (port) => {
      if (occupied.has(port) || reserved.has(port)) {
        return null;
      }

      reserved.add(port);
      return async () => {
        reserved.delete(port);
      };
    },
    reserved,
  };
}

test('parseDevPort uses the fallback and validates explicit values', () => {
  assert.equal(parseDevPort(undefined, 1066, 'WEB_DEV_PORT'), 1066);
  assert.equal(parseDevPort('2048', 1066, 'WEB_DEV_PORT'), 2048);
  assert.throws(
    () => parseDevPort('abc', 1066, 'WEB_DEV_PORT'),
    /WEB_DEV_PORT must be an integer/,
  );
  assert.throws(
    () => parseDevPort('80', 1066, 'WEB_DEV_PORT'),
    /WEB_DEV_PORT must be an integer/,
  );
});

test('selectDevPorts keeps preferred ports when both are available', async () => {
  const fake = createFakeReservation();
  const ports = await selectDevPorts(
    { webPort: 1066, coreApiPort: 1067 },
    fake.reserve,
  );

  assert.equal(ports.webPort, 1066);
  assert.equal(ports.coreApiPort, 1067);
  assert.equal(ports.webPortChanged, false);
  assert.equal(ports.coreApiPortChanged, false);

  await ports.release();
  assert.equal(fake.reserved.size, 0);
});

test('selectDevPorts preserves a free preferred port before choosing a fallback', async () => {
  const fake = createFakeReservation([1066]);
  const ports = await selectDevPorts(
    { webPort: 1066, coreApiPort: 1067 },
    fake.reserve,
  );

  assert.equal(ports.webPort, 1068);
  assert.equal(ports.coreApiPort, 1067);
  assert.equal(ports.webPortChanged, true);
  assert.equal(ports.coreApiPortChanged, false);

  await ports.release();
});

test('selectDevPorts gives each service a different fallback', async () => {
  const fake = createFakeReservation([1066, 1067]);
  const ports = await selectDevPorts(
    { webPort: 1066, coreApiPort: 1067 },
    fake.reserve,
  );

  assert.equal(ports.webPort, 1068);
  assert.equal(ports.coreApiPort, 1069);

  await ports.release();
});

test('selectDevPorts fails instead of shifting ports in strict mode', async () => {
  const fake = createFakeReservation([1066]);

  await assert.rejects(
    selectDevPorts(
      { webPort: 1066, coreApiPort: 1067, strict: true },
      fake.reserve,
    ),
    /Required development port unavailable: WEB_DEV_PORT=1066/,
  );
  assert.equal(fake.reserved.size, 0);
});

test('selectDevPorts rejects duplicate requested ports', async () => {
  const fake = createFakeReservation();

  await assert.rejects(
    selectDevPorts({ webPort: 1066, coreApiPort: 1066 }, fake.reserve),
    /must use different ports/,
  );
});
