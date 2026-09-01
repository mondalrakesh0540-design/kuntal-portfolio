/**
 * COMMERCIAL-GRADE INTERFACE CONTROLLER & CLIENT TOOLS
 * Features: 4-Theme Switcher, CAD Cursor, Cost Estimator, CLI Terminal Assistant, 3D Tilt Cards
 */

document.addEventListener('DOMContentLoaded', () => {
  initThemeSwitcher();
  initCADCrosshairCursor();
  initNav();
  initLabTabs();
  initRACCycleCanvas();
  initProjectCostEstimator();
  initTerminalCLI();
  init3DTiltCards();
  initProjectFilters();
  initResumeModal();
  initContactForm();
  initTelemetryTicker();
});

/* 1. DYNAMIC 4-THEME SWITCHER */
function initThemeSwitcher() {
  const themeBtns = document.querySelectorAll('.theme-btn');
  const html = document.documentElement;

  themeBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const theme = btn.getAttribute('data-theme');
      html.setAttribute('data-theme', theme);
      themeBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      if (window.mechAudio) window.mechAudio.playMechanicalClick(1500);
    });
  });
}

/* 2. PRECISION CAD CROSSHAIR CURSOR */
function initCADCrosshairCursor() {
  const cursor = document.getElementById('cad-cursor');
  const coordLabel = document.getElementById('cursor-coords');
  if (!cursor) return;

  window.addEventListener('mousemove', (e) => {
    cursor.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
    if (coordLabel) {
      coordLabel.textContent = `X:${e.clientX} Y:${e.clientY}`;
    }
  });

  // Expand crosshair on interactive hover
  const interactables = document.querySelectorAll('a, button, input, select, .project-card, .skill-card');
  interactables.forEach((el) => {
    el.addEventListener('mouseenter', () => {
      cursor.classList.add('active');
    });
    el.addEventListener('mouseleave', () => {
      cursor.classList.remove('active');
    });
  });
}

