import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { 
  Play, Pause, RotateCcw, Eye, Info, Sparkles, 
  Layers, Radio, Shield, MapPin, Cpu, Truck, CheckCircle2,
  AlertOctagon, Compass, ZoomIn, ZoomOut, AlertTriangle
} from 'lucide-react';
import { SystemWorkflowState } from '../../types';

interface SystemWorkflow3DProps {
  workflowState?: SystemWorkflowState;
  onStateSelect?: (state: SystemWorkflowState) => void;
  className?: string;
  isCompact?: boolean;
}

interface NodeData {
  id: string;
  name: string;
  stageName: string;
  position: THREE.Vector3;
  color: number;
  activeStates: SystemWorkflowState[];
  description: string;
  details: string[];
}

const NODES_CONFIG: NodeData[] = [
  {
    id: 'user',
    name: 'Citizen Distress Device',
    stageName: '1. USER',
    position: new THREE.Vector3(-10, 0, 3),
    color: 0x38bdf8, // light blue
    activeStates: ['sos_confirm', 'sos_activated'],
    description: 'Citizen device captures emergency distress intent and user profile.',
    details: ['Phone / Offline Beacon', 'Battery & Telemetry Monitored', 'Local Storage Safeguard']
  },
  {
    id: 'sos_trigger',
    name: 'SOS Activation Beacon',
    stageName: '2. SOS ACTIVATION',
    position: new THREE.Vector3(-6, 2, 0),
    color: 0xef4444, // red
    activeStates: ['sos_confirm', 'sos_activated'],
    description: 'Tactical confirmation step to eliminate accidental activations.',
    details: ['Double-confirmation Barrier', 'Unique SOS-2026 Code Generated', 'Deduplication Shield']
  },
  {
    id: 'location',
    name: 'GPS & Satellite Telemetry',
    stageName: '3. LOCATION DETECTION',
    position: new THREE.Vector3(-2, 6, -3),
    color: 0x3b82f6, // blue
    activeStates: ['location_detecting', 'request_processing'],
    description: 'High-accuracy browser GPS coordinates and elevation triangulation.',
    details: ['Browser W3C Geolocation', 'Accuracy Radius Detection', 'Offline Coordinates Fallback']
  },
  {
    id: 'ai_core',
    name: 'DISASTERFOG AI Engine',
    stageName: '4. AI DECISION ENGINE',
    position: new THREE.Vector3(1, 2.5, 0),
    color: 0xa855f7, // purple
    activeStates: ['request_processing', 'notification_processing'],
    description: 'Multi-source NLP classification, reliability scoring, and conflict resolution.',
    details: ['Severity & Mortality Classifier', 'Source Reliability Weighting', 'Resource Match Optimizer']
  },
  {
    id: 'eoc_hub',
    name: 'Tactical EOC Command Hub',
    stageName: '5. EOC COMMAND CENTER',
    position: new THREE.Vector3(6, 1.8, 2),
    color: 0xf59e0b, // amber
    activeStates: ['notification_processing', 'emergency_active'],
    description: 'Operations command console verifying missions and monitoring live map.',
    details: ['Live WebSocket Broadcast', 'Command Console HUD', 'Audit Trail Recording']
  },
  {
    id: 'dispatch',
    name: 'Tactical Rescue Force (NDRF/SDRF)',
    stageName: '6. EMERGENCY SERVICES',
    position: new THREE.Vector3(10, 2.5, -2),
    color: 0x10b981, // emerald
    activeStates: ['notification_processing', 'emergency_active'],
    description: 'External webhook and SMS gateway dispatching boat, medical, and drone units.',
    details: ['Automated SMS / Webhook Gateway', 'Nearest Tactical Unit Routing', 'National 112 Protocol']
  },
  {
    id: 'safe_haven',
    name: 'Evacuation & Relief Shelter',
    stageName: '7. RESPONSE & EVACUATION',
    position: new THREE.Vector3(13, 0.5, 2.5),
    color: 0x06b6d4, // cyan
    activeStates: ['emergency_active', 'resolved'],
    description: 'Victim extrication and admission into operational relief shelters and hospitals.',
    details: ['Evacuation Verification', 'Bed & Supply Availability', 'Resolved State Confirmation']
  }
];

