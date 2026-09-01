/**
 * COMMERCIAL-GRADE 4-STROKE ENGINE & REAL-TIME PV-DIAGRAM SIMULATOR
 * Kinematics + Dynamic Pressure-Volume Indicator Card
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
        if (window.mechAudio) window.mechAudio.playMechanicalClick(1000);
        this.isPlaying = !this.isPlaying;
        toggleBtn.textContent = this.isPlaying ? 'PAUSE ENGINE' : 'START ENGINE';
      });
    }
  }

  getKinematics() {
    const theta = this.crankAngle % (Math.PI * 4); // 720 deg for 4-stroke cycle
    const r = this.crankRadius;
    const l = this.rodLength;

    const crankX = r * Math.sin(theta);
    const crankY = r * Math.cos(theta);
    const pinY = crankY - Math.sqrt(l * l - crankX * crankX);
    const pinX = 0;

    const omega = (this.rpm * 2 * Math.PI) / 60;
    const n = l / r;
    const velocity = r * 0.001 * omega * (Math.sin(theta) + Math.sin(2 * theta) / (2 * n));

    const deg = (theta * 180 / Math.PI) % 720;
    let stage = '1. INTAKE (SUCTION)';
    let stageColor = '#00f0ff';
    let isCombusting = false;
    let intakeOpen = false;
    let exhaustOpen = false;
    let cylinderPressure = 1.0; // in bar

    // Otto Cycle 4-Stroke PV Profile
    // Normalized piston volume 0 (TDC) to 1 (BDC)
    const normVol = (pinY - (-l - r)) / (2 * r);

    if (deg >= 0 && deg < 180) {
      stage = '1. INTAKE (SUCTION)';
      stageColor = '#00f0ff';
      intakeOpen = true;
      cylinderPressure = 0.95;
    } else if (deg >= 180 && deg < 360) {
      stage = '2. COMPRESSION';
      stageColor = '#ff9d00';
      const compRatio = 1 / Math.max(0.1, normVol);
      cylinderPressure = Math.pow(compRatio, 1.35) * 1.0;
    } else if (deg >= 360 && deg < 540) {
      stage = '3. POWER (EXPANSION)';
      stageColor = '#ff3b30';
      isCombusting = deg < 430;
      const expRatio = 1 / Math.max(0.1, normVol);
      cylinderPressure = isCombusting ? 45.0 - (deg - 360) * 0.3 : Math.pow(expRatio, 1.3) * 3.5;
    } else {
      stage = '4. EXHAUST';
      stageColor = '#a855f7';
      exhaustOpen = true;
      cylinderPressure = 1.2;
    }

    return { theta, crankX, crankY, pinX, pinY, velocity, stage, stageColor, isCombusting, intakeOpen, exhaustOpen, deg, cylinderPressure, normVol };
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    const k = this.getKinematics();
    const centerX = this.width * 0.34;
    const crankCenterY = this.height * 0.72;

    // Blueprint Grid
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x < this.width; x += 25) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, this.height); ctx.stroke();
    }
    for (let y = 0; y < this.height; y += 25) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(this.width, y); ctx.stroke();
    }

    // Cylinder Sleeve Walls
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

    // Cylinder Head
    ctx.beginPath();
    ctx.moveTo(centerX - halfBore - 15, cylTop); ctx.lineTo(centerX + halfBore + 15, cylTop);
    ctx.stroke();

    // Spark Plug
    ctx.fillStyle = '#ff9d00';
    ctx.fillRect(centerX - 4, cylTop - 18, 8, 18);
    ctx.strokeStyle = '#fff';
    ctx.strokeRect(centerX - 4, cylTop - 18, 8, 18);

    // Intake & Exhaust Valves
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

    // Combustion Flame Effect
    if (k.isCombusting) {
      const grad = ctx.createRadialGradient(centerX, cylTop + 20, 5, centerX, cylTop + 35, 45);
      grad.addColorStop(0, 'rgba(255, 240, 100, 0.95)');
      grad.addColorStop(0.4, 'rgba(255, 100, 0, 0.8)');
      grad.addColorStop(1, 'rgba(255, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(centerX - halfBore + 2, cylTop + 2, this.bore - 4, (crankCenterY + k.pinY - 30) - cylTop);
    }

    // Piston Body
    const pistonTopY = crankCenterY + k.pinY - 35;
    ctx.fillStyle = '#182847';
    ctx.fillRect(centerX - halfBore + 2, pistonTopY, this.bore - 4, 45);
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2;
    ctx.strokeRect(centerX - halfBore + 2, pistonTopY, this.bore - 4, 45);

    // Compression Ring Grooves
    ctx.strokeStyle = '#ff9d00';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(centerX - halfBore + 2, pistonTopY + 8); ctx.lineTo(centerX + halfBore - 2, pistonTopY + 8);
    ctx.moveTo(centerX - halfBore + 2, pistonTopY + 14); ctx.lineTo(centerX + halfBore - 2, pistonTopY + 14);
    ctx.stroke();

    // Connecting Rod
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
    ctx.beginPath(); ctx.arc(pinActualX, pinActualY, 6, 0, Math.PI * 2); ctx.fill();

    // Crankshaft & Counterweight
    ctx.fillStyle = '#0f1c38';
    ctx.beginPath(); ctx.arc(centerX, crankCenterY, 18, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#ff9d00'; ctx.lineWidth = 2; ctx.stroke();

    ctx.fillStyle = '#00f0ff';
    ctx.beginPath(); ctx.arc(crankActualX, crankActualY, 8, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    // DRAW DYNAMIC PV-DIAGRAM (Right side)
    this.drawPVDiagram(k);
  }

  drawPVDiagram(k) {
    const ctx = this.ctx;
    const px = this.width * 0.62;
    const py = 35;
    const pw = this.width * 0.34;
    const ph = this.height * 0.45;

    ctx.save();
    // PV Frame Box
    ctx.fillStyle = 'rgba(8, 14, 26, 0.9)';
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
    ctx.lineWidth = 1;
    ctx.fillRect(px, py, pw, ph);
    ctx.strokeRect(px, py, pw, ph);

    // Title
    ctx.fillStyle = '#00f0ff';
    ctx.font = '10px "Orbitron", sans-serif';
    ctx.fillText('OTTO CYCLE P-V DIAGRAM', px + 10, py + 18);

    // P and V Axes
    const axOriginX = px + 35;
    const axOriginY = py + ph - 25;
    const axWidth = pw - 50;
    const axHeight = ph - 55;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(axOriginX, py + 25); ctx.lineTo(axOriginX, axOriginY);
    ctx.lineTo(axOriginX + axWidth, axOriginY);
    ctx.stroke();

    // Axis Labels
    ctx.fillStyle = '#8fa0c2';
    ctx.font = '9px "JetBrains Mono", monospace';
    ctx.fillText('P (bar)', axOriginX - 30, py + 35);
    ctx.fillText('V (Volume)', axOriginX + axWidth - 45, axOriginY + 18);

    // Theoretical Otto Cycle Loop (Dashed Cyan)
    const pt1 = { x: axOriginX + axWidth * 0.9, y: axOriginY - axHeight * 0.08 }; // BDC Intake
    const pt2 = { x: axOriginX + axWidth * 0.15, y: axOriginY - axHeight * 0.42 }; // TDC Compression
    const pt3 = { x: axOriginX + axWidth * 0.15, y: axOriginY - axHeight * 0.92 }; // Peak Combustion
    const pt4 = { x: axOriginX + axWidth * 0.9, y: axOriginY - axHeight * 0.3 };  // Expansion BDC

    ctx.strokeStyle = 'rgba(0, 240, 255, 0.45)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(pt1.x, pt1.y);
    ctx.quadraticCurveTo(axOriginX + axWidth * 0.45, axOriginY - axHeight * 0.15, pt2.x, pt2.y);
    ctx.lineTo(pt3.x, pt3.y);
    ctx.quadraticCurveTo(axOriginX + axWidth * 0.45, axOriginY - axHeight * 0.55, pt4.x, pt4.y);
    ctx.lineTo(pt1.x, pt1.y);
    ctx.stroke();
    ctx.setLineDash([]);

    // Live Operating Point (Red/Amber Glowing Marker)
    const curX = axOriginX + axWidth * (0.15 + k.normVol * 0.75);
    const curP_norm = Math.min(1.0, k.cylinderPressure / 48.0);
    const curY = axOriginY - axHeight * curP_norm;

    ctx.fillStyle = k.stageColor;
    ctx.beginPath();
    ctx.arc(curX, curY, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Telemetry Text Card Below PV
    const ty = py + ph + 12;
    const th = this.height - ty - 25;
    ctx.fillStyle = 'rgba(8, 14, 26, 0.9)';
    ctx.strokeStyle = 'rgba(255, 157, 0, 0.35)';
    ctx.fillRect(px, ty, pw, th);
    ctx.strokeRect(px, ty, pw, th);

    ctx.fillStyle = k.stageColor;
    ctx.font = 'bold 10px "JetBrains Mono", monospace';
    ctx.fillText(k.stage, px + 10, ty + 18);

    ctx.fillStyle = '#8fa0c2';
    ctx.font = '9px "JetBrains Mono", monospace';
    ctx.fillText(`CYL. PRESSURE:`, px + 10, ty + 38);
    ctx.fillStyle = '#ff9d00';
    ctx.font = 'bold 12px "JetBrains Mono", monospace';
    ctx.fillText(`${k.cylinderPressure.toFixed(1)} bar`, px + 10, ty + 54);

    ctx.fillStyle = '#8fa0c2';
    ctx.font = '9px "JetBrains Mono", monospace';
    ctx.fillText(`PISTON VELOCITY:`, px + 10, ty + 74);
    ctx.fillStyle = '#00f0ff';
    ctx.font = 'bold 12px "JetBrains Mono", monospace';
    ctx.fillText(`${Math.abs(k.velocity).toFixed(2)} m/s`, px + 10, ty + 90);

    ctx.restore();

    const stageEl = document.getElementById('piston-stage-val');
    const velEl = document.getElementById('piston-vel-val');
    const angleEl = document.getElementById('piston-angle-val');
    if (stageEl) stageEl.textContent = k.stage;
    if (velEl) velEl.textContent = `${Math.abs(k.velocity).toFixed(2)} m/s`;
    if (angleEl) angleEl.textContent = `${k.deg.toFixed(0)}°`;
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
