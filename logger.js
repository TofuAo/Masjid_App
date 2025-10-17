const theme = {
  primary: (text) => `\x1b[34m${text}\x1b[0m`,
  data: (text) => `\x1b[36m${text}\x1b[0m`,
  success: (text) => `\x1b[32m${text}\x1b[0m`,
  warning: (text) => `\x1b[33m${text}\x1b[0m`,
  error: (text) => `\x1b[31m${text}\x1b[0m`,
};

const logger = {
  info: (message) => {
    console.log(`${theme.primary('[INFO]')} ${message}`);
  },
  success: (message) => {
    console.log(`${theme.success('[SUCCESS]')} ${message}`);
  },
  warning: (message) => {
    console.log(`${theme.warning('[WARNING]')} ${message}`);
  },
  error: (message, error) => {
    console.error(`${theme.error('[ERROR]')} ${message}`, error);
  },
};

export { logger, theme };
