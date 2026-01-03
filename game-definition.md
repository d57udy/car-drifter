# Car Drifter - Game Definition Document

## Overview

**Genre:** 3D Car Racing / Stunt Game
**Platform:** Web browser (desktop and mobile)
**Target Devices:** PC (Chrome, Firefox, Safari) and Mobile (Android/iOS browsers)

---

## Prototype Scope

The prototype focuses on core driving mechanics with the following features:

### Must Have (Prototype)
- [x] Drivable 3D car with realistic physics
- [x] 3rd person camera (behind the car)
- [x] Desert environment (mid-sized map)
- [x] Obstacles: cones and ramps
- [x] PC controls (arrow keys)
- [x] Mobile touch controls (on-screen buttons)
- [x] Simple goals/objectives

### Future Features (Not in Prototype)
- Sandbox mode with all content unlocked
- Car categories (Sports, Hobby, Offroad, Hybrids)
- Car customization/upgrades
- Stunt competitions against AI opponents
- Stunt scoring system
- Multiple maps/environments

---

## Technical Specification

### Technology Stack
| Component | Technology | Rationale |
|-----------|------------|-----------|
| 3D Rendering | **Three.js** | Mature, well-documented, large community |
| Physics Engine | **Cannon-es** | Lightweight, good vehicle physics, ES6 module support |
| Build Tool | **Vite** | Fast development, easy setup, good for prototyping |
| Language | **JavaScript (ES6+)** | No compilation needed, fast iteration |

### Performance Targets
- 60 FPS on modern desktop browsers
- 30+ FPS on mobile devices
- Map size optimized for web hosting (minimal assets, efficient geometry)

---

## Gameplay

### Driving Mechanics
- **Physics Model:** Realistic (momentum, weight transfer, tire grip)
- **Camera:** 3rd person, following behind the car with smooth interpolation
- **Collision:** Full collision detection with obstacles and terrain

### Objectives (Prototype)
1. Navigate through cone courses
2. Hit ramps and land successfully
3. Reach checkpoints or finish markers

---

## Controls

### PC (Keyboard)
| Key | Action |
|-----|--------|
| ↑ (Up Arrow) | Accelerate |
| ↓ (Down Arrow) | Brake / Reverse |
| ← (Left Arrow) | Steer Left |
| → (Right Arrow) | Steer Right |

### Mobile (Touch)
```
┌─────────────────────────────────────────┐
│                                         │
│                                         │
│                 [GAME VIEW]             │
│                                         │
│                                         │
├──────────────────┬──────────────────────┤
│                  │                      │
│    [◄] [►]       │      [GAS]           │
│    Steering      │      [BRAKE]         │
│                  │                      │
└──────────────────┴──────────────────────┘
```
- **Left side:** Steering buttons (left/right)
- **Right side:** Gas and Brake buttons (stacked vertically)

---

## Visual Design

### Style
- **Clean, stylized 3D** (simple but polished, not low-poly)
- Smooth shading with simple textures
- Clear, readable UI elements

### Environment: Desert
- Sandy terrain with subtle elevation changes
- Clear blue sky with simple sun lighting
- Scattered rocks and desert vegetation for visual interest
- Dust particle effects when driving (optional for prototype)

### Car
- Single car model for prototype
- Simple but recognizable sports car silhouette
- Basic color/material (e.g., red with slight metallic shine)

### Obstacles
| Type | Description |
|------|-------------|
| Cones | Orange traffic cones, knockable |
| Ramps | Wooden/metal ramps for jumps |
| Barriers | Optional boundary markers |

---

## Map Layout (Prototype)

```
┌────────────────────────────────────────────┐
│                                            │
│     [RAMP]                    [CONES]      │
│        ╱╲                      ◊ ◊ ◊       │
│                                ◊   ◊       │
│                [START]         ◊ ◊ ◊       │
│                  🚗                        │
│                                            │
│   [CONES]                     [RAMP]       │
│   ◊ ◊ ◊ ◊                       ╱╲         │
│                                            │
│              [FINISH/GOAL]                 │
│                  🏁                        │
│                                            │
└────────────────────────────────────────────┘
```

- Mid-sized arena (~200m x 200m game units)
- Boundary walls or natural barriers (rocks/cliffs)
- Multiple obstacle configurations

---

## File Structure (Planned)

```
car-drifter/
├── index.html          # Main HTML entry point
├── style.css           # Global styles + mobile UI
├── src/
│   ├── main.js         # Game initialization
│   ├── car.js          # Car model + physics
│   ├── controls.js     # Input handling (keyboard + touch)
│   ├── camera.js       # 3rd person camera
│   ├── world.js        # Desert environment + obstacles
│   └── ui.js           # Mobile touch controls overlay
├── assets/
│   ├── models/         # 3D models (car, ramps, etc.)
│   └── textures/       # Textures (sand, sky, etc.)
├── package.json        # Dependencies
└── vite.config.js      # Build configuration
```

---

## Success Criteria (Prototype)

The prototype is complete when:
1. ✅ Car drives smoothly with realistic physics
2. ✅ Camera follows car in 3rd person view
3. ✅ Arrow keys work on PC
4. ✅ Touch controls work on mobile
5. ✅ Desert map loads with cones and ramps
6. ✅ Car can collide with and knock over cones
7. ✅ Car can drive up ramps and perform jumps
8. ✅ Game runs at acceptable frame rate on both platforms

---

## Next Steps

1. Set up project with Vite + Three.js
2. Create basic scene with ground plane
3. Implement car with physics
4. Add 3rd person camera
5. Implement keyboard controls
6. Add mobile touch controls
7. Build desert environment
8. Add obstacles (cones, ramps)
9. Test and optimize performance
