import { getCarSpeed, resetCar } from './car.js';
import { gameState, resetGameState, repairCar, formatTime, getCurrentLapTime } from './gameState.js';

let speedDisplay = null;
let scoreDisplay = null;
let lapDisplay = null;
let timeDisplay = null;
let crashOverlay = null;
let jumpPopup = null;
let jumpPopupTimeout = null;

export function setupUI() {
  speedDisplay = document.getElementById('speed-display');

  // Create score display
  scoreDisplay = document.createElement('div');
  scoreDisplay.id = 'score-display';
  scoreDisplay.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    font-size: 28px;
    font-weight: bold;
    color: #FFD700;
    text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
    font-family: Arial, sans-serif;
  `;
  document.body.appendChild(scoreDisplay);

  // Create lap display
  lapDisplay = document.createElement('div');
  lapDisplay.id = 'lap-display';
  lapDisplay.style.cssText = `
    position: fixed;
    top: 60px;
    right: 20px;
    font-size: 22px;
    font-weight: bold;
    color: #ffffff;
    text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
    font-family: Arial, sans-serif;
  `;
  document.body.appendChild(lapDisplay);

  // Create time display
  timeDisplay = document.createElement('div');
  timeDisplay.id = 'time-display';
  timeDisplay.style.cssText = `
    position: fixed;
    top: 90px;
    right: 20px;
    font-size: 18px;
    color: #00ffff;
    text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
    font-family: 'Courier New', monospace;
  `;
  document.body.appendChild(timeDisplay);

  // Create crash overlay
  crashOverlay = document.createElement('div');
  crashOverlay.id = 'crash-overlay';
  crashOverlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(255, 0, 0, 0.3);
    display: none;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    z-index: 1000;
  `;
  crashOverlay.innerHTML = `
    <div style="font-size: 48px; color: white; text-shadow: 3px 3px 6px black; margin-bottom: 20px;">
      CRASHED!
    </div>
    <div style="font-size: 24px; color: white; text-shadow: 2px 2px 4px black;">
      Press R to restart
    </div>
  `;
  document.body.appendChild(crashOverlay);

  // Create jump points popup
  jumpPopup = document.createElement('div');
  jumpPopup.id = 'jump-popup';
  jumpPopup.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 36px;
    font-weight: bold;
    color: #00ff00;
    text-shadow: 3px 3px 6px rgba(0,0,0,0.8);
    font-family: Arial, sans-serif;
    opacity: 0;
    transition: opacity 0.3s, transform 0.5s;
    pointer-events: none;
  `;
  document.body.appendChild(jumpPopup);

  // Detect touch device and show/hide controls accordingly
  const touchControls = document.getElementById('touch-controls');
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  if (touchControls) {
    touchControls.style.display = isTouchDevice ? 'flex' : 'none';
  }

  // Initialize game state
  resetGameState();
}

export function updateUI(car) {
  if (!car) return;

  // Update speed display
  if (speedDisplay) {
    const speed = Math.round(getCarSpeed(car));
    speedDisplay.textContent = `${speed} km/h`;

    if (speed > 80) {
      speedDisplay.style.color = '#ff4444';
    } else if (speed > 50) {
      speedDisplay.style.color = '#ffaa00';
    } else {
      speedDisplay.style.color = '#00ff88';
    }
  }

  // Update score
  if (scoreDisplay) {
    scoreDisplay.textContent = `Score: ${gameState.score}`;
  }

  // Update lap display
  if (lapDisplay) {
    lapDisplay.textContent = `Lap: ${gameState.currentLap}`;
  }

  // Update time display
  if (timeDisplay) {
    const currentTime = formatTime(getCurrentLapTime());
    const bestTime = gameState.bestLapTime ? formatTime(gameState.bestLapTime) : '--:--.--';
    timeDisplay.innerHTML = `
      Time: ${currentTime}<br>
      Best: ${bestTime}
    `;
  }

  // Show/hide crash overlay
  if (crashOverlay) {
    crashOverlay.style.display = gameState.isBroken ? 'flex' : 'none';
  }

  // Show jump points popup
  if (jumpPopup && car.lastJumpPoints && car.lastJumpPoints > 0) {
    showJumpPopup(car.lastJumpPoints);
    car.lastJumpPoints = 0;  // Clear after showing
  }
}

function showJumpPopup(points) {
  if (jumpPopupTimeout) {
    clearTimeout(jumpPopupTimeout);
  }

  jumpPopup.textContent = `+${points} JUMP!`;
  jumpPopup.style.opacity = '1';
  jumpPopup.style.transform = 'translate(-50%, -50%) scale(1.2)';

  jumpPopupTimeout = setTimeout(() => {
    jumpPopup.style.opacity = '0';
    jumpPopup.style.transform = 'translate(-50%, -50%) scale(1)';
  }, 800);
}

export function handleRestart(car) {
  if (gameState.isBroken) {
    repairCar();
    resetCar(car);
    resetGameState();
  }
}
