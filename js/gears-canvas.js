/**
 * GEAR TRAIN INTERACTIVE SIMULATOR (Canvas 2D Physics)
 * Kuntal Ghosh Mechanical Engineering Portfolio
 */

class GearTrainSimulator {
  constructor(canvasId, options = {}) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.rpm = options.rpm || 60;
    this.showPitchCircles = options.showPitchCircles !== false;
    this.showDimensions = options.showDimensions !== false;
    this.isMini = options.isMini || false;
    this.angle = 0;
    this.isRunning = true;
    this.isDragging = false;
    this.lastMouseX = 0;

    this.initGears();
    this.resize();
    this.bindEvents();
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  initGears() {
    // 3 Meshing Gears System: Driving Gear -> Idler Gear -> Driven Gear
    this.gears = [
      { id: 1, x: 0.28, y: 0.5, teeth: 24, radius: 60, module: 5, color: '#00f0ff', dir: 1, label: 'DRIVE (Z1=24)' },
      { id: 2, x: 0.52, y: 0.42, teeth: 16, radius: 40, module: 5, color: '#ff9d00', dir: -1, label: 'IDLER (Z2=16)' },
      { id: 3, x: 0.76, y: 0.56, teeth: 32, radius: 80, module: 5, color: '#00ff88', dir: 1, label: 'DRIVEN (Z3=32)' }
    ];
  }

  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.width = this.canvas.width = rect.width || 600;
    this.height = this.canvas.height = rect.height || 360;
  }

  bindEvents() {
    window.addEventListener('resize', () => this.resize());

    // Mouse & Touch drag interaction (Mobile Optimized)
    this.canvas.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.lastMouseX = e.clientX;
    });

    window.addEventListener('mouseup', () => { this.isDragging = false; });

    window.addEventListener('mousemove', (e) => {
      if (this.isDragging) {
        const deltaX = e.clientX - this.lastMouseX;
        this.angle += deltaX * 0.02;
        this.lastMouseX = e.clientX;
      }
    });

    // Touch events for mobile phones and tablets
    this.canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length > 0) {
        this.isDragging = true;
        this.lastMouseX = e.touches[0].clientX;
      }
    }, { passive: true });

    window.addEventListener('touchend', () => { this.isDragging = false; });

    this.canvas.addEventListener('touchmove', (e) => {
      if (this.isDragging && e.touches.length > 0) {
        const deltaX = e.touches[0].clientX - this.lastMouseX;
        this.angle += deltaX * 0.02;
        this.lastMouseX = e.touches[0].clientX;
      }
    }, { passive: true });

    // Lab Controls
    const rpmSlider = document.getElementById('gear-rpm-slider');
    if (rpmSlider) {
      rpmSlider.addEventListener('input', (e) => {
        this.rpm = parseFloat(e.target.value);
        const rpmVal = document.getElementById('gear-rpm-val');
        if (rpmVal) rpmVal.textContent = this.rpm + ' RPM';
        this.updateReadouts();
      });
    }

    const pitchToggle = document.getElementById('gear-pitch-toggle');
    if (pitchToggle) {
      pitchToggle.addEventListener('change', (e) => {
        this.showPitchCircles = e.target.checked;
      });
    }
  }

  updateReadouts() {
    const speedRatio = (this.gears[0].teeth / this.gears[2].teeth).toFixed(2);
    const outputRpm = (this.rpm * (this.gears[0].teeth / this.gears[2].teeth)).toFixed(1);
    const ratioEl = document.getElementById('gear-ratio-val');
    const outRpmEl = document.getElementById('gear-out-rpm-val');
    if (ratioEl) ratioEl.textContent = `1 : ${(1/speedRatio).toFixed(2)}`;
    if (outRpmEl) outRpmEl.textContent = `${outputRpm} RPM`;
  }

  drawGear(gear, currentAngle) {
    const ctx = this.ctx;
    const cx = this.width * gear.x;
    const cy = this.height * gear.y;
    const r = gear.radius * (this.width / 700);
    const teeth = gear.teeth;
    const pitchR = r;
    const outerR = r + 8;
    const innerR = r - 10;
    const rootR = r - 14;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(currentAngle * gear.dir * (this.gears[0].teeth / gear.teeth));

    // Draw Involute Teeth Profile
    ctx.beginPath();
    for (let i = 0; i < teeth; i++) {
      const a = (i * 2 * Math.PI) / teeth;
      const step = Math.PI / teeth;
      const a1 = a - step * 0.45;
      const a2 = a - step * 0.2;
      const a3 = a + step * 0.2;
      const a4 = a + step * 0.45;

      if (i === 0) {
        ctx.moveTo(Math.cos(a1) * innerR, Math.sin(a1) * innerR);
      } else {
        ctx.lineTo(Math.cos(a1) * innerR, Math.sin(a1) * innerR);
      }
      ctx.lineTo(Math.cos(a2) * outerR, Math.sin(a2) * outerR);
      ctx.lineTo(Math.cos(a3) * outerR, Math.sin(a3) * outerR);
      ctx.lineTo(Math.cos(a4) * innerR, Math.sin(a4) * innerR);
      ctx.lineTo(Math.cos(a + step) * rootR, Math.sin(a + step) * rootR);
    }
    ctx.closePath();

    // Shading & Stroke
    ctx.fillStyle = '#0f1c38';
    ctx.fill();
    ctx.strokeStyle = gear.color;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Body Webbing & Weight-reduction holes
    const holeCount = teeth >= 24 ? 5 : 3;
    const holeDist = r * 0.55;
    const holeR = r * 0.18;
    ctx.fillStyle = '#070b14';
    for (let h = 0; h < holeCount; h++) {
      const ha = (h * 2 * Math.PI) / holeCount;
      ctx.beginPath();
      ctx.arc(Math.cos(ha) * holeDist, Math.sin(ha) * holeDist, holeR, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Shaft Bore & Keyway
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.25, 0, Math.PI * 2);
    ctx.fillStyle = '#17274a';
    ctx.fill();
    ctx.strokeStyle = gear.color;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Keyway slot
    ctx.fillStyle = '#070b14';
    ctx.fillRect(-r * 0.05, -r * 0.32, r * 0.1, r * 0.15);

    // Center Crosshair
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-r * 0.15, 0); ctx.lineTo(r * 0.15, 0);
    ctx.moveTo(0, -r * 0.15); ctx.lineTo(0, r * 0.15);
    ctx.stroke();

    ctx.restore();

    // Pitch Circle Line (Drafting annotation)
    if (this.showPitchCircles && !this.isMini) {
      ctx.save();
      ctx.beginPath();
      ctx.setLineDash([4, 4]);
      ctx.arc(cx, cy, pitchR, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Gear Tag
      ctx.fillStyle = gear.color;
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillText(gear.label, cx - 35, cy + pitchR + 18);
      ctx.restore();
    }
  }

  animate() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    // Draw background blueprint grid
    this.drawBlueprintGrid();

    // Update rotation
    if (!this.isDragging && this.isRunning) {
      this.angle += (this.rpm * Math.PI * 2) / (60 * 60);
    }

    // Draw all meshing gears
    this.gears.forEach((gear) => {
      this.drawGear(gear, this.angle);
    });

    // Pitch Line Tangents
    if (this.showPitchCircles && !this.isMini) {
      this.drawPitchLineTangents();
    }

    requestAnimationFrame(this.animate);
  }

  drawBlueprintGrid() {
    const ctx = this.ctx;
    const step = 25;
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x < this.width; x += step) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, this.height); ctx.stroke();
    }
    for (let y = 0; y < this.height; y += step) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(this.width, y); ctx.stroke();
    }
    ctx.restore();
  }

  drawPitchLineTangents() {
    const ctx = this.ctx;
    const g1 = this.gears[0], g2 = this.gears[1], g3 = this.gears[2];
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 157, 0, 0.4)';
    ctx.setLineDash([2, 4]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.width * g1.x, this.height * g1.y);
    ctx.lineTo(this.width * g2.x, this.height * g2.y);
    ctx.lineTo(this.width * g3.x, this.height * g3.y);
    ctx.stroke();
    ctx.restore();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  // Mini HUD Hero canvas
  if (document.getElementById('hero-hud-canvas')) {
    new GearTrainSimulator('hero-hud-canvas', { rpm: 45, isMini: true, showPitchCircles: false });
  }
  // Main Lab Gear simulator
  if (document.getElementById('gears-lab-canvas')) {
    window.mainGearSim = new GearTrainSimulator('gears-lab-canvas', { rpm: 60, isMini: false, showPitchCircles: true });
  }
});