/* 3. NAVIGATION & SCROLLSPY */
function initNav() {
  const toggleBtn = document.querySelector('.nav-toggle-btn');
  const navLinks = document.querySelector('.nav-links');
  const links = document.querySelectorAll('.nav-link');

  if (toggleBtn && navLinks) {
    toggleBtn.addEventListener('click', () => {
      if (window.mechAudio) window.mechAudio.playMechanicalClick(1100);
      navLinks.classList.toggle('active');
    });
  }

  links.forEach((link) => {
    link.addEventListener('click', () => {
      if (window.mechAudio) window.mechAudio.playMechanicalClick(900);
      if (navLinks) navLinks.classList.remove('active');
    });
  });

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

/* 4. MECHANICAL LAB TABS */
function initLabTabs() {
  const tabBtns = document.querySelectorAll('.lab-tab-btn');
  const panels = document.querySelectorAll('.lab-panel');

  tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      if (window.mechAudio) window.mechAudio.playHydraulicWhoosh();
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

/* 5. VAPOR COMPRESSION REFRIGERATION (VCR) CANVAS */
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

    const compX = w * 0.25, compY = h * 0.75;
    const condX = w * 0.25, condY = h * 0.25;
    const expX  = w * 0.75, expY  = h * 0.25;
    const evapX = w * 0.75, evapY = h * 0.75;

    ctx.lineWidth = 4;
    // 1-2: High P/T Vapor (Red)
    ctx.strokeStyle = '#ff3b30';
    ctx.beginPath(); ctx.moveTo(compX, compY - 20); ctx.lineTo(condX, condY + 20); ctx.stroke();

    // 2-3: Subcooled Liquid (Amber)
    ctx.strokeStyle = '#ff9d00';
    ctx.beginPath(); ctx.moveTo(condX + 30, condY); ctx.lineTo(expX - 25, expY); ctx.stroke();

    // 3-4: Low P/T Liquid-Vapor (Cyan)
    ctx.strokeStyle = '#00f0ff';
    ctx.beginPath(); ctx.moveTo(expX, expY + 20); ctx.lineTo(evapX, evapY - 20); ctx.stroke();

    // 4-1: Saturated Vapor (Blue)
    ctx.strokeStyle = '#0088ff';
    ctx.beginPath(); ctx.moveTo(evapX - 30, evapY); ctx.lineTo(compX + 25, compY); ctx.stroke();

    // Components
    ctx.fillStyle = '#17274a'; ctx.strokeStyle = '#ff3b30'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(compX, compY, 24, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.font = 'bold 9px "JetBrains Mono", monospace'; ctx.fillText('COMP', compX - 12, compY + 3);

    ctx.fillStyle = '#17274a'; ctx.strokeStyle = '#ff9d00';
    ctx.fillRect(condX - 25, condY - 18, 50, 36); ctx.strokeRect(condX - 25, condY - 18, 50, 36);
    ctx.fillStyle = '#ff9d00'; ctx.fillText('COND', condX - 12, condY + 3);

    ctx.fillStyle = '#17274a'; ctx.strokeStyle = '#00f0ff';
    ctx.beginPath(); ctx.moveTo(expX - 16, expY - 14); ctx.lineTo(expX + 16, expY + 14);
    ctx.lineTo(expX + 16, expY - 14); ctx.lineTo(expX - 16, expY + 14); ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#00f0ff'; ctx.fillText('EXP.V', expX - 14, expY - 18);

    ctx.fillStyle = '#17274a'; ctx.strokeStyle = '#0088ff';
    ctx.fillRect(evapX - 25, evapY - 18, 50, 36); ctx.strokeRect(evapX - 25, evapY - 18, 50, 36);
    ctx.fillStyle = '#0088ff'; ctx.fillText('EVAP', evapX - 12, evapY + 3);

    requestAnimationFrame(drawRAC);
  }
  drawRAC();
}

/* 6. ENGINEERING PROJECT COST ESTIMATOR & QUOTE GENERATOR */
function initProjectCostEstimator() {
  const serviceType = document.getElementById('calc-service-type');
  const complexity = document.getElementById('calc-complexity');
  const partsCount = document.getElementById('calc-parts-count');
  const totalCostEl = document.getElementById('calc-total-cost');
  const totalHoursEl = document.getElementById('calc-total-hours');

  function calculate() {
    if (!serviceType || !complexity || !partsCount) return;
    const baseRates = {
      cad_2d: 25,       // $25/hr
      solidworks_3d: 45,// $45/hr
      cnc_cam: 55,      // $55/hr
      rac_hvac: 50,     // $50/hr
      full_assembly: 65 // $65/hr
    };

    const compMultipliers = {
      simple: 1.0,
      moderate: 1.6,
      advanced: 2.5
    };

    const rate = baseRates[serviceType.value] || 40;
    const comp = compMultipliers[complexity.value] || 1.0;
    const parts = parseInt(partsCount.value) || 1;

    const hours = Math.round(parts * 3.5 * comp);
    const totalCost = hours * rate;

    if (totalCostEl) totalCostEl.textContent = `$${totalCost.toLocaleString()} USD`;
    if (totalHoursEl) totalHoursEl.textContent = `${hours} Estimated Engineering Hours`;
  }

  if (serviceType && complexity && partsCount) {
    serviceType.addEventListener('change', () => { if (window.mechAudio) window.mechAudio.playMechanicalClick(1200); calculate(); });
    complexity.addEventListener('change', () => { if (window.mechAudio) window.mechAudio.playMechanicalClick(1400); calculate(); });
    partsCount.addEventListener('input', () => calculate());
    calculate();
  }
}

/* 7. INTERACTIVE CLI TERMINAL ASSISTANT */
function initTerminalCLI() {
  const cliInput = document.getElementById('cli-terminal-input');
  const cliOutput = document.getElementById('cli-terminal-output');
  if (!cliInput || !cliOutput) return;

  const commands = {
    help: 'Available commands: skills, cad, cnc, rac, projects, quote, contact, clear, theme, about',
    about: 'Kuntal Ghosh | Diploma in Mechanical Engineering | Bankura Government Polytechnic | WBSCT&VE&SD',
    skills: 'CAD: AutoCAD 2D/3D, SolidWorks | CNC: G-Code, M-Code, Lathe/Mill Simulation | Thermal & RAC | Metrology | AI Engineering Tools',
    cad: 'SolidWorks 3D Parametric Modeling, AutoCAD Drafting, Involute Gear Design, GD&T ISO Tolerancing',
    cnc: 'ISO G-Code / M-Code Programming, Canned Cycles (G81-G89), Circular Interpolation (G02/G03), Work Coordinate Systems (G54-G59)',
    rac: 'Vapor Compression Refrigeration (VCR) cycle, Compressor overhaul, Psychrometrics, Enthalpy state calculations',
    projects: '1. High-Precision Spur Gearbox | 2. 4-Stroke Engine Kinematics | 3. CNC Milling Fixture | 4. Industrial RAC Chiller | 5. Double Wishbone Suspension',
    contact: 'Phone: +91 8170841588 | Email: kuntalghosh949@gmail.com | Location: Midnapore, West Bengal',
    quote: 'Scroll to the Engineering Cost Estimator section below to calculate project quotation!',
    clear: 'CLEAR'
  };

  cliInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const val = cliInput.value.trim().toLowerCase();
      if (!val) return;

      if (window.mechAudio) window.mechAudio.playMechanicalClick(1600);

      const userLine = document.createElement('div');
      userLine.innerHTML = `<span class="text-cyan">> user@kuntal-eng:~$</span> ${val}`;
      cliOutput.appendChild(userLine);

      if (val === 'clear') {
        cliOutput.innerHTML = '<div class="text-dim">Antigravity CAD Terminal Engine initialized. Type "help" for command list.</div>';
      } else if (commands[val]) {
        const respLine = document.createElement('div');
        respLine.style.color = '#ff9d00';
        respLine.style.marginBottom = '6px';
        respLine.textContent = commands[val];
        cliOutput.appendChild(respLine);
      } else {
        const errLine = document.createElement('div');
        errLine.style.color = '#ff5500';
        errLine.textContent = `Command not recognized: "${val}". Type "help" for available commands.`;
        cliOutput.appendChild(errLine);
      }

      cliInput.value = '';
      cliOutput.scrollTop = cliOutput.scrollHeight;
    }
  });
}

