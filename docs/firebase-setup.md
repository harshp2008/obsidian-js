# Firebase Setup Guide for obsidian-js

This guide will walk you through setting up Firebase with obsidian-js for file storage and management.

## Prerequisites

- A Firebase account
- Node.js and npm installed
- Basic knowledge of React and TypeScript

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter a project name and follow the setup wizard
4. Enable Google Analytics if desired (optional)

## Step 2: Install Required Dependencies

```bash
npm install firebase @firebase/auth
```

## Step 3: Configure Firebase

Create a new file `src/lib/firebase.ts`:

```typescript
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = () => {
  signInWithPopup(auth, googleProvider).catch((error) => {
    console.error("Error signing in with Google:", error);
  });
};

export const signOutGoogle = () => {
  signOut(auth).catch((error) => {
    console.error("Error signing out:", error);
  });
};

export { app, auth, db, onAuthStateChanged, type User };
```

## Step 4: Set Up Environment Variables

Create a `.env.local` file in your project root:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## Step 5: Implement Firebase FileSystem

Create a new file `src/lib/firebaseFileSystem.ts`:

```typescript
import { db, auth } from "./firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";
import { FileSystem } from "obsidian-js";

class FileSystemError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FileSystemError";
  }
}

const getUserFilesPath = (userId: string) => `users/${userId}/files`;

export const createFirebaseFileSystem = (): FileSystem => {
  const currentUser = auth.currentUser;

  if (!currentUser) {
    throw new FileSystemError("Authentication required for file operations.");
  }

  const userId = currentUser.uid;
  const userFilesCollectionRef = collection(db, getUserFilesPath(userId));

  return {
    async readFile(path: string): Promise<string> {
      if (!userId) throw new FileSystemError("User not authenticated.");
      try {
        const fileDocRef = doc(userFilesCollectionRef, path);
        const fileDocSnap = await getDoc(fileDocRef);

        if (!fileDocSnap.exists()) {
          throw new FileSystemError(`File not found: ${path}`);
        }

        const fileData = fileDocSnap.data();
        return fileData?.content || "";
      } catch (error) {
        throw new FileSystemError(`Failed to read file: ${path}`);
      }
    },

    async writeFile(path: string, content: string): Promise<void> {
      if (!userId) throw new FileSystemError("User not authenticated.");

      const fileDocRef = doc(userFilesCollectionRef, path);

      try {
        const fileDocSnap = await getDoc(fileDocRef);

        if (fileDocSnap.exists()) {
          await updateDoc(fileDocRef, {
            content: content,
            updatedAt: new Date(),
          });
        } else {
          await setDoc(fileDocRef, {
            name: path,
            content: content,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      } catch (error) {
        throw new FileSystemError(`Failed to write file: ${path}`);
      }
    },

    async deleteFile(path: string): Promise<void> {
      if (!userId) throw new FileSystemError("User not authenticated.");
      try {
        const fileDocRef = doc(userFilesCollectionRef, path);
        await deleteDoc(fileDocRef);
      } catch (error) {
        throw new FileSystemError(`Failed to delete file: ${path}`);
      }
    },

    async listFiles(directoryPath: string): Promise<any> {
      if (!userId) throw new FileSystemError("User not authenticated.");
      try {
        const querySnapshot = await getDocs(userFilesCollectionRef);
        const files: { name: string }[] = [];
        querySnapshot.forEach((doc) => {
          files.push({ name: doc.id });
        });
        return files;
      } catch (error) {
        throw new FileSystemError("Failed to list files.");
      }
    },
  };
};
```

## Step 6: Initialize the FileSystem

In your app's entry point (e.g., `src/app/layout.tsx` or `src/pages/_app.tsx`):

```typescript
import { createFirebaseFileSystem } from "../lib/firebaseFileSystem";
import { setFilesystem } from "obsidian-js";

// Initialize the filesystem
const filesystem = createFirebaseFileSystem();
setFilesystem(filesystem);
```

## Step 7: Security Rules

Set up Firestore security rules in your Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/files/{fileId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Usage Example

```typescript
import { getFilesystem } from "obsidian-js";

// In your component
const handleSave = async () => {
  const fs = getFilesystem();
  try {
    await fs.writeFile("my-note.md", "# Hello from Firebase!");
    const content = await fs.readFile("my-note.md");
    console.log("Saved content:", content);
  } catch (error) {
    console.error("Error:", error);
  }
};
```

## Troubleshooting

1. **Authentication Issues**

   - Ensure you've enabled Google Authentication in Firebase Console
   - Check that your environment variables are correctly set
   - Verify that the user is properly authenticated before file operations

2. **File Operation Errors**

   - Check Firestore security rules
   - Verify file paths are valid
   - Ensure proper error handling in your components

3. **Build Issues**
   - Make sure all dependencies are installed
   - Check TypeScript configurations
   - Verify import paths are correct

## Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Authentication](https://firebase.google.com/docs/auth)
