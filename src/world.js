import * as THREE from 'three';

// Store obstacles for collision detection
export const obstacles = [];

// World configuration
export const WORLD_CONFIG = {
  groundSize: 200,
  trackWidth: 12,
  trackRadius: 60,
};

export function createWorld(scene) {
  createGround(scene);
  createSkybox(scene);
  createRacetrack(scene);
  createRamps(scene);
  createCones(scene);
  createRocks(scene);
  createBoundaryWalls(scene);
}

function createGround(scene) {
  // Gravel/sand base
  const groundGeometry = new THREE.PlaneGeometry(WORLD_CONFIG.groundSize, WORLD_CONFIG.groundSize);
  const groundMaterial = new THREE.MeshStandardMaterial({
    color: 0xC2B280,  // Sandy color
    roughness: 0.9,
    metalness: 0.0,
  });
  const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
  groundMesh.rotation.x = -Math.PI / 2;
  groundMesh.position.y = 0;
  groundMesh.receiveShadow = true;
  scene.add(groundMesh);
}

function createRacetrack(scene) {
  // Create oval track using a ring shape
  const outerRadius = WORLD_CONFIG.trackRadius + WORLD_CONFIG.trackWidth / 2;
  const innerRadius = WORLD_CONFIG.trackRadius - WORLD_CONFIG.trackWidth / 2;

  // Track surface (dark asphalt)
  const trackShape = new THREE.Shape();
  trackShape.absarc(0, 0, outerRadius, 0, Math.PI * 2, false);
  const holePath = new THREE.Path();
  holePath.absarc(0, 0, innerRadius, 0, Math.PI * 2, true);
  trackShape.holes.push(holePath);

  const trackGeometry = new THREE.ShapeGeometry(trackShape, 64);
  const trackMaterial = new THREE.MeshStandardMaterial({
    color: 0x333333,  // Dark asphalt
    roughness: 0.8,
    metalness: 0.1,
  });
  const trackMesh = new THREE.Mesh(trackGeometry, trackMaterial);
  trackMesh.rotation.x = -Math.PI / 2;
  trackMesh.position.y = 0.01;  // Slightly above ground
  trackMesh.receiveShadow = true;
  scene.add(trackMesh);

  // Track white lines (center line)
  const centerLineRadius = WORLD_CONFIG.trackRadius;
  const lineGeometry = new THREE.RingGeometry(centerLineRadius - 0.15, centerLineRadius + 0.15, 64);
  const lineMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.5,
  });
  const centerLine = new THREE.Mesh(lineGeometry, lineMaterial);
  centerLine.rotation.x = -Math.PI / 2;
  centerLine.position.y = 0.02;
  scene.add(centerLine);

  // Track edge lines
  const outerLineGeometry = new THREE.RingGeometry(outerRadius - 0.3, outerRadius, 64);
  const outerLine = new THREE.Mesh(outerLineGeometry, lineMaterial);
  outerLine.rotation.x = -Math.PI / 2;
  outerLine.position.y = 0.02;
  scene.add(outerLine);

  const innerLineGeometry = new THREE.RingGeometry(innerRadius, innerRadius + 0.3, 64);
  const innerLine = new THREE.Mesh(innerLineGeometry, lineMaterial);
  innerLine.rotation.x = -Math.PI / 2;
  innerLine.position.y = 0.02;
  scene.add(innerLine);

  // Start/Finish line - larger and more visible
  createStartFinishLine(scene, outerRadius, innerRadius);
}

