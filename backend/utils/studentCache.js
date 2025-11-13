import NodeCache from 'node-cache';

export const studentCache = new NodeCache({ stdTTL: 600 });

export const flushStudentCache = () => {
  studentCache.flushAll();
};

