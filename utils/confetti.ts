
export const triggerConfetti = () => {
  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.pointerEvents = 'none'; // Critical for clicks passing through
  canvas.style.zIndex = '9999';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  if (!ctx) {
      document.body.removeChild(canvas);
      return;
  }

  let width = window.innerWidth;
  let height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;

  const particles: Particle[] = [];
  const colors = ['#7c3aed', '#cba6f7', '#fbbf24', '#ef4444', '#10b981', '#3b82f6', '#ec4899'];

  class Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    color: string;
    alpha: number;
    size: number;
    rotation: number;
    rotationSpeed: number;

    constructor(x?: number, y?: number) {
      this.x = x ?? width / 2;
      this.y = y ?? height / 2;
      
      // Explosion mechanics
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 15 + 5; // Varied speed
      
      this.vx = Math.cos(angle) * speed;
      this.vy = Math.sin(angle) * speed;
      
      this.color = colors[Math.floor(Math.random() * colors.length)];
      this.alpha = 1;
      this.size = Math.random() * 10 + 4;
      this.rotation = Math.random() * 360;
      this.rotationSpeed = (Math.random() - 0.5) * 12;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.vy += 0.4; // Gravity
      this.vx *= 0.95; // Air resistance
      this.vy *= 0.95;
      this.alpha -= 0.012; // Slow fade
      this.rotation += this.rotationSpeed;
    }

    draw(ctx: CanvasRenderingContext2D) {
      ctx.save();
      ctx.globalAlpha = this.alpha;
      ctx.translate(this.x, this.y);
      ctx.rotate((this.rotation * Math.PI) / 180);
      ctx.fillStyle = this.color;
      ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
      ctx.restore();
    }
  }

  const startTime = Date.now();
  const duration = 2500; // 2.5 seconds duration

  const animate = () => {
    if (!document.body.contains(canvas)) return; // Safety check
    
    ctx.clearRect(0, 0, width, height);
    
    // Continuously spawn new particles for the duration
    if (Date.now() - startTime < duration) {
        // Spawn rate
        for (let i = 0; i < 4; i++) {
            particles.push(new Particle(width / 2, height / 2));
        }
    }
    
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.update();
      p.draw(ctx);
      if (p.alpha <= 0) {
        particles.splice(i, 1);
      }
    }

    // Continue animation loop if particles exist or we are still within duration
    if (particles.length > 0 || Date.now() - startTime < duration) {
      requestAnimationFrame(animate);
    } else {
      if (document.body.contains(canvas)) {
          document.body.removeChild(canvas);
      }
    }
  };

  animate();
  
  // Handle resize safety
  const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
  };
  window.addEventListener('resize', handleResize);
  
  // Cleanup event listener
  setTimeout(() => window.removeEventListener('resize', handleResize), duration + 2000);
};