/* 8. 3D TILT CARDS */
function init3DTiltCards() {
  const cards = document.querySelectorAll('.tilt-card');
  cards.forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      card.style.transform = `perspective(800px) rotateY(${x * 0.04}deg) rotateX(${-y * 0.04}deg) translateY(-4px)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(800px) rotateY(0deg) rotateX(0deg) translateY(0)';
    });
  });
}

/* 9. PROJECT FILTERING */
function initProjectFilters() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.project-card');

  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      if (window.mechAudio) window.mechAudio.playMechanicalClick(1300);
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

/* 10. RESUME MODAL */
function initResumeModal() {
  const openBtns = document.querySelectorAll('.open-resume-btn');
  const modal = document.getElementById('resume-modal');
  const closeBtn = document.getElementById('close-resume-btn');
  const printBtn = document.getElementById('print-resume-btn');

  if (openBtns && modal) {
    openBtns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        if (window.mechAudio) window.mechAudio.playHydraulicWhoosh();
        modal.classList.add('open');
      });
    });
  }

  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => {
      if (window.mechAudio) window.mechAudio.playMechanicalClick(800);
      modal.classList.remove('open');
    });
  }

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

/* 11. CONTACT FORM */
function initContactForm() {
  const form = document.getElementById('contact-form');
  const statusEl = document.getElementById('form-status-msg');

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (window.mechAudio) window.mechAudio.playLaserBeep();

      const name = document.getElementById('form-name').value;
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

/* 12. TELEMETRY TICKER */
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
