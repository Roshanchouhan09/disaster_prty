import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { 
  Play, Pause, RotateCcw, Eye, Info, Sparkles, 
  Layers, Radio, Shield, MapPin, Cpu, Truck, CheckCircle2,
  AlertOctagon, Compass, ZoomIn, ZoomOut, AlertTriangle,
  Volume2, VolumeX, Video, Activity, Zap, Navigation
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
  telemetry: { label: string; value: string }[];
}

const NODES_CONFIG: NodeData[] = [
  {
    id: 'user',
    name: 'Citizen Distress Device',
    stageName: '1. CITIZEN NODE',
    position: new THREE.Vector3(-12, 0, 4),
    color: 0x38bdf8, // light blue
    activeStates: ['sos_confirm', 'sos_activated'],
    description: 'Citizen smartphone or offline mesh node captures emergency distress intent and field telemetry.',
    details: ['Phone / Offline Mesh Beacon', 'Battery & Radio Monitored', 'Local Storage Cryptographic Guard'],
    telemetry: [
      { label: 'Signal Strength', value: '-74 dBm (4G/LoRa)' },
      { label: 'Device Battery', value: '88% Optimal' },
      { label: 'Packet Ingestion', value: '1.2 KB Encrypted' }
    ]
  },
  {
    id: 'sos_trigger',
    name: 'SOS Activation Beacon',
    stageName: '2. SOS ACTIVATION',
    position: new THREE.Vector3(-7, 2, 0.5),
    color: 0xef4444, // red
    activeStates: ['sos_confirm', 'sos_activated'],
    description: 'Cryptographic double-confirmation barrier that eliminates false positives and generates unique incident seeds.',
    details: ['Double-confirmation Barrier', 'Unique SOS-2026 Code Generated', 'Zero-Duplicate Geo Hashing'],
    telemetry: [
      { label: 'Deduplication Guard', value: 'Active (SHA-256)' },
      { label: 'Triage Level', value: 'PRIORITY 1 (CRITICAL)' },
      { label: 'Confidence Seed', value: '0.992 Authenticated' }
    ]
  },
  {
    id: 'location',
    name: 'GPS & Satellite Telemetry',
    stageName: '3. SATELLITE & GPS',
    position: new THREE.Vector3(-2, 5.5, -3),
    color: 0x0ea5e9, // sky cyan
    activeStates: ['location_detecting', 'request_processing'],
    description: 'Real-time multi-constellation orbital triangulation fusing W3C GPS, NavIC, and elevation maps.',
    details: ['NavIC / GPS Multi-Constellation', 'Accuracy Radius 1.4m', 'Terrain Elevation Map Match'],
    telemetry: [
      { label: 'Satellites Locked', value: '11 Orbital Links' },
      { label: 'HDOP Precision', value: '0.78 (Sub-2m CEP)' },
      { label: 'GIS Elevation', value: '+54.2m ASL' }
    ]
  },
  {
    id: 'ai_core',
    name: 'DISASTERFOG AI Neural Engine',
    stageName: '4. AI DECISION ENGINE',
    position: new THREE.Vector3(2, 3, 0),
    color: 0xa855f7, // purple
    activeStates: ['request_processing', 'notification_processing'],
    description: 'Transformer NLP neural models performing cross-report clustering, contradiction flagging, and casualty estimation.',
    details: ['Multi-lingual NLP Severity Classifier', 'Bayesian Source Reliability Model', 'Triage Allocation Matrix'],
    telemetry: [
      { label: 'Inference Latency', value: '18.4ms FP16' },
      { label: 'Mortality Risk Score', value: 'HIGH (0.89)' },
      { label: 'Contradiction Check', value: 'Verified Zero Conflict' }
    ]
  },
  {
    id: 'eoc_hub',
    name: 'Tactical EOC Command Console',
    stageName: '5. EOC COMMAND CENTER',
    position: new THREE.Vector3(7, 2, 2.5),
    color: 0xf59e0b, // amber
    activeStates: ['notification_processing', 'emergency_active'],
    description: 'Human-in-the-loop tactical dashboard streaming real-time WebSocket updates to incident commanders.',
    details: ['Live Dual-Channel WebSocket Stream', 'Controller Override Switch', 'Immutable Event Audit Trail'],
    telemetry: [
      { label: 'Active EOC Operators', value: '8 Connected' },
      { label: 'WS Latency', value: '12ms Broadcast' },
      { label: 'DEFCON State', value: 'DEFCON 1 EMERGENCY' }
    ]
  },
  {
    id: 'dispatch',
    name: 'Tactical Rescue Force (NDRF/SDRF)',
    stageName: '6. TACTICAL DISPATCH',
    position: new THREE.Vector3(12, 2.8, -2),
    color: 0x10b981, // emerald
    activeStates: ['notification_processing', 'emergency_active'],
    description: 'Multi-agency dispatch gateway triggering autonomous reconnaissance drones, rescue boats, and trauma teams.',
    details: ['Automated National 112 Protocol', 'Autonomous Drone Recon Dispatched', 'Trauma Ambulance GPS Link'],
    telemetry: [
      { label: 'Assigned Unit', value: 'SDRF Alpha-6 Drone + Boat' },
      { label: 'Air Recon ETA', value: '3.8 Minutes' },
      { label: 'Telemetry Link', value: 'AES-256 Encrypted' }
    ]
  },
  {
    id: 'safe_haven',
    name: 'Evacuation Shelter & Medical Hub',
    stageName: '7. EVACUATION & RELIEF',
    position: new THREE.Vector3(15, 0.8, 3),
    color: 0x06b6d4, // cyan
    activeStates: ['emergency_active', 'resolved'],
    description: 'Safe extraction corridors, hospital triage intake, and operational emergency camp capacity tracking.',
    details: ['Shelter Capacity Verification', 'Direct Trauma Intake', 'Victim Status Resolution Protocol'],
    telemetry: [
      { label: 'Shelter Capacity', value: '1,200 (68% Occupied)' },
      { label: 'ICU Beds Available', value: '14 Ready' },
      { label: 'Mission State', value: 'EXTRACTION VERIFIED' }
    ]
  }
];

