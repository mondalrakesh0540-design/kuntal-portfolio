/**
 * COMMERCIAL-GRADE 3D MECHANICAL CAD STUDIO (Three.js WebGL)
 * Features: Planetary Gearbox, 4-Valve Head, Turbine Impeller, Caliper Measuring Tool, Exploded Disassembly
 */

class MechanicalCADViewer {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.shadingMode = 'shaded';
    this.materialPreset = 'steel';
    this.autoRotate = true;
    this.explodeFactor = 0;
    this.currentModelType = 'planetary';
    this.caliperMode = false;
    this.caliperPoints = [];

    this.initThree();
    this.loadModel('planetary');
    this.bindControls();
    this.animate = this.animate.bind(this);
    this.animate();
  }

  initThree() {
    const width = this.container.clientWidth || 600;
    const height = this.container.clientHeight || 450;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x070d18);
    this.scene.fog = new THREE.FogExp2(0x070d18, 0.012);

    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    this.camera.position.set(30, 25, 40);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    if (typeof THREE.OrbitControls !== 'undefined') {
      this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.05;
      this.controls.maxDistance = 150;
      this.controls.minDistance = 5;
    }

    // Blueprint CAD Grid Floor
    const gridHelper = new THREE.GridHelper(70, 35, 0x00f0ff, 0x112344);
    gridHelper.position.y = -14;
    this.scene.add(gridHelper);

    // Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    this.scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x00f0ff, 1.3);
    dirLight1.position.set(35, 45, 35);
    this.scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xff9d00, 0.9);
    dirLight2.position.set(-35, -20, -35);
    this.scene.add(dirLight2);

    const pointLight = new THREE.PointLight(0xffffff, 1.2, 60);
    pointLight.position.set(0, 20, 0);
    this.scene.add(pointLight);

    this.modelGroup = new THREE.Group();
    this.scene.add(this.modelGroup);

    // Raycaster for 3D measurement caliper
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    window.addEventListener('resize', () => {
      const w = this.container.clientWidth || 600;
      const h = this.container.clientHeight || 450;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    });
  }

  getMaterial(customColor = null, roughness = 0.35, metalness = 0.85) {
    const isWire = this.shadingMode === 'wireframe';
    const isBlueprint = this.shadingMode === 'blueprint';

    if (isBlueprint) {
      return new THREE.MeshBasicMaterial({
        color: customColor || 0x00f0ff,
        wireframe: true,
        transparent: true,
        opacity: 0.85
      });
    }

    let matProps = {
      roughness: roughness,
      metalness: metalness,
      wireframe: isWire
    };

    if (this.materialPreset === 'titanium') {
      matProps.color = customColor || 0x6e7f91;
      matProps.roughness = 0.22;
      matProps.metalness = 0.95;
    } else if (this.materialPreset === 'gold') {
      matProps.color = customColor || 0xffd700;
      matProps.roughness = 0.25;
      matProps.metalness = 0.9;
    } else if (this.materialPreset === 'carbon') {
      matProps.color = customColor || 0x1f2937;
      matProps.roughness = 0.55;
      matProps.metalness = 0.3;
    } else if (this.materialPreset === 'brass') {
      matProps.color = customColor || 0xd4af37;
      matProps.roughness = 0.28;
      matProps.metalness = 0.82;
    } else if (this.materialPreset === 'cyan') {
      matProps.color = customColor || 0x00f0ff;
      matProps.roughness = 0.15;
      matProps.metalness = 0.6;
    } else {
      // Machined Tool Steel
      matProps.color = customColor || 0xa0aec0;
      matProps.roughness = 0.38;
      matProps.metalness = 0.88;
    }

    return new THREE.MeshStandardMaterial(matProps);
  }

  loadModel(type) {
    this.currentModelType = type;
    while (this.modelGroup.children.length > 0) {
      this.modelGroup.remove(this.modelGroup.children[0]);
    }
    this.parts = [];

    if (type === 'planetary') {
      this.buildPlanetaryGearbox();
    } else if (type === 'engine') {
      this.buildEngineAssembly();
    } else if (type === 'turbine') {
      this.buildTurbineImpeller();
    }
  }

  // 1. PLANETARY GEARBOX ASSEMBLY
  buildPlanetaryGearbox() {
    const group = new THREE.Group();

    // Sun Gear (Center)
    const sunMat = this.getMaterial(0xff9d00);
    const sunGeo = new THREE.CylinderGeometry(4.5, 4.5, 5, 24);
    const sunMesh = new THREE.Mesh(sunGeo, sunMat);
    group.add(sunMesh);

    for (let i = 0; i < 14; i++) {
      const a = (i * Math.PI * 2) / 14;
      const tGeo = new THREE.BoxGeometry(1.2, 5, 1.4);
      const tMesh = new THREE.Mesh(tGeo, sunMat);
      tMesh.position.set(Math.cos(a) * 5.0, 0, Math.sin(a) * 5.0);
      tMesh.rotation.y = -a;
      group.add(tMesh);
    }
    this.parts.push({ mesh: sunMesh, explodeDir: new THREE.Vector3(0, 1.8, 0) });

    // 3 Planet Gears + Carrier Arm
    const planetMat = this.getMaterial(0x00f0ff);
    for (let p = 0; p < 3; p++) {
      const pa = (p * Math.PI * 2) / 3;
      const px = Math.cos(pa) * 11;
      const pz = Math.sin(pa) * 11;

      const pGeo = new THREE.CylinderGeometry(3.5, 3.5, 4.5, 20);
      const pMesh = new THREE.Mesh(pGeo, planetMat);
      pMesh.position.set(px, 0, pz);
      group.add(pMesh);

      for (let pt = 0; pt < 10; pt++) {
        const pta = (pt * Math.PI * 2) / 10;
        const ptGeo = new THREE.BoxGeometry(1, 4.5, 1.2);
        const ptMesh = new THREE.Mesh(ptGeo, planetMat);
        ptMesh.position.set(px + Math.cos(pta) * 3.9, 0, pz + Math.sin(pta) * 3.9);
        ptMesh.rotation.y = -pta;
        group.add(ptMesh);
      }

      this.parts.push({ mesh: pMesh, explodeDir: new THREE.Vector3(Math.cos(pa) * 1.5, 0, Math.sin(pa) * 1.5) });
    }

    // Outer Ring Gear (Annulus)
    const ringMat = this.getMaterial(0x64748b);
    const ringGeo = new THREE.CylinderGeometry(17, 17, 6, 48, 1, true);
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    group.add(ringMesh);
    this.parts.push({ mesh: ringMesh, explodeDir: new THREE.Vector3(0, -1.5, 0) });

    // Carrier Flange Base
    const carrierMat = this.getMaterial(0xd4af37);
    const carrierGeo = new THREE.CylinderGeometry(13, 13, 2, 32);
    const carrierMesh = new THREE.Mesh(carrierGeo, carrierMat);
    carrierMesh.position.y = -3.5;
    group.add(carrierMesh);
    this.parts.push({ mesh: carrierMesh, explodeDir: new THREE.Vector3(0, -2.2, 0) });

    this.modelGroup.add(group);
  }

  // 2. 4-VALVE CYLINDER HEAD & PISTON
  buildEngineAssembly() {
    const group = new THREE.Group();

    // Piston Crown
    const pMat = this.getMaterial(0x94a3b8);
    const pGeo = new THREE.CylinderGeometry(9, 9, 10, 32);
    const pMesh = new THREE.Mesh(pGeo, pMat);
    pMesh.position.y = 2;
    group.add(pMesh);
    this.parts.push({ mesh: pMesh, explodeDir: new THREE.Vector3(0, -1.5, 0) });

    // Wrist Pin
    const pinMat = this.getMaterial(0x00f0ff);
    const pinGeo = new THREE.CylinderGeometry(2, 2, 16, 24);
    const pinMesh = new THREE.Mesh(pinGeo, pinMat);
    pinMesh.rotation.z = Math.PI / 2;
    pinMesh.position.y = 0;
    group.add(pinMesh);
    this.parts.push({ mesh: pinMesh, explodeDir: new THREE.Vector3(1.8, 0, 0) });

    // 4 Valves (2 Intake Cyan, 2 Exhaust Red/Amber)
    const valPositions = [
      { x: -4, z: -4, col: 0x00f0ff, dir: new THREE.Vector3(-1, 1.8, -1) },
      { x: 4, z: -4, col: 0x00f0ff, dir: new THREE.Vector3(1, 1.8, -1) },
      { x: -4, z: 4, col: 0xff5500, dir: new THREE.Vector3(-1, 1.8, 1) },
      { x: 4, z: 4, col: 0xff5500, dir: new THREE.Vector3(1, 1.8, 1) }
    ];

    valPositions.forEach((vp) => {
      const vStem = new THREE.CylinderGeometry(0.8, 0.8, 14, 16);
      const vHead = new THREE.CylinderGeometry(2.8, 1.2, 1.5, 24);
      const vMesh1 = new THREE.Mesh(vStem, this.getMaterial(vp.col));
      const vMesh2 = new THREE.Mesh(vHead, this.getMaterial(vp.col));
      vMesh1.position.set(vp.x, 15, vp.z);
      vMesh2.position.set(vp.x, 8.5, vp.z);

      const vGroup = new THREE.Group();
      vGroup.add(vMesh1); vGroup.add(vMesh2);
      group.add(vGroup);
      this.parts.push({ mesh: vGroup, explodeDir: vp.dir });
    });

    // Spark Plug in center
    const spMat = this.getMaterial(0xffd700);
    const spGeo = new THREE.CylinderGeometry(1.2, 1.2, 18, 16);
    const spMesh = new THREE.Mesh(spGeo, spMat);
    spMesh.position.set(0, 16, 0);
    group.add(spMesh);
    this.parts.push({ mesh: spMesh, explodeDir: new THREE.Vector3(0, 2.5, 0) });

    this.modelGroup.add(group);
  }

  // 3. HIGH-SPEED TURBINE IMPELLER & ROTOR
  buildTurbineImpeller() {
    const group = new THREE.Group();

    // Central Rotor Hub
    const hubMat = this.getMaterial(0x00f0ff);
    const hubGeo = new THREE.CylinderGeometry(3.5, 8.5, 12, 36);
    const hubMesh = new THREE.Mesh(hubGeo, hubMat);
    group.add(hubMesh);
    this.parts.push({ mesh: hubMesh, explodeDir: new THREE.Vector3(0, 0, 0) });

    // 12 Curved Aerodynamic Impeller Blades
    const bladeMat = this.getMaterial(0xa0aec0);
    for (let b = 0; b < 12; b++) {
      const ba = (b * Math.PI * 2) / 12;
      const bGeo = new THREE.BoxGeometry(1.2, 10, 8);
      const bMesh = new THREE.Mesh(bGeo, bladeMat);
      bMesh.position.set(Math.cos(ba) * 7.5, 0, Math.sin(ba) * 7.5);
      bMesh.rotation.y = -ba + 0.6;
      bMesh.rotation.z = 0.25;
      group.add(bMesh);
      this.parts.push({ mesh: bMesh, explodeDir: new THREE.Vector3(Math.cos(ba) * 1.5, 0, Math.sin(ba) * 1.5) });
    }

    // Nose Cone (Diffuser Fairing)
    const noseMat = this.getMaterial(0xff9d00);
    const noseGeo = new THREE.ConeGeometry(3.8, 8, 32);
    const noseMesh = new THREE.Mesh(noseGeo, noseMat);
    noseMesh.position.y = 10;
    group.add(noseMesh);
    this.parts.push({ mesh: noseMesh, explodeDir: new THREE.Vector3(0, 2.0, 0) });

    this.modelGroup.add(group);
  }

  updateExplode(factor) {
    this.explodeFactor = factor;
    if (!this.parts) return;
    this.parts.forEach((item) => {
      if (item.mesh && item.explodeDir) {
        if (!item.initialPos) {
          item.initialPos = item.mesh.position.clone();
        }
        item.mesh.position.copy(item.initialPos).addScaledVector(item.explodeDir, factor * 9);
      }
    });
  }

  bindControls() {
    const modelSelect = document.getElementById('cad-model-select');
    if (modelSelect) {
      modelSelect.addEventListener('change', (e) => {
        if (window.mechAudio) window.mechAudio.playMechanicalClick(1400);
        this.loadModel(e.target.value);
      });
    }

    const shadeSelect = document.getElementById('cad-shade-mode');
    if (shadeSelect) {
      shadeSelect.addEventListener('change', (e) => {
        if (window.mechAudio) window.mechAudio.playMechanicalClick(1200);
        this.shadingMode = e.target.value;
        this.loadModel(this.currentModelType);
      });
    }

    const matSelect = document.getElementById('cad-material-preset');
    if (matSelect) {
      matSelect.addEventListener('change', (e) => {
        if (window.mechAudio) window.mechAudio.playMechanicalClick(1600);
        this.materialPreset = e.target.value;
        this.loadModel(this.currentModelType);
      });
    }

    const explodeSlider = document.getElementById('cad-explode-slider');
    if (explodeSlider) {
      explodeSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        this.updateExplode(val);
        const valLabel = document.getElementById('cad-explode-val');
        if (valLabel) valLabel.textContent = `${(val * 100).toFixed(0)}%`;
      });
    }

    const spinToggle = document.getElementById('cad-spin-toggle');
    if (spinToggle) {
      spinToggle.addEventListener('change', (e) => {
        this.autoRotate = e.target.checked;
      });
    }

    const resetCamBtn = document.getElementById('cad-reset-cam-btn');
    if (resetCamBtn) {
      resetCamBtn.addEventListener('click', () => {
        if (window.mechAudio) window.mechAudio.playHydraulicWhoosh();
        this.camera.position.set(30, 25, 40);
        if (this.controls) this.controls.target.set(0, 0, 0);
      });
    }
  }

  animate() {
    requestAnimationFrame(this.animate);
    if (this.controls) this.controls.update();

    if (this.autoRotate && this.modelGroup) {
      this.modelGroup.rotation.y += 0.008;
    }

    this.renderer.render(this.scene, this.camera);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('three-cad-canvas-container')) {
    setTimeout(() => {
      if (typeof THREE !== 'undefined') {
        window.mainCADViewer = new MechanicalCADViewer('three-cad-canvas-container');
      }
    }, 150);
  }
});
