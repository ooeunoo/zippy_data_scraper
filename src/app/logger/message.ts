import { calculateMemoryMB } from '../utils/memory';

export const start = (id: string) => `${id} 작업 시작`;
export const end = (id: string) => `${id} 작업 마침`;
export const error = (id: string, error: any) => `${id} 작업 오류: ${error}`;
export const memeory = (id: string) => {
  return `${id}가 ${calculateMemoryMB()}MB만큼 사용중입니다.`;
};
