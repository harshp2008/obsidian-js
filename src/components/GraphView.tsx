'use client';

import React, { useEffect, useRef } from 'react';

interface GraphNode {
  id: string;
  name: string;
  connections: string[];
}

interface GraphViewProps {
  activeNode?: string;
}

export function GraphView({ activeNode = 'Chemistry IA version 2' }: GraphViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Demo data
  const nodes: GraphNode[] = [
    { id: 'chemistry-ia-v2', name: 'Chemistry IA version 2', connections: ['chemistry-ia', 'chemistry-ia-v3', 'chem-ia-crisis-2'] },
    { id: 'chemistry-ia', name: 'Chemistry IA', connections: ['chemistry-ia-v2'] },
    { id: 'chemistry-ia-v3', name: 'Chemistry IA version 3', connections: ['chemistry-ia-v2'] },
    { id: 'chem-ia', name: 'Chem IA', connections: [] },
    { id: 'chem-ia-crisis-1', name: 'Chem IA (CRISIS) 1', connections: ['chem-ia-crisis-2'] },
    { id: 'chem-ia-crisis-2', name: 'Chem IA (CRISIS) 2', connections: ['chemistry-ia-v2', 'chem-ia-crisis-1'] },
    { id: 'co-h2o-structure', name: 'Co(H20)6 structure', connections: ['chemistry-ia-v2'] },
    { id: 'colour-reaction', name: 'coluor_reaction', connections: ['chemistry-ia-v2'] },
  ];

  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas dimensions
    const resizeCanvas = () => {
      if (canvas) {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
        drawGraph();
      }
    };
    
    // Initial size and resize listener
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    function drawGraph() {
      if (!ctx || !canvas) return;
      
      const width = canvas.width;
      const height = canvas.height;
      
      // Clear canvas
      ctx.clearRect(0, 0, width, height);
      
      // Calculate node positions (in a circle for simplicity)
      const radius = Math.min(width, height) * 0.35;
      const centerX = width / 2;
      const centerY = height / 2;
      
      const nodePositions = new Map();
      
      nodes.forEach((node, i) => {
        // Active node in the center, others around in a circle
        if (node.name === activeNode) {
          nodePositions.set(node.id, { x: centerX, y: centerY });
        } else {
          const angle = (i / (nodes.length - 1)) * Math.PI * 2;
          const x = centerX + radius * Math.cos(angle);
          const y = centerY + radius * Math.sin(angle);
          nodePositions.set(node.id, { x, y });
        }
      });
      
      // Draw connections
      ctx.strokeStyle = 'rgba(123, 108, 217, 0.3)';
      ctx.lineWidth = 1;
      
      nodes.forEach(node => {
        const startPosition = nodePositions.get(node.id);
        
        node.connections.forEach(connId => {
          const endPosition = nodePositions.get(connId);
          if (startPosition && endPosition) {
            ctx.beginPath();
            ctx.moveTo(startPosition.x, startPosition.y);
            ctx.lineTo(endPosition.x, endPosition.y);
            ctx.stroke();
          }
        });
      });
      
      // Draw nodes
      nodes.forEach(node => {
        const position = nodePositions.get(node.id);
        if (!position) return;
        
        const isActive = node.name === activeNode;
        
        // Draw circle
        ctx.beginPath();
        ctx.arc(position.x, position.y, isActive ? 20 : 12, 0, Math.PI * 2);
        
        if (isActive) {
          ctx.fillStyle = 'rgba(123, 108, 217, 0.9)';
        } else {
          ctx.fillStyle = 'rgba(123, 108, 217, 0.6)';
        }
        
        ctx.fill();
        
        // Draw labels for connected nodes or the active node
        if (isActive || node.connections.includes(nodes.find(n => n.name === activeNode)?.id || '')) {
          ctx.fillStyle = isActive ? '#ffffff' : 'rgba(var(--foreground-rgb), 0.9)';
          ctx.font = isActive ? 'bold 12px sans-serif' : '10px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(node.name.substring(0, 15) + (node.name.length > 15 ? '...' : ''), position.x, position.y + (isActive ? 35 : 25));
        }
      });
    }
    
    drawGraph();
    
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [activeNode]);
  
  const containerStyles: React.CSSProperties = {
    width: '100%',
    height: '100%',
    backgroundColor: 'var(--background)',
    borderRadius: '4px',
    overflow: 'hidden'
  };
  
  const canvasStyles: React.CSSProperties = {
    width: '100%',
    height: '100%',
    display: 'block'
  };
  
  return (
    <div className="graph-view-container" style={containerStyles}>
      <canvas ref={canvasRef} className="graph-canvas" style={canvasStyles} />
    </div>
  );
} 