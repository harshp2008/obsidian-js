import type { Filesystem } from '../../../types/filesystem';

let fs: Filesystem | null = null;

export function setFilesystem(filesystem: Filesystem) {
  fs = filesystem;
}

export function getFilesystem(): Filesystem {
  if (!fs) throw new Error('Filesystem not set');
  return fs;
} 