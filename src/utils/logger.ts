/* Simple logger utility */
export const log = (...args: unknown[]) => console.log(new Date().toISOString(), '-', ...args);
export const error = (...args: unknown[]) => console.error(new Date().toISOString(), '- ERROR -', ...args);
