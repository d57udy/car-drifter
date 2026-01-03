import * as THREE from 'three';

// Camera configuration
const CAMERA_CONFIG = {
  fov: 60,
  near: 0.1,
  far: 1000,
  distance: 10,
  height: 4,
  lookAheadDistance: 5,
  smoothness: 5,
};

// Camera state
const cameraState = {
  currentPosition: new THREE.Vector3(),
  currentLookAt: new THREE.Vector3(),
  initialized: false,
};

export function setupCamera() {
  const camera = new THREE.PerspectiveCamera(
    CAMERA_CONFIG.fov,
    window.innerWidth / window.innerHeight,
    CAMERA_CONFIG.near,
    CAMERA_CONFIG.far
  );

  camera.position.set(0, CAMERA_CONFIG.height, -CAMERA_CONFIG.distance);

  return camera;
}

export function updateCamera(camera, car, delta) {
  if (!car || !car.mesh) return;

  const carPosition = car.mesh.position.clone();
  const carQuaternion = car.mesh.quaternion.clone();

  // Calculate camera offset based on car's rotation
  const offset = new THREE.Vector3(0, CAMERA_CONFIG.height, -CAMERA_CONFIG.distance);
  offset.applyQuaternion(carQuaternion);

  // Target camera position (behind and above the car)
  const targetPosition = carPosition.clone().add(offset);

  // Calculate look-at point (ahead of the car)
  const lookAhead = new THREE.Vector3(0, 1, CAMERA_CONFIG.lookAheadDistance);
  lookAhead.applyQuaternion(carQuaternion);
  const targetLookAt = carPosition.clone().add(lookAhead);

  // Initialize camera state if needed
  if (!cameraState.initialized) {
    cameraState.currentPosition.copy(targetPosition);
    cameraState.currentLookAt.copy(targetLookAt);
    cameraState.initialized = true;
  }

  // Smoothly interpolate camera position
  const smoothFactor = 1 - Math.exp(-CAMERA_CONFIG.smoothness * delta);

  cameraState.currentPosition.lerp(targetPosition, smoothFactor);
  cameraState.currentLookAt.lerp(targetLookAt, smoothFactor);

  // Apply to camera
  camera.position.copy(cameraState.currentPosition);
  camera.lookAt(cameraState.currentLookAt);
}
