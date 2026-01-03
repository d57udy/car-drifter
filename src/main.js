import * as THREE from 'three';
import { createCar, updateCar, resetCar } from './car.js';
import { createWorld, WORLD_CONFIG } from './world.js';
import { setupControls, getControlState } from './controls.js';
import { setupCamera, updateCamera } from './camera.js';
import { setupUI, updateUI, handleRestart } from './ui.js';
import { resetGameState } from './gameState.js';

// Game state
const state = {
  scene: null,
  renderer: null,
  camera: null,
  car: null,
  clock: new THREE.Clock(),
};

// Initialize the game
async function init() {
  // Create Three.js scene
  state.scene = new THREE.Scene();
  state.scene.background = new THREE.Color(0x87CEEB); // Sky blue
  state.scene.fog = new THREE.Fog(0xC2B280, 50, 300);

  // Create renderer
  const canvas = document.getElementById('game-canvas');
  state.renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
  });
  state.renderer.setSize(window.innerWidth, window.innerHeight);
  state.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  state.renderer.shadowMap.enabled = true;
  state.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // Create camera
  state.camera = setupCamera();

  // Add lighting
  setupLighting(state.scene);

  // Create game world (terrain, obstacles)
  createWorld(state.scene);

  // Create car (no physics engine - uses simple vector math)
  state.car = createCar(state.scene);

  // Position car at start line (facing clockwise around track)
  // At (0, 60), clockwise direction is -X, which is rotation = -PI/2
  const trackRadius = 60;  // Must match world.js WORLD_CONFIG.trackRadius
  state.car.position.set(0, state.car.position.y, trackRadius);
  state.car.rotation = -Math.PI / 2;  // Face -X direction (clockwise tangent at top of track)
  state.car.mesh.position.copy(state.car.position);
  state.car.mesh.rotation.y = state.car.rotation;

  // Setup controls
  setupControls();

  // R key to restart after crash
  document.addEventListener('keydown', (event) => {
    if (event.code === 'KeyR') {
      handleRestart(state.car);
      // Reposition at start
      state.car.position.set(0, state.car.position.y, trackRadius);
      state.car.rotation = -Math.PI / 2;  // Face -X direction (clockwise)
      state.car.mesh.position.copy(state.car.position);
      state.car.mesh.rotation.y = state.car.rotation;
    }
  });

  // Setup UI
  setupUI();

  // Handle window resize
  window.addEventListener('resize', onWindowResize);

  // Start game loop
  animate();
}

function setupLighting(scene) {
  // Ambient light
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  // Directional light (sun)
  const sunLight = new THREE.DirectionalLight(0xffffff, 1.0);
  sunLight.position.set(50, 100, 50);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 2048;
  sunLight.shadow.mapSize.height = 2048;
  sunLight.shadow.camera.near = 0.5;
  sunLight.shadow.camera.far = 300;
  sunLight.shadow.camera.left = -100;
  sunLight.shadow.camera.right = 100;
  sunLight.shadow.camera.top = 100;
  sunLight.shadow.camera.bottom = -100;
  scene.add(sunLight);

  // Hemisphere light for natural sky/ground colors
  const hemiLight = new THREE.HemisphereLight(0x87CEEB, 0xC2B280, 0.4);
  scene.add(hemiLight);
}

function onWindowResize() {
  state.camera.aspect = window.innerWidth / window.innerHeight;
  state.camera.updateProjectionMatrix();
  state.renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);

  const delta = Math.min(state.clock.getDelta(), 0.1);

  // Get control state
  const controls = getControlState();

  // Update car
  updateCar(state.car, controls, delta);

  // Update camera to follow car
  updateCamera(state.camera, state.car, delta);

  // Update UI
  updateUI(state.car);

  // Render
  state.renderer.render(state.scene, state.camera);
}

// Start the game
init();
