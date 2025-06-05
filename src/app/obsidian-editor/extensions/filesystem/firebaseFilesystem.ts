import { Filesystem, FileMetadata } from '../../../types/filesystem';
import { getDownloadURL, ref, uploadBytes, deleteObject, listAll, getMetadata } from 'firebase/storage';

// Users must initialize Firebase and pass in the storage instance
export class FirebaseFilesystem implements Filesystem {
  constructor(private storage: any) {}

  async readFile(path: string): Promise<string> {
    const fileRef = ref(this.storage, path);
    const url = await getDownloadURL(fileRef);
    const response = await fetch(url);
    return await response.text();
  }

  async writeFile(path: string, data: string | ArrayBuffer): Promise<void> {
    const fileRef = ref(this.storage, path);
    let blob: Blob;
    if (typeof data === 'string') {
      blob = new Blob([data], { type: 'text/plain' });
    } else {
      blob = new Blob([data]);
    }
    await uploadBytes(fileRef, blob);
  }

  async deleteFile(path: string): Promise<void> {
    const fileRef = ref(this.storage, path);
    await deleteObject(fileRef);
  }

  async listFiles(directory: string): Promise<FileMetadata[]> {
    const dirRef = ref(this.storage, directory);
    const res = await listAll(dirRef);
    const files: FileMetadata[] = await Promise.all(res.items.map(async (itemRef) => {
      const meta = await getMetadata(itemRef);
      return {
        name: itemRef.name,
        path: itemRef.fullPath,
        size: meta.size,
        type: 'file',
        lastModified: meta.updated ? new Date(meta.updated).getTime() : undefined,
      };
    }));
    return files;
  }
} 