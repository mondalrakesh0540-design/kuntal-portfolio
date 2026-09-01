/**
 * COMMERCIAL-GRADE CNC G-CODE & TOOLPATH MACHINING STUDIO
 * Interactive G-Code Editor + Multi-Pattern Machining Simulator
 */

class CNCSimulator {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    this.presets = {
      profile: [
        { code: 'N01 G21 G90 G17', desc: 'Metric, Absolute, XY plane', type: 'setup', x: 0, y: 0, z: 10 },
        { code: 'N02 G00 X15.0 Y15.0 Z5.0', desc: 'Rapid to start clearance', type: 'rapid', x: 15, y: 15, z: 5 },
        { code: 'N03 G01 Z-2.0 F150', desc: 'Plunge end mill to Z -2', type: 'cut', x: 15, y: 15, z: -2 },
        { code: 'N04 G01 X85.0 Y15.0 F300', desc: 'Linear milling pass 1', type: 'cut', x: 85, y: 15, z: -2 },
        { code: 'N05 G02 X115.0 Y45.0 R30.0', desc: 'CW Circular interpolation arc', type: 'arc', x: 115, y: 45, z: -2 },
        { code: 'N06 G01 X115.0 Y95.0', desc: 'Linear contour right wall', type: 'cut', x: 115, y: 95, z: -2 },
        { code: 'N07 G03 X85.0 Y125.0 R30.0', desc: 'CCW Circular corner fillet', type: 'arc', x: 85, y: 125, z: -2 },
        { code: 'N08 G01 X15.0 Y125.0', desc: 'Top edge face milling', type: 'cut', x: 15, y: 125, z: -2 },
        { code: 'N09 G01 X15.0 Y15.0', desc: 'Complete closed contour', type: 'cut', x: 15, y: 15, z: -2 },
        { code: 'N10 G00 Z15.0', desc: 'Retract spindle to clearance', type: 'rapid', x: 15, y: 15, z: 15 },
        { code: 'N11 G00 X0.0 Y0.0 M05', desc: 'Return home, spindle stop', type: 'rapid', x: 0, y: 0, z: 15 },
        { code: 'N12 M30', desc: 'Program end & rewind', type: 'end', x: 0, y: 0, z: 15 }
      ],
      pocket: [
        { code: 'N01 G21 G90 G17', desc: 'Metric, Absolute XY', type: 'setup', x: 0, y: 0, z: 10 },
        { code: 'N02 G00 X60.0 Y60.0 Z5.0', desc: 'Rapid to pocket center', type: 'rapid', x: 60, y: 60, z: 5 },
        { code: 'N03 G01 Z-3.0 F120', desc: 'Helical plunge', type: 'cut', x: 60, y: 60, z: -3 },
        { code: 'N04 G02 X60.0 Y60.0 I15.0 J0.0', desc: 'Circular pocket spiral 1', type: 'arc', x: 60, y: 60, z: -3 },
        { code: 'N05 G02 X60.0 Y60.0 I30.0 J0.0', desc: 'Circular pocket spiral 2', type: 'arc', x: 60, y: 60, z: -3 },
        { code: 'N06 G02 X60.0 Y60.0 I45.0 J0.0', desc: 'Finish perimeter cut', type: 'arc', x: 60, y: 60, z: -3 },
        { code: 'N07 G00 Z15.0 M05', desc: 'Retract & stop', type: 'rapid', x: 60, y: 60, z: 15 },
        { code: 'N08 M30', desc: 'End of program', type: 'end', x: 0, y: 0, z: 15 }
      ]
    };

    this.program = this.presets.profile;
    this.currentStep = 0;
    this.progress = 0;
    this.speed = 1.0;
    this.isPlaying = true;
    this.cutPath = [];
    this.sparks = [];

    this.currentPos = { x: 0, y: 0, z: 10 };
    this.targetPos = { x: 0, y: 0, z: 10 };
    this.startPos = { x: 0, y: 0, z: 10 };

