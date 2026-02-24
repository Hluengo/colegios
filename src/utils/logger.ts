/* eslint-disable no-console */
/**
 * Logger avanzado con soporte para múltiples niveles
 */

const isDev = import.meta.env.DEV;

// Configuración de niveles
const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };
const currentLevel = isDev ? 'debug' : 'warn';

function formatMessage(level, args) {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
  const formatted = formatArgs(args);
  return formatted.length === 1 ? [prefix, formatted[0]] : [prefix, ...formatted];
}

function formatArgs(args) {
  const seen = new WeakSet();
  function safeStringify(obj) {
    try {
      return JSON.stringify(obj, function (_, value) {
        if (typeof value === 'object' && value !== null) {
          if (seen.has(value)) return '[Circular]';
          seen.add(value);
        }
        if (value instanceof Error) {
          return { name: value.name, message: value.message, stack: value.stack };
        }
        return value;
      });
    } catch (e) {
      return String(obj);
    }
  }

  return Array.from(args).map((a) => {
    if (a instanceof Error) return `${a.name}: ${a.message}\n${a.stack}`;
    if (typeof a === 'object') return safeStringify(a);
    return a;
  });
}

export const logger = {
  debug: (...args) => {
    if (LOG_LEVELS[currentLevel] > LOG_LEVELS.debug) return;
    console.debug(...formatMessage('debug', args));
  },

  info: (...args) => {
    if (LOG_LEVELS[currentLevel] > LOG_LEVELS.info) return;
    console.info(...formatMessage('info', args));
  },

  warn: (...args) => {
    if (LOG_LEVELS[currentLevel] > LOG_LEVELS.warn) return;
    console.warn(...formatMessage('warn', args));
  },

  error: (...args) => {
    console.error(...formatMessage('error', args));
  },

  group: (label, fn) => {
    if (isDev) {
      console.group(`[${label}]`);
      fn();
      console.groupEnd();
    }
  },

  if:
    (condition, level = 'debug') =>
    (...args) => {
      if (condition) logger[level](...args);
    },
};

export default logger;
