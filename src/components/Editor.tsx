'use client';

import { CodeMirrorEditor } from 'obsidian-js';
import type { CodeMirrorEditorProps } from 'obsidian-js';

export function Editor(props: CodeMirrorEditorProps) {
  return <CodeMirrorEditor {...props} />;
} 