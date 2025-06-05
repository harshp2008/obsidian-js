export interface FileMetadata {
  name: string;
  path: string;
  size?: number;
  type?: string; // e.g., 'file', 'directory'
  lastModified?: number;
}

export interface Filesystem {
  readFile(path: string): Promise<string | ArrayBuffer>;
  writeFile(path: string, data: string | ArrayBuffer): Promise<void>;
  deleteFile(path: string): Promise<void>;
  listFiles(directory: string): Promise<FileMetadata[]>;
  // Add more as needed (move, copy, etc.)
} 