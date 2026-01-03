// Control state
const controlState = {
  accelerate: false,
  brake: false,
  left: false,
  right: false,
};

// Key mappings
const KEY_MAP = {
  ArrowUp: 'accelerate',
  ArrowDown: 'brake',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  KeyW: 'accelerate',
  KeyS: 'brake',
  KeyA: 'left',
  KeyD: 'right',
};

export function setupControls() {
  // Keyboard controls
  document.addEventListener('keydown', (event) => {
    const action = KEY_MAP[event.code];
    if (action) {
      controlState[action] = true;
      event.preventDefault();
    }
  });

  document.addEventListener('keyup', (event) => {
    const action = KEY_MAP[event.code];
    if (action) {
      controlState[action] = false;
      event.preventDefault();
    }
  });

  // Touch controls
  setupTouchControls();
}

function setupTouchControls() {
  const buttons = {
    'btn-gas': 'accelerate',
    'btn-brake': 'brake',
    'btn-left': 'left',
    'btn-right': 'right',
  };

  Object.entries(buttons).forEach(([id, action]) => {
    const button = document.getElementById(id);
    if (!button) return;

    // Touch start
    button.addEventListener('touchstart', (e) => {
      e.preventDefault();
      controlState[action] = true;
      button.classList.add('pressed');
    });

    // Touch end
    button.addEventListener('touchend', (e) => {
      e.preventDefault();
      controlState[action] = false;
      button.classList.remove('pressed');
    });

    // Touch cancel
    button.addEventListener('touchcancel', (e) => {
      e.preventDefault();
      controlState[action] = false;
      button.classList.remove('pressed');
    });

    // Mouse events (for testing touch UI on desktop)
    button.addEventListener('mousedown', (e) => {
      controlState[action] = true;
      button.classList.add('pressed');
    });

    button.addEventListener('mouseup', (e) => {
      controlState[action] = false;
      button.classList.remove('pressed');
    });

    button.addEventListener('mouseleave', (e) => {
      controlState[action] = false;
      button.classList.remove('pressed');
    });
  });

  // Prevent context menu on long press
  document.getElementById('touch-controls')?.addEventListener('contextmenu', (e) => {
    e.preventDefault();
  });
}

export function getControlState() {
  return { ...controlState };
}

// For debugging
export function setControl(action, value) {
  if (action in controlState) {
    controlState[action] = value;
  }
}
