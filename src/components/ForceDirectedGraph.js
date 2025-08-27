import React, { useEffect, useRef } from 'react';

const ForceDirectedGraph = () => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const nodesRef = useRef([]);
  const connectionsRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    const updateCanvasSize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    // Initialize nodes
    const centerX = canvas.offsetWidth / 2;
    const centerY = canvas.offsetHeight / 2;
    
    // Single orange color with different sizes
    const nodeTypes = [
      { color: '#ff8c42', size: 6, type: 'core' },
      { color: '#ff8c42', size: 4, type: 'secondary' },
      { color: '#ff8c42', size: 3, type: 'tertiary' },
      { color: '#ff8c42', size: 5, type: 'connector' },
      { color: '#ff8c42', size: 2, type: 'satellite' },
      { color: '#ff8c42', size: 7, type: 'hub' }
    ];

    nodesRef.current = [];
    for (let i = 0; i < 50; i++) {
      const nodeType = nodeTypes[Math.floor(Math.random() * nodeTypes.length)];

      // Distribute nodes in a more controlled area around center
      const margin = 100;
      const x = margin + Math.random() * (canvas.offsetWidth - 2 * margin);
      const y = margin + Math.random() * (canvas.offsetHeight - 2 * margin);

      nodesRef.current.push({
        id: i,
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 0.1,
        vy: (Math.random() - 0.5) * 0.1,
        ...nodeType,
        pulsePhase: Math.random() * Math.PI * 2,
        originalSize: nodeType.size,
        driftAngle: Math.random() * Math.PI * 2,
        driftSpeed: 0.0005 + Math.random() * 0.001
      });
    }

    // Create connections between nearby nodes (more sparse)
    connectionsRef.current = [];
    nodesRef.current.forEach((node, i) => {
      nodesRef.current.forEach((otherNode, j) => {
        if (i !== j) {
          const distance = Math.sqrt(
            Math.pow(node.x - otherNode.x, 2) +
            Math.pow(node.y - otherNode.y, 2)
          );

          // Larger distance threshold and lower probability for sparser connections
          if (distance < 120 && Math.random() > 0.85) {
            connectionsRef.current.push({
              from: i,
              to: j,
              strength: Math.random() * 0.3 + 0.2,
              fadePhase: Math.random() * Math.PI * 2,
              fadeSpeed: 0.01 + Math.random() * 0.02,
              baseFadeInterval: 3 + Math.random() * 4 // 3-7 seconds between fades
            });
          }
        }
      });
    });

    let time = 0;

    const animate = () => {
      time += 0.016; // ~60fps
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
      
      const nodes = nodesRef.current;
      const connections = connectionsRef.current;

      // Update node positions with gentle forces
      nodes.forEach((node, i) => {
        // Gentle random drift
        node.driftAngle += node.driftSpeed;
        const driftX = Math.cos(node.driftAngle) * 0.1;
        const driftY = Math.sin(node.driftAngle) * 0.1;

        // Stronger center attraction to keep nodes in view
        const centerForceX = (centerX - node.x) * 0.0008;
        const centerForceY = (centerY - node.y) * 0.0008;

        // Boundary forces to keep nodes on screen
        let boundaryForceX = 0;
        let boundaryForceY = 0;
        const margin = 50;

        if (node.x < margin) boundaryForceX = (margin - node.x) * 0.002;
        if (node.x > canvas.offsetWidth - margin) boundaryForceX = (canvas.offsetWidth - margin - node.x) * 0.002;
        if (node.y < margin) boundaryForceY = (margin - node.y) * 0.002;
        if (node.y > canvas.offsetHeight - margin) boundaryForceY = (canvas.offsetHeight - margin - node.y) * 0.002;

        // Repulsion from other nodes
        let repulsionX = 0;
        let repulsionY = 0;

        nodes.forEach((otherNode, j) => {
          if (i !== j) {
            const dx = node.x - otherNode.x;
            const dy = node.y - otherNode.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 60 && distance > 0) {
              const force = (60 - distance) * 0.0005;
              repulsionX += (dx / distance) * force;
              repulsionY += (dy / distance) * force;
            }
          }
        });

        // Connection forces
        connections.forEach(connection => {
          if (connection.from === i) {
            const otherNode = nodes[connection.to];
            const dx = otherNode.x - node.x;
            const dy = otherNode.y - node.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0) {
              const force = connection.strength * 0.001;
              node.vx += (dx / distance) * force;
              node.vy += (dy / distance) * force;
            }
          }
        });

        // Apply forces
        node.vx += driftX + centerForceX + boundaryForceX + repulsionX;
        node.vy += driftY + centerForceY + boundaryForceY + repulsionY;

        // Stronger damping to prevent runaway motion
        node.vx *= 0.95;
        node.vy *= 0.95;

        // Limit maximum velocity
        const maxVelocity = 0.5;
        const velocity = Math.sqrt(node.vx * node.vx + node.vy * node.vy);
        if (velocity > maxVelocity) {
          node.vx = (node.vx / velocity) * maxVelocity;
          node.vy = (node.vy / velocity) * maxVelocity;
        }

        // Update position
        node.x += node.vx;
        node.y += node.vy;

        // Hard boundaries to ensure nodes stay visible
        const hardMargin = 20;
        if (node.x < hardMargin) {
          node.x = hardMargin;
          node.vx = Math.abs(node.vx) * 0.5;
        }
        if (node.x > canvas.offsetWidth - hardMargin) {
          node.x = canvas.offsetWidth - hardMargin;
          node.vx = -Math.abs(node.vx) * 0.5;
        }
        if (node.y < hardMargin) {
          node.y = hardMargin;
          node.vy = Math.abs(node.vy) * 0.5;
        }
        if (node.y > canvas.offsetHeight - hardMargin) {
          node.y = canvas.offsetHeight - hardMargin;
          node.vy = -Math.abs(node.vy) * 0.5;
        }

        // Gentle pulsing
        node.pulsePhase += 0.015;
        node.size = node.originalSize + Math.sin(node.pulsePhase) * 0.5;
      });

      // Draw connections with animation
      connections.forEach(connection => {
        const fromNode = nodes[connection.from];
        const toNode = nodes[connection.to];

        const distance = Math.sqrt(
          Math.pow(fromNode.x - toNode.x, 2) +
          Math.pow(fromNode.y - toNode.y, 2)
        );

        if (distance < 150) {
          // Update fade animation
          connection.fadePhase += connection.fadeSpeed;

          // Random fade effect - some edges randomly become invisible
          let fadeMultiplier = 1;
          const fadeValue = Math.sin(connection.fadePhase);
          if (fadeValue < -0.8) {
            // Random chance for edge to fade out completely
            if (Math.random() < 0.02) { // 2% chance per frame
              fadeMultiplier = 0;
            }
          }

          ctx.beginPath();
          ctx.moveTo(fromNode.x, fromNode.y);
          ctx.lineTo(toNode.x, toNode.y);

          const baseOpacity = Math.max(0, (150 - distance) / 150) * connection.strength;
          const finalOpacity = baseOpacity * 0.9 * fadeMultiplier; // Increased opacity
          ctx.strokeStyle = `rgba(255, 140, 66, ${finalOpacity})`;
          ctx.lineWidth = 2.5; // Increased from 1.5 to 2.5
          ctx.stroke();
        }
      });

      // Draw nodes
      nodes.forEach(node => {
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.size, 0, Math.PI * 2);
        
        // Gradient fill
        const gradient = ctx.createRadialGradient(
          node.x, node.y, 0,
          node.x, node.y, node.size
        );
        gradient.addColorStop(0, node.color);
        gradient.addColorStop(1, node.color + '40');
        
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Subtle glow
        ctx.shadowColor = node.color;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', updateCanvasSize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="force-directed-graph"
      style={{
        width: '100%',
        height: '100%',
        background: 'transparent'
      }}
    />
  );
};

export default ForceDirectedGraph;