// Web Audio API feedback synthesizer
const playSynthTone = (freq = 520, type: OscillatorType = 'sine', duration = 0.09) => {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.03, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    // browser auto-play or muted
  }
};

export const SystemWorkflow3D: React.FC<SystemWorkflow3DProps> = ({
  workflowState = 'idle',
  onStateSelect,
  className = '',
  isCompact = false
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [selectedNode, setSelectedNode] = useState<NodeData | null>(NODES_CONFIG[3]); // default to AI core
  const [hoveredNode, setHoveredNode] = useState<NodeData | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [webglSupported, setWebglSupported] = useState(true);
  const [cameraView, setCameraView] = useState<'overview' | 'citizen' | 'satellite' | 'ai' | 'dispatch' | 'shelter'>('overview');

  // Three.js internal references
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const nodesMeshMap = useRef<Map<string, THREE.Group>>(new Map());
  const particlesRef = useRef<THREE.Points | null>(null);
  const droneMeshRef = useRef<THREE.Group | null>(null);
  const satelliteMeshRef = useRef<THREE.Group | null>(null);
  const radarSweepRef = useRef<THREE.Mesh | null>(null);
  const animFrameId = useRef<number | null>(null);

  // Manual camera rotation state
  const isDragging = useRef(false);
  const prevMousePos = useRef({ x: 0, y: 0 });
  const cameraAngle = useRef({ theta: 0.35, phi: 0.58, radius: 28 });
  const targetLookAt = useRef(new THREE.Vector3(1.5, 2.2, 0));

  const updateCameraPosition = useCallback(() => {
    if (!cameraRef.current) return;
    const { theta, phi, radius } = cameraAngle.current;
    cameraRef.current.position.x = targetLookAt.current.x + radius * Math.sin(phi) * Math.sin(theta);
    cameraRef.current.position.y = targetLookAt.current.y + radius * Math.cos(phi);
    cameraRef.current.position.z = targetLookAt.current.z + radius * Math.sin(phi) * Math.cos(theta);
    cameraRef.current.lookAt(targetLookAt.current);
  }, []);

  const setViewPreset = (view: 'overview' | 'citizen' | 'satellite' | 'ai' | 'dispatch' | 'shelter') => {
    setCameraView(view);
    if (soundEnabled) playSynthTone(640, 'triangle', 0.08);

    if (view === 'overview') {
      targetLookAt.current.set(1.5, 2.2, 0);
      cameraAngle.current = { theta: 0.35, phi: 0.58, radius: 28 };
    } else if (view === 'citizen') {
      targetLookAt.current.copy(NODES_CONFIG[0].position);
      cameraAngle.current = { theta: 0.85, phi: 0.65, radius: 14 };
    } else if (view === 'satellite') {
      targetLookAt.current.copy(NODES_CONFIG[2].position);
      cameraAngle.current = { theta: 0.3, phi: 0.45, radius: 15 };
    } else if (view === 'ai') {
      targetLookAt.current.copy(NODES_CONFIG[3].position);
      cameraAngle.current = { theta: 0.08, phi: 0.62, radius: 13 };
    } else if (view === 'dispatch') {
      targetLookAt.current.copy(NODES_CONFIG[5].position);
      cameraAngle.current = { theta: -0.65, phi: 0.65, radius: 15 };
    } else if (view === 'shelter') {
      targetLookAt.current.copy(NODES_CONFIG[6].position);
      cameraAngle.current = { theta: -0.95, phi: 0.7, radius: 14 };
    }
    updateCameraPosition();
  };

  // Automated Simulation Stepper
  useEffect(() => {
    if (!isPlaying) return;
    const stages: SystemWorkflowState[] = [
      'idle', 'sos_confirm', 'location_detecting', 
      'request_processing', 'notification_processing', 
      'emergency_active', 'resolved'
    ];
    let currentIndex = stages.indexOf(workflowState);
    if (currentIndex < 0) currentIndex = 0;

    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % stages.length;
      const nextState = stages[currentIndex];
      onStateSelect?.(nextState);
      if (soundEnabled) {
        playSynthTone(400 + currentIndex * 90, 'sine', 0.12);
      }
      // Follow the active node with camera preset
      if (currentIndex === 1) setViewPreset('citizen');
      else if (currentIndex === 2) setViewPreset('satellite');
      else if (currentIndex === 3) setViewPreset('ai');
      else if (currentIndex === 4 || currentIndex === 5) setViewPreset('dispatch');
      else if (currentIndex === 6) setViewPreset('shelter');
      else setViewPreset('overview');
    }, 2800);

    return () => clearInterval(interval);
  }, [isPlaying, workflowState, onStateSelect, soundEnabled]);

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
    const width = container.clientWidth || 900;
    const height = container.clientHeight || 540;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x020617); // Deep Slate-950
    scene.fog = new THREE.FogExp2(0x020617, 0.02);

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 150);
    cameraRef.current = camera;
    updateCameraPosition();

    // Renderer with high performance antialiasing
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 3. Ambient, Directional & Point Lights
    const ambientLight = new THREE.AmbientLight(0x38bdf8, 0.65);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.4);
    dirLight.position.set(12, 24, 12);
    scene.add(dirLight);

    const purplePointLight = new THREE.PointLight(0xa855f7, 3, 35);
    purplePointLight.position.set(2, 5, 0);
    scene.add(purplePointLight);

    const cyanPointLight = new THREE.PointLight(0x06b6d4, 2.5, 30);
    cyanPointLight.position.set(-2, 6, -3);
    scene.add(cyanPointLight);

    // 4. Starfield & Cyber Dust Particles
    const starCount = 350;
    const starGeom = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starPositions[i] = (Math.random() - 0.5) * 80;
      starPositions[i + 1] = Math.random() * 30 + 1;
      starPositions[i + 2] = (Math.random() - 0.5) * 80;
    }
    starGeom.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0x94a3b8,
      size: 0.18,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending
    });
    const starPoints = new THREE.Points(starGeom, starMat);
    scene.add(starPoints);

    // 5. Cybernetic Holographic Ground with Concentric Radar Rings
    const gridHelper = new THREE.GridHelper(50, 50, 0x334155, 0x0f172a);
    gridHelper.position.y = -1;
    scene.add(gridHelper);

    // Radar Concentric Range Rings
    [8, 16, 24].forEach((radius) => {
      const ringGeom = new THREE.RingGeometry(radius - 0.05, radius + 0.05, 64);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x0ea5e9,
        transparent: true,
        opacity: 0.22,
        side: THREE.DoubleSide
      });
      const ringMesh = new THREE.Mesh(ringGeom, ringMat);
      ringMesh.rotation.x = Math.PI / 2;
      ringMesh.position.y = -0.98;
      scene.add(ringMesh);
    });

    // Rotating Radar Sweep Sector
    const radarSectorGeom = new THREE.CircleGeometry(24, 32, 0, Math.PI / 4);
    const radarSectorMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.07,
      side: THREE.DoubleSide
    });
    const radarSweepMesh = new THREE.Mesh(radarSectorGeom, radarSectorMat);
    radarSweepMesh.rotation.x = Math.PI / 2;
    radarSweepMesh.position.y = -0.97;
    scene.add(radarSweepMesh);
    radarSweepRef.current = radarSweepMesh;

    // 6. Build High-Tech 3D Workflow Nodes with Dual Gimbal Rings
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
        geom = new THREE.OctahedronGeometry(1.2, 0);
      } else if (config.id === 'sos_trigger') {
        geom = new THREE.IcosahedronGeometry(1.25, 0);
      } else if (config.id === 'dispatch') {
        geom = new THREE.BoxGeometry(1.4, 1.2, 1.8);
      } else if (config.id === 'safe_haven') {
        geom = new THREE.CylinderGeometry(0.8, 1.3, 1.6, 6);
      } else {
        geom = new THREE.SphereGeometry(1.1, 28, 28);
      }

      const mat = new THREE.MeshStandardMaterial({
        color: config.color,
        roughness: 0.15,
        metalness: 0.85,
        emissive: config.color,
        emissiveIntensity: 0.45
      });

      const mesh = new THREE.Mesh(geom, mat);
      group.add(mesh);

      // Primary Gimbal Outer Ring
      const ring1Geom = new THREE.TorusGeometry(1.8, 0.04, 12, 40);
      const ring1Mat = new THREE.MeshBasicMaterial({ color: config.color, transparent: true, opacity: 0.65 });
      const ring1 = new THREE.Mesh(ring1Geom, ring1Mat);
      ring1.rotation.x = Math.PI / 2;
      group.add(ring1);

      // Secondary Gimbal Counter-Rotating Ring
      const ring2Geom = new THREE.TorusGeometry(1.5, 0.03, 10, 36);
      const ring2Mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.4 });
      const ring2 = new THREE.Mesh(ring2Geom, ring2Mat);
      ring2.rotation.y = Math.PI / 3;
      group.add(ring2);

      // Ground Pulsing Projection Column
      const lineGeom = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, -config.position.y - 1, 0)
      ]);
      const lineMat = new THREE.LineDashedMaterial({
        color: config.color,
        dashSize: 0.5,
        gapSize: 0.25,
        transparent: true,
        opacity: 0.4
      });
      const dropLine = new THREE.Line(lineGeom, lineMat);
      dropLine.computeLineDistances();
      group.add(dropLine);

      // Ground Target Disc
      const discGeom = new THREE.RingGeometry(0.6, 0.9, 24);
      const discMat = new THREE.MeshBasicMaterial({ color: config.color, transparent: true, opacity: 0.35, side: THREE.DoubleSide });
      const disc = new THREE.Mesh(discGeom, discMat);
      disc.rotation.x = Math.PI / 2;
      disc.position.y = -config.position.y - 0.98;
      group.add(disc);

      scene.add(group);
      nodeMeshes.set(config.id, group);
    });

    nodesMeshMap.current = nodeMeshes;

    // 7. Connect Nodes with Luminous Arched Pipelines
    const pipelinePoints: THREE.Vector3[] = [];
    for (let i = 0; i < NODES_CONFIG.length - 1; i++) {
      const p1 = NODES_CONFIG[i].position;
      const p2 = NODES_CONFIG[i + 1].position;
      const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
      mid.y += 1.8; // graceful suspension arch

      const curve = new THREE.QuadraticBezierCurve3(p1, mid, p2);
      const points = curve.getPoints(28);
      points.forEach(pt => pipelinePoints.push(pt));

      const tubeGeom = new THREE.TubeGeometry(curve, 28, 0.08, 8, false);
      const tubeMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.4
      });
      const tubeMesh = new THREE.Mesh(tubeGeom, tubeMat);
      scene.add(tubeMesh);
    }

    // 8. Animated High-Speed Data Flow Energy Packets
    const particleCount = 260;
    const particleGeom = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);
    const particleSpeeds = new Float32Array(particleCount);
    const particleProgress = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      particleProgress[i] = Math.random();
      particleSpeeds[i] = 0.0035 + Math.random() * 0.006;
      const idx = Math.floor(particleProgress[i] * (pipelinePoints.length - 1));
      const pt = pipelinePoints[idx] || NODES_CONFIG[0].position;
      particlePositions[i * 3] = pt.x;
      particlePositions[i * 3 + 1] = pt.y;
      particlePositions[i * 3 + 2] = pt.z;

      // Color packet according to progress through the pipeline
      const c = new THREE.Color().setHSL(0.55 + particleProgress[i] * 0.4, 0.9, 0.65);
      particleColors[i * 3] = c.r;
      particleColors[i * 3 + 1] = c.g;
      particleColors[i * 3 + 2] = c.b;
    }

    particleGeom.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeom.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));
    const particleMat = new THREE.PointsMaterial({
      size: 0.32,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending
    });

    const particles = new THREE.Points(particleGeom, particleMat);
    scene.add(particles);
    particlesRef.current = particles;

    // 9. Overhead Tactical GPS Satellite
    const satelliteGroup = new THREE.Group();
    satelliteGroup.position.set(-2, 12, -3);

    const satBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.8, 1.4),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.2 })
    );
    satelliteGroup.add(satBody);

    // Solar Wings
    [-1.2, 1.2].forEach(offset => {
      const wing = new THREE.Mesh(
        new THREE.BoxGeometry(1.6, 0.05, 0.8),
        new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.6, roughness: 0.3 })
      );
      wing.position.x = offset;
      satelliteGroup.add(wing);
    });

    // Satellite Laser Downlink Beam to Location Node
    const satBeamGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, -6.5, 0)
    ]);
    const satBeamMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.5
    });
    const satBeam = new THREE.Line(satBeamGeom, satBeamMat);
    satelliteGroup.add(satBeam);

    scene.add(satelliteGroup);
    satelliteMeshRef.current = satelliteGroup;

    // 10. Autonomous Tactical Recon Drone Model
    const droneGroup = new THREE.Group();
    droneGroup.position.set(7, 4.5, 1);

    const droneCore = new THREE.Mesh(
      new THREE.SphereGeometry(0.4, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0x10b981, metalness: 0.8, roughness: 0.2 })
    );
    droneGroup.add(droneCore);

    // 4 Drone Rotor Arms
    const armAngles = [Math.PI / 4, 3 * Math.PI / 4, 5 * Math.PI / 4, 7 * Math.PI / 4];
    armAngles.forEach(angle => {
      const arm = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.04, 0.9),
        new THREE.MeshStandardMaterial({ color: 0x334155 })
      );
      arm.rotation.z = Math.PI / 2;
      arm.rotation.y = angle;
      arm.position.x = Math.cos(angle) * 0.45;
      arm.position.z = Math.sin(angle) * 0.45;
      droneGroup.add(arm);

      // Spinning rotor disc
      const rotor = new THREE.Mesh(
        new THREE.RingGeometry(0.1, 0.35, 12),
        new THREE.MeshBasicMaterial({ color: 0x6ee7b7, transparent: true, opacity: 0.6, side: THREE.DoubleSide })
      );
      rotor.rotation.x = Math.PI / 2;
      rotor.position.set(Math.cos(angle) * 0.85, 0.08, Math.sin(angle) * 0.85);
      droneGroup.add(rotor);
    });

    scene.add(droneGroup);
    droneMeshRef.current = droneGroup;

    // 11. Raycasting for Interaction
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

        // Treat small click as node selection
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
              const nodeCfg = rootGroup.userData.config as NodeData;
              setSelectedNode(nodeCfg);
              if (soundEnabled) playSynthTone(580, 'sine', 0.08);
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
      cameraAngle.current.phi = Math.max(0.12, Math.min(Math.PI / 2 - 0.04, cameraAngle.current.phi - dy * 0.007));
      updateCameraPosition();
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      cameraAngle.current.radius = Math.max(10, Math.min(48, cameraAngle.current.radius + e.deltaY * 0.02));
      updateCameraPosition();
    };

    container.addEventListener('mousemove', onPointerMove);
    container.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mouseup', onPointerUp);
    window.addEventListener('mousemove', onDragRotate);
    container.addEventListener('wheel', onWheel, { passive: false });

    // 12. Resize Observer
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

    // 13. Dynamic Render Loop
    const clock = new THREE.Clock();

    const animate = () => {
      animFrameId.current = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // Continuous cinematic orbit if enabled and not currently dragging
      if (autoRotate && !isDragging.current) {
        cameraAngle.current.theta += delta * 0.08;
        updateCameraPosition();
      }

      // Rotate ground radar sweep
      if (radarSweepRef.current) {
        radarSweepRef.current.rotation.z += delta * 0.75;
      }

      // Rotate Satellite
      if (satelliteMeshRef.current) {
        satelliteMeshRef.current.rotation.y += delta * 0.2;
        satelliteMeshRef.current.position.y = 12 + Math.sin(time * 1.5) * 0.4;
      }

      // Fly Autonomous Recon Drone
      if (droneMeshRef.current) {
        const flightRadius = 4.2;
        droneMeshRef.current.position.x = 9 + Math.cos(time * 0.8) * flightRadius;
        droneMeshRef.current.position.z = Math.sin(time * 0.8) * flightRadius;
        droneMeshRef.current.position.y = 4.2 + Math.sin(time * 2.5) * 0.3;
        droneMeshRef.current.rotation.y = time * 0.8 + Math.PI / 2;
      }

      // Animate Nodes & Dual Gimbal Rings
      nodeMeshes.forEach((group) => {
        const cfg = group.userData.config as NodeData;
        const isStateActive = cfg?.activeStates.includes(workflowState);

        // Core mesh rotation
        const core = group.children[0] as THREE.Mesh;
        if (core) {
          core.rotation.y += delta * (isStateActive ? 1.6 : 0.4);
          core.rotation.x += delta * 0.25;

          if (isStateActive) {
            const scale = 1 + Math.sin(time * 6) * 0.14;
            core.scale.set(scale, scale, scale);
            (core.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.85 + Math.sin(time * 6) * 0.4;
          } else {
            core.scale.set(1, 1, 1);
            (core.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.35;
          }
        }

        // Gimbal Ring 1
        const ring1 = group.children[1] as THREE.Mesh;
        if (ring1) {
          ring1.rotation.z += delta * (isStateActive ? 1.2 : 0.6);
        }

        // Gimbal Ring 2
        const ring2 = group.children[2] as THREE.Mesh;
        if (ring2) {
          ring2.rotation.x += delta * (isStateActive ? -1.4 : -0.5);
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
          positions[i * 3] = pt.x + (Math.sin(time * 4 + i) * 0.12);
          positions[i * 3 + 1] = pt.y + (Math.cos(time * 4 + i) * 0.12);
          positions[i * 3 + 2] = pt.z + (Math.sin(time * 2 + i) * 0.12);
        }
        particlesRef.current.geometry.attributes.position.needsUpdate = true;
      }

      renderer.render(scene, camera);
    };

    animate();

    // 14. Cleanup function
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
  }, [workflowState, updateCameraPosition, autoRotate]);

  const handleZoom = (direction: 'in' | 'out') => {
    const delta = direction === 'in' ? -3 : 3;
    cameraAngle.current.radius = Math.max(10, Math.min(48, cameraAngle.current.radius + delta));
    updateCameraPosition();
    if (soundEnabled) playSynthTone(700, 'sine', 0.05);
  };

  const handleResetCamera = () => {
    setViewPreset('overview');
  };

  return (
    <div className={`relative bg-slate-950 border border-purple-500/40 rounded-2xl overflow-hidden shadow-2xl flex flex-col ${className}`}>
      
      {/* 3D Top Tactical HUD Bar */}
      <div className="bg-slate-900/90 backdrop-blur-md px-4 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-purple-600/30 text-purple-400 border border-purple-500/50 shadow-md shadow-purple-950">
            <Cpu className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-black text-white tracking-wide flex items-center gap-1.5">
                <span>3D INTELLIGENCE PIPELINE DIGITAL TWIN</span>
              </h3>
              <span className="text-[10px] bg-purple-600 text-white font-mono px-2 py-0.5 rounded font-bold uppercase shadow">
                WebGL 2.0
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5 flex items-center gap-2">
              <span>Pipeline Stage:</span>
              <span className="text-emerald-400 font-bold uppercase tracking-wider bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-500/30">
                {workflowState}
              </span>
            </p>
          </div>
        </div>

        {/* View Camera Presets & Interactive Stepper */}
        <div className="flex items-center gap-1.5 flex-wrap">
          
          {/* Auto Simulation Stepper Button */}
          <button
            onClick={() => {
              setIsPlaying(!isPlaying);
              if (soundEnabled) playSynthTone(isPlaying ? 350 : 800, 'triangle', 0.1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 shadow ${
              isPlaying
                ? 'bg-amber-600 text-white animate-pulse'
                : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white'
            }`}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>{isPlaying ? 'PAUSE AI SIMULATION' : 'RUN AI SIMULATION'}</span>
          </button>

          <div className="h-4 w-px bg-slate-700 mx-1 hidden sm:block"></div>

          {/* Camera Perspective Presets */}
          <button
            onClick={() => setViewPreset('overview')}
            className={`px-2.5 py-1 rounded-md text-xs font-bold transition-colors ${
              cameraView === 'overview' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setViewPreset('citizen')}
            className={`px-2.5 py-1 rounded-md text-xs font-bold transition-colors ${
              cameraView === 'citizen' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Citizen SOS
          </button>
          <button
            onClick={() => setViewPreset('satellite')}
            className={`px-2.5 py-1 rounded-md text-xs font-bold transition-colors ${
              cameraView === 'satellite' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Satellite GPS
          </button>
          <button
            onClick={() => setViewPreset('ai')}
            className={`px-2.5 py-1 rounded-md text-xs font-bold transition-colors ${
              cameraView === 'ai' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            AI Engine
          </button>
          <button
            onClick={() => setViewPreset('dispatch')}
            className={`px-2.5 py-1 rounded-md text-xs font-bold transition-colors ${
              cameraView === 'dispatch' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Tactical Drone
          </button>

          <div className="h-4 w-px bg-slate-700 mx-1 hidden sm:block"></div>

          {/* Cinematic Auto-Rotate */}
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className={`p-1.5 rounded-md transition-colors ${
              autoRotate ? 'bg-purple-600/40 text-purple-300 border border-purple-500/50' : 'bg-slate-800 text-slate-400'
            }`}
            title={autoRotate ? 'Disable Cinematic 360° Cam' : 'Enable Cinematic 360° Cam'}
          >
            <Video className="w-3.5 h-3.5" />
          </button>

          {/* Sound FX Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-1.5 rounded-md transition-colors ${
              soundEnabled ? 'bg-slate-800 text-slate-200' : 'bg-slate-800 text-slate-500'
            }`}
            title={soundEnabled ? 'Mute Audio FX' : 'Enable Audio FX'}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-cyan-400" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          {/* Zoom In & Out */}
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
      <div className="relative flex-1 min-h-[440px] sm:min-h-[580px] bg-slate-950 flex items-center justify-center">
        {webglSupported ? (
          <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing select-none" />
        ) : (
          /* WebGL Fallback */
          <div className="p-8 text-center max-w-md space-y-4">
            <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto" />
            <h4 className="text-base font-bold text-white">3D Hardware Acceleration Unavailable</h4>
            <p className="text-xs text-slate-400">
              WebGL is disabled or unsupported on this device. The system architecture workflow remains active:
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

        {/* Floating Telemetry HUD Drawer for Selected Node */}
        {selectedNode && (
          <div className="absolute top-4 left-4 z-10 max-w-xs sm:max-w-sm w-full bg-slate-900/90 backdrop-blur-md p-4 rounded-xl border border-purple-500/40 shadow-2xl text-xs space-y-3 pointer-events-auto">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-purple-400 font-black uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping"></span>
                <span>{selectedNode.stageName}</span>
              </span>
              <span className="text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded font-mono font-bold">
                ONLINE
              </span>
            </div>
            
            <h4 className="text-sm font-black text-white leading-tight">{selectedNode.name}</h4>
            <p className="text-[11px] text-slate-300 leading-snug">{selectedNode.description}</p>
            
            {/* Live Telemetry Data Feed */}
            <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 space-y-1.5 font-mono text-[10px]">
              <div className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Live Node Telemetry</div>
              {selectedNode.telemetry.map((t, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <span className="text-slate-400">{t.label}:</span>
                  <span className="text-cyan-400 font-bold">{t.value}</span>
                </div>
              ))}
            </div>

            {/* Architecture Details */}
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

        {/* Orbit Helper Tip & Active Status */}
        <div className="absolute top-4 right-4 z-10 pointer-events-none hidden sm:flex flex-col items-end gap-1.5">
          <div className="flex items-center gap-1.5 text-[10px] text-slate-300 bg-slate-900/80 backdrop-blur-sm px-3 py-1 rounded-full border border-slate-800 font-mono shadow">
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            <span>Click & Drag to Orbit | Scroll to Zoom</span>
          </div>
          <div className="flex items-center gap-2 text-[9px] font-mono text-slate-400 bg-slate-950/80 px-2.5 py-0.5 rounded border border-slate-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>UAV Recon Drone Airspeed: 58 km/h</span>
          </div>
        </div>
      </div>

      {/* Interactive Workflow State Progress Bar */}
      <div className="bg-slate-900/95 px-4 py-2.5 border-t border-slate-800 overflow-x-auto">
        <div className="flex items-center justify-between gap-2 min-w-[700px] text-[10px] font-mono">
          {[
            { id: 'idle', label: '1. IDLE STANDBY' },
            { id: 'sos_confirm', label: '2. SOS TRIGGER' },
            { id: 'location_detecting', label: '3. GPS SATELLITE' },
            { id: 'request_processing', label: '4. AI NLP FUSION' },
            { id: 'notification_processing', label: '5. NOTIFY EOC' },
            { id: 'emergency_active', label: '6. TACTICAL DRONE/SDRF' },
            { id: 'resolved', label: '7. EVACUATION RESOLVED' }
          ].map((st) => {
            const isCurrent = workflowState === st.id;
            return (
              <button
                key={st.id}
                onClick={() => {
                  onStateSelect?.(st.id as SystemWorkflowState);
                  if (soundEnabled) playSynthTone(540, 'triangle', 0.08);
                }}
                className={`flex-1 py-2 px-2.5 rounded-lg font-bold text-center transition-all ${
                  isCurrent
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-950 ring-2 ring-purple-400 scale-[1.02]'
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
