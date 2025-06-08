import { EditorView } from '@codemirror/view';

export interface FileSystemOptions {
  basePath?: string;
  onError?: (error: Error) => void;
}

export interface FileSystem {
  readFile: (path: string) => Promise<string>;
  writeFile: (path: string, content: string) => Promise<void>;
  deleteFile: (path: string) => Promise<void>;
  listFiles: (path: string) => Promise<any>;
}

export class FileSystemError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FileSystemError';
  }
}

export const createFileSystem = (options: FileSystemOptions = {}): FileSystem => {
  const { basePath = '', onError } = options;

  const handleError = (error: Error) => {
    if (onError) {
      onError(error);
    } else {
      console.error('FileSystem Error:', error);
    }
    throw error;
  };

  return {
    async readFile(path: string): Promise<string> {
      try {
        const response = await fetch(`${basePath}/${encodeURIComponent(path)}`);
        if (!response.ok) {
          throw new FileSystemError(`Failed to read file: ${path}`);
        }
        return await response.text();
      } catch (error) {
        return handleError(error as Error);
      }
    },

    async writeFile(path: string, content: string): Promise<void> {
      try {
        const response = await fetch(`${basePath}?path=${encodeURIComponent(path)}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'text/plain',
          },
          body: content,
        });
        if (!response.ok) {
          throw new FileSystemError(`Failed to write file: ${path}`);
        }
      } catch (error) {
        return handleError(error as Error);
      }
    },

    async deleteFile(path: string): Promise<void> {
      try {
        const response = await fetch(`${basePath}?path=${encodeURIComponent(path)}`, {
          method: 'DELETE',
        });
        if (!response.ok) {
          throw new FileSystemError(`Failed to delete file: ${path}`);
        }
      } catch (error) {
        return handleError(error as Error);
      }
    },

    async listFiles(path: string): Promise<any> {
      try {
        const response = await fetch(`${basePath}?path=${encodeURIComponent(path)}`);
        if (!response.ok) {
          throw new FileSystemError(`Failed to list files in: ${path}`);
        }
        return await response.json();
      } catch (error) {
        return handleError(error as Error);
      }
    },
  };
};

export const createFileSystemExtension = (fileSystem: FileSystem) => {
  return EditorView.domEventHandlers({
    keydown: (event, view) => {
      // Handle Ctrl+S or Cmd+S for saving
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        // You can implement auto-save logic here
        return true;
      }
      return false;
    },
  });
}; 