function createStartFinishLine(scene, outerRadius, innerRadius) {
  const trackWidth = outerRadius - innerRadius;
  const lineDepth = 3;  // How wide the line is along the track direction

  // Start line at x=0, spanning from innerRadius to outerRadius in Z
  // At this point on the circle, track runs in X direction (tangent)
  // So the finish line should span in Z direction (radial) to cross the track

  // Base white rectangle - spans radially (Z direction) across track
  const startLineGeometry = new THREE.PlaneGeometry(lineDepth, trackWidth);
  const startLineMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.5,
  });
  const startLine = new THREE.Mesh(startLineGeometry, startLineMaterial);
  startLine.rotation.x = -Math.PI / 2;
  startLine.position.set(0, 0.02, WORLD_CONFIG.trackRadius);  // Center of track at top
  scene.add(startLine);

  // Checkerboard pattern
  const checkerSize = 1;
  const blackMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
  const numCheckersX = Math.floor(lineDepth / checkerSize);
  const numCheckersZ = Math.floor(trackWidth / checkerSize);

  for (let i = 0; i < numCheckersX; i++) {
    for (let j = 0; j < numCheckersZ; j++) {
      if ((i + j) % 2 === 0) {
        const checker = new THREE.Mesh(
          new THREE.PlaneGeometry(checkerSize, checkerSize),
          blackMaterial
        );
        checker.rotation.x = -Math.PI / 2;
        checker.position.set(
          -lineDepth / 2 + i * checkerSize + checkerSize / 2,
          0.025,
          innerRadius + j * checkerSize + checkerSize / 2
        );
        scene.add(checker);
      }
    }
  }

  // Start/Finish banner arch - spans radially across track (in Z direction)
  const archHeight = 6;

  // Inner pole (at inner edge of track)
  const poleMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const poleGeometry = new THREE.CylinderGeometry(0.25, 0.25, archHeight, 8);
  const innerPole = new THREE.Mesh(poleGeometry, poleMaterial);
  innerPole.position.set(0, archHeight / 2, innerRadius - 1);
  innerPole.castShadow = true;
  scene.add(innerPole);

  // Outer pole (at outer edge of track)
  const outerPole = new THREE.Mesh(poleGeometry, poleMaterial);
  outerPole.position.set(0, archHeight / 2, outerRadius + 1);
  outerPole.castShadow = true;
  scene.add(outerPole);

  // Top banner - spans between poles (in Z direction)
  const bannerLength = trackWidth + 4;
  const bannerGeometry = new THREE.BoxGeometry(0.5, 1.5, bannerLength);
  const bannerMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
  const banner = new THREE.Mesh(bannerGeometry, bannerMaterial);
  banner.position.set(0, archHeight, WORLD_CONFIG.trackRadius);
  banner.castShadow = true;
  scene.add(banner);

  // Checkered flag pattern on banner
  const flagMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
  for (let i = -3; i <= 3; i++) {
    if (i % 2 === 0) {
      const flagBlock = new THREE.Mesh(
        new THREE.BoxGeometry(0.55, 1, 1.2),
        flagMaterial
      );
      flagBlock.position.set(0, archHeight, WORLD_CONFIG.trackRadius + i * 1.2);
      scene.add(flagBlock);
    }
  }
}

function createRamps(scene) {
  // Place ramps tangent to the track, facing CLOCKWISE direction
  // AVOID angle 0 - that's where the finish line is!
  // Clockwise tangent at angle θ is in direction (θ - π/2)
  const rampPositions = [
    { angle: Math.PI / 3 },      // 60 degrees - between top and right
    { angle: Math.PI },          // 180 degrees - bottom of track
    { angle: Math.PI * 5/3 },    // 300 degrees - between bottom and top (left side)
  ];

  rampPositions.forEach(pos => {
    // Position on track center line
    const x = Math.sin(pos.angle) * WORLD_CONFIG.trackRadius;
    const z = Math.cos(pos.angle) * WORLD_CONFIG.trackRadius;
    // Rotation for clockwise tangent direction
    const rotation = pos.angle - Math.PI / 2;
    createRamp(scene, x, z, rotation);
  });
}

