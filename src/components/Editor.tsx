'use client';

import React from 'react';
import CodeMirrorEditor, { CodeMirrorEditorProps } from '../app/obsidian-editor/CodeMirrorEditor';

export function Editor(props: CodeMirrorEditorProps) {
  return <CodeMirrorEditor {...props} />;
} 