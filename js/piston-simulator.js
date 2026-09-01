/**
 * 4-STROKE RECIPROCATING ENGINE & KINEMATICS SIMULATOR
 * Kuntal Ghosh Mechanical Engineering Portfolio
 */

class PistonEngineSimulator {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.rpm = 1200;
    this.crankAngle = 0;
    this.crankRadius = 45;
    this.rodLength = 135;
    this.bore = 68;
    this.stroke = this.crankRadius * 2;
    this.isPlaying = true;

    this.resize();
    this.bindEvents();
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.width = this.canvas.width = rect.width || 600;
    this.height = this.canvas.height = rect.height || 450;
  }

  bindEvents() {
    window.addEventListener('resize', () => this.resize());

    const rpmSlider = document.getElementById('piston-rpm-slider');
    if (rpmSlider) {
      rpmSlider.addEventListener('input', (e) => {
        this.rpm = parseFloat(e.target.value);
        const valEl = document.getElementById('piston-rpm-val');
        if (valEl) valEl.textContent = `${this.rpm} RPM`;
      });
    }

    const toggleBtn = document.getElementById('piston-toggle-btn');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        this.isPlaying = !this.isPlaying;
        toggleBtn.textContent = this.isPlaying ? 'PAUSE ENGINE' : 'START ENGINE';
      });
    }
  }

  getKinematics() {
    const theta = this.crankAngle % (Math.PI * 4);
    const r = this.crankRadius;
    const l = this.rodLength;

    const crankX = r * Math.sin(theta);
    const crankY = r * Math.cos(theta);

    const pinY = crankY - Math.sqrt(l * l - crankX * crankX);
    const pinX = 0;

    const omega = (this.rpm * 2 * Math.PI) / 60;
    const n = l / r;
    const velocity = r * 0.001 * omega * (Math.sin(theta) + Math.sin(2 * theta) / (2 * n));

    let stage = '1. SUCTION STROKE';
    let stageColor = '#00f0ff';
    let isCombusting = false;
    let intakeOpen = false;
    let exhaustOpen = false;

    const deg = (theta * 180 / Math.PI) % 720;
    if (deg >= 0 && deg < 180) {
      stage = '1. INTAKE (SUCTION)';
      stageColor = '#00f0ff';
      intakeOpen = true;
    } else if (deg >= 180 && deg < 360) {
      stage = '2. COMPRESSION';
      stageColor = '#ff9d00';
    } else if (deg >= 360 && deg < 540) {
      stage = '3. POWER (EXPANSION)';
      stageColor = '#ff3b30';
      isCombusting = deg < 440;
    } else {
      stage = '4. EXHAUST';
      stageColor = '#a855f7';
      exhaustOpen = true;
    }

    return { theta, crankX, crankY, pinX, pinY, velocity, stage, stageColor, isCombusting, intakeOpen, exhaustOpen, deg };
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    const k = this.getKinematics();
    const centerX = this.width * 0.42;
    const crankCenterY = this.height * 0.72;

    ctx.strokeStyle = 'rgba(0, 240, 255, 0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x < this.width; x += 25) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, this.height); ctx.stroke();
    }
    for (let y = 0; y < this.height; y += 25) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(this.width, y); ctx.stroke();
    }

    const cylTop = crankCenterY - this.rodLength - this.crankRadius - 60;
    const cylBottom = crankCenterY - this.rodLength + this.crankRadius + 30;
    const halfBore = this.bore / 2;

    ctx.save();
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(centerX - halfBore, cylTop); ctx.lineTo(centerX - halfBore, cylBottom);
    ctx.moveTo(centerX + halfBore, cylTop); ctx.lineTo(centerX + halfBore, cylBottom);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(centerX - halfBore - 15, cylTop);
    ctx.lineTo(centerX + halfBore + 15, cylTop);
    ctx.stroke();

    ctx.fillStyle = '#ff9d00';
    ctx.fillRect(centerX - 4, cylTop - 18, 8, 18);
    ctx.strokeStyle = '#fff';
    ctx.strokeRect(centerX - 4, cylTop - 18, 8, 18);

    const intakeOffset = k.intakeOpen ? 8 : 0;
    ctx.strokeStyle = k.intakeOpen ? '#00f0ff' : '#475569';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(centerX - 18, cylTop - 15); ctx.lineTo(centerX - 18, cylTop + intakeOffset);
    ctx.stroke();
    ctx.fillRect(centerX - 24, cylTop + intakeOffset, 12, 3);

    const exhaustOffset = k.exhaustOpen ? 8 : 0;
    ctx.strokeStyle = k.exhaustOpen ? '#a855f7' : '#475569';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(centerX + 18, cylTop - 15); ctx.lineTo(centerX + 18, cylTop + exhaustOffset);
    ctx.stroke();
    ctx.fillRect(centerX + 12, cylTop + exhaustOffset, 12, 3);

    if (k.isCombusting) {
      const grad = ctx.createRadialGradient(centerX, cylTop + 20, 5, centerX, cylTop + 35, 45);
      grad.addColorStop(0, 'rgba(255, 240, 100, 0.95)');
      grad.addColorStop(0.4, 'rgba(255, 100, 0, 0.8)');
      grad.addColorStop(1, 'rgba(255, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(centerX - halfBore + 2, cylTop + 2, this.bore - 4, (crankCenterY + k.pinY - 30) - cylTop);
    }

    const pistonTopY = crankCenterY + k.pinY - 35;
    ctx.fillStyle = '#182847';
    ctx.fillRect(centerX - halfBore + 2, pistonTopY, this.bore - 4, 45);
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2;
    ctx.strokeRect(centerX - halfBore + 2, pistonTopY, this.bore - 4, 45);

    ctx.strokeStyle = '#ff9d00';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(centerX - halfBore + 2, pistonTopY + 8); ctx.lineTo(centerX + halfBore - 2, pistonTopY + 8);
    ctx.moveTo(centerX - halfBore + 2, pistonTopY + 14); ctx.lineTo(centerX + halfBore - 2, pistonTopY + 14);
    ctx.stroke();

    const pinActualX = centerX + k.pinX;
    const pinActualY = crankCenterY + k.pinY;
    const crankActualX = centerX + k.crankX;
    const crankActualY = crankCenterY + k.crankY;

    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(pinActualX, pinActualY); ctx.lineTo(crankActualX, crankActualY);
    ctx.stroke();

    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(pinActualX, pinActualY); ctx.lineTo(crankActualX, crankActualY);
    ctx.stroke();

    ctx.fillStyle = '#ff9d00';
    ctx.beginPath();
    ctx.arc(pinActualX, pinActualY, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(centerX, crankCenterY);
    ctx.beginPath();
    ctx.arc(0, 0, this.crankRadius + 14, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = '#0f1c38';
    ctx.beginPath();
    ctx.arc(centerX, crankCenterY, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ff9d00';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#00f0ff';
    ctx.beginPath();
    ctx.arc(crankActualX, crankActualY, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
    this.drawDashboard(k);
  }

  drawDashboard(k) {
    const ctx = this.ctx;
    const dx = this.width - 210;
    const dy = 30;

    ctx.save();
    ctx.fillStyle = 'rgba(13, 21, 39, 0.85)';
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
    ctx.lineWidth = 1;
    ctx.fillRect(dx, dy, 190, 220);
    ctx.strokeRect(dx, dy, 190, 220);

    ctx.fillStyle = '#00f0ff';
    ctx.font = '11px "Orbitron", sans-serif';
    ctx.fillText('ENGINE TELEMETRY', dx + 12, dy + 22);

    ctx.fillStyle = k.stageColor;
    ctx.font = 'bold 10px "JetBrains Mono", monospace';
    ctx.fillText(k.stage, dx + 12, dy + 48);

    ctx.fillStyle = '#8fa0c2';
    ctx.font = '9px "JetBrains Mono", monospace';
    ctx.fillText('CRANK ANGLE (theta):', dx + 12, dy + 75);
    ctx.fillStyle = '#ff9d00';
    ctx.font = 'bold 12px "JetBrains Mono", monospace';
    ctx.fillText(`${k.deg.toFixed(1)} deg`, dx + 12, dy + 92);

    ctx.fillStyle = '#8fa0c2';
    ctx.font = '9px "JetBrains Mono", monospace';
    ctx.fillText('PISTON VELOCITY:', dx + 12, dy + 120);
    ctx.fillStyle = '#00f0ff';
    ctx.font = 'bold 12px "JetBrains Mono", monospace';
    ctx.fillText(`${Math.abs(k.velocity).toFixed(2)} m/s`, dx + 12, dy + 137);

    ctx.fillStyle = '#8fa0c2';
    ctx.font = '9px "JetBrains Mono", monospace';
    ctx.fillText('BORE x STROKE:', dx + 12, dy + 165);
    ctx.fillStyle = '#fff';
    ctx.font = '11px "JetBrains Mono", monospace';
    ctx.fillText('68mm x 90mm', dx + 12, dy + 182);

    ctx.fillStyle = '#8fa0c2';
    ctx.fillText('CR: 10.5 : 1 (Otto)', dx + 12, dy + 204);

    ctx.restore();

    const stageEl = document.getElementById('piston-stage-val');
    const velEl = document.getElementById('piston-vel-val');
    const angleEl = document.getElementById('piston-angle-val');
    if (stageEl) stageEl.textContent = k.stage;
    if (velEl) velEl.textContent = `${Math.abs(k.velocity).toFixed(2)} m/s`;
    if (angleEl) angleEl.textContent = `${k.deg.toFixed(0)} deg`;
  }

  animate() {
    if (this.isPlaying) {
      const deltaAngle = (this.rpm * 2 * Math.PI) / (60 * 60);
      this.crankAngle += deltaAngle;
    }
    this.draw();
    requestAnimationFrame(this.animate);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('piston-lab-canvas')) {
    window.mainPistonSim = new PistonEngineSimulator('piston-lab-canvas');
  }
});
