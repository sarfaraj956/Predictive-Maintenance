import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import {
  RotateCw,
  Eye,
  AlertTriangle,
  ShieldCheck,
  Zap,
  Thermometer,
  Gauge,
  Camera,
  Layers,
  Sparkles,
  Volume2,
  VolumeX,
  Maximize2,
  Play,
  Pause,
  Focus,
  RotateCcw
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface Machine3DViewerProps {
  rotationalSpeed: number;
  torque: number;
  toolWear: number;
  airTemp: number;
  processTemp: number;
  isFailure: boolean;
  className?: string;
  enableSound?: boolean;
}

type ViewMode = 'solid' | 'wireframe' | 'thermal' | 'xray';
type CameraView = 'iso' | 'tool' | 'front' | 'top';

export const Machine3DViewer: React.FC<Machine3DViewerProps> = ({
  rotationalSpeed,
  torque,
  toolWear,
  airTemp,
  processTemp,
  isFailure,
  className = '',
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const [viewMode, setViewMode] = useState<ViewMode>('solid');
  const [cameraView, setCameraView] = useState<CameraView>('iso');
  const [isRotating, setIsRotating] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(false);

  // References for live 3D loop
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const spindleRef = useRef<THREE.Group | null>(null);
  const alertLightRef = useRef<THREE.PointLight | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);

  // Spherical Orbit Camera State (Guarantees model is always dead-center!)
  const orbitState = useRef({
    radius: 4.8,
    targetRadius: 4.8,
    theta: Math.PI / 4,       // Azimuth horizontal angle
    targetTheta: Math.PI / 4,
    phi: 1.1,                 // Polar vertical angle (0 = top, pi/2 = equator)
    targetPhi: 1.1,
  });

  // Audio oscillator reference (Web Audio API for real-time spindle frequency)
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  // Sync refs for animation frame
  const speedRef = useRef(rotationalSpeed);
  const failureRef = useRef(isFailure);
  const torqueRef = useRef(torque);
  const wearRef = useRef(toolWear);
  const tempDiffRef = useRef(processTemp - airTemp);
  const viewModeRef = useRef<ViewMode>(viewMode);
  const isRotatingRef = useRef(isRotating);
  const isDarkRef = useRef(isDark);

  useEffect(() => {
    speedRef.current = rotationalSpeed;
    failureRef.current = isFailure;
    torqueRef.current = torque;
    wearRef.current = toolWear;
    tempDiffRef.current = processTemp - airTemp;
    viewModeRef.current = viewMode;
    isRotatingRef.current = isRotating;
    isDarkRef.current = isDark;
  }, [rotationalSpeed, isFailure, torque, toolWear, airTemp, processTemp, viewMode, isRotating, isDark]);

  // Audio tone generation for RPM
  useEffect(() => {
    if (!soundEnabled) {
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = isFailure ? 'sawtooth' : 'sine';
      const freq = Math.max(70, Math.min(320, (rotationalSpeed / 60) * 4));
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();

      audioCtxRef.current = ctx;
      oscRef.current = osc;
      gainRef.current = gain;
    } catch (e) {
      console.warn('Web Audio not supported or blocked', e);
    }

    return () => {
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
    };
  }, [soundEnabled]);

  // Camera presets that smoothly transition spherical angles
  const applyCameraPreset = useCallback((preset: CameraView) => {
    setCameraView(preset);
    switch (preset) {
      case 'iso':
        orbitState.current.targetTheta = Math.PI / 4;
        orbitState.current.targetPhi = 1.05;
        orbitState.current.targetRadius = 4.8;
        break;
      case 'tool':
        orbitState.current.targetTheta = 0.05;
        orbitState.current.targetPhi = 1.45;
        orbitState.current.targetRadius = 3.0; // Zoomed right into cutting flutes
        break;
      case 'front':
        orbitState.current.targetTheta = 0;
        orbitState.current.targetPhi = 1.45;
        orbitState.current.targetRadius = 4.8;
        break;
      case 'top':
        orbitState.current.targetTheta = 0;
        orbitState.current.targetPhi = 0.18; // Looking straight down
        orbitState.current.targetRadius = 5.0;
        break;
    }
  }, []);

  const handleRecenter = useCallback(() => {
    applyCameraPreset('iso');
  }, [applyCameraPreset]);

  // Three.js Mount & Render
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 420;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera centered directly at origin (0, 0, 0)
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    cameraRef.current = camera;

    // 3. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // 4. Lighting System
    const ambientLight = new THREE.AmbientLight(0xffffff, isDark ? 0.9 : 1.5);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0x00f0ff, isDark ? 2.8 : 2.0);
    keyLight.position.set(5, 7, 5);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x3b82f6, 2.0);
    rimLight.position.set(-5, 2, -4);
    scene.add(rimLight);

    const stateLight = new THREE.PointLight(isFailure ? 0xf43f5e : 0x00f0ff, 3.5, 9);
    stateLight.position.set(0, 0, 1.8);
    scene.add(stateLight);
    alertLightRef.current = stateLight;

    // 5. Grid Floor (Positioned right below machine table at y = -1.45)
    const gridColor1 = isDark ? 0x00f0ff : 0x0284c7;
    const gridColor2 = isDark ? 0x1e293b : 0xcbd5e1;
    const gridHelper = new THREE.GridHelper(8, 20, gridColor1, gridColor2);
    gridHelper.position.y = -1.45;
    scene.add(gridHelper);

    // 6. Materials
    const darkMetalMat = new THREE.MeshStandardMaterial({
      color: isDark ? 0x0f172a : 0x334155,
      metalness: 0.85,
      roughness: 0.25,
    });

    const brushedChromeMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.95,
      roughness: 0.15,
    });

    const cuttingToolMat = new THREE.MeshStandardMaterial({
      color: 0xd97706, // TiN Gold Coating
      metalness: 0.92,
      roughness: 0.22,
    });

    const glowingCyanMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
    });

    // 7. MACHINE ASSEMBLY GROUP (Vertically centered at origin y = 0.0)
    const machineGroup = new THREE.Group();
    scene.add(machineGroup);

    // Top Head Housing: y from +0.2 to +1.4 (center = +0.8)
    const housingGeom = new THREE.CylinderGeometry(0.75, 0.75, 1.3, 32);
    const housing = new THREE.Mesh(housingGeom, darkMetalMat);
    housing.position.y = 0.75;
    machineGroup.add(housing);

    // Cyan Neon Accent Rings on Housing
    for (let i = 0; i < 4; i++) {
      const finGeom = new THREE.TorusGeometry(0.77, 0.018, 16, 40);
      const fin = new THREE.Mesh(finGeom, glowingCyanMat);
      fin.rotation.x = Math.PI / 2;
      fin.position.y = 0.35 + i * 0.28;
      machineGroup.add(fin);
    }

    // Rotating Spindle Rotor Group (center around y = 0.0)
    const rotorGroup = new THREE.Group();
    rotorGroup.position.y = 0.05;
    machineGroup.add(rotorGroup);
    spindleRef.current = rotorGroup;

    // Precision Collet Chuck
    const chuckGeom = new THREE.CylinderGeometry(0.48, 0.32, 0.55, 32);
    const chuck = new THREE.Mesh(chuckGeom, brushedChromeMat);
    chuck.position.y = -0.05;
    rotorGroup.add(chuck);

    // End Mill Cutting Tool
    const toolGeom = new THREE.CylinderGeometry(0.1, 0.1, 0.85, 20);
    const tool = new THREE.Mesh(toolGeom, cuttingToolMat);
    tool.position.y = -0.65;
    rotorGroup.add(tool);

    // 4 Spiral Flutes
    for (let i = 0; i < 4; i++) {
      const fluteGeom = new THREE.BoxGeometry(0.035, 0.55, 0.18);
      const flute = new THREE.Mesh(fluteGeom, brushedChromeMat);
      flute.position.y = -0.68;
      flute.rotation.y = (i * Math.PI) / 2;
      rotorGroup.add(flute);
    }

    // Workpiece Heavy Base: centered at y = -1.35
    const tableGeom = new THREE.BoxGeometry(2.2, 0.18, 2.2);
    const table = new THREE.Mesh(tableGeom, darkMetalMat);
    table.position.y = -1.35;
    machineGroup.add(table);

    // Workpiece Billet Block: sitting on table at y = -1.15
    const stockGeom = new THREE.BoxGeometry(0.9, 0.3, 0.9);
    const stockMaterial = new THREE.MeshStandardMaterial({
      color: isDark ? 0x1e293b : 0x64748b,
      metalness: 0.7,
      roughness: 0.4,
    });
    const stock = new THREE.Mesh(stockGeom, stockMaterial);
    stock.position.y = -1.12;
    machineGroup.add(stock);

    // 8. Machining Spark Particle System
    const particleCount = 60;
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 0.1;
      positions[i * 3 + 1] = -0.95;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 0.1;

      velocities[i * 3] = (Math.random() - 0.5) * 0.04;
      velocities[i * 3 + 1] = Math.random() * 0.03 + 0.01;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.04;
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMaterial = new THREE.PointsMaterial({
      color: 0xf59e0b,
      size: 0.04,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    machineGroup.add(particles);
    particlesRef.current = particles;

    // 9. TRUE ORBIT CONTROLS VIA MOUSE (Camera rotates smoothly around center)
    let isDragging = false;
    let prevMousePos = { x: 0, y: 0 };

    const handleMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMousePos = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMousePos.x;
      const deltaY = e.clientY - prevMousePos.y;

      // Update spherical target angles
      orbitState.current.targetTheta -= deltaX * 0.008;
      orbitState.current.targetPhi -= deltaY * 0.008;

      // Clamp vertical phi angle so camera stays above ground and doesn't flip
      orbitState.current.targetPhi = Math.max(0.15, Math.min(1.52, orbitState.current.targetPhi));

      prevMousePos = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      isDragging = false;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      // Zoom in / out safely clamped
      orbitState.current.targetRadius += e.deltaY * 0.004;
      orbitState.current.targetRadius = Math.max(2.5, Math.min(7.5, orbitState.current.targetRadius));
    };

    const domElement = renderer.domElement;
    domElement.addEventListener('mousedown', handleMouseDown);
    domElement.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    // 10. Animation Loop
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();
      const currentMode = viewModeRef.current;

      // Update shader materials based on view mode
      if (currentMode === 'wireframe') {
        darkMetalMat.wireframe = true;
        brushedChromeMat.wireframe = true;
        cuttingToolMat.wireframe = true;
        stockMaterial.wireframe = true;
        darkMetalMat.color.setHex(isDarkRef.current ? 0x00f0ff : 0x0284c7);
      } else if (currentMode === 'thermal') {
        darkMetalMat.wireframe = false;
        brushedChromeMat.wireframe = false;
        cuttingToolMat.wireframe = false;
        stockMaterial.wireframe = false;

        const heatRatio = Math.min(1, Math.max(0, (tempDiffRef.current - 5) / 10));
        cuttingToolMat.color.setHex(heatRatio > 0.6 || failureRef.current ? 0xef4444 : 0xf59e0b);
        darkMetalMat.color.setHex(heatRatio > 0.7 ? 0x7c2d12 : 0x1e293b);
      } else if (currentMode === 'xray') {
        darkMetalMat.wireframe = false;
        darkMetalMat.transparent = true;
        darkMetalMat.opacity = 0.35;
        brushedChromeMat.transparent = true;
        brushedChromeMat.opacity = 0.85;
      } else {
        // Standard PBR solid
        darkMetalMat.wireframe = false;
        darkMetalMat.transparent = false;
        darkMetalMat.opacity = 1.0;
        darkMetalMat.color.setHex(isDarkRef.current ? 0x0f172a : 0x334155);
        brushedChromeMat.wireframe = false;
        brushedChromeMat.transparent = false;
        cuttingToolMat.wireframe = false;
        cuttingToolMat.color.setHex(failureRef.current ? 0xef4444 : 0xd97706);
      }

      // Auto turntable rotation when not interacting
      if (!isDragging && isRotatingRef.current) {
        orbitState.current.targetTheta += 0.003;
      }

      // Smooth interpolation for orbit angles
      const state = orbitState.current;
      state.theta += (state.targetTheta - state.theta) * 0.1;
      state.phi += (state.targetPhi - state.phi) * 0.1;
      state.radius += (state.targetRadius - state.radius) * 0.1;

      // Spherical coordinate mapping directly to camera position
      camera.position.x = state.radius * Math.sin(state.phi) * Math.sin(state.theta);
      camera.position.y = state.radius * Math.cos(state.phi);
      camera.position.z = state.radius * Math.sin(state.phi) * Math.cos(state.theta);

      // ALWAYS LOOK AT THE CENTER (y = -0.1 is optical machine center)
      camera.lookAt(0, -0.15, 0);

      // Spindle rotation proportional to actual RPM
      if (spindleRef.current && isRotatingRef.current) {
        const radPerSec = (speedRef.current / 60) * 0.28;
        spindleRef.current.rotation.y += radPerSec;

        // Tool chatter & vibration on high torque or breakdown
        if (torqueRef.current > 55 || failureRef.current) {
          const jitter = (torqueRef.current / 1000) * 0.035;
          spindleRef.current.position.x = (Math.random() - 0.5) * jitter;
          spindleRef.current.position.z = (Math.random() - 0.5) * jitter;
        } else {
          spindleRef.current.position.x = 0;
          spindleRef.current.position.z = 0;
        }
      }

      // Strobe alert light on failure
      if (alertLightRef.current) {
        if (failureRef.current) {
          const pulse = (Math.sin(elapsed * 9) + 1) * 2.5;
          alertLightRef.current.color.setHex(0xf43f5e);
          alertLightRef.current.intensity = pulse + 1.5;
        } else {
          alertLightRef.current.color.setHex(0x00f0ff);
          alertLightRef.current.intensity = 2.2;
        }
      }

      // Machining sparks animation
      if (particlesRef.current) {
        const shouldSpark = failureRef.current || torqueRef.current > 50 || wearRef.current > 180;
        particlesRef.current.visible = shouldSpark;

        if (shouldSpark) {
          const posAttr = particlesRef.current.geometry.attributes.position as THREE.BufferAttribute;
          const posArray = posAttr.array as Float32Array;

          for (let i = 0; i < particleCount; i++) {
            posArray[i * 3 + 1] += velocities[i * 3 + 1];
            posArray[i * 3] += velocities[i * 3];
            posArray[i * 3 + 2] += velocities[i * 3 + 2];

            if (posArray[i * 3 + 1] > -0.6 || Math.random() < 0.03) {
              posArray[i * 3] = (Math.random() - 0.5) * 0.12;
              posArray[i * 3 + 1] = -0.95;
              posArray[i * 3 + 2] = (Math.random() - 0.5) * 0.12;
            }
          }
          posAttr.needsUpdate = true;
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    // Resize handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w > 0 && h > 0) {
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      domElement.removeEventListener('mousedown', handleMouseDown);
      domElement.removeEventListener('wheel', handleWheel);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('resize', handleResize);
      if (container.contains(domElement)) {
        container.removeChild(domElement);
      }
      renderer.dispose();
    };
  }, [isDark]);

  const tempDiff = Number((processTemp - airTemp).toFixed(1));
  const toolWearPercent = Math.min(100, Math.round((toolWear / 240) * 100));

  return (
    <div
      className={`relative rounded-2xl overflow-hidden bg-slate-900/90 dark:bg-gradient-to-b dark:from-[#0c1222] dark:to-[#050811] border transition-all duration-300 ${
        isFailure
          ? 'border-rose-500/60 shadow-glow-danger'
          : 'border-slate-300/80 dark:border-slate-800 shadow-card-light dark:shadow-card-dark'
      } ${className}`}
    >
      {/* 3D Canvas Mount */}
      <div ref={mountRef} className="w-full h-80 sm:h-[420px] cursor-grab active:cursor-grabbing" />

      {/* Top HUD Bar: Clean, Non-overlapping responsive layout */}
      <div className="absolute top-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Left: Status Pill */}
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 relative">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isFailure ? 'bg-rose-500' : 'bg-cyan-400'
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                isFailure ? 'bg-rose-600' : 'bg-cyan-500'
              }`}
            />
          </span>
          <span className="font-mono text-xs font-bold tracking-wider uppercase text-white bg-slate-950/85 px-3 py-1 rounded-lg border border-slate-700/80 backdrop-blur-md shadow-xs">
            Digital Twin 3D Spindle {isFailure ? '• FAULT DETECTED' : '• NOMINAL'}
          </span>
        </div>

        {/* Right: Render Modes Switcher */}
        <div className="flex items-center gap-1 pointer-events-auto bg-slate-950/85 p-1 rounded-lg border border-slate-700/80 backdrop-blur-md">
          {(['solid', 'wireframe', 'thermal', 'xray'] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold transition-all ${
                viewMode === mode
                  ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/60 shadow-[0_0_8px_rgba(0,240,255,0.3)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Camera Presets & Recenter Toolbar (Placed below top bar with ample spacing) */}
      <div className="absolute top-12 left-3 flex items-center gap-1 pointer-events-auto bg-slate-950/85 p-1 rounded-lg border border-slate-700/80 backdrop-blur-md">
        <Camera size={13} className="text-cyan-400 ml-1 mr-0.5" />
        {(['iso', 'tool', 'front', 'top'] as CameraView[]).map((view) => (
          <button
            key={view}
            onClick={() => applyCameraPreset(view)}
            className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase transition-colors ${
              cameraView === view
                ? 'bg-slate-700 text-white font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {view}
          </button>
        ))}

        <div className="h-3 w-px bg-slate-700 mx-0.5" />

        {/* Recenter Button */}
        <button
          onClick={handleRecenter}
          className="px-2 py-0.5 rounded text-[10px] font-mono font-bold text-cyan-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors flex items-center gap-1"
          title="Recenter camera to center of machine"
        >
          <RotateCcw size={11} />
          <span>Recenter</span>
        </button>

        <div className="h-3 w-px bg-slate-700 mx-0.5" />

        {/* Pause / Play Rotation */}
        <button
          onClick={() => setIsRotating(!isRotating)}
          className="p-1 rounded text-slate-400 hover:text-white transition-colors"
          title={isRotating ? 'Pause Spindle Rotation' : 'Resume Spindle Rotation'}
        >
          {isRotating ? <Pause size={12} /> : <Play size={12} />}
        </button>

        {/* Audio Toggle */}
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={`p-1 rounded text-xs font-mono transition-colors ${
            soundEnabled ? 'text-cyan-300' : 'text-slate-400 hover:text-white'
          }`}
          title={soundEnabled ? 'Mute RPM Sound' : 'Enable Spindle RPM Sound'}
        >
          {soundEnabled ? <Volume2 size={12} /> : <VolumeX size={12} />}
        </button>
      </div>

      {/* Bottom Telemetry HUD */}
      <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="flex items-center gap-3 bg-slate-950/90 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-slate-700/80 text-xs font-mono shadow-lg text-white">
          <div className="flex items-center gap-1.5 text-cyan-400">
            <Gauge size={13} />
            <span className="font-bold">{rotationalSpeed}</span>
            <span className="text-[10px] text-slate-400">RPM</span>
          </div>

          <div className="h-3 w-px bg-slate-700" />

          <div className="flex items-center gap-1.5 text-amber-400">
            <Zap size={13} />
            <span className="font-bold">{torque}</span>
            <span className="text-[10px] text-slate-400">Nm</span>
          </div>

          <div className="h-3 w-px bg-slate-700" />

          <div className="flex items-center gap-1.5 text-indigo-400">
            <Thermometer size={13} />
            <span className="font-bold">ΔT {tempDiff}</span>
            <span className="text-[10px] text-slate-400">K</span>
          </div>

          <div className="h-3 w-px bg-slate-700 hidden sm:block" />

          <div className="hidden sm:flex items-center gap-1.5 text-emerald-400">
            <ShieldCheck size={13} />
            <span>Wear: {toolWear}m</span>
            <span className="text-[10px] text-slate-400">({toolWearPercent}%)</span>
          </div>
        </div>

        <span className="text-[10px] text-slate-400 font-mono bg-slate-950/80 px-2.5 py-1 rounded-lg border border-slate-700/60 backdrop-blur-md">
          Drag to orbit • Wheel to zoom
        </span>
      </div>
    </div>
  );
};
