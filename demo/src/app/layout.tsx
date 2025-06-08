import './globals.css';
import '../../../src/app/obsidian-editor/CodeMirrorEditor.css';
import { ThemeProvider } from '../../../src/contexts/ThemeContext';
import type { Metadata } from 'next';

// Import theme stylesheets directly (don't duplicate with link tags)
import '../../../public/css/obsidian.css';
import '../../../public/css/vanilla-light.css';
import '../../../public/css/vanilla-dark.css';

export const metadata: Metadata = {
  title: 'Obsidian-JS Demo',
  description: 'A demo of the Obsidian-JS markdown editor',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* CSS is already imported above, don't duplicate with link tags */}
      </head>
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
} 