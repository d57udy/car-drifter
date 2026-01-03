import * as THREE from 'three';
import { checkCollisions, getRampHeight, obstacles } from './world.js';
import { gameState, breakCar, startJump, endJump, updateLapTracking } from './gameState.js';

// Car configuration - simple arcade physics
const CAR_CONFIG = {
  // Dimensions
  chassisWidth: 1.8,
  chassisHeight: 0.6,
  chassisLength: 4,
  wheelRadius: 0.4,

  // Performance (Porsche-like)
  maxSpeed: 50,           // m/s (~180 km/h)
  acceleration: 20,       // m/s²
  brakeDeceleration: 30,  // m/s²
  reverseMaxSpeed: 15,    // m/s
  drag: 0.98,             // velocity multiplier when coasting

  // Handling
  turnRate: 2.0,          // radians per second base turn rate
  grip: 0.95,             // how quickly car aligns to facing direction (0-1)
};

export function createCar(scene) {
  const car = {
    // Transform
    position: new THREE.Vector3(0, CAR_CONFIG.chassisHeight / 2 + CAR_CONFIG.wheelRadius, 0),
    rotation: 0,           // Y rotation in radians

    // Physics (simple vectors)
    velocity: new THREE.Vector3(0, 0, 0),
    speed: 0,              // current forward speed (signed)
    verticalVelocity: 0,   // for jumping
    isAirborne: false,     // track if car is in the air
    lastRampHeight: 0,     // track ramp for launch detection
    lastJumpPoints: 0,     // for UI display

    // Visuals
    mesh: null,
    wheelMeshes: [],
    wheelSpin: 0,
    steeringAngle: 0,
  };

  // Create car mesh (chassis)
  const chassisGeometry = new THREE.BoxGeometry(
    CAR_CONFIG.chassisWidth,
    CAR_CONFIG.chassisHeight,
    CAR_CONFIG.chassisLength
  );
  const chassisMaterial = new THREE.MeshStandardMaterial({
    color: 0xcc0000,
    metalness: 0.6,
    roughness: 0.4,
  });
  const chassisMesh = new THREE.Mesh(chassisGeometry, chassisMaterial);
  chassisMesh.castShadow = true;
  chassisMesh.receiveShadow = true;

  // Create car body group
  const carGroup = new THREE.Group();
  carGroup.add(chassisMesh);

  // Add roof/cabin
  const roofGeometry = new THREE.BoxGeometry(
    CAR_CONFIG.chassisWidth * 0.8,
    CAR_CONFIG.chassisHeight * 0.8,
    CAR_CONFIG.chassisLength * 0.4
  );
  const roofMaterial = new THREE.MeshStandardMaterial({
    color: 0x990000,
    metalness: 0.6,
    roughness: 0.4,
  });
  const roofMesh = new THREE.Mesh(roofGeometry, roofMaterial);
  roofMesh.position.set(0, CAR_CONFIG.chassisHeight * 0.7, -CAR_CONFIG.chassisLength * 0.1);
  roofMesh.castShadow = true;
  carGroup.add(roofMesh);

  // Add headlights
  const headlightGeometry = new THREE.SphereGeometry(0.15, 8, 8);
  const headlightMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffcc,
    emissive: 0xffffcc,
    emissiveIntensity: 0.3,
  });
  const headlightLeft = new THREE.Mesh(headlightGeometry, headlightMaterial);
  headlightLeft.position.set(-0.5, 0, CAR_CONFIG.chassisLength / 2 - 0.1);
  carGroup.add(headlightLeft);

  const headlightRight = new THREE.Mesh(headlightGeometry, headlightMaterial);
  headlightRight.position.set(0.5, 0, CAR_CONFIG.chassisLength / 2 - 0.1);
  carGroup.add(headlightRight);

  scene.add(carGroup);

  // Create wheel meshes (visual only)
  const wheelGeometry = new THREE.CylinderGeometry(
    CAR_CONFIG.wheelRadius,
    CAR_CONFIG.wheelRadius,
    0.3,
    16
  );
  wheelGeometry.rotateZ(Math.PI / 2);

  const wheelMaterial = new THREE.MeshStandardMaterial({
    color: 0x222222,
    metalness: 0.1,
    roughness: 0.9,
  });

  const wheelPositions = [
    { x: -CAR_CONFIG.chassisWidth / 2 - 0.15, y: -CAR_CONFIG.chassisHeight / 2, z: CAR_CONFIG.chassisLength / 2.5 },
    { x: CAR_CONFIG.chassisWidth / 2 + 0.15, y: -CAR_CONFIG.chassisHeight / 2, z: CAR_CONFIG.chassisLength / 2.5 },
    { x: -CAR_CONFIG.chassisWidth / 2 - 0.15, y: -CAR_CONFIG.chassisHeight / 2, z: -CAR_CONFIG.chassisLength / 2.5 },
    { x: CAR_CONFIG.chassisWidth / 2 + 0.15, y: -CAR_CONFIG.chassisHeight / 2, z: -CAR_CONFIG.chassisLength / 2.5 },
  ];

  wheelPositions.forEach((pos) => {
    const wheelMesh = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheelMesh.position.set(pos.x, pos.y, pos.z);
    wheelMesh.castShadow = true;
    carGroup.add(wheelMesh);
    car.wheelMeshes.push(wheelMesh);
  });

  car.mesh = carGroup;

  return car;
}