    this.resize();
    this.initGCodeConsole();
    this.bindEvents();
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.width = this.canvas.width = rect.width || 600;
    this.height = this.canvas.height = rect.height || 450;
  }

  initGCodeConsole() {
    const consoleEl = document.getElementById('cnc-gcode-lines');
    if (!consoleEl) return;
    consoleEl.innerHTML = '';
    this.program.forEach((line, idx) => {
      const div = document.createElement('div');
      div.className = `gcode-line ${idx === 0 ? 'active' : ''}`;
      div.id = `gcode-l-${idx}`;
      div.textContent = `${line.code} (${line.desc})`;
      consoleEl.appendChild(div);
    });
  }

  loadPreset(name) {
    if (this.presets[name]) {
      this.program = this.presets[name];
      this.reset();
      this.initGCodeConsole();
    }
  }

  bindEvents() {
    window.addEventListener('resize', () => this.resize());

    const playBtn = document.getElementById('cnc-play-btn');
    if (playBtn) {
      playBtn.addEventListener('click', () => {
        if (window.mechAudio) window.mechAudio.playMechanicalClick(1100);
        this.isPlaying = !this.isPlaying;
        playBtn.textContent = this.isPlaying ? 'PAUSE' : 'PLAY';
      });
    }

    const resetBtn = document.getElementById('cnc-reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (window.mechAudio) window.mechAudio.playHydraulicWhoosh();
        this.reset();
      });
    }

    const presetSelect = document.getElementById('cnc-preset-select');
    if (presetSelect) {
      presetSelect.addEventListener('change', (e) => {
        this.loadPreset(e.target.value);
      });
    }

    const feedSlider = document.getElementById('cnc-feed-slider');
    if (feedSlider) {
      feedSlider.addEventListener('input', (e) => {
        this.speed = parseFloat(e.target.value);
        const feedVal = document.getElementById('cnc-feed-val');
        if (feedVal) feedVal.textContent = `${(this.speed * 100).toFixed(0)}%`;
      });
    }
  }

  reset() {
    this.currentStep = 0;
    this.progress = 0;
    this.cutPath = [];
    this.sparks = [];
    this.currentPos = { x: 0, y: 0, z: 10 };
    this.highlightGCode(0);
  }

  highlightGCode(stepIdx) {
    this.program.forEach((_, idx) => {
      const el = document.getElementById(`gcode-l-${idx}`);
      if (el) {
        if (idx === stepIdx) {
          el.classList.add('active');
          el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        } else {
          el.classList.remove('active');
        }
      }
    });
  }

  worldToCanvas(x, y) {
    const scale = Math.min(this.width / 180, this.height / 180);
    const offsetX = (this.width - 130 * scale) / 2 + 10;
    const offsetY = (this.height - 140 * scale) / 2 + 15;
    return {
      cx: offsetX + x * scale,
      cy: this.height - (offsetY + y * scale)
    };
  }

  update() {
    if (!this.isPlaying) return;

    const cmd = this.program[this.currentStep];
    const prevCmd = this.program[Math.max(0, this.currentStep - 1)];

    this.startPos = { x: prevCmd.x, y: prevCmd.y, z: prevCmd.z };
    this.targetPos = { x: cmd.x, y: cmd.y, z: cmd.z };

    const stepSpeed = cmd.type === 'rapid' ? 0.04 * this.speed : 0.018 * this.speed;
    this.progress += stepSpeed;

    if (this.progress >= 1) {
      this.progress = 0;
      this.currentPos = { ...this.targetPos };
      this.currentStep++;

      if (cmd.type === 'rapid' && window.mechAudio) {
        window.mechAudio.playMechanicalClick(900);
      }

      if (this.currentStep >= this.program.length) {
        this.currentStep = 0;
        this.cutPath = [];
      }
      this.highlightGCode(this.currentStep);
    } else {
      this.currentPos.x = this.startPos.x + (this.targetPos.x - this.startPos.x) * this.progress;
      this.currentPos.y = this.startPos.y + (this.targetPos.y - this.startPos.y) * this.progress;
      this.currentPos.z = this.startPos.z + (this.targetPos.z - this.startPos.z) * this.progress;

      if (cmd.type === 'cut' || cmd.type === 'arc') {
        this.cutPath.push({ x: this.currentPos.x, y: this.currentPos.y });
        if (Math.random() < 0.45) {
          const pt = this.worldToCanvas(this.currentPos.x, this.currentPos.y);
          this.sparks.push({
            x: pt.cx,
            y: pt.cy,
            vx: (Math.random() - 0.5) * 5,
            vy: (Math.random() - 0.5) * 5 - 2,
            life: 1.0
          });
          if (window.mechAudio && Math.random() < 0.15) {
            window.mechAudio.playCncPulse();
          }
        }
      }
    }

    const xEl = document.getElementById('cnc-dro-x');
    const yEl = document.getElementById('cnc-dro-y');
    const zEl = document.getElementById('cnc-dro-z');
    const fEl = document.getElementById('cnc-dro-f');
    if (xEl) xEl.textContent = `X: ${this.currentPos.x.toFixed(3)}`;
    if (yEl) yEl.textContent = `Y: ${this.currentPos.y.toFixed(3)}`;
    if (zEl) zEl.textContent = `Z: ${this.currentPos.z.toFixed(3)}`;
    if (fEl) fEl.textContent = cmd.type === 'rapid' ? 'F: RAPID G00' : 'F: 300 mm/min';
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // CNC Grid
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < this.width; x += 25) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, this.height); ctx.stroke();
    }
    for (let y = 0; y < this.height; y += 25) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(this.width, y); ctx.stroke();
    }

    // Workpiece Billet
    const b0 = this.worldToCanvas(0, 140);
    const b1 = this.worldToCanvas(130, 0);
    const bWidth = b1.cx - b0.cx;
    const bHeight = b1.cy - b0.cy;

    ctx.fillStyle = '#0a1428';
    ctx.fillRect(b0.cx, b0.cy, bWidth, bHeight);
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(b0.cx, b0.cy, bWidth, bHeight);

    // Fixture Clamps
    ctx.fillStyle = '#ff9d00';
    ctx.fillRect(b0.cx - 8, b0.cy + 10, 14, 18);
    ctx.fillRect(b1.cx - 6, b0.cy + 10, 14, 18);
    ctx.fillRect(b0.cx - 8, b1.cy - 28, 14, 18);
    ctx.fillRect(b1.cx - 6, b1.cy - 28, 14, 18);

    // WCS Machine Zero (G54)
    const origin = this.worldToCanvas(0, 0);
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(origin.cx - 15, origin.cy); ctx.lineTo(origin.cx + 15, origin.cy);
    ctx.moveTo(origin.cx, origin.cy - 15); ctx.lineTo(origin.cx, origin.cy + 15);
    ctx.stroke();
    ctx.fillStyle = '#00ff88';
    ctx.font = '9px "JetBrains Mono", monospace';
    ctx.fillText('WCS (0,0)', origin.cx + 5, origin.cy - 5);

    // Cut Path
    if (this.cutPath.length > 1) {
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      const p0 = this.worldToCanvas(this.cutPath[0].x, this.cutPath[0].y);
      ctx.moveTo(p0.cx, p0.cy);
      for (let i = 1; i < this.cutPath.length; i++) {
        const pt = this.worldToCanvas(this.cutPath[i].x, this.cutPath[i].y);
        ctx.lineTo(pt.cx, pt.cy);
      }
      ctx.stroke();

      ctx.strokeStyle = '#ff9d00';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Spark Particles
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const sp = this.sparks[i];
      sp.x += sp.vx;
      sp.y += sp.vy;
      sp.life -= 0.05;
      if (sp.life <= 0) {
        this.sparks.splice(i, 1);
      } else {
        ctx.fillStyle = `rgba(255, 180, 0, ${sp.life})`;
        ctx.beginPath(); ctx.arc(sp.x, sp.y, 2, 0, Math.PI * 2); ctx.fill();
      }
    }

    // Toolhead
    const toolPt = this.worldToCanvas(this.currentPos.x, this.currentPos.y);
    const isCutting = this.currentPos.z <= 0;

    ctx.fillStyle = '#1e293b';
    ctx.beginPath(); ctx.arc(toolPt.cx, toolPt.cy, 16, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#64748b'; ctx.lineWidth = 2; ctx.stroke();

    ctx.fillStyle = isCutting ? '#ff9d00' : '#00f0ff';
    ctx.beginPath(); ctx.arc(toolPt.cx, toolPt.cy, 6, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5; ctx.stroke();

    ctx.strokeStyle = isCutting ? '#ff3b30' : 'rgba(0, 240, 255, 0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(toolPt.cx - 24, toolPt.cy); ctx.lineTo(toolPt.cx + 24, toolPt.cy);
    ctx.moveTo(toolPt.cx, toolPt.cy - 24); ctx.lineTo(toolPt.cx, toolPt.cy + 24);
    ctx.stroke();
  }

  animate() {
    this.update();
    this.draw();
    requestAnimationFrame(this.animate);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('cnc-lab-canvas')) {
    window.mainCncSim = new CNCSimulator('cnc-lab-canvas');
  }
});
