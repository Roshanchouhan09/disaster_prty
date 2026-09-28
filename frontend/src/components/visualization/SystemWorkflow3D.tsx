import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { 
  Play, Pause, RotateCcw, Eye, Info, Sparkles, 
  Layers, Radio, Shield, MapPin, Cpu, Truck, CheckCircle2,
  AlertOctagon, Compass, ZoomIn, ZoomOut, AlertTriangle,
  Volume2, VolumeX, Video, Activity, Zap, Navigation,
  ChevronRight, ChevronLeft, Award, HelpCircle
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
  shortTag: string;
  position: THREE.Vector3;
  color: number;
  activeStates: SystemWorkflowState[];
  judgePitch: string;
  description: string;
  details: string[];
  telemetry: { label: string; value: string }[];
}

const NODES_CONFIG: NodeData[] = [
  {
    id: 'user',
    name: 'Citizen Distress Smartphone',
    stageName: '1. CITIZEN SOS',
    shortTag: 'STEP 1: CITIZEN DISTRESS',
    position: new THREE.Vector3(-14, 0, 4),
    color: 0x38bdf8, // light blue
    activeStates: ['sos_confirm', 'sos_activated'],
    judgePitch: 'Civilians trapped in floodwaters or collapsed structures trigger 1-click distress with zero internet requirement.',
    description: 'Smartphone / offline wearable captures emergency distress intent and field telemetry.',
    details: ['Phone / Offline Mesh Beacon', 'Battery & Radio Monitored', 'Local Storage Cryptographic Guard'],
    telemetry: [
      { label: 'Signal Type', value: 'Offline LoRa / 4G Fallback' },
      { label: 'Device Battery', value: '88% Monitored' },
      { label: 'Payload Integrity', value: 'SHA-256 Verified' }
    ]
  },
  {
    id: 'sos_trigger',
    name: 'Cellular / LoRa Mesh Relay Tower',
    stageName: '2. MESH RELAY',
    shortTag: 'STEP 2: OFFLINE MESH RELAY',
    position: new THREE.Vector3(-8.5, 2.5, 0.5),
    color: 0xef4444, // red
    activeStates: ['sos_confirm', 'sos_activated'],
    judgePitch: 'Peer-to-peer LoRa mesh hops data across flooded valleys where telecom towers are down, eliminating duplicate panics.',
    description: 'Cryptographic double-confirmation barrier that eliminates false positives and generates unique incident seeds.',
    details: ['Zero-Tower Mesh Hopping', 'Unique SOS Code Generated', 'Deduplication Shield Active'],
    telemetry: [
      { label: 'Mesh Relay Hop', value: 'Node #4 -> Gateway #1' },
      { label: 'Deduplication Guard', value: 'Active (Filters 95% Spam)' },
      { label: 'Triage Level', value: 'PRIORITY 1 (CRITICAL)' }
    ]
  },
  {
    id: 'location',
    name: 'NavIC / GPS Satellite Constellation',
    stageName: '3. SATELLITE GPS',
    shortTag: 'STEP 3: ORBITAL SATELLITE GPS',
    position: new THREE.Vector3(-3, 6, -3.5),
    color: 0x0ea5e9, // sky cyan
    activeStates: ['location_detecting', 'request_processing'],
    judgePitch: 'Multi-constellation orbital satellites lock sub-2m civilian coordinates and terrain elevation models.',
    description: 'Real-time multi-constellation orbital triangulation fusing W3C GPS, NavIC, and elevation maps.',
    details: ['NavIC / GPS Multi-Constellation', 'Accuracy Radius 1.4m', 'Terrain Elevation Map Match'],
    telemetry: [
      { label: 'Constellation', value: 'ISRO NavIC + Sentinel-2' },
      { label: 'Precision CEP', value: '1.4 meters radius' },
      { label: 'GIS Elevation', value: '+54.2m River Embankment' }
    ]
  },
  {
    id: 'ai_core',
    name: 'DISASTERFOG AI Neural Engine',
    stageName: '4. AI DECISION CORE',
    shortTag: 'STEP 4: AI NLP & FUSION BRAIN',
    position: new THREE.Vector3(2.5, 3.2, 0),
    color: 0xa855f7, // purple
    activeStates: ['request_processing', 'notification_processing'],
    judgePitch: 'The core AI brain: Transformer NLP reads multi-lingual reports, resolves conflicting rumors, and calculates high-mortality zones.',
    description: 'Transformer NLP neural models performing cross-report clustering, contradiction flagging, and casualty estimation.',
    details: ['Multi-lingual NLP Severity Classifier', 'Rumor & Contradiction Resolver', 'High-Mortality Risk Predictor'],
    telemetry: [
      { label: 'NLP Inference', value: '14.2ms Multi-Lingual' },
      { label: 'Casualty Estimate', value: '~850 Trapped Civilians' },
      { label: 'Contradiction Check', value: '3 False Rumors Resolved' }
    ]
  },
  {
    id: 'eoc_hub',
    name: 'Tactical EOC Command Bunker',
    stageName: '5. EOC COMMAND',
    shortTag: 'STEP 5: EOC HUMAN-IN-THE-LOOP',
    position: new THREE.Vector3(8, 2.2, 2.5),
    color: 0xf59e0b, // amber
    activeStates: ['notification_processing', 'emergency_active'],
    judgePitch: 'Human-in-the-Loop governance: EOC commanders verify AI recommendations with real-time WebSocket live-sync.',
    description: 'Tactical operations console verifying automated dispatches, tracking GIS maps, and maintaining immutable audit trails.',
    details: ['Live Dual-Channel WebSocket Stream', 'Controller Override Switch', 'Immutable Event Audit Trail'],
    telemetry: [
      { label: 'Incident State', value: 'DEFCON 1 EMERGENCY' },
      { label: 'Active Commanders', value: 'District EOC Team' },
      { label: 'Decision SLA', value: 'Under 60 Seconds' }
    ]
  },
  {
    id: 'dispatch',
    name: 'Tactical Rescue Force (NDRF/SDRF)',
    stageName: '6. TACTICAL NDRF',
    shortTag: 'STEP 6: DRONE & RESCUE DISPATCH',
    position: new THREE.Vector3(13.5, 2.8, -2),
    color: 0x10b981, // emerald
    activeStates: ['notification_processing', 'emergency_active'],
    judgePitch: 'Automated multi-agency dispatch sends autonomous UAV reconnaissance drones, flood rescue boats, and trauma ambulances.',
    description: 'Multi-agency dispatch gateway triggering autonomous reconnaissance drones, rescue boats, and trauma teams.',
    details: ['Automated National 112 Protocol', 'Autonomous Drone Recon Dispatched', 'Trauma Ambulance GPS Link'],
    telemetry: [
      { label: 'Deployed Units', value: 'NDRF Boat #4 + SDRF Drone' },
      { label: 'Drone Airspeed', value: '62 km/h Searchlight' },
      { label: 'ETA to Target', value: '3.4 Minutes' }
    ]
  },
  {
    id: 'safe_haven',
    name: 'Evacuation Hospital & Safe Haven',
    stageName: '7. RELIEF HAVEN',
    shortTag: 'STEP 7: SAFE HAVEN & RELIEF',
    position: new THREE.Vector3(17.5, 1.2, 3),
    color: 0x06b6d4, // cyan
    activeStates: ['emergency_active', 'resolved'],
    judgePitch: 'Closed-loop resolution: Extricated civilians are admitted to relief camps with live bed and medical supply telemetry.',
    description: 'Safe extraction corridors, hospital triage intake, and operational emergency camp capacity tracking.',
    details: ['Shelter Capacity Verification', 'Direct Trauma Intake', 'Victim Status Resolution Protocol'],
    telemetry: [
      { label: 'Camp Capacity', value: '1,200 (68% Occupied)' },
      { label: 'Trauma ICU Beds', value: '14 Available' },
      { label: 'Outcome', value: 'Lives Saved & Documented' }
    ]
  }
];

