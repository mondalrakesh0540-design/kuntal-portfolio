/**
 * MAIN INTERFACE CONTROLLER & RAC CYCLE ANIMATOR
 * Kuntal Ghosh Mechanical Engineering Portfolio
 */

document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initLabTabs();
  initRACCycleCanvas();
  initProjectFilters();
  initResumeModal();
  initContactForm();
  initTelemetryTicker();
});

/* NAVIGATION & SCROLLSPY */
function initNav() {
  const toggleBtn = document.querySelector('.nav-toggle-btn');
  const navLinks = document.querySelector('.nav-links');
  const links = document.querySelectorAll('.nav-link');

  if (toggleBtn && navLinks) {
    toggleBtn.addEventListener('click', () => {
      navLinks.classList.toggle('active');
    });
  }

  // Smooth scroll & close mobile menu
  links.forEach((link) => {
    link.addEventListener('click', () => {
      if (navLinks) navLinks.classList.remove('active');
    });
  });

  // Active section scroll spy
  const sections = document.querySelectorAll('section[id]');
  window.addEventListener('scroll', () => {
    const scrollY = window.pageYOffset;
    sections.forEach((current) => {
      const sectionHeight = current.offsetHeight;
      const sectionTop = current.offsetTop - 120;
      const sectionId = current.getAttribute('id');
      const navLink = document.querySelector(`.nav-links a[href*='${sectionId}']`);

      if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
        links.forEach((l) => l.classList.remove('active'));
        if (navLink) navLink.classList.add('active');
      }
    });
  });
}

/* MECHANICAL LAB TABS SWITCHER */
function initLabTabs() {
  const tabBtns = document.querySelectorAll('.lab-tab-btn');
  const panels = document.querySelectorAll('.lab-panel');

  tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      tabBtns.forEach((b) => b.classList.remove('active'));
      panels.forEach((p) => p.classList.remove('active'));

      btn.classList.add('active');
      const targetId = btn.getAttribute('data-tab');
      const targetPanel = document.getElementById(targetId);
      if (targetPanel) {
        targetPanel.classList.add('active');
      }
    });
  });
}

/* VAPOR COMPRESSION REFRIGERATION (VCR) CYCLE CANVAS */
function initRACCycleCanvas() {
  const canvas = document.getElementById('rac-cycle-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  function resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width || 480;
    canvas.height = rect.height || 260;
  }
  resize();
  window.addEventListener('resize', resize);

  let particleOffset = 0;

  function drawRAC() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const w = canvas.width;
    const h = canvas.height;

    // Component Positions
    const compX = w * 0.25, compY = h * 0.75;  // Compressor (Bottom-Left)
    const condX = w * 0.25, condY = h * 0.25;  // Condenser (Top-Left)
    const expX  = w * 0.75, expY  = h * 0.25;  // Expansion Valve (Top-Right)
    const evapX = w * 0.75, evapY = h * 0.75;  // Evaporator (Bottom-Right)

    // Draw Piping Loop with Temperature-Graded Lines
    ctx.lineWidth = 4;

    // 1 -> 2: High Pressure / High Temp Vapor (Discharge Line: Red/Orange)
    ctx.strokeStyle = '#ff3b30';
    ctx.beginPath(); ctx.moveTo(compX, compY - 20); ctx.lineTo(condX, condY + 20); ctx.stroke();

    // 2 -> 3: High Pressure Subcooled Liquid (Liquid Line: Amber)
    ctx.strokeStyle = '#ff9d00';
    ctx.beginPath(); ctx.moveTo(condX + 30, condY); ctx.lineTo(expX - 25, expY); ctx.stroke();

    // 3 -> 4: Low Pressure Low Temp Liquid-Vapor (Cyan)
    ctx.strokeStyle = '#00f0ff';
    ctx.beginPath(); ctx.moveTo(expX, expY + 20); ctx.lineTo(evapX, evapY - 20); ctx.stroke();

    // 4 -> 1: Low Pressure Saturated Vapor (Suction Line: Deep Cyan/Blue)
    ctx.strokeStyle = '#00aaff';
    ctx.beginPath(); ctx.moveTo(evapX - 30, evapY); ctx.lineTo(compX + 25, compY); ctx.stroke();

    // Flow Arrows
    particleOffset = (particleOffset + 0.5) % 30;

    // Draw Component Icons & Boxes
    // 1. COMPRESSOR
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#ff3b30';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(compX, compY, 24, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 9px "JetBrains Mono", monospace';
    ctx.fillText('COMP', compX - 12, compY + 3);

    // 2. CONDENSER
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#ff9d00';
    ctx.fillRect(condX - 25, condY - 18, 50, 36);
    ctx.strokeRect(condX - 25, condY - 18, 50, 36);
    ctx.fillStyle = '#ff9d00';
    ctx.fillText('COND', condX - 12, condY + 3);

    // 3. EXPANSION VALVE
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#00f0ff';
    ctx.beginPath();
    ctx.moveTo(expX - 16, expY - 14); ctx.lineTo(expX + 16, expY + 14);
    ctx.lineTo(expX + 16, expY - 14); ctx.lineTo(expX - 16, expY + 14);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#00f0ff';
    ctx.fillText('EXP.V', expX - 14, expY - 18);

    // 4. EVAPORATOR
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#00aaff';
    ctx.fillRect(evapX - 25, evapY - 18, 50, 36);
    ctx.strokeRect(evapX - 25, evapY - 18, 50, 36);
    ctx.fillStyle = '#00aaff';
    ctx.fillText('EVAP', evapX - 12, evapY + 3);

    // Thermodynamic State Labels
    ctx.fillStyle = '#8fa0c2';
    ctx.font = '8px "JetBrains Mono", monospace';
    ctx.fillText('P_high, T_high (Gas)', compX - 45, (compY + condY) / 2);
    ctx.fillText('Condensation (Q_out)', (condX + expX) / 2 - 40, condY - 8);
    ctx.fillText('P_low, T_low (Mix)', expX + 8, (expY + evapY) / 2);
    ctx.fillText('Refrigeration Effect (Q_in)', (compX + evapX) / 2 - 50, compY + 24);

    requestAnimationFrame(drawRAC);
  }

  drawRAC();
}

