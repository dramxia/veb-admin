import net from 'node:net';
import { spawn } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const DEFAULT_WEB_PORT = 1066;
const DEFAULT_CORE_API_PORT = 1067;
const MIN_DEV_PORT = 1024;
const MAX_PORT = 65535;
const PORT_SEARCH_LIMIT = 200;

export function parseDevPort(value, fallback, name) {
  if (value === undefined || value === '') {
    return fallback;
  }

  const port = Number(value);
  if (!Number.isInteger(port) || port < MIN_DEV_PORT || port > MAX_PORT) {
    throw new Error(
      `${name} must be an integer between ${MIN_DEV_PORT} and ${MAX_PORT}.`,
    );
  }

  return port;
}

export function reservePort(port) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();

    server.once('error', (error) => {
      if (error.code === 'EADDRINUSE' || error.code === 'EACCES') {
        resolve(null);
        return;
      }

      reject(error);
    });

    server.listen({ port, exclusive: true }, () => {
      let released = false;
      resolve(
        () =>
          new Promise((resolveClose, rejectClose) => {
            if (released) {
              resolveClose();
              return;
            }

            released = true;
            server.close((error) => {
              if (error) {
                rejectClose(error);
                return;
              }

              resolveClose();
            });
          }),
      );
    });
  });
}

async function releaseAll(releases) {
  await Promise.allSettled([...releases].reverse().map((release) => release()));
}

function nextCandidate(preferredPort, offset) {
  const range = MAX_PORT - MIN_DEV_PORT + 1;
  return MIN_DEV_PORT + ((preferredPort - MIN_DEV_PORT + offset) % range);
}

export async function selectDevPorts(
  { webPort, coreApiPort, strict = false },
  reserve = reservePort,
) {
  if (webPort === coreApiPort) {
    throw new Error(
      'WEB_DEV_PORT and CORE_API_DEV_PORT must use different ports.',
    );
  }

  const services = [
    { key: 'webPort', label: 'WEB_DEV_PORT', preferredPort: webPort },
    {
      key: 'coreApiPort',
      label: 'CORE_API_DEV_PORT',
      preferredPort: coreApiPort,
    },
  ];
  const selected = {};
  const unavailable = [];
  const releases = [];

  try {
    for (const service of services) {
      const release = await reserve(service.preferredPort);
      if (release) {
        selected[service.key] = service.preferredPort;
        releases.push(release);
      } else {
        unavailable.push(service);
      }
    }

    if (strict && unavailable.length > 0) {
      const ports = unavailable.map(
        ({ label, preferredPort }) => `${label}=${preferredPort}`,
      );
      throw new Error(
        `Required development port unavailable: ${ports.join(', ')}.`,
      );
    }

    for (const service of unavailable) {
      let found = false;

      for (let offset = 1; offset <= PORT_SEARCH_LIMIT; offset += 1) {
        const candidate = nextCandidate(service.preferredPort, offset);
        const release = await reserve(candidate);

        if (release) {
          selected[service.key] = candidate;
          releases.push(release);
          found = true;
          break;
        }
      }

      if (!found) {
        throw new Error(
          `No free port found for ${service.label} after checking ${PORT_SEARCH_LIMIT} candidates.`,
        );
      }
    }

    return {
      ...selected,
      webPortChanged: selected.webPort !== webPort,
      coreApiPortChanged: selected.coreApiPort !== coreApiPort,
      release: () => releaseAll(releases),
    };
  } catch (error) {
    await releaseAll(releases);
    throw error;
  }
}

async function main() {
  const requestedWebPort = parseDevPort(
    process.env.WEB_DEV_PORT,
    DEFAULT_WEB_PORT,
    'WEB_DEV_PORT',
  );
  const requestedCoreApiPort = parseDevPort(
    process.env.CORE_API_DEV_PORT,
    DEFAULT_CORE_API_PORT,
    'CORE_API_DEV_PORT',
  );
  const strict = process.env.VEB_DEV_STRICT_PORTS === '1';
  const ports = await selectDevPorts({
    webPort: requestedWebPort,
    coreApiPort: requestedCoreApiPort,
    strict,
  });

  const webNote = ports.webPortChanged
    ? ` (${requestedWebPort} unavailable)`
    : '';
  const coreApiNote = ports.coreApiPortChanged
    ? ` (${requestedCoreApiPort} unavailable)`
    : '';
  console.log(`[dev] Web:      http://localhost:${ports.webPort}${webNote}`);
  console.log(
    `[dev] Core API: http://localhost:${ports.coreApiPort}${coreApiNote}`,
  );

  const childEnvironment = {
    ...process.env,
    WEB_DEV_PORT: String(ports.webPort),
    CORE_API_DEV_PORT: String(ports.coreApiPort),
    AUTH_URL: `http://localhost:${ports.webPort}`,
    CORE_API_INTERNAL_URL: `http://127.0.0.1:${ports.coreApiPort}`,
  };

  await ports.release();

  const child = spawn(
    'pnpm',
    ['--parallel', '--filter', '@veb/web', '--filter', '@veb/core-api', 'dev'],
    {
      env: childEnvironment,
      stdio: 'inherit',
    },
  );

  let forwardedSignal;
  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, () => {
      forwardedSignal = signal;
      child.kill(signal);
    });
  }

  child.on('error', (error) => {
    console.error(`[dev] Failed to start pnpm: ${error.message}`);
    process.exitCode = 1;
  });

  child.on('exit', (code, signal) => {
    if (forwardedSignal === 'SIGINT') {
      process.exitCode = 130;
      return;
    }

    if (forwardedSignal === 'SIGTERM') {
      process.exitCode = 143;
      return;
    }

    process.exitCode = code ?? (signal ? 1 : 0);
  });
}

const isMain =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  main().catch((error) => {
    console.error(`[dev] ${error.message}`);
    process.exitCode = 1;
  });
}