// Helper to create 3D Canvas Text Sprite (Billboards) that always face the camera
function createTextSprite(tagText: string, nameText: string, colorHex: string): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 160;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.Sprite();

  // Dark high-contrast translucent pill
  ctx.fillStyle = 'rgba(10, 15, 30, 0.92)';
  ctx.strokeStyle = colorHex;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.roundRect(10, 10, 492, 140, 24);
  ctx.fill();
  ctx.stroke();

  // Tag Badge (e.g. 1. CITIZEN SOS)
  ctx.font = 'bold 36px monospace';
  ctx.fillStyle = colorHex;
  ctx.textAlign = 'center';
  ctx.fillText(tagText, 256, 68);

  // Subtitle Name (e.g. Trapped Victim Phone)
  ctx.font = 'bold 24px sans-serif';
  ctx.fillStyle = '#f8fafc';
  ctx.fillText(nameText, 256, 116);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(4.8, 1.5, 1);
  return sprite;
}

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
  const [selectedNodeIndex, setSelectedNodeIndex] = useState<number>(3); // default to AI core (index 3)
  const [hoveredNode, setHoveredNode] = useState<NodeData | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isJudgeTourActive, setIsJudgeTourActive] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [webglSupported, setWebglSupported] = useState(true);

  const selectedNode = NODES_CONFIG[selectedNodeIndex] || NODES_CONFIG[3];

  // Three.js internal references
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const nodesMeshMap = useRef<Map<string, THREE.Group>>(new Map());
  const particlesRef = useRef<THREE.Points | null>(null);
  const droneMeshRef = useRef<THREE.Group | null>(null);
  const ambulanceMeshRef = useRef<THREE.Group | null>(null);
  const satelliteMeshRef = useRef<THREE.Group | null>(null);
  const radarSweepRef = useRef<THREE.Mesh | null>(null);
  const citizenPulseRef = useRef<THREE.Mesh | null>(null);
  const animFrameId = useRef<number | null>(null);

  // Manual camera rotation state
  const isDragging = useRef(false);
  const prevMousePos = useRef({ x: 0, y: 0 });
  const cameraAngle = useRef({ theta: 0.35, phi: 0.58, radius: 30 });
  const targetLookAt = useRef(new THREE.Vector3(2.5, 2.2, 0));

  const updateCameraPosition = useCallback(() => {
    if (!cameraRef.current) return;
    const { theta, phi, radius } = cameraAngle.current;
    cameraRef.current.position.x = targetLookAt.current.x + radius * Math.sin(phi) * Math.sin(theta);
    cameraRef.current.position.y = targetLookAt.current.y + radius * Math.cos(phi);
    cameraRef.current.position.z = targetLookAt.current.z + radius * Math.sin(phi) * Math.cos(theta);
    cameraRef.current.lookAt(targetLookAt.current);
  }, []);

  const jumpToStage = useCallback((index: number) => {
    if (index < 0 || index >= NODES_CONFIG.length) return;
    setSelectedNodeIndex(index);
    const targetNode = NODES_CONFIG[index];

    // Trigger state change
    const stateMap: SystemWorkflowState[] = [
      'idle', 'sos_confirm', 'location_detecting',
      'request_processing', 'notification_processing',
      'emergency_active', 'resolved'
    ];
    onStateSelect?.(stateMap[index] || 'idle');

    if (soundEnabled) playSynthTone(440 + index * 80, 'triangle', 0.1);

    // Smoothly focus camera on this station
    targetLookAt.current.copy(targetNode.position);
    cameraAngle.current = {
      theta: 0.35 - (index * 0.18),
      phi: 0.62,
      radius: 16
    };
    updateCameraPosition();
  }, [onStateSelect, soundEnabled, updateCameraPosition]);

  const setViewPreset = (view: 'overview' | 'citizen' | 'satellite' | 'ai' | 'dispatch' | 'shelter') => {
    if (soundEnabled) playSynthTone(640, 'triangle', 0.08);

    if (view === 'overview') {
      targetLookAt.current.set(2.5, 2.2, 0);
      cameraAngle.current = { theta: 0.35, phi: 0.58, radius: 30 };
    } else if (view === 'citizen') {
      jumpToStage(0);
      return;
    } else if (view === 'satellite') {
      jumpToStage(2);
      return;
    } else if (view === 'ai') {
      jumpToStage(3);
      return;
    } else if (view === 'dispatch') {
      jumpToStage(5);
      return;
    } else if (view === 'shelter') {
      jumpToStage(6);
      return;
    }
    updateCameraPosition();
  };

  // Automated Judge Tour / Presentation Loop
  useEffect(() => {
    if (!isPlaying && !isJudgeTourActive) return;

    const interval = setInterval(() => {
      setSelectedNodeIndex((prev) => {
        const next = (prev + 1) % NODES_CONFIG.length;
        jumpToStage(next);
        return next;
      });
    }, 4200); // 4.2 seconds per stage gives judges time to read narration

    return () => clearInterval(interval);
  }, [isPlaying, isJudgeTourActive, jumpToStage]);

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
    const width = container.clientWidth || 1000;
    const height = container.clientHeight || 580;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x020617); // Deep Slate-950
    scene.fog = new THREE.FogExp2(0x020617, 0.018);

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 160);
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

    // 3. Ambient & Studio Lighting
    const ambientLight = new THREE.AmbientLight(0x38bdf8, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.6);
    dirLight.position.set(15, 30, 15);
    scene.add(dirLight);

    const purplePointLight = new THREE.PointLight(0xa855f7, 3.5, 40);
    purplePointLight.position.set(2.5, 5, 0);
    scene.add(purplePointLight);

    const cyanPointLight = new THREE.PointLight(0x06b6d4, 3, 35);
    cyanPointLight.position.set(-3, 6, -3.5);
    scene.add(cyanPointLight);

    // 4. Starfield & Cyber Dust Particles
    const starCount = 400;
    const starGeom = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starPositions[i] = (Math.random() - 0.5) * 90;
      starPositions[i + 1] = Math.random() * 35 + 1;
      starPositions[i + 2] = (Math.random() - 0.5) * 90;
    }
    starGeom.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0x94a3b8,
      size: 0.22,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending
    });
    const starPoints = new THREE.Points(starGeom, starMat);
    scene.add(starPoints);

    // 5. Cybernetic Holographic Ground with Concentric Radar Rings
    const gridHelper = new THREE.GridHelper(60, 60, 0x334155, 0x0f172a);
    gridHelper.position.y = -1;
    scene.add(gridHelper);

    // Radar Concentric Range Rings
    [10, 20, 30].forEach((radius) => {
      const ringGeom = new THREE.RingGeometry(radius - 0.06, radius + 0.06, 64);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x0ea5e9,
        transparent: true,
        opacity: 0.24,
        side: THREE.DoubleSide
      });
      const ringMesh = new THREE.Mesh(ringGeom, ringMat);
      ringMesh.rotation.x = Math.PI / 2;
      ringMesh.position.y = -0.98;
      scene.add(ringMesh);
    });

    // Rotating Radar Sweep Sector
    const radarSectorGeom = new THREE.CircleGeometry(30, 32, 0, Math.PI / 4);
    const radarSectorMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.08,
      side: THREE.DoubleSide
    });
    const radarSweepMesh = new THREE.Mesh(radarSectorGeom, radarSectorMat);
    radarSweepMesh.rotation.x = Math.PI / 2;
    radarSweepMesh.position.y = -0.97;
    scene.add(radarSweepMesh);
    radarSweepRef.current = radarSweepMesh;

    // 6. Build High-Detail Procedural 3D Stations with Floating 3D Text Billboards
    const nodeMeshes = new Map<string, THREE.Group>();

    NODES_CONFIG.forEach((config, idx) => {
      const group = new THREE.Group();
      group.position.copy(config.position);
      group.userData = { id: config.id, config, index: idx };

      // Floating 3D Text Billboard Sprite above node
      const labelSprite = createTextSprite(
        config.stageName,
        config.name,
        '#' + config.color.toString(16).padStart(6, '0')
      );
      labelSprite.position.set(0, 3.2, 0);
      group.add(labelSprite);

      // Station Specific 3D Models
      if (config.id === 'user') {
        // STATION 1: Citizen Smartphone & Distress Beacon
        const phoneBody = new THREE.Mesh(
          new THREE.BoxGeometry(0.9, 1.8, 0.12),
          new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9, roughness: 0.1 })
        );
        const phoneScreen = new THREE.Mesh(
          new THREE.PlaneGeometry(0.75, 1.6),
          new THREE.MeshBasicMaterial({ color: 0xef4444 }) // Glowing Red SOS Screen
        );
        phoneScreen.position.z = 0.07;
        phoneBody.add(phoneScreen);
        group.add(phoneBody);

        // Citizen Silhouette
        const citizenHead = new THREE.Mesh(
          new THREE.SphereGeometry(0.35, 16, 16),
          new THREE.MeshStandardMaterial({ color: 0x38bdf8 })
        );
        citizenHead.position.set(1.4, 0.9, 0);
        const citizenBody = new THREE.Mesh(
          new THREE.CylinderGeometry(0.1, 0.45, 1.1, 8),
          new THREE.MeshStandardMaterial({ color: 0x0284c7 })
        );
        citizenBody.position.set(1.4, 0.1, 0);
        group.add(citizenHead);
        group.add(citizenBody);

        // Expanding Citizen SOS Shockwave Ring
        const pulseGeom = new THREE.RingGeometry(0.2, 0.4, 32);
        const pulseMat = new THREE.MeshBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.8, side: THREE.DoubleSide });
        const pulseMesh = new THREE.Mesh(pulseGeom, pulseMat);
        pulseMesh.rotation.x = Math.PI / 2;
        pulseMesh.position.y = -config.position.y - 0.96;
        group.add(pulseMesh);
        citizenPulseRef.current = pulseMesh;

      } else if (config.id === 'sos_trigger') {
        // STATION 2: Cellular / LoRa Mesh Relay Tower Mast
        const towerGroup = new THREE.Group();
        const mast = new THREE.Mesh(
          new THREE.CylinderGeometry(0.12, 0.6, 3.2, 4),
          new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8, roughness: 0.3, wireframe: true })
        );
        towerGroup.add(mast);

        // Red Aviation Warning Strobe Beacon at Mast Tip
        const tipLight = new THREE.Mesh(
          new THREE.SphereGeometry(0.2, 12, 12),
          new THREE.MeshBasicMaterial({ color: 0xef4444 })
        );
        tipLight.position.y = 1.7;
        towerGroup.add(tipLight);

        // Microwave Relay Dishes
        [-0.4, 0.4].forEach(xOff => {
          const dish = new THREE.Mesh(
            new THREE.CylinderGeometry(0.35, 0.1, 0.15, 16),
            new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.7 })
          );
          dish.rotation.z = Math.PI / 2;
          dish.position.set(xOff, 0.8, 0);
          towerGroup.add(dish);
        });
        group.add(towerGroup);

      } else if (config.id === 'location') {
        // STATION 3: Satellite Telemetry Ground Station & Laser Uplink
        const dishPedestal = new THREE.Mesh(
          new THREE.CylinderGeometry(0.5, 0.8, 0.6, 12),
          new THREE.MeshStandardMaterial({ color: 0x334155 })
        );
        const paraboDish = new THREE.Mesh(
          new THREE.CylinderGeometry(1.2, 0.2, 0.4, 20),
          new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.1 })
        );
        paraboDish.rotation.x = Math.PI / 3;
        paraboDish.position.y = 0.6;
        dishPedestal.add(paraboDish);
        group.add(dishPedestal);

      } else if (config.id === 'ai_core') {
        // STATION 4: AI Decision Neural Brain
        const brainCore = new THREE.Mesh(
          new THREE.DodecahedronGeometry(1.5, 1),
          new THREE.MeshStandardMaterial({
            color: 0xa855f7,
            roughness: 0.1,
            metalness: 0.9,
            emissive: 0xa855f7,
            emissiveIntensity: 0.6
          })
        );
        group.add(brainCore);

        // Synaptic Orbital Nodes
        for (let i = 0; i < 6; i++) {
          const angle = (i / 6) * Math.PI * 2;
          const syn = new THREE.Mesh(
            new THREE.SphereGeometry(0.2, 12, 12),
            new THREE.MeshBasicMaterial({ color: 0xc084fc })
          );
          syn.position.set(Math.cos(angle) * 2.2, Math.sin(angle) * 0.8, Math.sin(angle) * 2.2);
          group.add(syn);
        }

      } else if (config.id === 'eoc_hub') {
        // STATION 5: Tactical EOC Operations Bunker Platform
        const bunkerBase = new THREE.Mesh(
          new THREE.BoxGeometry(2.2, 0.4, 2.2),
          new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8 })
        );
        // Multi-Monitor Holographic Console
        [-0.7, 0, 0.7].forEach(x => {
          const screen = new THREE.Mesh(
            new THREE.BoxGeometry(0.55, 0.45, 0.05),
            new THREE.MeshBasicMaterial({ color: 0xf59e0b })
          );
          screen.position.set(x, 0.6, 0.4);
          screen.rotation.y = -x * 0.3;
          bunkerBase.add(screen);
        });
        group.add(bunkerBase);

      } else if (config.id === 'dispatch') {
        // STATION 6: Tactical Rescue Force Base (NDRF Ambulance & Flood Boat)
        const baseMesh = new THREE.Mesh(
          new THREE.BoxGeometry(2.4, 0.3, 2.4),
          new THREE.MeshStandardMaterial({ color: 0x064e3b })
        );
        // NDRF Ambulance Model
        const amb = new THREE.Group();
        const ambBody = new THREE.Mesh(
          new THREE.BoxGeometry(1.6, 0.8, 0.9),
          new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 })
        );
        amb.add(ambBody);
        // Strobe Flasher Lightbar
        const strobe = new THREE.Mesh(
          new THREE.BoxGeometry(0.5, 0.15, 0.2),
          new THREE.MeshBasicMaterial({ color: 0xef4444 })
        );
        strobe.position.y = 0.48;
        amb.add(strobe);
        amb.position.set(0, 0.55, 0);
        group.add(baseMesh);
        group.add(amb);
        ambulanceMeshRef.current = strobe;

      } else {
        // STATION 7: Relief Haven & Field Hospital
        const havenGroup = new THREE.Group();
        const shelterTent = new THREE.Mesh(
          new THREE.ConeGeometry(1.6, 1.8, 4),
          new THREE.MeshStandardMaterial({ color: 0x0891b2, roughness: 0.4 })
        );
        shelterTent.rotation.y = Math.PI / 4;
        havenGroup.add(shelterTent);

        // Glowing 3D Medical Cross (+)
        const crossH = new THREE.Mesh(
          new THREE.BoxGeometry(0.9, 0.25, 0.15),
          new THREE.MeshBasicMaterial({ color: 0x10b981 })
        );
        const crossV = new THREE.Mesh(
          new THREE.BoxGeometry(0.25, 0.9, 0.15),
          new THREE.MeshBasicMaterial({ color: 0x10b981 })
        );
        crossH.position.set(0, 1.4, 0);
        crossV.position.set(0, 1.4, 0);
        havenGroup.add(crossH);
        havenGroup.add(crossV);
        group.add(havenGroup);
      }

      // Dual Gimbal Orbiting Rings for all nodes
      const ring1Geom = new THREE.TorusGeometry(2.1, 0.04, 12, 40);
      const ring1Mat = new THREE.MeshBasicMaterial({ color: config.color, transparent: true, opacity: 0.65 });
      const ring1 = new THREE.Mesh(ring1Geom, ring1Mat);
      ring1.rotation.x = Math.PI / 2;
      group.add(ring1);

      // Ground Target Disc
      const discGeom = new THREE.RingGeometry(0.8, 1.2, 24);
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
      mid.y += 2.2; // graceful suspension arch

      const curve = new THREE.QuadraticBezierCurve3(p1, mid, p2);
      const points = curve.getPoints(28);
      points.forEach(pt => pipelinePoints.push(pt));

      const tubeGeom = new THREE.TubeGeometry(curve, 28, 0.09, 8, false);
      const tubeMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.4
      });
      const tubeMesh = new THREE.Mesh(tubeGeom, tubeMat);
      scene.add(tubeMesh);
    }

    // 8. Animated High-Speed Data Flow Energy Packets
    const particleCount = 280;
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

      const c = new THREE.Color().setHSL(0.55 + particleProgress[i] * 0.4, 0.9, 0.65);
      particleColors[i * 3] = c.r;
      particleColors[i * 3 + 1] = c.g;
      particleColors[i * 3 + 2] = c.b;
    }

    particleGeom.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeom.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));
    const particleMat = new THREE.PointsMaterial({
      size: 0.36,
      vertexColors: true,
      transparent: true,
      opacity: 0.92,
      blending: THREE.AdditiveBlending
    });

    const particles = new THREE.Points(particleGeom, particleMat);
    scene.add(particles);
    particlesRef.current = particles;

    // 9. Overhead Tactical GPS Satellite with Volumetric Downlink Laser
    const satelliteGroup = new THREE.Group();
    satelliteGroup.position.set(-3, 13, -3.5);

    const satBody = new THREE.Mesh(
      new THREE.BoxGeometry(1.0, 1.0, 1.6),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.2 })
    );
    satelliteGroup.add(satBody);

    // Twin Blue Solar Wings
    [-1.5, 1.5].forEach(offset => {
      const wing = new THREE.Mesh(
        new THREE.BoxGeometry(1.8, 0.06, 0.9),
        new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.7, roughness: 0.2 })
      );
      wing.position.x = offset;
      satelliteGroup.add(wing);
    });

    // Satellite Laser Downlink Beam to Location Station
    const satBeamGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, -7.0, 0)
    ]);
    const satBeamMat = new THREE.LineDashedMaterial({
      color: 0x38bdf8,
      dashSize: 0.5,
      gapSize: 0.2,
      transparent: true,
      opacity: 0.6
    });
    const satBeam = new THREE.Line(satBeamGeom, satBeamMat);
    satBeam.computeLineDistances();
    satelliteGroup.add(satBeam);

    scene.add(satelliteGroup);
    satelliteMeshRef.current = satelliteGroup;

    // 10. Autonomous Tactical Recon Drone Model with Searchlight Cone
    const droneGroup = new THREE.Group();
    droneGroup.position.set(13.5, 5.5, -2);

    const droneCore = new THREE.Mesh(
      new THREE.SphereGeometry(0.45, 16, 16),
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

      const rotor = new THREE.Mesh(
        new THREE.RingGeometry(0.1, 0.35, 12),
        new THREE.MeshBasicMaterial({ color: 0x6ee7b7, transparent: true, opacity: 0.6, side: THREE.DoubleSide })
      );
      rotor.rotation.x = Math.PI / 2;
      rotor.position.set(Math.cos(angle) * 0.85, 0.08, Math.sin(angle) * 0.85);
      droneGroup.add(rotor);
    });

    // Downward Volumetric Recon Searchlight Cone
    const coneGeom = new THREE.ConeGeometry(1.6, 4.0, 16, 1, true);
    const coneMat = new THREE.MeshBasicMaterial({
      color: 0x34d399,
      transparent: true,
      opacity: 0.12,
      side: THREE.DoubleSide
    });
    const searchlightCone = new THREE.Mesh(coneGeom, coneMat);
    searchlightCone.position.y = -2.0;
    droneGroup.add(searchlightCone);

    scene.add(droneGroup);
    droneMeshRef.current = droneGroup;

    // 11. Raycasting for Mouse Interaction
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
        while (rootGroup && rootGroup.userData.index === undefined && rootGroup.parent) {
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
        if (dx < 5 && dy < 5) {
          const rect = container.getBoundingClientRect();
          mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
          mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

          raycaster.setFromCamera(mouse, camera);
          const groups = Array.from(nodeMeshes.values());
          const intersects = raycaster.intersectObjects(groups, true);

          if (intersects.length > 0) {
            let rootGroup = intersects[0].object.parent;
            while (rootGroup && rootGroup.userData.index === undefined && rootGroup.parent) {
              rootGroup = rootGroup.parent;
            }
            if (rootGroup && rootGroup.userData.index !== undefined) {
              jumpToStage(rootGroup.userData.index);
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
      cameraAngle.current.radius = Math.max(10, Math.min(50, cameraAngle.current.radius + e.deltaY * 0.02));
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
        cameraAngle.current.theta += delta * 0.06;
        updateCameraPosition();
      }

      // Rotate ground radar sweep
      if (radarSweepRef.current) {
        radarSweepRef.current.rotation.z += delta * 0.75;
      }

      // Pulse citizen SOS wave ring
      if (citizenPulseRef.current) {
        const s = 1 + (time * 1.5 % 3.0);
        citizenPulseRef.current.scale.set(s, s, s);
        (citizenPulseRef.current.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.8 - (s / 3.0));
      }

      // Rotate Satellite
      if (satelliteMeshRef.current) {
        satelliteMeshRef.current.rotation.y += delta * 0.2;
        satelliteMeshRef.current.position.y = 13 + Math.sin(time * 1.5) * 0.4;
      }

      // Fly Autonomous Recon Drone
      if (droneMeshRef.current) {
        const flightRadius = 4.0;
        droneMeshRef.current.position.x = 13.5 + Math.cos(time * 0.9) * flightRadius;
        droneMeshRef.current.position.z = -2 + Math.sin(time * 0.9) * flightRadius;
        droneMeshRef.current.position.y = 5.2 + Math.sin(time * 2.5) * 0.35;
        droneMeshRef.current.rotation.y = time * 0.9 + Math.PI / 2;
      }

      // Strobe ambulance flashing light
      if (ambulanceMeshRef.current) {
        (ambulanceMeshRef.current.material as THREE.MeshBasicMaterial).color.setHex(
          Math.sin(time * 10) > 0 ? 0xef4444 : 0x3b82f6
        );
      }

      // Animate Nodes & Floating Billboards
      nodeMeshes.forEach((group) => {
        const cfg = group.userData.config as NodeData;
        const isSelected = group.userData.index === selectedNodeIndex;

        // Animate Rings
        const ring = group.children[group.children.length - 2] as THREE.Mesh;
        if (ring) {
          ring.rotation.z += delta * (isSelected ? 1.5 : 0.6);
          ring.scale.setScalar(isSelected ? 1.15 + Math.sin(time * 5) * 0.08 : 1.0);
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
  }, [updateCameraPosition, autoRotate, jumpToStage, selectedNodeIndex]);

  const handleZoom = (direction: 'in' | 'out') => {
    const delta = direction === 'in' ? -3 : 3;
    cameraAngle.current.radius = Math.max(10, Math.min(50, cameraAngle.current.radius + delta));
    updateCameraPosition();
    if (soundEnabled) playSynthTone(700, 'sine', 0.05);
  };

  const handleResetCamera = () => {
    setViewPreset('overview');
  };

  return (
    <div className={`relative bg-slate-950 border border-purple-500/40 rounded-2xl overflow-hidden shadow-2xl flex flex-col ${className}`}>
      
      {/* Top Judges' Architecture Banner & Controls */}
      <div className="bg-slate-900/95 backdrop-blur-md px-4 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-950">
            <Cpu className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-black text-white tracking-wide">
                DISASTERFOG AI — END-TO-END 3D SYSTEM ARCHITECTURE
              </h3>
              <span className="text-[10px] bg-emerald-600 text-white font-mono px-2 py-0.5 rounded font-black uppercase shadow">
                IIT GHY EVALUATION READY
              </span>
            </div>
            <p className="text-[11px] text-slate-300 font-mono mt-0.5">
              Live Stage {selectedNodeIndex + 1}/7: <span className="text-purple-400 font-bold uppercase">{selectedNode.stageName}</span> — <span className="text-slate-400">{selectedNode.name}</span>
            </p>
          </div>
        </div>

        {/* Guided Jury Tour & Simulation Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          
          {/* Judges' Guided Tour Button */}
          <button
            onClick={() => {
              const nextState = !isJudgeTourActive;
              setIsJudgeTourActive(nextState);
              setIsPlaying(false);
              if (soundEnabled) playSynthTone(nextState ? 780 : 380, 'triangle', 0.12);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-lg ${
              isJudgeTourActive
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white ring-2 ring-emerald-400 animate-pulse'
                : 'bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white'
            }`}
          >
            <Award className="w-3.5 h-3.5 fill-current" />
            <span>{isJudgeTourActive ? 'JURY TOUR ACTIVE (AUTO-STEP)' : 'START JUDGE ARCHITECTURE TOUR'}</span>
          </button>

          {/* Stepper Navigation (< / >) */}
          <div className="flex items-center gap-1 bg-slate-800 p-0.5 rounded-lg border border-slate-700">
            <button
              onClick={() => {
                const prev = (selectedNodeIndex - 1 + NODES_CONFIG.length) % NODES_CONFIG.length;
                jumpToStage(prev);
              }}
              className="p-1 text-slate-300 hover:text-white hover:bg-slate-700 rounded transition-colors"
              title="Previous Stage"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-[11px] font-mono px-2 font-bold text-purple-300">
              {selectedNodeIndex + 1}/{NODES_CONFIG.length}
            </span>
            <button
              onClick={() => {
                const next = (selectedNodeIndex + 1) % NODES_CONFIG.length;
                jumpToStage(next);
              }}
              className="p-1 text-slate-300 hover:text-white hover:bg-slate-700 rounded transition-colors"
              title="Next Stage"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="h-4 w-px bg-slate-700 mx-1 hidden sm:block"></div>

          {/* Camera Preset Quick Jumps */}
          <button
            onClick={() => setViewPreset('overview')}
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors"
          >
            Overview
          </button>

          {/* Cinematic 360 Toggle */}
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className={`p-1.5 rounded transition-colors ${
              autoRotate ? 'bg-purple-600/40 text-purple-300 border border-purple-500/50' : 'bg-slate-800 text-slate-400'
            }`}
            title={autoRotate ? 'Pause 360° Cam' : 'Enable 360° Cam'}
          >
            <Video className="w-3.5 h-3.5" />
          </button>

          {/* Sound FX Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1.5 rounded bg-slate-800 text-slate-300 hover:text-white transition-colors"
            title={soundEnabled ? 'Mute Audio' : 'Unmute Audio'}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-cyan-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
          </button>

          {/* Zoom & Reset */}
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

      {/* Prominent High-Impact Judges' Concept Pitch Bar (Center Top) */}
      <div className="bg-gradient-to-r from-purple-950/90 via-slate-900/95 to-slate-950/90 border-b border-purple-500/30 px-4 py-2.5 flex items-center justify-between gap-3 text-xs z-10">
        <div className="flex items-center gap-2.5">
          <span className="bg-purple-600 text-white font-mono text-[10px] font-black px-2 py-0.5 rounded tracking-wider uppercase shrink-0 shadow">
            {selectedNode.shortTag}
          </span>
          <p className="text-slate-100 font-semibold text-xs sm:text-sm tracking-wide">
            {selectedNode.judgePitch}
          </p>
        </div>
        <div className="hidden md:flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span>Live Digital Twin Active</span>
        </div>
      </div>

      {/* 3D Canvas Mount or WebGL Fallback */}
      <div className="relative flex-1 min-h-[460px] sm:min-h-[600px] bg-slate-950 flex items-center justify-center">
        {webglSupported ? (
          <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing select-none" />
        ) : (
          /* WebGL Fallback */
          <div className="p-8 text-center max-w-md space-y-4">
            <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto" />
            <h4 className="text-base font-bold text-white">3D Hardware Acceleration Unavailable</h4>
            <p className="text-xs text-slate-400">
              WebGL is disabled or unsupported on this device.
            </p>
          </div>
        )}

        {/* Floating Telemetry HUD Drawer for Selected Node (Left) */}
        {selectedNode && (
          <div className="absolute top-4 left-4 z-10 max-w-xs sm:max-w-sm w-full bg-slate-900/90 backdrop-blur-md p-4 rounded-xl border border-purple-500/50 shadow-2xl text-xs space-y-3 pointer-events-auto">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-purple-400 font-black uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping"></span>
                <span>{selectedNode.stageName}</span>
              </span>
              <span className="text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded font-mono font-bold">
                OPERATIONAL
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

        {/* Orbit Helper Tip & Active Status (Right) */}
        <div className="absolute top-4 right-4 z-10 pointer-events-none hidden sm:flex flex-col items-end gap-2">
          <div className="flex items-center gap-1.5 text-[10px] text-slate-300 bg-slate-900/80 backdrop-blur-sm px-3 py-1 rounded-full border border-slate-800 font-mono shadow">
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            <span>Click & Drag to Orbit | Scroll to Zoom | Click Station to Inspect</span>
          </div>
          <div className="flex items-center gap-2 text-[9px] font-mono text-slate-400 bg-slate-950/80 px-2.5 py-0.5 rounded border border-slate-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>UAV Drone Searchlight: Active Scan</span>
          </div>
        </div>
      </div>

      {/* Bottom Architectural Flowchart Stepper - Judge Interactive Flow */}
      <div className="bg-slate-900/95 px-4 py-3 border-t border-slate-800 overflow-x-auto">
        <div className="flex items-center justify-between gap-2 min-w-[850px] text-[10px] font-mono">
          {NODES_CONFIG.map((node, index) => {
            const isCurrent = selectedNodeIndex === index;
            return (
              <button
                key={node.id}
                onClick={() => jumpToStage(index)}
                className={`flex-1 py-2.5 px-2 rounded-xl font-bold text-center transition-all flex flex-col items-center gap-1 ${
                  isCurrent
                    ? 'bg-gradient-to-b from-purple-600 to-indigo-700 text-white shadow-xl shadow-purple-950 ring-2 ring-purple-400 scale-[1.03]'
                    : 'bg-slate-950 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800/80'
                }`}
              >
                <span className="text-[9px] opacity-75 font-semibold">STAGE {index + 1}</span>
                <span className="truncate max-w-[110px] font-black">{node.stageName.split('. ')[1] || node.stageName}</span>
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
};