function createRamp(scene, x, z, rotation) {
  const rampWidth = 6;
  const rampLength = 8;
  const rampHeight = 1.5;

  // Create ramp geometry as a wedge
  const geometry = new THREE.BufferGeometry();

  const vertices = new Float32Array([
    // Bottom face
    -rampWidth/2, 0, 0,
    rampWidth/2, 0, 0,
    rampWidth/2, 0, rampLength,
    -rampWidth/2, 0, rampLength,

    // Top slanted face
    -rampWidth/2, 0, 0,
    rampWidth/2, 0, 0,
    rampWidth/2, rampHeight, rampLength,
    -rampWidth/2, rampHeight, rampLength,

    // Front face (tall end)
    -rampWidth/2, 0, rampLength,
    rampWidth/2, 0, rampLength,
    rampWidth/2, rampHeight, rampLength,
    -rampWidth/2, rampHeight, rampLength,

    // Left side
    -rampWidth/2, 0, 0,
    -rampWidth/2, 0, rampLength,
    -rampWidth/2, rampHeight, rampLength,

    // Right side
    rampWidth/2, 0, 0,
    rampWidth/2, 0, rampLength,
    rampWidth/2, rampHeight, rampLength,
  ]);

  const indices = [
    // Bottom
    0, 1, 2,  0, 2, 3,
    // Top (slant)
    4, 6, 5,  4, 7, 6,
    // Front
    8, 9, 10,  8, 10, 11,
    // Left
    12, 13, 14,
    // Right
    15, 17, 16,
  ];

  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  const material = new THREE.MeshStandardMaterial({
    color: 0x8B4513,  // Wood brown
    roughness: 0.7,
    metalness: 0.2,
  });

  const rampMesh = new THREE.Mesh(geometry, material);
  rampMesh.position.set(x, 0, z);
  rampMesh.rotation.y = rotation;
  rampMesh.castShadow = true;
  rampMesh.receiveShadow = true;
  scene.add(rampMesh);

  // Yellow edge stripe
  const stripeGeometry = new THREE.BoxGeometry(rampWidth + 0.2, 0.2, 0.3);
  const stripeMaterial = new THREE.MeshStandardMaterial({ color: 0xFFD700 });
  const stripe = new THREE.Mesh(stripeGeometry, stripeMaterial);

  // Position stripe at top of ramp
  const stripeOffset = new THREE.Vector3(0, rampHeight + 0.1, rampLength);
  stripeOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), rotation);
  stripe.position.set(x + stripeOffset.x, stripeOffset.y, z + stripeOffset.z);
  stripe.rotation.y = rotation;
  scene.add(stripe);

  // Add ramp as obstacle for collision (simplified as box)
  obstacles.push({
    type: 'ramp',
    x: x,
    z: z,
    width: rampWidth,
    length: rampLength,
    height: rampHeight,
    rotation: rotation,
  });
}

function createCones(scene) {
  // Place cones around the track edges only (sparser)
  const conePositions = [
    // Inner edge markers (fewer cones)
    ...generateCirclePositions(WORLD_CONFIG.trackRadius - WORLD_CONFIG.trackWidth/2 - 1.5, 8),
    // Outer edge markers (fewer cones)
    ...generateCirclePositions(WORLD_CONFIG.trackRadius + WORLD_CONFIG.trackWidth/2 + 1.5, 8),
  ];

  conePositions.forEach(pos => {
    createCone(scene, pos.x, pos.z);
  });
}

function generateCirclePositions(radius, count) {
  const positions = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    positions.push({
      x: Math.cos(angle) * radius,
      z: Math.sin(angle) * radius,
    });
  }
  return positions;
}

function createCone(scene, x, z) {
  const coneHeight = 0.8;
  const coneRadius = 0.25;

  // Cone geometry
  const coneGeometry = new THREE.ConeGeometry(coneRadius, coneHeight, 8);
  const coneMaterial = new THREE.MeshStandardMaterial({
    color: 0xFF6600,
    roughness: 0.7,
  });
  const coneMesh = new THREE.Mesh(coneGeometry, coneMaterial);
  coneMesh.position.set(x, coneHeight / 2, z);
  coneMesh.castShadow = true;
  scene.add(coneMesh);

  // White stripe
  const stripeGeometry = new THREE.ConeGeometry(coneRadius * 0.9, coneHeight * 0.2, 8);
  const stripeMaterial = new THREE.MeshStandardMaterial({ color: 0xFFFFFF });
  const stripe = new THREE.Mesh(stripeGeometry, stripeMaterial);
  stripe.position.y = -coneHeight * 0.2;
  coneMesh.add(stripe);

  // Add as obstacle
  obstacles.push({
    type: 'cone',
    x: x,
    z: z,
    radius: coneRadius * 2,  // Collision radius
    mesh: coneMesh,
  });
}