/* PROJECT FILTERING */
function initProjectFilters() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.project-card');

  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.getAttribute('data-filter');
      projectCards.forEach((card) => {
        const cat = card.getAttribute('data-category');
        if (filter === 'all' || cat === filter) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });
}

/* RESUME MODAL & PRINT HANDLER */
function initResumeModal() {
  const openBtns = document.querySelectorAll('.open-resume-btn');
  const modal = document.getElementById('resume-modal');
  const closeBtn = document.getElementById('close-resume-btn');
  const printBtn = document.getElementById('print-resume-btn');

  if (openBtns && modal) {
    openBtns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        modal.classList.add('open');
      });
    });
  }

  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => {
      modal.classList.remove('open');
    });
  }

  // Close on outside click
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('open');
    });
  }

  if (printBtn) {
    printBtn.addEventListener('click', () => {
      window.print();
    });
  }
}

/* CONTACT FORM HANDLER */
function initContactForm() {
  const form = document.getElementById('contact-form');
  const statusEl = document.getElementById('form-status-msg');

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('form-name').value;
      const email = document.getElementById('form-email').value;
      const subject = document.getElementById('form-subject').value;
      const message = document.getElementById('form-message').value;

      if (statusEl) {
        statusEl.textContent = '> TRANSMITTING TELEMETRY DATA...';
        statusEl.style.color = '#ff9d00';
      }

      setTimeout(() => {
        if (statusEl) {
          statusEl.textContent = `> TRANSMISSION CONFIRMED! THANK YOU ${name.toUpperCase()}. KUNTAL WILL RESPOND PROMPTLY.`;
          statusEl.style.color = '#00ff88';
        }
        form.reset();
      }, 1200);
    });
  }
}

/* HERO TELEMETRY TICKER */
function initTelemetryTicker() {
  const coordEl = document.getElementById('hud-live-coords');
  const clockEl = document.getElementById('hud-live-time');

  function update() {
    const now = new Date();
    if (clockEl) {
      clockEl.textContent = now.toTimeString().split(' ')[0] + ' UTC+5:30';
    }
    if (coordEl) {
      const rx = (22.25 + Math.sin(Date.now() * 0.001) * 0.02).toFixed(4);
      const ry = (87.32 + Math.cos(Date.now() * 0.001) * 0.02).toFixed(4);
      coordEl.textContent = `LAT: ${rx}° N | LON: ${ry}° E`;
    }
  }

  setInterval(update, 500);
  update();
}