export const SystemWorkflow3D: React.FC<SystemWorkflow3DProps> = ({
  workflowState = 'idle',
  onStateSelect,
  className = '',
  isCompact = false
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [selectedNode, setSelectedNode] = useState<NodeData | null>(NODES_CONFIG[3]); // default to AI core
  const [hoveredNode, setHoveredNode] = useState<NodeData | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [webglSupported, setWebglSupported] = useState(true);
  const [cameraView, setCameraView] = useState<'overview' | 'citizen' | 'ai' | 'dispatch'>('overview');

  // Three.js internal references
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const nodesMeshMap = useRef<Map<string, THREE.Group>>(new Map());
  const particlesRef = useRef<THREE.Points | null>(null);
  const animFrameId = useRef<number | null>(null);

  // Manual camera rotation state
  const isDragging = useRef(false);
  const prevMousePos = useRef({ x: 0, y: 0 });
  const cameraAngle = useRef({ theta: 0.35, phi: 0.55, radius: 26 });

  const updateCameraPosition = useCallback(() => {
    if (!cameraRef.current) return;
    const { theta, phi, radius } = cameraAngle.current;
    cameraRef.current.position.x = radius * Math.sin(phi) * Math.sin(theta);
    cameraRef.current.position.y = radius * Math.cos(phi);
    cameraRef.current.position.z = radius * Math.sin(phi) * Math.cos(theta);
    cameraRef.current.lookAt(1, 2, 0);
  }, []);

  const setViewPreset = (view: 'overview' | 'citizen' | 'ai' | 'dispatch') => {
    setCameraView(view);
    if (view === 'overview') {
      cameraAngle.current = { theta: 0.35, phi: 0.55, radius: 26 };
    } else if (view === 'citizen') {
      cameraAngle.current = { theta: 0.95, phi: 0.7, radius: 18 };
    } else if (view === 'ai') {
      cameraAngle.current = { theta: 0.05, phi: 0.6, radius: 15 };
    } else if (view === 'dispatch') {
      cameraAngle.current = { theta: -0.65, phi: 0.65, radius: 19 };
    }
    updateCameraPosition();
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Detect WebGL Support
    try {
      const testCanvas = document.createElement('canvas');
      const gl = testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl');
      if (!gl) {
        setWebglSupported(false);
        return;
      }
    } catch (e) {
      setWebglSupported(false);
      return;
    }

    // 2. Initialize Three.js Scene
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x020617); // Slate-950
    scene.fog = new THREE.FogExp2(0x020617, 0.022);

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    cameraRef.current = camera;
    updateCameraPosition();

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    rendererRef.current = renderer;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 3. Ambient & Directional Lights
    const ambientLight = new THREE.AmbientLight(0x38bdf8, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(10, 20, 10);
    scene.add(dirLight);

    const pointLight = new THREE.PointLight(0xa855f7, 2.5, 30);
    pointLight.position.set(1, 4, 1);
    scene.add(pointLight);

    // 4. Ground Grid & Cybernetic Base
    const gridHelper = new THREE.GridHelper(40, 40, 0x1e293b, 0x0f172a);
    gridHelper.position.y = -1;
    scene.add(gridHelper);

    // 5. Build 3D Workflow Nodes
    const nodeMeshes = new Map<string, THREE.Group>();

    NODES_CONFIG.forEach((config) => {
      const group = new THREE.Group();
      group.position.copy(config.position);
      group.userData = { id: config.id, config };

      // Core Geometric Shape
      let geom: THREE.BufferGeometry;
      if (config.id === 'ai_core') {
        geom = new THREE.DodecahedronGeometry(1.4, 1);
      } else if (config.id === 'location') {
        geom = new THREE.OctahedronGeometry(1.1, 0);
      } else if (config.id === 'sos_trigger') {
        geom = new THREE.IcosahedronGeometry(1.2, 0);
      } else if (config.id === 'dispatch') {
        geom = new THREE.BoxGeometry(1.4, 1.2, 1.8);
      } else {
        geom = new THREE.SphereGeometry(1.0, 24, 24);
      }

      const mat = new THREE.MeshStandardMaterial({
        color: config.color,
        roughness: 0.2,
        metalness: 0.8,
        emissive: config.color,
        emissiveIntensity: 0.35,
        wireframe: false
      });

      const mesh = new THREE.Mesh(geom, mat);
      group.add(mesh);

      // Glowing Aura Outer Wireframe Ring
      const ringGeom = new THREE.TorusGeometry(1.6, 0.04, 12, 32);
      const ringMat = new THREE.MeshBasicMaterial({ color: config.color, transparent: true, opacity: 0.6 });
      const ring = new THREE.Mesh(ringGeom, ringMat);
      ring.rotation.x = Math.PI / 2;
      group.add(ring);

      // Ground Projection Column
      const lineGeom = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, -config.position.y - 1, 0)
      ]);
      const lineMat = new THREE.LineDashedMaterial({
        color: config.color,
        dashSize: 0.4,
        gapSize: 0.2,
        transparent: true,
        opacity: 0.35
      });
      const dropLine = new THREE.Line(lineGeom, lineMat);
      dropLine.computeLineDistances();
      group.add(dropLine);

      scene.add(group);
      nodeMeshes.set(config.id, group);
    });

    nodesMeshMap.current = nodeMeshes;

    // 6. Connect Nodes with Luminous Pipelines
    const pipelinePoints: THREE.Vector3[] = [];
    for (let i = 0; i < NODES_CONFIG.length - 1; i++) {
      const p1 = NODES_CONFIG[i].position;
      const p2 = NODES_CONFIG[i + 1].position;
      const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
      mid.y += 1.5; // gentle arch

      const curve = new THREE.QuadraticBezierCurve3(p1, mid, p2);
      const points = curve.getPoints(24);
      points.forEach(pt => pipelinePoints.push(pt));

      const tubeGeom = new THREE.TubeGeometry(curve, 24, 0.07, 8, false);
      const tubeMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.45
      });
      const tubeMesh = new THREE.Mesh(tubeGeom, tubeMat);
      scene.add(tubeMesh);
    }

    // 7. Animated Data Flow Particles
    const particleCount = 180;
    const particleGeom = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleSpeeds = new Float32Array(particleCount);
    const particleProgress = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      particleProgress[i] = Math.random();
      particleSpeeds[i] = 0.003 + Math.random() * 0.005;
      const idx = Math.floor(particleProgress[i] * (pipelinePoints.length - 1));
      const pt = pipelinePoints[idx] || NODES_CONFIG[0].position;
      particlePositions[i * 3] = pt.x;
      particlePositions[i * 3 + 1] = pt.y;
      particlePositions[i * 3 + 2] = pt.z;
    }

    particleGeom.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x67e8f9,
      size: 0.28,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });

    const particles = new THREE.Points(particleGeom, particleMat);
    scene.add(particles);
    particlesRef.current = particles;

    // 8. Raycasting for Mouse Hover & Click
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onPointerMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const groups = Array.from(nodeMeshes.values());
      const intersects = raycaster.intersectObjects(groups, true);

      if (intersects.length > 0) {
        let rootGroup = intersects[0].object.parent;
        while (rootGroup && !rootGroup.userData.id && rootGroup.parent) {
          rootGroup = rootGroup.parent;
        }
        if (rootGroup && rootGroup.userData.config) {
          setHoveredNode(rootGroup.userData.config);
          container.style.cursor = 'pointer';
          return;
        }
      }
      setHoveredNode(null);
      container.style.cursor = isDragging.current ? 'grabbing' : 'grab';
    };

    const onPointerDown = (e: MouseEvent) => {
      if (e.button === 0) {
        isDragging.current = true;
        prevMousePos.current = { x: e.clientX, y: e.clientY };
      }
    };

    const onPointerUp = (e: MouseEvent) => {
      if (isDragging.current) {
        const dx = Math.abs(e.clientX - prevMousePos.current.x);
        const dy = Math.abs(e.clientY - prevMousePos.current.y);
        isDragging.current = false;
        container.style.cursor = 'grab';

        // If tiny drag, treat as click
        if (dx < 4 && dy < 4) {
          const rect = container.getBoundingClientRect();
          mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
          mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

          raycaster.setFromCamera(mouse, camera);
          const groups = Array.from(nodeMeshes.values());
          const intersects = raycaster.intersectObjects(groups, true);

          if (intersects.length > 0) {
            let rootGroup = intersects[0].object.parent;
            while (rootGroup && !rootGroup.userData.id && rootGroup.parent) {
              rootGroup = rootGroup.parent;
            }
            if (rootGroup && rootGroup.userData.config) {
              setSelectedNode(rootGroup.userData.config);
            }
          }
        }
      }
    };

    const onDragRotate = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const dx = e.clientX - prevMousePos.current.x;
      const dy = e.clientY - prevMousePos.current.y;
      prevMousePos.current = { x: e.clientX, y: e.clientY };

      cameraAngle.current.theta -= dx * 0.007;
      cameraAngle.current.phi = Math.max(0.15, Math.min(Math.PI / 2 - 0.05, cameraAngle.current.phi - dy * 0.007));
      updateCameraPosition();
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      cameraAngle.current.radius = Math.max(12, Math.min(42, cameraAngle.current.radius + e.deltaY * 0.02));
      updateCameraPosition();
    };

    container.addEventListener('mousemove', onPointerMove);
    container.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mouseup', onPointerUp);
    window.addEventListener('mousemove', onDragRotate);
    container.addEventListener('wheel', onWheel, { passive: false });

    // 9. Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: w, height: h } = entry.contentRect;
        if (w > 0 && h > 0 && cameraRef.current && rendererRef.current) {
          cameraRef.current.aspect = w / h;
          cameraRef.current.updateProjectionMatrix();
          rendererRef.current.setSize(w, h);
        }
      }
    });
    resizeObserver.observe(container);

    // 10. Animation Loop
    let clock = new THREE.Clock();

    const animate = () => {
      animFrameId.current = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // Rotate nodes & rings
      nodeMeshes.forEach((group, id) => {
        const cfg = group.userData.config as NodeData;
        const isStateActive = cfg?.activeStates.includes(workflowState);

        // Core mesh rotation
        const core = group.children[0] as THREE.Mesh;
        if (core) {
          core.rotation.y += delta * (isStateActive ? 1.4 : 0.4);
          core.rotation.x += delta * 0.2;

          // Pulse scale if active in current workflow state
          if (isStateActive) {
            const scale = 1 + Math.sin(time * 6) * 0.12;
            core.scale.set(scale, scale, scale);
            (core.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.8 + Math.sin(time * 6) * 0.4;
          } else {
            core.scale.set(1, 1, 1);
            (core.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.3;
          }
        }

        // Ring rotation
        const ring = group.children[1] as THREE.Mesh;
        if (ring) {
          ring.rotation.z += delta * 0.8;
          ring.scale.setScalar(isStateActive ? 1.25 + Math.sin(time * 4) * 0.1 : 1.0);
        }
      });

      // Advance particles along pipeline
      if (particlesRef.current && pipelinePoints.length > 0) {
        const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
        const totalPoints = pipelinePoints.length;

        for (let i = 0; i < particleCount; i++) {
          particleProgress[i] += particleSpeeds[i];
          if (particleProgress[i] >= 1.0) particleProgress[i] = 0;

          const idx = Math.floor(particleProgress[i] * (totalPoints - 1));
          const pt = pipelinePoints[idx] || pipelinePoints[0];
          positions[i * 3] = pt.x + (Math.sin(time * 4 + i) * 0.1);
          positions[i * 3 + 1] = pt.y + (Math.cos(time * 4 + i) * 0.1);
          positions[i * 3 + 2] = pt.z + (Math.sin(time * 2 + i) * 0.1);
        }
        particlesRef.current.geometry.attributes.position.needsUpdate = true;
      }

      renderer.render(scene, camera);
    };

    animate();

    // 11. Cleanup function to prevent memory leaks
    return () => {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
      resizeObserver.disconnect();
      container.removeEventListener('mousemove', onPointerMove);
      container.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('mouseup', onPointerUp);
      window.removeEventListener('mousemove', onDragRotate);
      container.removeEventListener('wheel', onWheel);

      scene.traverse((obj) => {
        if ((obj as THREE.Mesh).geometry) (obj as THREE.Mesh).geometry.dispose();
        if ((obj as THREE.Mesh).material) {
          const mat = (obj as THREE.Mesh).material;
          if (Array.isArray(mat)) mat.forEach(m => m.dispose());
          else mat.dispose();
        }
      });
      renderer.dispose();
    };
  }, [workflowState, updateCameraPosition]);

  const handleZoom = (direction: 'in' | 'out') => {
    const delta = direction === 'in' ? -3 : 3;
    cameraAngle.current.radius = Math.max(12, Math.min(42, cameraAngle.current.radius + delta));
    updateCameraPosition();
  };

  const handleResetCamera = () => {
    setViewPreset('overview');
  };

  return (
    <div className={`relative bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col ${className}`}>
      
      {/* 3D Top Header Bar */}
      <div className="bg-slate-900/90 backdrop-blur-md px-4 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 z-10">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-600/30 text-purple-400 border border-purple-500/40">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-black text-white flex items-center gap-2">
              3D INTELLIGENCE PIPELINE ARCHITECTURE
              <span className="text-[10px] bg-purple-500/30 text-purple-300 font-mono px-2 py-0.5 rounded uppercase">
                Interactive Three.js
              </span>
            </h3>
            <p className="text-[11px] text-slate-400 font-mono">
              Live State: <span className="text-emerald-400 font-bold uppercase">{workflowState}</span>
            </p>
          </div>
        </div>

        {/* View Camera Presets & Zoom Controls */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setViewPreset('overview')}
            className={`px-2.5 py-1 rounded text-xs font-bold transition-colors ${
              cameraView === 'overview' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setViewPreset('citizen')}
            className={`px-2.5 py-1 rounded text-xs font-bold transition-colors ${
              cameraView === 'citizen' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            SOS Node
          </button>
          <button
            onClick={() => setViewPreset('ai')}
            className={`px-2.5 py-1 rounded text-xs font-bold transition-colors ${
              cameraView === 'ai' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            AI Engine
          </button>
          <button
            onClick={() => setViewPreset('dispatch')}
            className={`px-2.5 py-1 rounded text-xs font-bold transition-colors ${
              cameraView === 'dispatch' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Dispatch
          </button>

          <div className="h-4 w-px bg-slate-700 mx-1 hidden sm:block"></div>

          <button
            onClick={() => handleZoom('in')}
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleZoom('out')}
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleResetCamera}
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Reset Camera"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 3D Canvas Mount or WebGL Fallback */}
      <div className="relative flex-1 min-h-[360px] sm:min-h-[440px] bg-slate-950 flex items-center justify-center">
        {webglSupported ? (
          <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing select-none" />
        ) : (
          /* WebGL Graceful Fallback UI */
          <div className="p-8 text-center max-w-md space-y-4">
            <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto" />
            <h4 className="text-base font-bold text-white">3D Hardware Acceleration Unavailable</h4>
            <p className="text-xs text-slate-400">
              WebGL is disabled or unsupported on this device. The system architecture workflow remains fully active below:
            </p>
            <div className="flex flex-col gap-2 text-left">
              {NODES_CONFIG.map(node => (
                <div key={node.id} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-200">{node.stageName}</span>
                  <span className="text-[10px] font-mono text-purple-400">{node.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Floating Telemetry HUD for Selected / Hovered Node */}
        {selectedNode && (
          <div className="absolute bottom-4 left-4 z-10 max-w-xs sm:max-w-sm w-full bg-slate-900/90 backdrop-blur-md p-3.5 rounded-xl border border-purple-500/40 shadow-2xl text-xs space-y-2 pointer-events-auto">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-purple-400 font-bold uppercase">
                {selectedNode.stageName}
              </span>
              <span className="text-[9px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-mono">
                ACTIVE
              </span>
            </div>
            <h4 className="text-sm font-bold text-white leading-tight">{selectedNode.name}</h4>
            <p className="text-[11px] text-slate-300 leading-snug">{selectedNode.description}</p>
            <div className="space-y-1 pt-1 border-t border-slate-800 text-[10px] text-slate-400 font-mono">
              {selectedNode.details.map((d, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                  <span>{d}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Orbit Helper Tip */}
        <div className="absolute top-4 right-4 z-10 pointer-events-none hidden sm:flex items-center gap-1.5 text-[10px] text-slate-400 bg-slate-900/70 backdrop-blur-sm px-2.5 py-1 rounded-full border border-slate-800 font-mono">
          <Compass className="w-3 h-3 text-cyan-400" />
          <span>Click & Drag to Orbit | Scroll to Zoom</span>
        </div>
      </div>

      {/* Interactive Workflow State Progress Bar */}
      <div className="bg-slate-900/95 px-4 py-2.5 border-t border-slate-800 overflow-x-auto">
        <div className="flex items-center justify-between gap-2 min-w-[600px] text-[10px] font-mono">
          {[
            { id: 'idle', label: '1. IDLE' },
            { id: 'sos_confirm', label: '2. SOS TRIGGER' },
            { id: 'location_detecting', label: '3. GPS DETECT' },
            { id: 'request_processing', label: '4. AI FUSION' },
            { id: 'notification_processing', label: '5. NOTIFY DISPATCH' },
            { id: 'emergency_active', label: '6. TACTICAL RESCUE' },
            { id: 'resolved', label: '7. RESOLVED' }
          ].map((st, i) => {
            const isCurrent = workflowState === st.id;
            return (
              <button
                key={st.id}
                onClick={() => onStateSelect?.(st.id as SystemWorkflowState)}
                className={`flex-1 py-1.5 px-2 rounded-lg font-bold text-center transition-all ${
                  isCurrent
                    ? 'bg-purple-600 text-white shadow-md ring-1 ring-purple-400'
                    : 'bg-slate-950 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                {st.label}
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
};