function createRocks(scene) {
  // Place rocks in the desert area (outside track)
  const rockPositions = [
    { x: 30, z: 80, scale: 3 },
    { x: -35, z: 75, scale: 2.5 },
    { x: 80, z: 30, scale: 4 },
    { x: 75, z: -25, scale: 2 },
    { x: -80, z: 20, scale: 3.5 },
    { x: -75, z: -30, scale: 2.5 },
    { x: 25, z: -80, scale: 3 },
    { x: -30, z: -75, scale: 2 },
    { x: 85, z: 60, scale: 2 },
    { x: -85, z: -60, scale: 2.5 },
  ];

  const rockGeometry = new THREE.DodecahedronGeometry(1, 0);
  const rockMaterial = new THREE.MeshStandardMaterial({
    color: 0x8B7355,
    roughness: 0.9,
    metalness: 0.0,
  });

  rockPositions.forEach(pos => {
    const rock = new THREE.Mesh(rockGeometry, rockMaterial);
    rock.position.set(pos.x, pos.scale * 0.4, pos.z);
    rock.scale.set(pos.scale, pos.scale * 0.7, pos.scale);
    rock.rotation.set(Math.random() * 0.5, Math.random() * Math.PI, 0);
    rock.castShadow = true;
    rock.receiveShadow = true;
    scene.add(rock);

    // Add as obstacle
    obstacles.push({
      type: 'rock',
      x: pos.x,
      z: pos.z,
      radius: pos.scale * 1.2,  // Collision radius
    });
  });
}

function createBoundaryWalls(scene) {
  const wallDistance = WORLD_CONFIG.groundSize / 2 - 2;
  const wallHeight = 2;

  const wallMaterial = new THREE.MeshStandardMaterial({
    color: 0x666666,
    roughness: 0.9,
  });

  // Create 4 walls
  const walls = [
    { x: 0, z: wallDistance, width: WORLD_CONFIG.groundSize, rotation: 0 },
    { x: 0, z: -wallDistance, width: WORLD_CONFIG.groundSize, rotation: 0 },
    { x: wallDistance, z: 0, width: WORLD_CONFIG.groundSize, rotation: Math.PI / 2 },
    { x: -wallDistance, z: 0, width: WORLD_CONFIG.groundSize, rotation: Math.PI / 2 },
  ];

  walls.forEach(wall => {
    const geometry = new THREE.BoxGeometry(wall.width, wallHeight, 1);
    const mesh = new THREE.Mesh(geometry, wallMaterial);
    mesh.position.set(wall.x, wallHeight / 2, wall.z);
    mesh.rotation.y = wall.rotation;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);

    // Add as obstacle
    obstacles.push({
      type: 'wall',
      x: wall.x,
      z: wall.z,
      width: wall.width,
      depth: 1,
      rotation: wall.rotation,
    });
  });
}

function createSkybox(scene) {
  const skyGeometry = new THREE.SphereGeometry(400, 32, 32);
  const skyMaterial = new THREE.ShaderMaterial({
    uniforms: {
      topColor: { value: new THREE.Color(0x0077ff) },
      bottomColor: { value: new THREE.Color(0x87CEEB) },
      offset: { value: 33 },
      exponent: { value: 0.6 },
    },
    vertexShader: `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 topColor;
      uniform vec3 bottomColor;
      uniform float offset;
      uniform float exponent;
      varying vec3 vWorldPosition;
      void main() {
        float h = normalize(vWorldPosition + offset).y;
        gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
      }
    `,
    side: THREE.BackSide,
  });
  const sky = new THREE.Mesh(skyGeometry, skyMaterial);
  scene.add(sky);
}