export function updateCar(car, controls, delta) {
  // Clamp delta to prevent huge jumps
  delta = Math.min(delta, 0.05);

  // If car is broken, don't update physics
  if (gameState.isBroken) {
    return;
  }

  // --- GET FORWARD DIRECTION ---
  const forward = new THREE.Vector3(
    Math.sin(car.rotation),
    0,
    Math.cos(car.rotation)
  );

  // --- ACCELERATION / BRAKING ---
  if (controls.accelerate) {
    // Accelerate forward
    car.speed += CAR_CONFIG.acceleration * delta;
    if (car.speed > CAR_CONFIG.maxSpeed) {
      car.speed = CAR_CONFIG.maxSpeed;
    }
  } else if (controls.brake) {
    if (car.speed > 0.5) {
      // Braking
      car.speed -= CAR_CONFIG.brakeDeceleration * delta;
      if (car.speed < 0) car.speed = 0;
    } else {
      // Reverse
      car.speed -= CAR_CONFIG.acceleration * 0.5 * delta;
      if (car.speed < -CAR_CONFIG.reverseMaxSpeed) {
        car.speed = -CAR_CONFIG.reverseMaxSpeed;
      }
    }
  } else {
    // Coasting - apply drag
    car.speed *= CAR_CONFIG.drag;
    if (Math.abs(car.speed) < 0.1) car.speed = 0;
  }

  // --- STEERING ---
  // Smooth steering input
  let steerInput = 0;
  if (controls.left) steerInput = 1;
  if (controls.right) steerInput = -1;

  // Steering visual angle (for wheel display)
  car.steeringAngle += (steerInput * 0.4 - car.steeringAngle) * 0.2;

  // Only turn when moving
  if (Math.abs(car.speed) > 0.5) {
    // Turn rate decreases at higher speeds for stability
    const speedRatio = Math.abs(car.speed) / CAR_CONFIG.maxSpeed;
    const effectiveTurnRate = CAR_CONFIG.turnRate * (1 - speedRatio * 0.5);

    // Reverse steering when going backward
    const turnDirection = car.speed < 0 ? -steerInput : steerInput;

    // Apply rotation
    car.rotation += turnDirection * effectiveTurnRate * delta;
  }

  // --- UPDATE VELOCITY ---
  // Set velocity in the direction the car is facing
  car.velocity.set(
    forward.x * car.speed,
    0,
    forward.z * car.speed
  );

  // --- UPDATE POSITION ---
  const newX = car.position.x + car.velocity.x * delta;
  const newZ = car.position.z + car.velocity.z * delta;

  // --- COLLISION DETECTION ---
  const collision = checkCollisions(
    newX, newZ,
    CAR_CONFIG.chassisWidth, CAR_CONFIG.chassisLength,
    car.rotation,
    car.position.y  // Pass car height for ramp collision check
  );

  if (collision.hit) {
    if (collision.type === 'rock') {
      // Crash into rock - break the car!
      if (Math.abs(car.speed) > 15) {
        // High speed collision = broken
        breakCar();
        car.speed = 0;
      } else {
        // Low speed = just stop
        car.speed *= -0.3;
        car.position.x += collision.pushX * 0.5;
        car.position.z += collision.pushZ * 0.5;
      }
    } else if (collision.type === 'ramp_back') {
      // Hit the back of a ramp - crash at high speed
      if (Math.abs(car.speed) > 15) {
        breakCar();
        car.speed = 0;
      } else {
        // Bounce back
        car.speed *= -0.5;
        car.position.x += collision.pushX * 1.0;
        car.position.z += collision.pushZ * 1.0;
      }
    } else if (collision.type === 'wall') {
      // Wall collision - just stop, don't break
      car.speed *= -0.3;
      car.position.x += collision.pushX * 0.5;
      car.position.z += collision.pushZ * 0.5;
    } else if (collision.type === 'cone') {
      // Knock cone over (minimal slowdown, push cone away)
      car.speed *= 0.98;  // Barely slow down
      // Move the cone far away
      if (collision.obstacle && collision.obstacle.mesh) {
        collision.obstacle.mesh.position.x += collision.pushX * 5;
        collision.obstacle.mesh.position.z += collision.pushZ * 5;
        collision.obstacle.mesh.rotation.x = Math.PI / 2;  // Tip over completely
        collision.obstacle.mesh.rotation.z = Math.random() * Math.PI;
        // Update collision position so it doesn't keep triggering
        collision.obstacle.x = collision.obstacle.mesh.position.x;
        collision.obstacle.z = collision.obstacle.mesh.position.z;
      }
      car.position.x = newX;
      car.position.z = newZ;
    }
  } else {
    car.position.x = newX;
    car.position.z = newZ;
  }

  // --- RAMP HEIGHT & JUMPING ---
  const rampHeight = getRampHeight(car.position.x, car.position.z);
  const baseHeight = CAR_CONFIG.chassisHeight / 2 + CAR_CONFIG.wheelRadius;
  const groundLevel = baseHeight + rampHeight;

  // Apply gravity when airborne
  const gravity = 25;  // m/s²

  if (car.isAirborne) {
    car.verticalVelocity -= gravity * delta;
    car.position.y += car.verticalVelocity * delta;

    // Check if we've landed
    if (car.position.y <= groundLevel) {
      car.position.y = groundLevel;
      car.isAirborne = false;
      car.verticalVelocity = 0;
      // End jump and get points
      const jumpPoints = endJump();
      if (jumpPoints > 0) {
        car.lastJumpPoints = jumpPoints;  // Store for UI display
      }
    }
  } else {
    // On ground - check if we should launch off a ramp
    const wasOnRamp = car.lastRampHeight > 0.1;
    const isOnRamp = rampHeight > 0.1;

    if (wasOnRamp && !isOnRamp && Math.abs(car.speed) > 10) {
      // Launching off ramp!
      car.isAirborne = true;
      // Vertical velocity based on ramp angle and speed
      car.verticalVelocity = Math.abs(car.speed) * 0.3;  // Launch upward
      // Start tracking jump for points
      startJump();
    } else {
      car.position.y = groundLevel;
    }

    car.lastRampHeight = rampHeight;
  }

  // --- LAP TRACKING ---
  updateLapTracking(car.position.x, car.position.z);

  // --- BOUNDARY CHECK ---
  const boundary = 95;
  if (car.position.x > boundary) { car.position.x = boundary; car.speed *= 0.5; }
  if (car.position.x < -boundary) { car.position.x = -boundary; car.speed *= 0.5; }
  if (car.position.z > boundary) { car.position.z = boundary; car.speed *= 0.5; }
  if (car.position.z < -boundary) { car.position.z = -boundary; car.speed *= 0.5; }

  // --- UPDATE MESH ---
  car.mesh.position.copy(car.position);
  car.mesh.rotation.y = car.rotation;

  // --- UPDATE WHEELS ---
  car.wheelSpin += car.speed * delta * 3;

  car.wheelMeshes.forEach((wheel, index) => {
    wheel.rotation.set(0, 0, 0);
    if (index < 2) {
      // Front wheels - steering + spin
      wheel.rotateY(car.steeringAngle);
    }
    wheel.rotateX(car.wheelSpin);
  });
}

export function resetCar(car) {
  car.position.set(0, CAR_CONFIG.chassisHeight / 2 + CAR_CONFIG.wheelRadius, 0);
  car.rotation = 0;
  car.speed = 0;
  car.velocity.set(0, 0, 0);
  car.verticalVelocity = 0;
  car.isAirborne = false;
  car.lastRampHeight = 0;
  car.lastJumpPoints = 0;
  car.steeringAngle = 0;
  car.wheelSpin = 0;
}

export function getCarSpeed(car) {
  return Math.abs(car.speed) * 3.6; // Convert to km/h
}

// Export for collision detection
export function getCarBody(car) {
  return {
    position: car.position,
    width: CAR_CONFIG.chassisWidth,
    length: CAR_CONFIG.chassisLength,
    rotation: car.rotation,
  };
}
