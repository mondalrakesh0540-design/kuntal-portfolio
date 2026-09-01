/**
 * THREE.JS 3D MECHANICAL CAD COMPONENT EXPLORER
 * Kuntal Ghosh Mechanical Engineering Portfolio
 */

class MechanicalCADViewer {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.shadingMode = 'shaded';
    this.materialPreset = 'steel';
    this.autoRotate = true;
    this.explodeFactor = 0;
    this.currentModelType = 'gear';

    this.initThree();
    this.loadModel('gear');
    this.bindControls();
    this.animate = this.animate.bind(this);
    this.animate();
  }

  initThree() {
    const width = this.container.clientWidth || 600;
    const height = this.container.clientHeight || 450;

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a1122);
    this.scene.fog = new THREE.FogExp2(0x0a1122, 0.015);

    // Camera
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    this.camera.position.set(25, 20, 35);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    // Orbit Controls
    if (typeof THREE.OrbitControls !== 'undefined') {
      this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.05;
      this.controls.maxDistance = 150;
      this.controls.minDistance = 5;
    }

    // CAD Blueprint Grid Floor
    const gridHelper = new THREE.GridHelper(60, 30, 0x00f0ff, 0x13274f);
    gridHelper.position.y = -12;
    this.scene.add(gridHelper);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x00f0ff, 1.2);
    dirLight1.position.set(30, 40, 30);
    this.scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xff9d00, 0.8);
    dirLight2.position.set(-30, -20, -30);
    this.scene.add(dirLight2);

    const pointLight = new THREE.PointLight(0xffffff, 1.0, 50);
    pointLight.position.set(0, 15, 0);
    this.scene.add(pointLight);

    // Model group
    this.modelGroup = new THREE.Group();
    this.scene.add(this.modelGroup);

    // Window resize
    window.addEventListener('resize', () => {
      const w = this.container.clientWidth || 600;
      const h = this.container.clientHeight || 450;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    });
  }

  getMaterial(customColor = null) {
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
      roughness: 0.35,
      metalness: 0.85,
      wireframe: isWire
    };

    if (this.materialPreset === 'titanium') {
      matProps.color = customColor || 0x7a8b9e;
      matProps.roughness = 0.25;
      matProps.metalness = 0.95;
    } else if (this.materialPreset === 'brass') {
      matProps.color = customColor || 0xd4af37;
      matProps.roughness = 0.3;
      matProps.metalness = 0.8;
    } else if (this.materialPreset === 'cyan') {
      matProps.color = customColor || 0x00f0ff;
      matProps.roughness = 0.2;
      matProps.metalness = 0.5;
    } else {
      // Tool Steel
      matProps.color = customColor || 0xa0aec0;
      matProps.roughness = 0.4;
      matProps.metalness = 0.85;
    }

    return new THREE.MeshStandardMaterial(matProps);
  }

  loadModel(type) {
    this.currentModelType = type;
    // Clear existing children
    while (this.modelGroup.children.length > 0) {
      const obj = this.modelGroup.children[0];
      this.modelGroup.remove(obj);
    }

    this.parts = [];

    if (type === 'gear') {
      this.buildFlangedGear();
    } else if (type === 'piston') {
      this.buildPistonAssembly();
    } else if (type === 'shaft') {
      this.buildTransmissionShaft();
    }
  }

  buildFlangedGear() {
    const gearGroup = new THREE.Group();

    // 1. Gear Rim and Teeth
    const teethCount = 20;
    const rimRadius = 12;
    const gearMat = this.getMaterial(0x94a3b8);

    // Rim Cylinder
    const rimGeo = new THREE.CylinderGeometry(rimRadius, rimRadius, 4, 32);
    const rimMesh = new THREE.Mesh(rimGeo, gearMat);
    gearGroup.add(rimMesh);

    // Individual Involute Teeth
    for (let i = 0; i < teethCount; i++) {
      const angle = (i * Math.PI * 2) / teethCount;
      const toothGeo = new THREE.BoxGeometry(2.2, 4, 3.2);
      const toothMesh = new THREE.Mesh(toothGeo, gearMat);
      toothMesh.position.set(
        Math.cos(angle) * (rimRadius + 1.2),
        0,
        Math.sin(angle) * (rimRadius + 1.2)
      );
      toothMesh.rotation.y = -angle;
      gearGroup.add(toothMesh);
    }

    // 2. Center Flange Hub (Explodable Part)
    const hubMat = this.getMaterial(0x00f0ff);
    const hubGeo = new THREE.CylinderGeometry(6, 6, 7, 32);
    const hubMesh = new THREE.Mesh(hubGeo, hubMat);
    hubMesh.position.y = 0;
    gearGroup.add(hubMesh);

    // 3. Central Shaft with Keyway
    const shaftMat = this.getMaterial(0xd4af37);
    const shaftGeo = new THREE.CylinderGeometry(3, 3, 16, 32);
    const shaftMesh = new THREE.Mesh(shaftGeo, shaftMat);
    shaftMesh.position.y = 0;
    gearGroup.add(shaftMesh);

    // 4. Hex Retaining Bolts on Flange
    for (let b = 0; b < 6; b++) {
      const bAngle = (b * Math.PI * 2) / 6;
      const boltGeo = new THREE.CylinderGeometry(0.8, 0.8, 1.2, 6);
      const boltMesh = new THREE.Mesh(boltGeo, this.getMaterial(0xff9d00));
      boltMesh.position.set(Math.cos(bAngle) * 4.5, 3.8, Math.sin(bAngle) * 4.5);
      gearGroup.add(boltMesh);
      this.parts.push({ mesh: boltMesh, explodeDir: new THREE.Vector3(Math.cos(bAngle), 1.5, Math.sin(bAngle)) });
    }

    this.parts.push({ mesh: shaftMesh, explodeDir: new THREE.Vector3(0, -1.5, 0) });
    this.parts.push({ mesh: hubMesh, explodeDir: new THREE.Vector3(0, 1.2, 0) });

    this.modelGroup.add(gearGroup);
  }

  buildPistonAssembly() {
    const pistonGroup = new THREE.Group();

    // 1. Piston Crown
    const crownMat = this.getMaterial(0xa0aec0);
    const crownGeo = new THREE.CylinderGeometry(9, 9, 12, 32);
    const crownMesh = new THREE.Mesh(crownGeo, crownMat);
    crownMesh.position.y = 10;
    pistonGroup.add(crownMesh);
    this.parts.push({ mesh: crownMesh, explodeDir: new THREE.Vector3(0, 1.5, 0) });

    // Compression Rings (2 rings)
    for (let r = 0; r < 2; r++) {
      const ringGeo = new THREE.TorusGeometry(9.1, 0.25, 8, 32);
      const ringMesh = new THREE.Mesh(ringGeo, this.getMaterial(0xff9d00));
      ringMesh.rotation.x = Math.PI / 2;
      ringMesh.position.y = 13 + r * 1.5;
      pistonGroup.add(ringMesh);
      this.parts.push({ mesh: ringMesh, explodeDir: new THREE.Vector3(0, 1.8 + r * 0.4, 0) });
    }

    // 2. Wrist Gudgeon Pin
    const pinMat = this.getMaterial(0x00f0ff);
    const pinGeo = new THREE.CylinderGeometry(2, 2, 16, 24);
    const pinMesh = new THREE.Mesh(pinGeo, pinMat);
    pinMesh.rotation.z = Math.PI / 2;
    pinMesh.position.y = 8;
    pistonGroup.add(pinMesh);
    this.parts.push({ mesh: pinMesh, explodeDir: new THREE.Vector3(1.8, 0, 0) });

    // 3. Connecting Rod Shank
    const rodMat = this.getMaterial(0x64748b);
    const rodGeo = new THREE.BoxGeometry(3, 18, 2.5);
    const rodMesh = new THREE.Mesh(rodGeo, rodMat);
    rodMesh.position.y = -2;
    pistonGroup.add(rodMesh);

    // 4. Big End Bearing Cap & Fasteners
    const capMat = this.getMaterial(0xd4af37);
    const capGeo = new THREE.CylinderGeometry(4.5, 4.5, 3.5, 24, 1, false, 0, Math.PI);
    const capMesh = new THREE.Mesh(capGeo, capMat);
    capMesh.rotation.z = Math.PI / 2;
    capMesh.position.y = -12;
    pistonGroup.add(capMesh);
    this.parts.push({ mesh: capMesh, explodeDir: new THREE.Vector3(0, -1.8, 0) });

    this.modelGroup.add(pistonGroup);
  }

  buildTransmissionShaft() {
    const shaftGroup = new THREE.Group();

    // Stepped Cylinders
    const steps = [
      { r: 2.5, len: 8, pos: -12, color: 0x94a3b8 },
      { r: 4.5, len: 10, pos: -3, color: 0x00f0ff },
      { r: 6.0, len: 6, pos: 5, color: 0xd4af37 },
      { r: 3.5, len: 12, pos: 14, color: 0xa0aec0 }
    ];

    steps.forEach((step, idx) => {
      const geo = new THREE.CylinderGeometry(step.r, step.r, step.len, 32);
      const mesh = new THREE.Mesh(geo, this.getMaterial(step.color));
      mesh.position.y = step.pos;
      shaftGroup.add(mesh);
      this.parts.push({ mesh, explodeDir: new THREE.Vector3(0, (idx - 1.5) * 0.8, 0) });
    });

    // Splines on step 1
    for (let s = 0; s < 8; s++) {
      const sa = (s * Math.PI * 2) / 8;
      const sGeo = new THREE.BoxGeometry(0.8, 7, 0.8);
      const sMesh = new THREE.Mesh(sGeo, this.getMaterial(0xff9d00));
      sMesh.position.set(Math.cos(sa) * 2.6, -12, Math.sin(sa) * 2.6);
      shaftGroup.add(sMesh);
    }

    this.modelGroup.add(shaftGroup);
  }

  updateExplode(factor) {
    this.explodeFactor = factor;
    if (!this.parts) return;
    this.parts.forEach((item) => {
      if (item.mesh && item.explodeDir) {
        if (!item.initialPos) {
          item.initialPos = item.mesh.position.clone();
        }
        item.mesh.position.copy(item.initialPos).addScaledVector(item.explodeDir, factor * 8);
      }
    });
  }

  bindControls() {
    const modelSelect = document.getElementById('cad-model-select');
    if (modelSelect) {
      modelSelect.addEventListener('change', (e) => this.loadModel(e.target.value));
    }

    const shadeSelect = document.getElementById('cad-shade-mode');
    if (shadeSelect) {
      shadeSelect.addEventListener('change', (e) => {
        this.shadingMode = e.target.value;
        this.loadModel(this.currentModelType);
      });
    }

    const matSelect = document.getElementById('cad-material-preset');
    if (matSelect) {
      matSelect.addEventListener('change', (e) => {
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
        this.camera.position.set(25, 20, 35);
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
    // Delay initialization slightly to guarantee Three.js and container dimensions
    setTimeout(() => {
      if (typeof THREE !== 'undefined') {
        window.mainCADViewer = new MechanicalCADViewer('three-cad-canvas-container');
      }
    }, 150);
  }
});
