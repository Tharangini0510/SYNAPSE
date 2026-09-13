// =============================================================
// NeuralBackground.jsx – Interactive Canvas Constellation Engine
// =============================================================
import { useEffect, useRef } from 'react';
import styles from './NeuralBackground.module.css';

export default function NeuralBackground({ theme }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let width = (canvas.width = canvas.parentElement.offsetWidth);
    let height = (canvas.height = canvas.parentElement.offsetHeight);

    // Mouse tracking state
    const mouse = {
      x: null,
      y: null,
      radius: 160,
    };

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };

    const handleMouseLeave = () => {
      mouse.x = null;
      mouse.y = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    const handleResize = () => {
      if (!canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.offsetWidth;
      height = canvas.height = canvas.parentElement.offsetHeight;
      initNodes();
    };

    window.addEventListener('resize', handleResize);

    // Node particle definition
    class Node {
      constructor(x, y) {
        this.x = x;
        this.y = y;
        this.baseRadius = Math.random() * 2 + 1.5;
        this.radius = this.baseRadius;
        this.vx = (Math.random() - 0.5) * 0.6;
        this.vy = (Math.random() - 0.5) * 0.6;
        this.pulse = Math.random() * Math.PI * 2;
        this.pulseSpeed = 0.02 + Math.random() * 0.02;
        // Accent color palette selection
        const rand = Math.random();
        this.colorType = rand > 0.7 ? 'primary' : rand > 0.4 ? 'secondary' : 'accent';
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        // Bounce off canvas edges
        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;

        // Pulse size
        this.pulse += this.pulseSpeed;

        // Mouse attraction / repulsion physics
        if (mouse.x !== null && mouse.y !== null) {
          const dx = mouse.x - this.x;
          const dy = mouse.y - this.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < mouse.radius) {
            const forceDirectionX = dx / distance;
            const forceDirectionY = dy / distance;
            const maxDistance = mouse.radius;
            const force = (maxDistance - distance) / maxDistance;
            const direction = 1; // gentle attraction
            this.x += forceDirectionX * force * direction * 1.5;
            this.y += forceDirectionY * force * direction * 1.5;
          }
        }
      }

      draw(isDark) {
        ctx.beginPath();
        const currentRadius = this.baseRadius + Math.sin(this.pulse) * 0.8;
        ctx.arc(this.x, this.y, Math.max(0.5, currentRadius), 0, Math.PI * 2);

        let fillStyle;
        if (isDark) {
          fillStyle =
            this.colorType === 'primary'
              ? 'rgba(129, 140, 248, 0.85)'
              : this.colorType === 'secondary'
              ? 'rgba(56, 189, 248, 0.85)'
              : 'rgba(52, 211, 153, 0.85)';
        } else {
          fillStyle =
            this.colorType === 'primary'
              ? 'rgba(79, 70, 229, 0.75)'
              : this.colorType === 'secondary'
              ? 'rgba(37, 99, 235, 0.75)'
              : 'rgba(16, 185, 129, 0.75)';
        }

        ctx.fillStyle = fillStyle;
        ctx.shadowColor = fillStyle;
        ctx.shadowBlur = isDark ? 8 : 4;
        ctx.fill();
        ctx.shadowBlur = 0; // reset for performance
      }
    }

    // Signals traveling on lines
    class PulseSignal {
      constructor(fromNode, toNode) {
        this.from = fromNode;
        this.to = toNode;
        this.progress = 0;
        this.speed = 0.008 + Math.random() * 0.012;
      }

      update() {
        this.progress += this.speed;
        return this.progress < 1;
      }

      draw(isDark) {
        const currentX = this.from.x + (this.to.x - this.from.x) * this.progress;
        const currentY = this.from.y + (this.to.y - this.from.y) * this.progress;

        ctx.beginPath();
        ctx.arc(currentX, currentY, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = isDark ? '#38BDF8' : '#6366F1';
        ctx.shadowColor = isDark ? '#38BDF8' : '#6366F1';
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    let nodes = [];
    let pulses = [];

    const initNodes = () => {
      nodes = [];
      pulses = [];
      const count = Math.min(Math.floor((width * height) / 16000), 75);
      for (let i = 0; i < count; i++) {
        nodes.push(
          new Node(Math.random() * width, Math.random() * height)
        );
      }
    };

    initNodes();

    const maxDistance = 140;

    const animate = () => {
      const isDark =
        theme === 'dark' ||
        document.documentElement.getAttribute('data-theme') === 'dark';

      ctx.clearRect(0, 0, width, height);

      // Update and draw nodes
      for (let i = 0; i < nodes.length; i++) {
        nodes[i].update();
        nodes[i].draw(isDark);

        // Draw connections to nearby nodes
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxDistance) {
            const alpha = (1 - dist / maxDistance) * (isDark ? 0.35 : 0.22);
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);

            ctx.strokeStyle = isDark
              ? `rgba(129, 140, 248, ${alpha})`
              : `rgba(79, 70, 229, ${alpha})`;
            ctx.lineWidth = 1;
            ctx.stroke();

            // Randomly spawn pulses on connected nodes
            if (Math.random() < 0.0008 && pulses.length < 12) {
              pulses.push(new PulseSignal(nodes[i], nodes[j]));
            }
          }
        }
      }

      // Update and draw pulse signals
      for (let p = pulses.length - 1; p >= 0; p--) {
        if (!pulses[p].update()) {
          pulses.splice(p, 1);
        } else {
          pulses[p].draw(isDark);
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [theme]);

  return (
    <div className={styles.container}>
      <canvas ref={canvasRef} className={styles.canvas} />
      <div className={styles.glowTopLeft} />
      <div className={styles.glowBottomRight} />
    </div>
  );
}