// Collision detection function
export function checkCollisions(carX, carZ, carWidth, carLength, carRotation, carY = 0) {
  const carRadius = Math.max(carWidth, carLength) / 2;

  for (const obstacle of obstacles) {
    if (obstacle.type === 'cone') {
      // Circle-circle collision
      const dx = carX - obstacle.x;
      const dz = carZ - obstacle.z;
      const distance = Math.sqrt(dx * dx + dz * dz);
      if (distance < carRadius + obstacle.radius) {
        return {
          hit: true,
          type: 'cone',
          obstacle: obstacle,
          pushX: dx / distance,
          pushZ: dz / distance,
        };
      }
    } else if (obstacle.type === 'rock') {
      // Circle-circle collision
      const dx = carX - obstacle.x;
      const dz = carZ - obstacle.z;
      const distance = Math.sqrt(dx * dx + dz * dz);
      if (distance < carRadius + obstacle.radius) {
        return {
          hit: true,
          type: 'rock',
          pushX: dx / distance,
          pushZ: dz / distance,
          overlap: carRadius + obstacle.radius - distance,
        };
      }
    } else if (obstacle.type === 'wall') {
      // Simple AABB for walls
      const cosR = Math.cos(obstacle.rotation);
      const sinR = Math.sin(obstacle.rotation);

      // Transform car position to wall's local space
      const localX = (carX - obstacle.x) * cosR + (carZ - obstacle.z) * sinR;
      const localZ = -(carX - obstacle.x) * sinR + (carZ - obstacle.z) * cosR;

      const halfWidth = obstacle.width / 2;
      const halfDepth = obstacle.depth / 2 + carRadius;

      if (Math.abs(localX) < halfWidth && Math.abs(localZ) < halfDepth) {
        return {
          hit: true,
          type: 'wall',
          pushX: localZ > 0 ? sinR : -sinR,
          pushZ: localZ > 0 ? cosR : -cosR,
        };
      }
    } else if (obstacle.type === 'ramp') {
      // Only collide with the BACK of the ramp (the tall steep end)
      // Back edge is at: ramp position + rampLength in the ramp's forward direction
      const rampForwardX = Math.sin(obstacle.rotation);
      const rampForwardZ = Math.cos(obstacle.rotation);

      // Position of the back edge (top of ramp)
      const backEdgeX = obstacle.x + rampForwardX * obstacle.length;
      const backEdgeZ = obstacle.z + rampForwardZ * obstacle.length;

      // Distance from car to back edge
      const dx = carX - backEdgeX;
      const dz = carZ - backEdgeZ;
      const distToBack = Math.sqrt(dx * dx + dz * dz);

      // Check if car is close to back edge, at ground level, and within ramp width
      const collisionDist = carRadius + 1.5;
      const atGroundLevel = carY < 1.5;  // Not elevated (on ramp or jumping)

      // Also check car is actually behind the ramp (not on top of it)
      // by checking if it's beyond the ramp end in the forward direction
      const beyondRamp = (dx * rampForwardX + dz * rampForwardZ) > 0;

      if (distToBack < collisionDist && atGroundLevel && beyondRamp) {
        return {
          hit: true,
          type: 'ramp_back',
          pushX: dx / distToBack,
          pushZ: dz / distToBack,
        };
      }
    }
  }

  return { hit: false };
}

// Get ramp height at position
export function getRampHeight(x, z) {
  for (const obstacle of obstacles) {
    if (obstacle.type === 'ramp') {
      // Transform to ramp's local space using inverse rotation
      // For rotation θ around Y, inverse rotation transforms world to local:
      // localX = dx * cos(θ) - dz * sin(θ)
      // localZ = dx * sin(θ) + dz * cos(θ)
      const cosR = Math.cos(obstacle.rotation);
      const sinR = Math.sin(obstacle.rotation);

      const dx = x - obstacle.x;
      const dz = z - obstacle.z;
      const localX = dx * cosR - dz * sinR;
      const localZ = dx * sinR + dz * cosR;

      // Check if on ramp (with small margin for smoother entry)
      const margin = 1.0;
      if (localX > -obstacle.width/2 - margin && localX < obstacle.width/2 + margin &&
          localZ > -margin && localZ < obstacle.length + margin) {
        // Calculate height based on position on ramp
        const progress = Math.max(0, Math.min(1, localZ / obstacle.length));
        return progress * obstacle.height;
      }
    }
  }
  return 0;
}
