'use client';

import { ObsidianLayout } from '../components/ObsidianLayout';
import { Providers } from '../components/Providers';

export default function Home() {
  return (
    <Providers>
      <div className="app-container">
        <ObsidianLayout />
      </div>
      <style jsx>{`
        .app-container {
          height: 100vh;
          width: 100vw;
          overflow: hidden;
          display: flex;
        }
      `}</style>
    </Providers>
  );
} 