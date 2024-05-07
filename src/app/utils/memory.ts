export const calculateMemoryMB = () => {
  const use = process.memoryUsage().heapUsed / 1024 / 1024;
  return Math.round(use * 100) / 100;
};
