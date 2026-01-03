// Game state management

export const gameState = {
  // Score
  score: 0,

  // Lap tracking
  currentLap: 0,
  lapTimes: [],
  lapStartTime: 0,
  bestLapTime: null,

  // For lap detection - track X position since finish line is at x=0
  lastX: 0,
  crossedStart: false,

  // Car state
  isBroken: false,

  // Jump tracking
  jumpStartTime: 0,
  isInJump: false,
};

// Track configuration (must match world.js)
const TRACK_RADIUS = 60;

export function resetGameState() {
  gameState.score = 0;
  gameState.currentLap = 1;  // Start on lap 1
  gameState.lapTimes = [];
  gameState.lapStartTime = performance.now();
  gameState.bestLapTime = null;
  gameState.lastX = 0;
  gameState.crossedStart = true;  // Already at start line
  gameState.isBroken = false;
  gameState.jumpStartTime = 0;
  gameState.isInJump = false;
}

export function updateLapTracking(carX, carZ) {
  if (gameState.isBroken) return;

  // Finish line is at x=0, spanning z from innerRadius to outerRadius
  // Car drives clockwise: starts at (0,60), goes to (-60,0), (0,-60), (60,0), back to (0,60)
  // So when completing a lap, car approaches finish from POSITIVE X (coming from right side)
  const innerRadius = TRACK_RADIUS - 6;  // trackWidth/2
  const outerRadius = TRACK_RADIUS + 6;

  // Check if car is in the finish line zone (correct Z range, near top of circle)
  const inFinishZone = carZ > innerRadius && carZ < outerRadius;

  // Check if car crossed x=0 going from positive to negative/zero (clockwise direction)
  // Car comes from positive X and crosses towards negative X
  const crossedLine = gameState.lastX > 2 && carX <= 2 && carX > -3;

  if (inFinishZone && crossedLine && !gameState.crossedStart) {
    gameState.crossedStart = true;

    if (gameState.currentLap > 0) {
      // Completed a lap
      const lapTime = performance.now() - gameState.lapStartTime;
      gameState.lapTimes.push(lapTime);

      if (gameState.bestLapTime === null || lapTime < gameState.bestLapTime) {
        gameState.bestLapTime = lapTime;
      }

      // Bonus points for completing a lap
      gameState.score += 100;
    }

    gameState.currentLap++;
    gameState.lapStartTime = performance.now();
  }

  // Reset crossing flag when moved away from the line
  if (carX > 10 || carX < -10) {
    gameState.crossedStart = false;
  }

  gameState.lastX = carX;
}

export function startJump() {
  if (!gameState.isInJump) {
    gameState.isInJump = true;
    gameState.jumpStartTime = performance.now();
  }
}

export function endJump() {
  if (gameState.isInJump) {
    const airTime = performance.now() - gameState.jumpStartTime;
    gameState.isInJump = false;

    // Award points based on air time
    if (airTime > 200) {  // Minimum 200ms to count as a jump
      const points = Math.floor(airTime / 100) * 10;  // 10 points per 100ms
      gameState.score += points;
      return points;  // Return points for UI feedback
    }
  }
  return 0;
}

export function breakCar() {
  gameState.isBroken = true;
}

export function repairCar() {
  gameState.isBroken = false;
}

export function getCurrentLapTime() {
  if (gameState.currentLap === 0) return 0;
  return performance.now() - gameState.lapStartTime;
}

export function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const centiseconds = Math.floor((ms % 1000) / 10);
  return `${minutes}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
}
