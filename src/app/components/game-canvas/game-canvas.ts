import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  ViewChild,
  inject,
} from '@angular/core';
import {isPlatformBrowser} from '@angular/common';
import * as THREE from 'three';
import {GameStateService} from '../../services/game-state.service';
import {GameAudioService} from '../../services/game-audio.service';

@Component({
  selector: 'app-game-canvas',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative w-full h-full overflow-hidden select-none bg-[#050807]">
      <canvas #renderCanvas class="w-full h-full block cursor-crosshair"></canvas>

      <!-- Screen Vignette & Heat Wave Effect Overlay -->
      <div
        class="absolute inset-0 pointer-events-none transition-opacity duration-700"
        [class.scanlines]="gameState.graphics().postProcessing"
        [style.box-shadow]="'inset 0 0 100px rgba(0,0,0,0.6)'"
      ></div>

      <!-- Police Flash Overlay when Heat is High (4-5 stars) -->
      @if (gameState.heatStars() >= 4) {
        <div class="absolute inset-0 pointer-events-none animate-pulse bg-red-600/10 mix-blend-screen"></div>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
        height: 100%;
        position: relative;
      }
    `,
  ],
})
export class GameCanvas implements OnInit, OnDestroy {
  @ViewChild('renderCanvas', {static: true}) canvasRef!: ElementRef<HTMLCanvasElement>;

  gameState = inject(GameStateService);
  audio = inject(GameAudioService);
  private platformId = inject(PLATFORM_ID);

  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private animFrameId: number | null = null;
  private lastTime = 0;
  private frameCount = 0;
  private fpsTimer = 0;

  // Scene Objects
  private characterGroup!: THREE.Group;
  private charBodyMesh!: THREE.Mesh;
  private charHeadMesh!: THREE.Mesh;
  private charHatMesh!: THREE.Mesh;
  private charGlassesMesh!: THREE.Mesh;
  private charLeftLeg!: THREE.Mesh;
  private charRightLeg!: THREE.Mesh;
  private charLeftArm!: THREE.Mesh;
  private charRightArm!: THREE.Mesh;

  private aztekVehicleGroup!: THREE.Group;
  private rvVehicleGroup!: THREE.Group;
  private policeCarGroup!: THREE.Group;
  private policeLightMesh!: THREE.Mesh;

  private sunLight!: THREE.DirectionalLight;
  private ambientLight!: THREE.AmbientLight;

  // Camera Orbit controls & GTA Mouse-Look
  private cameraYaw = 0;
  private cameraPitch = 0.35;
  private cameraDist = 8.5;
  private isMouseDown = false;
  private prevMouseX = 0;
  private prevMouseY = 0;
  isPointerLocked = false;

  // In-world animated markers & NPCs
  private animatedMarkers: THREE.Mesh[] = [];
  private npcs: { group: THREE.Group; id: string; initialY: number }[] = [];

  // Movement inputs
  private keys: Record<string, boolean> = {};
  private walkAnimPhase = 0;

  ngOnInit() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    this.initThree();
    this.buildWorld();
    this.setupInputs();
    this.startRenderLoop();
  }

  ngOnDestroy() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
    }
    this.removeInputs();
    this.renderer?.dispose();
  }

  private initThree() {
    const canvas = this.canvasRef.nativeElement;
    const width = canvas.clientWidth || window.innerWidth;
    const height = canvas.clientHeight || window.innerHeight;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xd4a373); // New Mexico desert sky tone
    this.scene.fog = new THREE.FogExp2(0xd4a373, 0.0035);

    this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1200);
    this.camera.position.set(-110, 10, -55);

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: this.gameState.graphics().textureQuality !== 'low',
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(
      Math.min(window.devicePixelRatio || 1, this.gameState.graphics().resolutionScale)
    );
    this.renderer.shadowMap.enabled = this.gameState.graphics().shadows;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Lights
    this.ambientLight = new THREE.AmbientLight(0xffeedd, 0.7);
    this.scene.add(this.ambientLight);

    this.sunLight = new THREE.DirectionalLight(0xfff3d6, 1.4);
    this.sunLight.position.set(120, 220, 100);
    this.sunLight.castShadow = this.gameState.graphics().shadows;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 600;
    const d = 250;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.scene.add(this.sunLight);
  }

  private buildWorld() {
    // 1. Terrain: Desert Sand on one side, City Grid on the other
    const groundGeo = new THREE.PlaneGeometry(1200, 1200, 64, 64);
    const posAttr = groundGeo.attributes['position'];
    for (let i = 0; i < posAttr.count; i++) {
      const vx = posAttr.getX(i);
      const vz = posAttr.getY(i); // In PlaneGeometry Y maps to Z before rotation
      if (vx < 0 && vz < 0) {
        // Desert Dunes undulating height
        const h = Math.sin(vx * 0.03) * 3.5 + Math.cos(vz * 0.02) * 4.0;
        posAttr.setZ(i, h);
      }
    }
    groundGeo.computeVertexNormals();

    const groundMat = new THREE.MeshStandardMaterial({
      color: 0xc89b6c,
      roughness: 0.9,
      metalness: 0.1,
    });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.receiveShadow = true;
    this.scene.add(groundMesh);

    // City Asphalt Roads & Grid
    this.createRoads();

    // 2. Character Model
    this.createCharacter();

    // 3. Vehicles
    this.createPontiacAztek();
    this.createFleetwoodRV();
    this.createPoliceCar();

    // 4. Landmarks & Interactive Environments
    this.createWhiteHouse();
    this.createSecretLab();
    this.createNPCCharacters();
    this.createLosPollosHermanos();
    this.createSaulGoodmanOffice();
    this.createCarwashA1A();
    this.createIndustrialSuperlab();
    this.createMadrigalWarehouse();
    this.createToHajiileeDesertProps();
  }

  private createRoads() {
    const roadMat = new THREE.MeshStandardMaterial({color: 0x242426, roughness: 0.8});
    const lineMat = new THREE.MeshBasicMaterial({color: 0xfacc15});

    // Main Highway connecting City to Desert
    const hwGeo = new THREE.BoxGeometry(16, 0.08, 900);
    const hwMesh = new THREE.Mesh(hwGeo, roadMat);
    hwMesh.position.set(0, 0.04, 0);
    hwMesh.receiveShadow = true;
    this.scene.add(hwMesh);

    // Highway divider line
    const hwLineGeo = new THREE.BoxGeometry(0.5, 0.1, 900);
    const hwLineMesh = new THREE.Mesh(hwLineGeo, lineMat);
    hwLineMesh.position.set(0, 0.06, 0);
    this.scene.add(hwLineMesh);

    // Cross city avenues
    [-80, 0, 80, 160].forEach((zPos) => {
      const crossRoad = new THREE.Mesh(new THREE.BoxGeometry(500, 0.08, 14), roadMat);
      crossRoad.position.set(120, 0.04, zPos);
      crossRoad.receiveShadow = true;
      this.scene.add(crossRoad);
    });
  }

  private createCharacter() {
    this.characterGroup = new THREE.Group();
    this.characterGroup.position.set(this.gameState.playerPos().x, 0, this.gameState.playerPos().z);

    // Dark trench coat / jacket body
    const bodyGeo = new THREE.BoxGeometry(0.85, 1.2, 0.5);
    const bodyMat = new THREE.MeshStandardMaterial({color: 0x1f2937, roughness: 0.7});
    this.charBodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    this.charBodyMesh.position.y = 1.35;
    this.charBodyMesh.castShadow = true;
    this.characterGroup.add(this.charBodyMesh);

    // Head
    const headGeo = new THREE.BoxGeometry(0.5, 0.52, 0.5);
    const headMat = new THREE.MeshStandardMaterial({color: 0xd4a373, roughness: 0.6});
    this.charHeadMesh = new THREE.Mesh(headGeo, headMat);
    this.charHeadMesh.position.y = 2.15;
    this.charHeadMesh.castShadow = true;
    this.characterGroup.add(this.charHeadMesh);

    // Heisenberg Fedora / Pork Pie Hat
    const hatGroup = new THREE.Group();
    const brimGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.05, 16);
    const crownGeo = new THREE.CylinderGeometry(0.35, 0.38, 0.32, 16);
    const hatMat = new THREE.MeshStandardMaterial({color: 0x09090b, roughness: 0.8});
    const brim = new THREE.Mesh(brimGeo, hatMat);
    const crown = new THREE.Mesh(crownGeo, hatMat);
    crown.position.y = 0.18;
    hatGroup.add(brim, crown);
    hatGroup.position.y = 2.45;
    this.charHatMesh = brim;
    this.characterGroup.add(hatGroup);

    // Sunglasses
    const glassesGeo = new THREE.BoxGeometry(0.42, 0.12, 0.08);
    const glassesMat = new THREE.MeshStandardMaterial({color: 0x020617, roughness: 0.2});
    this.charGlassesMesh = new THREE.Mesh(glassesGeo, glassesMat);
    this.charGlassesMesh.position.set(0, 2.18, 0.27);
    this.characterGroup.add(this.charGlassesMesh);

    // Limbs
    const legMat = new THREE.MeshStandardMaterial({color: 0x18181b, roughness: 0.8});
    const legGeo = new THREE.BoxGeometry(0.32, 0.9, 0.35);

    this.charLeftLeg = new THREE.Mesh(legGeo, legMat);
    this.charLeftLeg.position.set(-0.24, 0.45, 0);
    this.charLeftLeg.castShadow = true;

    this.charRightLeg = new THREE.Mesh(legGeo, legMat);
    this.charRightLeg.position.set(0.24, 0.45, 0);
    this.charRightLeg.castShadow = true;

    this.characterGroup.add(this.charLeftLeg, this.charRightLeg);

    const armMat = new THREE.MeshStandardMaterial({color: 0x1f2937, roughness: 0.7});
    const armGeo = new THREE.BoxGeometry(0.25, 0.9, 0.28);

    this.charLeftArm = new THREE.Mesh(armGeo, armMat);
    this.charLeftArm.position.set(-0.58, 1.3, 0);
    this.charLeftArm.castShadow = true;

    this.charRightArm = new THREE.Mesh(armGeo, armMat);
    this.charRightArm.position.set(0.58, 1.3, 0);
    this.charRightArm.castShadow = true;

    this.characterGroup.add(this.charLeftArm, this.charRightArm);

    this.scene.add(this.characterGroup);
  }

  private createPontiacAztek() {
    this.aztekVehicleGroup = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({color: 0x65a30d, roughness: 0.5}); // Aztec green/sage
    const glassMat = new THREE.MeshStandardMaterial({color: 0x1e293b, roughness: 0.1});
    const wheelMat = new THREE.MeshStandardMaterial({color: 0x111827, roughness: 0.9});

    // Lower Chassis
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.9, 4.6), bodyMat);
    chassis.position.y = 0.75;
    chassis.castShadow = true;
    this.aztekVehicleGroup.add(chassis);

    // Cabin / Roof
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.85, 2.6), glassMat);
    cabin.position.set(0, 1.5, -0.2);
    cabin.castShadow = true;
    this.aztekVehicleGroup.add(cabin);

    // Wheels
    const wheelGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.35, 16);
    wheelGeo.rotateZ(Math.PI / 2);
    [
      [-1.25, 0.45, 1.4],
      [1.25, 0.45, 1.4],
      [-1.25, 0.45, -1.4],
      [1.25, 0.45, -1.4],
    ].forEach(([wx, wy, wz]) => {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.position.set(wx, wy, wz);
      wheel.castShadow = true;
      this.aztekVehicleGroup.add(wheel);
    });

    // Position in driveway of White residence
    this.aztekVehicleGroup.position.set(-118, 0, -62);
    this.aztekVehicleGroup.rotation.y = Math.PI * 0.15;
    this.scene.add(this.aztekVehicleGroup);
  }

  private createFleetwoodRV() {
    this.rvVehicleGroup = new THREE.Group();
    const rvBodyMat = new THREE.MeshStandardMaterial({color: 0xfef08a, roughness: 0.7}); // Dirty beige
    const stripeMat = new THREE.MeshStandardMaterial({color: 0xc2410c, roughness: 0.6}); // Orange/brown stripes
    const wheelMat = new THREE.MeshStandardMaterial({color: 0x111827, roughness: 0.9});

    // Main RV Box
    const body = new THREE.Mesh(new THREE.BoxGeometry(3.0, 2.7, 8.2), rvBodyMat);
    body.position.y = 1.9;
    body.castShadow = true;
    this.rvVehicleGroup.add(body);

    // Orange side stripe
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(3.05, 0.4, 8.2), stripeMat);
    stripe.position.y = 1.6;
    this.rvVehicleGroup.add(stripe);

    // Taped bullet holes on door (Easter egg detail)
    const tapeMat = new THREE.MeshBasicMaterial({color: 0x71717a});
    [
      [1.53, 1.8, 1.2],
      [1.53, 1.95, 1.3],
      [1.53, 1.7, 1.4],
      [1.53, 2.05, 1.15],
    ].forEach(([tx, ty, tz]) => {
      const tape = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.08, 0.15), tapeMat);
      tape.position.set(tx, ty, tz);
      this.rvVehicleGroup.add(tape);
    });

    // Chimney with steam/smoke from cook
    const chimney = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.8), new THREE.MeshStandardMaterial({color: 0x475569}));
    chimney.position.set(-0.8, 3.5, -2.0);
    this.rvVehicleGroup.add(chimney);

    // Wheels (6 wheels for RV)
    const wheelGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.4, 16);
    wheelGeo.rotateZ(Math.PI / 2);
    [
      [-1.55, 0.55, 2.8],
      [1.55, 0.55, 2.8],
      [-1.55, 0.55, -1.8],
      [1.55, 0.55, -1.8],
      [-1.55, 0.55, -2.9],
      [1.55, 0.55, -2.9],
    ].forEach(([wx, wy, wz]) => {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.position.set(wx, wy, wz);
      wheel.castShadow = true;
      this.rvVehicleGroup.add(wheel);
    });

    this.rvVehicleGroup.position.set(-52, 0, -48);
    this.rvVehicleGroup.rotation.y = -Math.PI * 0.25;
    this.scene.add(this.rvVehicleGroup);
  }

  private createPoliceCar() {
    this.policeCarGroup = new THREE.Group();
    const whiteMat = new THREE.MeshStandardMaterial({color: 0xffffff, roughness: 0.4});
    const blackMat = new THREE.MeshStandardMaterial({color: 0x09090b, roughness: 0.5});

    const body = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.85, 4.8), whiteMat);
    body.position.y = 0.7;
    body.castShadow = true;
    this.policeCarGroup.add(body);

    const doors = new THREE.Mesh(new THREE.BoxGeometry(2.32, 0.86, 2.2), blackMat);
    doors.position.set(0, 0.7, 0);
    this.policeCarGroup.add(doors);

    // Roof Lightbar (Red/Blue Siren)
    const sirenBar = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 0.18, 0.4),
      new THREE.MeshStandardMaterial({color: 0x38bdf8, roughness: 0.1, emissive: 0x0284c7, emissiveIntensity: 0.8})
    );
    sirenBar.position.set(0, 1.8, -0.2);
    this.policeLightMesh = sirenBar;
    this.policeCarGroup.add(sirenBar);

    this.policeCarGroup.position.set(100, 0, 20);
    this.scene.add(this.policeCarGroup);
  }

  private createWhiteHouse() {
    const houseGroup = new THREE.Group();
    const brickMat = new THREE.MeshStandardMaterial({color: 0x9a3412, roughness: 0.8}); // Adobe brown/brick
    const interiorWallMat = new THREE.MeshStandardMaterial({color: 0xfef3c7, roughness: 0.9}); // Warm interior wall
    const roofMat = new THREE.MeshStandardMaterial({color: 0x78350f, roughness: 0.9}); // Terracotta shingles
    const lawnMat = new THREE.MeshStandardMaterial({color: 0x4d7c0f, roughness: 0.9});
    const poolMat = new THREE.MeshStandardMaterial({color: 0x0284c7, roughness: 0.1, metalness: 0.3});
    const floorMat = new THREE.MeshStandardMaterial({color: 0xb45309, roughness: 0.6}); // Polished hardwood floor
    const woodMat = new THREE.MeshStandardMaterial({color: 0x451a03, roughness: 0.7});
    const sofaMat = new THREE.MeshStandardMaterial({color: 0x78716c, roughness: 0.9});
    const rugMat = new THREE.MeshStandardMaterial({color: 0x991b1b, roughness: 0.9});

    // Suburban Lawn
    const lawn = new THREE.Mesh(new THREE.BoxGeometry(40, 0.1, 46), lawnMat);
    lawn.position.set(0, 0.05, 0);
    lawn.receiveShadow = true;
    houseGroup.add(lawn);

    // Front Porch with Steps leading into open doorway
    const porch = new THREE.Mesh(new THREE.BoxGeometry(8, 0.25, 4), new THREE.MeshStandardMaterial({color: 0xcbd5e1}));
    porch.position.set(0, 0.12, 11);
    porch.receiveShadow = true;
    houseGroup.add(porch);

    // Interior Hardwood Floor
    const floor = new THREE.Mesh(new THREE.BoxGeometry(21.6, 0.2, 19.6), floorMat);
    floor.position.set(0, 0.1, 0);
    floor.receiveShadow = true;
    houseGroup.add(floor);

    // --- OUTER WALLS with open doorway at South (Z: +9.8) ---
    // North Back Wall
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(22, 4.8, 0.5), brickMat);
    backWall.position.set(0, 2.4, -9.8);
    backWall.castShadow = true;
    backWall.receiveShadow = true;
    houseGroup.add(backWall);

    // West Side Wall
    const westWall = new THREE.Mesh(new THREE.BoxGeometry(0.5, 4.8, 20), brickMat);
    westWall.position.set(-10.8, 2.4, 0);
    westWall.castShadow = true;
    westWall.receiveShadow = true;
    houseGroup.add(westWall);

    // East Side Wall
    const eastWall = new THREE.Mesh(new THREE.BoxGeometry(0.5, 4.8, 20), brickMat);
    eastWall.position.set(10.8, 2.4, 0);
    eastWall.castShadow = true;
    eastWall.receiveShadow = true;
    houseGroup.add(eastWall);

    // South Front Wall: Left wing, Right wing, and Top Door Lintel (3.2m open doorway in center)
    const frontLeft = new THREE.Mesh(new THREE.BoxGeometry(9.4, 4.8, 0.5), brickMat);
    frontLeft.position.set(-6.3, 2.4, 9.8);
    frontLeft.castShadow = true;
    frontLeft.receiveShadow = true;

    const frontRight = new THREE.Mesh(new THREE.BoxGeometry(9.4, 4.8, 0.5), brickMat);
    frontRight.position.set(6.3, 2.4, 9.8);
    frontRight.castShadow = true;
    frontRight.receiveShadow = true;

    const doorLintel = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.4, 0.5), brickMat);
    doorLintel.position.set(0, 4.1, 9.8);
    doorLintel.castShadow = true;
    houseGroup.add(frontLeft, frontRight, doorLintel);

    // --- INTERIOR ROOM PARTITIONS ---
    const centerWall = new THREE.Mesh(new THREE.BoxGeometry(0.3, 4.8, 12), interiorWallMat);
    centerWall.position.set(0, 2.4, -3.8);
    centerWall.castShadow = true;
    houseGroup.add(centerWall);

    // --- LIVING ROOM FURNITURE (Left / West Side) ---
    // Sectional Sofa
    const sofa = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.85, 1.8), sofaMat);
    sofa.position.set(-5.5, 0.5, 2.0);
    sofa.castShadow = true;
    houseGroup.add(sofa);

    const sofaSide = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.85, 2.6), sofaMat);
    sofaSide.position.set(-7.4, 0.5, 0.2);
    sofaSide.castShadow = true;
    houseGroup.add(sofaSide);

    // Warm Rug
    const rug = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.02, 4.2), rugMat);
    rug.position.set(-5.2, 0.21, 0.2);
    rug.receiveShadow = true;
    houseGroup.add(rug);

    // Wooden Coffee Table
    const table = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.45, 1.3), woodMat);
    table.position.set(-5.2, 0.42, 0.2);
    table.castShadow = true;
    houseGroup.add(table);

    // Walter's Ceramic Mug & Newspaper on table
    const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.16, 8), new THREE.MeshStandardMaterial({color: 0xffffff}));
    mug.position.set(-5.0, 0.72, 0.2);
    houseGroup.add(mug);

    // Living Room Bookshelf & Chemistry Awards
    const bookcase = new THREE.Mesh(new THREE.BoxGeometry(0.6, 3.2, 3.0), woodMat);
    bookcase.position.set(-10.2, 1.7, -4.5);
    bookcase.castShadow = true;
    houseGroup.add(bookcase);

    // TV Credenza & CRT Television
    const tvStand = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.7, 0.8), woodMat);
    tvStand.position.set(-5.2, 0.45, -3.5);
    const tvScreen = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.1, 0.4), new THREE.MeshStandardMaterial({color: 0x09090b, roughness: 0.2}));
    tvScreen.position.set(-5.2, 1.35, -3.5);
    houseGroup.add(tvStand, tvScreen);

    // Fireplace & Chimney
    const fireplace = new THREE.Mesh(new THREE.BoxGeometry(0.8, 2.2, 2.8), brickMat);
    fireplace.position.set(-10.2, 1.2, 2.0);
    houseGroup.add(fireplace);

    // --- KITCHEN & DINING (Right / East Side) ---
    // Kitchen Counter Island with Sink
    const counter = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.0, 5.5), new THREE.MeshStandardMaterial({color: 0xe2e8f0, roughness: 0.3}));
    counter.position.set(5.0, 0.6, -2.5);
    counter.castShadow = true;
    houseGroup.add(counter);

    // Refrigerator
    const fridge = new THREE.Mesh(new THREE.BoxGeometry(1.3, 2.4, 1.2), new THREE.MeshStandardMaterial({color: 0x94a3b8, metalness: 0.6, roughness: 0.3}));
    fridge.position.set(9.8, 1.3, -8.8);
    fridge.castShadow = true;
    houseGroup.add(fridge);

    // Dining Table with Chairs
    const diningTable = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.85, 1.8), woodMat);
    diningTable.position.set(5.5, 0.52, 4.0);
    diningTable.castShadow = true;
    houseGroup.add(diningTable);

    // --- SECRET CRAWLSPACE HATCH & AIR VENT ---
    const hatch = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.05, 1.8), new THREE.MeshStandardMaterial({color: 0x292524}));
    hatch.position.set(0, 0.22, -6.5);
    houseGroup.add(hatch);

    const cashGreen = new THREE.MeshStandardMaterial({color: 0x16a34a, roughness: 0.7});
    const cashPack = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.12, 0.4), cashGreen);
    cashPack.position.set(0.3, 0.26, -6.5);
    houseGroup.add(cashPack);

    const vent = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.45, 0.06), new THREE.MeshStandardMaterial({color: 0x64748b, metalness: 0.7}));
    vent.position.set(0, 0.35, -9.5);
    houseGroup.add(vent);

    // Warm Interior Point Light
    const warmLight = new THREE.PointLight(0xfef3c7, 1.6, 22);
    warmLight.position.set(-2, 3.8, 0);
    houseGroup.add(warmLight);

    // Roof: Pitched Roof elevated with skylight opening so interior is easily visible and playable
    const roof = new THREE.Mesh(new THREE.BoxGeometry(23, 0.4, 21), roofMat);
    roof.position.set(0, 4.9, 0);
    roof.castShadow = true;
    houseGroup.add(roof);

    // Iconic Pizza on the Roof! (Breaking Bad Easter Egg)
    const pizzaGeo = new THREE.CylinderGeometry(1.4, 1.4, 0.12, 16);
    const pizzaMat = new THREE.MeshStandardMaterial({color: 0xea580c, roughness: 0.6});
    const pizza = new THREE.Mesh(pizzaGeo, pizzaMat);
    pizza.position.set(-3.5, 5.15, 4.0);
    pizza.rotation.x = 0.45;
    houseGroup.add(pizza);

    // Swimming Pool in backyard
    const pool = new THREE.Mesh(new THREE.BoxGeometry(8, 0.2, 12), poolMat);
    pool.position.set(13, 0.08, -3);
    houseGroup.add(pool);

    houseGroup.position.set(-110, 0, -70);
    this.scene.add(houseGroup);
  }

  private createSecretLab() {
    const labGroup = new THREE.Group();
    const cinderMat = new THREE.MeshStandardMaterial({color: 0x334155, roughness: 0.8});
    const metalMat = new THREE.MeshStandardMaterial({color: 0x475569, metalness: 0.6, roughness: 0.4});
    const epoxyFloorMat = new THREE.MeshStandardMaterial({color: 0x0f172a, roughness: 0.2, metalness: 0.3});
    const hazardMat = new THREE.MeshStandardMaterial({color: 0xeab308, roughness: 0.5});
    const deskMat = new THREE.MeshStandardMaterial({color: 0x3f2e21, roughness: 0.6});
    const safeMat = new THREE.MeshStandardMaterial({color: 0x14532d, metalness: 0.7, roughness: 0.3});

    // Floor
    const floor = new THREE.Mesh(new THREE.BoxGeometry(20, 0.2, 16), epoxyFloorMat);
    floor.position.set(0, 0.1, 0);
    floor.receiveShadow = true;
    labGroup.add(floor);

    // North Back Wall
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(20, 5, 0.5), cinderMat);
    backWall.position.set(0, 2.5, -8);
    backWall.castShadow = true;
    labGroup.add(backWall);

    // West Side Wall
    const westWall = new THREE.Mesh(new THREE.BoxGeometry(0.5, 5, 16), cinderMat);
    westWall.position.set(-10, 2.5, 0);
    westWall.castShadow = true;
    labGroup.add(westWall);

    // East Side Wall
    const eastWall = new THREE.Mesh(new THREE.BoxGeometry(0.5, 5, 16), cinderMat);
    eastWall.position.set(10, 2.5, 0);
    eastWall.castShadow = true;
    labGroup.add(eastWall);

    // South Front Wall with wide 6-meter Roll-up Bay Door
    const frontLeft = new THREE.Mesh(new THREE.BoxGeometry(7, 5, 0.5), cinderMat);
    frontLeft.position.set(-6.5, 2.5, 8);
    const frontRight = new THREE.Mesh(new THREE.BoxGeometry(7, 5, 0.5), cinderMat);
    frontRight.position.set(6.5, 2.5, 8);
    const doorTop = new THREE.Mesh(new THREE.BoxGeometry(6, 1.2, 0.5), metalMat);
    doorTop.position.set(0, 4.4, 8);
    labGroup.add(frontLeft, frontRight, doorTop);

    // Yellow Caution Threshold
    const hazardThreshold = new THREE.Mesh(new THREE.BoxGeometry(6, 0.05, 0.8), hazardMat);
    hazardThreshold.position.set(0, 0.22, 8);
    labGroup.add(hazardThreshold);

    // Industrial Roof & Ventilation
    const roof = new THREE.Mesh(new THREE.BoxGeometry(20.4, 0.3, 16.4), metalMat);
    roof.position.set(0, 5.1, 0);
    labGroup.add(roof);

    const ventPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 2.4, 16), metalMat);
    ventPipe.position.set(-4, 6.2, -3);
    labGroup.add(ventPipe);

    // Fluorescent Laboratory Lighting
    const neonCyan = new THREE.PointLight(0x06b6d4, 2.0, 20);
    neonCyan.position.set(-4.5, 4.2, -3.5);
    const neonGreen = new THREE.PointLight(0x2ecc71, 1.8, 20);
    neonGreen.position.set(4.5, 4.2, 0);
    labGroup.add(neonCyan, neonGreen);

    // 1. CHEMISTRY SYNTHESIS APPARATUS (دستگاه پخت)
    const chemBench = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.0, 2.2), new THREE.MeshStandardMaterial({color: 0x94a3b8, metalness: 0.8, roughness: 0.2}));
    chemBench.position.set(-4.5, 0.5, -3.5);
    chemBench.castShadow = true;
    labGroup.add(chemBench);

    const mantle = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.75, 0.5, 16), new THREE.MeshStandardMaterial({color: 0xea580c, emissive: 0xc2410c, emissiveIntensity: 0.8}));
    mantle.position.set(-4.8, 1.25, -3.5);
    labGroup.add(mantle);

    const flask = new THREE.Mesh(new THREE.SphereGeometry(0.55, 16, 16), new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.9,
      transparent: true,
      opacity: 0.85,
    }));
    flask.position.set(-4.8, 1.7, -3.5);
    labGroup.add(flask);

    const condenser = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 1.6, 12), new THREE.MeshStandardMaterial({color: 0xe0f2fe, roughness: 0.1, transparent: true, opacity: 0.7}));
    condenser.position.set(-3.8, 2.2, -3.5);
    condenser.rotation.z = 0.3;
    labGroup.add(condenser);

    const crystalTray = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.08, 0.8), new THREE.MeshStandardMaterial({color: 0xffffff, transparent: true, opacity: 0.8}));
    crystalTray.position.set(-3.4, 1.05, -3.0);
    const blueCrystals = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.12, 0.7), new THREE.MeshStandardMaterial({color: 0x00f5ff, emissive: 0x0284c7, emissiveIntensity: 0.7}));
    blueCrystals.position.set(-3.4, 1.12, -3.0);
    labGroup.add(crystalTray, blueCrystals);

    // 3D Floating Glowing Indicator for Cook Station
    const cookMarker = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.4, 0),
      new THREE.MeshStandardMaterial({color: 0x00f5ff, emissive: 0x0284c7, emissiveIntensity: 1.4})
    );
    cookMarker.position.set(-4.5, 3.2, -3.5);
    this.animatedMarkers.push(cookMarker);
    labGroup.add(cookMarker);

    // 2. LAUNDERING DESK & VAULT SAFE (میز پول‌شویی)
    const desk = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.9, 1.8), deskMat);
    desk.position.set(4.5, 0.45, 1.5);
    desk.castShadow = true;
    labGroup.add(desk);

    const pcBase = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 0.7), new THREE.MeshStandardMaterial({color: 0xe2e8f0, roughness: 0.5}));
    pcBase.position.set(3.8, 1.2, 1.5);
    const pcScreen = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.5, 0.05), new THREE.MeshStandardMaterial({color: 0x22c55e, emissive: 0x15803d, emissiveIntensity: 0.9}));
    pcScreen.position.set(3.8, 1.2, 1.86);
    labGroup.add(pcBase, pcScreen);

    const lampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.05, 8), new THREE.MeshStandardMaterial({color: 0xd97706, metalness: 0.8}));
    lampBase.position.set(5.5, 0.92, 1.3);
    const lampShade = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.15, 0.2), new THREE.MeshStandardMaterial({color: 0x16a34a, emissive: 0x15803d, emissiveIntensity: 0.8}));
    lampShade.position.set(5.5, 1.2, 1.3);
    labGroup.add(lampBase, lampShade);

    const cashMat = new THREE.MeshStandardMaterial({color: 0x16a34a, roughness: 0.8});
    for (let b = 0; b < 6; b++) {
      const stack = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.15, 0.25), cashMat);
      stack.position.set(4.6 + (b % 2) * 0.45, 0.98 + Math.floor(b / 2) * 0.16, 1.6);
      labGroup.add(stack);
    }

    const safe = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.0, 1.4), safeMat);
    safe.position.set(4.5, 1.0, -1.0);
    safe.castShadow = true;
    const safeDial = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.1, 16), new THREE.MeshStandardMaterial({color: 0xe2e8f0, metalness: 0.9}));
    safeDial.rotation.x = Math.PI / 2;
    safeDial.position.set(4.5, 1.2, -0.28);
    labGroup.add(safe, safeDial);

    // 3D Floating Glowing Indicator for Laundering Station
    const launderMarker = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.4, 0),
      new THREE.MeshStandardMaterial({color: 0x2ecc71, emissive: 0x16a34a, emissiveIntensity: 1.4})
    );
    launderMarker.position.set(4.5, 2.8, 1.5);
    this.animatedMarkers.push(launderMarker);
    labGroup.add(launderMarker);

    // 3. BLUE METHYLAMINE BARRELS
    const drumMat = new THREE.MeshStandardMaterial({color: 0x0284c7, metalness: 0.5, roughness: 0.4});
    [
      [-8.5, 0.7, 4.0],
      [-7.2, 0.7, 4.0],
      [-8.5, 0.7, 5.5],
      [-7.2, 0.7, 5.5],
      [-7.8, 1.9, 4.8],
    ].forEach(([dx, dy, dz]) => {
      const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 1.3, 16), drumMat);
      drum.position.set(dx, dy, dz);
      drum.castShadow = true;
      labGroup.add(drum);
    });

    // Outer Asphalt Parking Lot Apron
    const apron = new THREE.Mesh(new THREE.BoxGeometry(32, 0.1, 28), new THREE.MeshStandardMaterial({color: 0x1e293b, roughness: 0.9}));
    apron.position.set(0, 0.05, 0);
    apron.receiveShadow = true;
    labGroup.add(apron);

    labGroup.position.set(-60, 0, -35);
    this.scene.add(labGroup);
  }

  private createNPCCharacters() {
    // 1. Skyler White (Inside White Residence Living Room)
    const skyler = this.createSkylerModel();
    skyler.position.set(-114.5, 0.2, -71.0);
    this.scene.add(skyler);

    // 2. Jesse Pinkman (Outside Secret Lab by RV)
    const jesse = this.createJesseModel();
    jesse.position.set(-57.0, 0, -44.0);
    this.scene.add(jesse);

    // 3. Saul Goodman (In front of his office)
    const saul = this.createSaulModel();
    saul.position.set(50.0, 0, 78.0);
    this.scene.add(saul);

    // 4. Gus Fring (Inside Los Pollos Hermanos)
    const gus = this.createGusModel();
    gus.position.set(130.0, 0, -88.0);
    this.scene.add(gus);
  }

  private createSkylerModel(): THREE.Group {
    const group = new THREE.Group();
    const skinMat = new THREE.MeshStandardMaterial({color: 0xfbd0b0, roughness: 0.6});
    const sweaterMat = new THREE.MeshStandardMaterial({color: 0x38bdf8, roughness: 0.7});
    const hairMat = new THREE.MeshStandardMaterial({color: 0xfde047, roughness: 0.8});
    const pantMat = new THREE.MeshStandardMaterial({color: 0x1e293b, roughness: 0.8});

    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.85, 0.35), sweaterMat);
    torso.position.y = 1.35;
    group.add(torso);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.42, 0.38), skinMat);
    head.position.y = 1.95;
    group.add(head);

    const hair = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.65, 0.44), hairMat);
    hair.position.set(0, 1.95, -0.05);
    group.add(hair);

    const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.9, 0.28), pantMat);
    leftLeg.position.set(-0.16, 0.45, 0);
    const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.9, 0.28), pantMat);
    rightLeg.position.set(0.16, 0.45, 0);
    group.add(leftLeg, rightLeg);

    const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.8, 0.22), sweaterMat);
    leftArm.position.set(-0.38, 1.3, 0);
    const rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.8, 0.22), sweaterMat);
    rightArm.position.set(0.38, 1.3, 0);
    group.add(leftArm, rightArm);

    const marker = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.05, 8, 16), new THREE.MeshStandardMaterial({color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 1.0}));
    marker.position.y = 2.45;
    marker.rotation.x = Math.PI / 2;
    this.animatedMarkers.push(marker);
    group.add(marker);

    this.npcs.push({group, id: 'skyler', initialY: 0.2});
    return group;
  }

  private createJesseModel(): THREE.Group {
    const group = new THREE.Group();
    const hazmatMat = new THREE.MeshStandardMaterial({color: 0xfacc15, roughness: 0.5});
    const skinMat = new THREE.MeshStandardMaterial({color: 0xf0c0a0, roughness: 0.6});
    const beanieMat = new THREE.MeshStandardMaterial({color: 0x18181b, roughness: 0.9});
    const respMat = new THREE.MeshStandardMaterial({color: 0xd97706, roughness: 0.4});

    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.9, 0.45), hazmatMat);
    torso.position.y = 1.35;
    group.add(torso);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.42, 0.4), skinMat);
    head.position.y = 2.0;
    group.add(head);

    const beanie = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.25, 0.44), beanieMat);
    beanie.position.y = 2.22;
    group.add(beanie);

    const resp = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.22, 0.2), respMat);
    resp.position.set(0, 1.8, 0.24);
    group.add(resp);

    const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.9, 0.32), hazmatMat);
    leftLeg.position.set(-0.2, 0.45, 0);
    const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.9, 0.32), hazmatMat);
    rightLeg.position.set(0.2, 0.45, 0);
    group.add(leftLeg, rightLeg);

    const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.85, 0.26), hazmatMat);
    leftArm.position.set(-0.48, 1.3, 0);
    const rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.85, 0.26), hazmatMat);
    rightArm.position.set(0.48, 1.3, 0);
    group.add(leftArm, rightArm);

    const marker = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.05, 8, 16), new THREE.MeshStandardMaterial({color: 0xfacc15, emissive: 0xeab308, emissiveIntensity: 1.0}));
    marker.position.y = 2.55;
    marker.rotation.x = Math.PI / 2;
    this.animatedMarkers.push(marker);
    group.add(marker);

    this.npcs.push({group, id: 'jesse', initialY: 0});
    return group;
  }

  private createSaulModel(): THREE.Group {
    const group = new THREE.Group();
    const suitMat = new THREE.MeshStandardMaterial({color: 0xbe185d, roughness: 0.6});
    const skinMat = new THREE.MeshStandardMaterial({color: 0xf0c0a0, roughness: 0.6});
    const tieMat = new THREE.MeshStandardMaterial({color: 0xfacc15, roughness: 0.4});
    const hairMat = new THREE.MeshStandardMaterial({color: 0x451a03, roughness: 0.8});

    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.9, 0.4), suitMat);
    torso.position.y = 1.35;
    const tie = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.45, 0.05), tieMat);
    tie.position.set(0, 1.45, 0.21);
    group.add(torso, tie);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.42, 0.4), skinMat);
    head.position.y = 2.0;
    const hair = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.18, 0.44), hairMat);
    hair.position.set(0, 2.22, -0.02);
    group.add(head, hair);

    const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.9, 0.3), suitMat);
    leftLeg.position.set(-0.18, 0.45, 0);
    const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.9, 0.3), suitMat);
    rightLeg.position.set(0.18, 0.45, 0);
    group.add(leftLeg, rightLeg);

    const marker = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.05, 8, 16), new THREE.MeshStandardMaterial({color: 0xf97316, emissive: 0xea580c, emissiveIntensity: 1.0}));
    marker.position.y = 2.5;
    marker.rotation.x = Math.PI / 2;
    this.animatedMarkers.push(marker);
    group.add(marker);

    this.npcs.push({group, id: 'saul', initialY: 0});
    return group;
  }

  private createGusModel(): THREE.Group {
    const group = new THREE.Group();
    const shirtMat = new THREE.MeshStandardMaterial({color: 0xfef08a, roughness: 0.6});
    const skinMat = new THREE.MeshStandardMaterial({color: 0xb48255, roughness: 0.6});
    const tieMat = new THREE.MeshStandardMaterial({color: 0x09090b, roughness: 0.5});
    const pantMat = new THREE.MeshStandardMaterial({color: 0x18181b, roughness: 0.7});

    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.9, 0.38), shirtMat);
    torso.position.y = 1.35;
    const tie = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.5, 0.05), tieMat);
    tie.position.set(0, 1.45, 0.2);
    group.add(torso, tie);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.4, 0.38), skinMat);
    head.position.y = 2.0;
    const glasses = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.08, 0.06), new THREE.MeshStandardMaterial({color: 0xd97706, metalness: 0.8}));
    glasses.position.set(0, 2.02, 0.21);
    group.add(head, glasses);

    const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.9, 0.28), pantMat);
    leftLeg.position.set(-0.16, 0.45, 0);
    const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.9, 0.28), pantMat);
    rightLeg.position.set(0.16, 0.45, 0);
    group.add(leftLeg, rightLeg);

    const marker = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.05, 8, 16), new THREE.MeshStandardMaterial({color: 0xfacc15, emissive: 0xca8a04, emissiveIntensity: 1.0}));
    marker.position.y = 2.5;
    marker.rotation.x = Math.PI / 2;
    this.animatedMarkers.push(marker);
    group.add(marker);

    this.npcs.push({group, id: 'gus', initialY: 0});
    return group;
  }

  private createLosPollosHermanos() {
    const pollosGroup = new THREE.Group();
    const wallMat = new THREE.MeshStandardMaterial({color: 0xfef08a, roughness: 0.7});
    const blueTrimMat = new THREE.MeshStandardMaterial({color: 0x1d4ed8, roughness: 0.4});
    const yellowSignMat = new THREE.MeshStandardMaterial({color: 0xeab308, emissive: 0xca8a04, emissiveIntensity: 0.4});

    // Restaurant Building
    const building = new THREE.Mesh(new THREE.BoxGeometry(28, 6.5, 22), wallMat);
    building.position.set(0, 3.25, 0);
    building.castShadow = true;
    pollosGroup.add(building);

    // Blue Roof Fascia
    const roofTrim = new THREE.Mesh(new THREE.BoxGeometry(29, 1.2, 23), blueTrimMat);
    roofTrim.position.set(0, 6.8, 0);
    pollosGroup.add(roofTrim);

    // Tall Pole Sign with Chicken Logo Emissivity
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 16), new THREE.MeshStandardMaterial({color: 0x334155}));
    pole.position.set(16, 8, 14);
    pollosGroup.add(pole);

    const signBoard = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 3.5, 0.8, 24), yellowSignMat);
    signBoard.rotation.x = Math.PI / 2;
    signBoard.position.set(16, 16, 14);
    pollosGroup.add(signBoard);

    pollosGroup.position.set(130, 0, -90);
    this.scene.add(pollosGroup);
  }

  private createSaulGoodmanOffice() {
    const saulGroup = new THREE.Group();
    const stuccoMat = new THREE.MeshStandardMaterial({color: 0xfde047, roughness: 0.8});
    const columnMat = new THREE.MeshStandardMaterial({color: 0xf8fafc, roughness: 0.3});

    // Office Strip Mall Unit
    const building = new THREE.Mesh(new THREE.BoxGeometry(26, 6, 18), stuccoMat);
    building.position.set(0, 3, 0);
    building.castShadow = true;
    saulGroup.add(building);

    // White Neoclassical Columns
    [-8, -4, 4, 8].forEach((cx) => {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 6, 16), columnMat);
      col.position.set(cx, 3, 9.5);
      col.castShadow = true;
      saulGroup.add(col);
    });

    // Inflatable Statue of Liberty on Roof
    const ladyLibMat = new THREE.MeshStandardMaterial({color: 0x2dd4bf, roughness: 0.5});
    const libBody = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.8, 5.5, 12), ladyLibMat);
    libBody.position.set(0, 8.8, 0);
    const libTorch = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 2.5), ladyLibMat);
    libTorch.position.set(1.5, 11, 0);
    saulGroup.add(libBody, libTorch);

    saulGroup.position.set(50, 0, 80);
    this.scene.add(saulGroup);
  }

  private createCarwashA1A() {
    const carwashGroup = new THREE.Group();
    const concreteMat = new THREE.MeshStandardMaterial({color: 0x94a3b8, roughness: 0.7});
    const glassMat = new THREE.MeshStandardMaterial({color: 0x38bdf8, roughness: 0.1, transparent: true, opacity: 0.7});
    const brushMat = new THREE.MeshStandardMaterial({color: 0x0284c7, roughness: 0.9});

    // Drive-through tunnel
    const tunnel = new THREE.Mesh(new THREE.BoxGeometry(16, 5.5, 36), concreteMat);
    tunnel.position.set(0, 2.75, 0);
    tunnel.castShadow = true;
    carwashGroup.add(tunnel);

    // Glass wash bay observation windows
    const windowMesh = new THREE.Mesh(new THREE.BoxGeometry(16.2, 3.0, 22), glassMat);
    windowMesh.position.set(0, 2.5, 0);
    carwashGroup.add(windowMesh);

    // Giant rotating foam brushes inside
    [-6, 0, 6].forEach((bz) => {
      const brush = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 4.0, 16), brushMat);
      brush.position.set(0, 2.4, bz);
      carwashGroup.add(brush);
    });

    // Bold A1A Car Wash Sign
    const signBox = new THREE.Mesh(new THREE.BoxGeometry(14, 2.2, 0.8), new THREE.MeshStandardMaterial({color: 0x16a34a}));
    signBox.position.set(0, 6.8, 18);
    carwashGroup.add(signBox);

    carwashGroup.position.set(-50, 0, 110);
    this.scene.add(carwashGroup);
  }

  private createIndustrialSuperlab() {
    const labGroup = new THREE.Group();
    const industrialMat = new THREE.MeshStandardMaterial({color: 0x64748b, roughness: 0.7});
    const steelMat = new THREE.MeshStandardMaterial({color: 0x94a3b8, metalness: 0.8, roughness: 0.2});

    // Surface Industrial Laundry (Lavandería Brillante)
    const factory = new THREE.Mesh(new THREE.BoxGeometry(45, 10, 32), industrialMat);
    factory.position.set(0, 5, 0);
    factory.castShadow = true;
    labGroup.add(factory);

    // Twin Industrial Smokestacks
    [-8, 8].forEach((sx) => {
      const stack = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.6, 18, 16), industrialMat);
      stack.position.set(sx, 12, -10);
      labGroup.add(stack);
    });

    // Stainless Steel Superlab Vats visible through side gate
    [-5, 0, 5].forEach((vx) => {
      const vat = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, 6, 16), steelMat);
      vat.position.set(vx, 3, 18);
      labGroup.add(vat);
    });

    labGroup.position.set(240, 0, 130);
    this.scene.add(labGroup);
  }

  private createMadrigalWarehouse() {
    const madGroup = new THREE.Group();
    const warehouseMat = new THREE.MeshStandardMaterial({color: 0x475569, roughness: 0.8});

    // Large storage hanger
    const hangar = new THREE.Mesh(new THREE.BoxGeometry(40, 9, 36), warehouseMat);
    hangar.position.set(0, 4.5, 0);
    hangar.castShadow = true;
    madGroup.add(hangar);

    // Multi-colored stacked shipping containers
    const colors = [0x0284c7, 0xea580c, 0x16a34a, 0xdc2626];
    for (let i = 0; i < 8; i++) {
      const colIdx = i % colors.length;
      const cMat = new THREE.MeshStandardMaterial({color: colors[colIdx], roughness: 0.6});
      const container = new THREE.Mesh(new THREE.BoxGeometry(3.5, 3.2, 8.5), cMat);
      const row = Math.floor(i / 2);
      const col = i % 2;
      container.position.set(16 + col * 4.2, 1.6 + (row % 2) * 3.3, -12 + row * 9);
      container.castShadow = true;
      madGroup.add(container);
    }

    // Blue Methylamine chemical drums
    const drumMat = new THREE.MeshStandardMaterial({color: 0x0284c7, metalness: 0.4, roughness: 0.5});
    for (let d = 0; d < 12; d++) {
      const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 1.2, 12), drumMat);
      drum.position.set(-15 + (d % 4) * 1.3, 0.6, 12 + Math.floor(d / 4) * 1.4);
      drum.castShadow = true;
      madGroup.add(drum);
    }

    madGroup.position.set(200, 0, 180);
    this.scene.add(madGroup);
  }

  private createToHajiileeDesertProps() {
    // Red rock canyon mesas
    const mesaMat = new THREE.MeshStandardMaterial({color: 0xb45309, roughness: 0.95});
    [
      [-280, -290, 45, 25],
      [-200, -320, 55, 30],
      [-320, -180, 40, 20],
      [-160, -260, 30, 18],
    ].forEach(([mx, mz, rad, height]) => {
      const mesa = new THREE.Mesh(new THREE.CylinderGeometry(rad * 0.7, rad, height, 10), mesaMat);
      mesa.position.set(mx, height / 2 - 2, mz);
      mesa.castShadow = true;
      mesa.receiveShadow = true;
      this.scene.add(mesa);
    });

    // Saguaro Cacti scattered across desert
    const cactusMat = new THREE.MeshStandardMaterial({color: 0x15803d, roughness: 0.8});
    for (let c = 0; c < 35; c++) {
      const cx = -120 - Math.random() * 220;
      const cz = -120 - Math.random() * 220;
      const cactus = new THREE.Group();
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 5.5, 8), cactusMat);
      trunk.position.y = 2.75;
      cactus.add(trunk);
      // Branch
      const arm = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.35, 0.35), cactusMat);
      arm.position.set(0.6, 3.2, 0);
      const armUp = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 2.0, 8), cactusMat);
      armUp.position.set(1.4, 4.0, 0);
      cactus.add(arm, armUp);
      cactus.position.set(cx, 0, cz);
      cactus.castShadow = true;
      this.scene.add(cactus);
    }

    // Buried Money Barrels with GPS wooden marker
    const stakeGeo = new THREE.CylinderGeometry(0.1, 0.1, 2.2, 8);
    const stake = new THREE.Mesh(stakeGeo, new THREE.MeshStandardMaterial({color: 0x78350f}));
    stake.position.set(-235, 1.1, -250);
    this.scene.add(stake);
  }

  private setupInputs() {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('resize', this.handleResize);

    const canvas = this.canvasRef.nativeElement;
    canvas.addEventListener('click', this.handleCanvasClick);
    canvas.addEventListener('mousedown', this.handleMouseDown);
    window.addEventListener('mousemove', this.handleMouseMove);
    window.addEventListener('mouseup', this.handleMouseUp);
    canvas.addEventListener('wheel', this.handleWheel, {passive: true});
    document.addEventListener('pointerlockchange', this.handlePointerLockChange);
  }

  private removeInputs() {
    if (typeof window === 'undefined') return;
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('resize', this.handleResize);

    const canvas = this.canvasRef?.nativeElement;
    canvas?.removeEventListener('click', this.handleCanvasClick);
    canvas?.removeEventListener('mousedown', this.handleMouseDown);
    window.removeEventListener('mousemove', this.handleMouseMove);
    window.removeEventListener('mouseup', this.handleMouseUp);
    canvas?.removeEventListener('wheel', this.handleWheel);
    if (typeof document !== 'undefined') {
      document.removeEventListener('pointerlockchange', this.handlePointerLockChange);
    }
  }

  private handleCanvasClick = () => {
    if (!this.isPointerLocked && !this.gameState.isPaused() && this.gameState.isGameStarted()) {
      try {
        this.canvasRef.nativeElement.requestPointerLock?.();
      } catch {
        // Pointer lock optional
      }
    }
  };

  private handlePointerLockChange = () => {
    this.isPointerLocked = document.pointerLockElement === this.canvasRef.nativeElement;
  };

  private handleKeyDown = (e: KeyboardEvent) => {
    this.keys[e.code] = true;

    // Hotkeys
    if (e.code === 'KeyV') {
      this.gameState.toggleCamera();
    } else if (e.code === 'KeyF') {
      const active = this.gameState.activeInteraction();
      if (active?.type === 'rv_vehicle') {
        this.gameState.toggleVehicle('rv');
      } else if (active?.type === 'aztek_vehicle') {
        this.gameState.toggleVehicle('aztek');
      } else {
        this.gameState.toggleVehicle();
      }
    } else if (e.code === 'KeyM') {
      this.gameState.isMapOpen.update((m) => !m);
    } else if (e.code === 'KeyP' || e.code === 'Escape') {
      this.gameState.togglePause();
    } else if (e.code === 'KeyE') {
      this.handleInteraction();
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    this.keys[e.code] = false;
  };

  private handleMouseDown = (e: MouseEvent) => {
    this.isMouseDown = true;
    this.prevMouseX = e.clientX;
    this.prevMouseY = e.clientY;
  };

  private handleMouseMove = (e: MouseEvent) => {
    if (this.isPointerLocked) {
      // True GTA-style free mouse-look: 360 degree rotation and pitch
      const sensitivity = 0.0024;
      this.cameraYaw -= (e.movementX || 0) * sensitivity;
      this.cameraPitch = Math.max(-0.25, Math.min(1.35, this.cameraPitch + (e.movementY || 0) * sensitivity));
    } else if (this.isMouseDown) {
      const dx = e.clientX - this.prevMouseX;
      const dy = e.clientY - this.prevMouseY;
      this.prevMouseX = e.clientX;
      this.prevMouseY = e.clientY;

      this.cameraYaw -= dx * 0.004;
      this.cameraPitch = Math.max(-0.25, Math.min(1.35, this.cameraPitch + dy * 0.0035));
    }
  };

  private handleMouseUp = () => {
    this.isMouseDown = false;
  };

  private handleWheel = (e: WheelEvent) => {
    this.cameraDist = Math.max(3.5, Math.min(22, this.cameraDist + e.deltaY * 0.015));
  };

  private handleResize = () => {
    const canvas = this.canvasRef.nativeElement;
    if (!canvas) return;
    const width = canvas.clientWidth || window.innerWidth;
    const height = canvas.clientHeight || window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  private handleInteraction() {
    const active = this.gameState.activeInteraction();
    if (active) {
      switch (active.type) {
        case 'cook_lab':
          this.gameState.enterChemistryMinigame();
          return;
        case 'launder_desk':
          this.gameState.isLaunderingOpen.set(true);
          return;
        case 'skyler':
          this.gameState.triggerSkylerDialogue();
          return;
        case 'jesse':
          this.gameState.triggerJesseDialogue();
          return;
        case 'saul':
          this.gameState.triggerSaulDialogue();
          return;
        case 'gus':
          this.gameState.triggerGusDialogue();
          return;
        case 'rv_vehicle':
          this.gameState.enterChemistryMinigame();
          return;
        case 'aztek_vehicle':
          this.gameState.toggleVehicle('aztek');
          return;
      }
    }

    // Fallback location check
    const nearest = this.gameState.nearestLocation();
    if (!nearest.location) return;

    if (nearest.distance <= nearest.location.radius + 15) {
      if (nearest.location.id === 'desert_rv' || nearest.location.id === 'superlab') {
        this.gameState.enterChemistryMinigame();
      } else if (nearest.location.id === 'carwash' || nearest.location.id === 'saul_office') {
        this.gameState.isLaunderingOpen.set(true);
      } else if (nearest.location.id === 'pollos') {
        this.gameState.triggerGusDialogue();
      } else if (nearest.location.id === 'white_residence') {
        this.gameState.triggerSkylerDialogue();
      }
    }
  }

  private startRenderLoop() {
    const loop = (timestamp: number) => {
      this.animFrameId = requestAnimationFrame(loop);

      if (!this.lastTime) this.lastTime = timestamp;
      const delta = (timestamp - this.lastTime) / 1000;
      this.lastTime = timestamp;

      // FPS limiter check
      const fpsLimit = this.gameState.graphics().fpsLimit;
      if (fpsLimit > 0 && delta < 1 / fpsLimit) {
        return;
      }

      // FPS measurement
      this.frameCount++;
      this.fpsTimer += delta;
      if (this.fpsTimer >= 0.5) {
        this.gameState.currentFps.set(Math.round(this.frameCount / this.fpsTimer));
        this.frameCount = 0;
        this.fpsTimer = 0;
      }

      if (this.gameState.isGameStarted() && !this.gameState.isPaused()) {
        this.updateGameLogic(delta);
      }

      this.renderer.render(this.scene, this.camera);
    };

    this.animFrameId = requestAnimationFrame(loop);
  }

  private updateGameLogic(delta: number) {
    const inVeh = this.gameState.inVehicle();
    const isSprint = this.keys['ShiftLeft'] || this.keys['ShiftRight'];
    const speed = inVeh === 'none' ? (isSprint ? 14 : 7) : inVeh === 'aztek' ? 28 : 20;

    let moveX = 0;
    let moveZ = 0;

    if (this.keys['KeyW'] || this.keys['ArrowUp']) moveZ -= 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) moveZ += 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) moveX -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) moveX += 1;

    const isMoving = moveX !== 0 || moveZ !== 0;

    if (isMoving) {
      // Calculate world direction relative to camera angle
      const forward = new THREE.Vector3(-Math.sin(this.cameraYaw), 0, -Math.cos(this.cameraYaw));
      const right = new THREE.Vector3(Math.cos(this.cameraYaw), 0, -Math.sin(this.cameraYaw));
      const dir = forward.multiplyScalar(-moveZ).add(right.multiplyScalar(moveX)).normalize();

      const curPos = this.gameState.playerPos();
      const nextX = curPos.x + dir.x * speed * delta;
      const nextZ = curPos.z + dir.z * speed * delta;

      // Boundary clamp
      const clampedX = Math.max(-500, Math.min(500, nextX));
      const clampedZ = Math.max(-500, Math.min(500, nextZ));

      this.gameState.playerPos.set({x: clampedX, y: curPos.y, z: clampedZ});

      // Target character rotation
      const targetAngle = Math.atan2(dir.x, dir.z);
      this.gameState.playerRotY.set(targetAngle);

      // Procedural limb animation
      if (inVeh === 'none') {
        this.walkAnimPhase += delta * (isSprint ? 14 : 8);
        const swing = Math.sin(this.walkAnimPhase) * 0.45;
        this.charLeftLeg.rotation.x = swing;
        this.charRightLeg.rotation.x = -swing;
        this.charLeftArm.rotation.x = -swing;
        this.charRightArm.rotation.x = swing;
      }

      // Audio engine update if driving
      if (inVeh !== 'none') {
        this.audio.setEngineSound(isSprint ? 1.0 : 0.6);
      }
    } else {
      // Reset limbs to idle
      this.charLeftLeg.rotation.x *= 0.8;
      this.charRightLeg.rotation.x *= 0.8;
      this.charLeftArm.rotation.x *= 0.8;
      this.charRightArm.rotation.x *= 0.8;
      if (inVeh !== 'none') {
        this.audio.setEngineSound(0.1);
      }
    }

    // Synchronize character mesh position & rotation
    const pos = this.gameState.playerPos();
    this.characterGroup.position.set(pos.x, 0, pos.z);
    this.characterGroup.rotation.y = this.gameState.playerRotY();

    // Toggle character visibility if driving vehicle
    if (inVeh === 'aztek') {
      this.characterGroup.visible = false;
      this.aztekVehicleGroup.position.set(pos.x, 0, pos.z);
      this.aztekVehicleGroup.rotation.y = this.gameState.playerRotY() + Math.PI;
    } else if (inVeh === 'rv') {
      this.characterGroup.visible = false;
      this.rvVehicleGroup.position.set(pos.x, 0, pos.z);
      this.rvVehicleGroup.rotation.y = this.gameState.playerRotY() + Math.PI;
    } else {
      this.characterGroup.visible = true;
    }

    // Police Lightbar flash when Heat is active
    if (this.policeLightMesh) {
      if (this.gameState.heatStars() >= 3) {
        const t = Date.now() * 0.01;
        const col = Math.sin(t) > 0 ? 0xef4444 : 0x3b82f6;
        (this.policeLightMesh.material as THREE.MeshStandardMaterial).color.setHex(col);
        (this.policeLightMesh.material as THREE.MeshStandardMaterial).emissive.setHex(col);
      }
    }

    // In-world animated markers and NPC idle animation
    const now = Date.now() * 0.003;
    this.animatedMarkers.forEach((marker) => {
      marker.rotation.y += delta * 2.2;
    });
    this.npcs.forEach((npc, idx) => {
      npc.group.position.y = npc.initialY + Math.sin(now + idx * 1.5) * 0.03;
    });

    // Proximity detection for in-world interactions (E key)
    const p = this.gameState.playerPos();
    const dCook = Math.hypot(p.x - (-64.5), p.z - (-38.5));
    const dLaunder = Math.hypot(p.x - (-55.5), p.z - (-33.5));
    const dSkyler = Math.hypot(p.x - (-114.5), p.z - (-71.0));
    const dJesse = Math.hypot(p.x - (-57.0), p.z - (-44.0));
    const dSaul = Math.hypot(p.x - 50.0, p.z - 78.0);
    const dGus = Math.hypot(p.x - 130.0, p.z - (-88.0));
    const dRv = Math.hypot(p.x - (-52.0), p.z - (-48.0));
    const dAztek = Math.hypot(p.x - (-118.0), p.z - (-62.0));

    if (dCook < 4.0) {
      this.gameState.activeInteraction.set({
        id: 'cook_lab_station',
        type: 'cook_lab',
        titleKey: 'interact_cook_lab',
        subKey: 'interact_cook_lab_sub',
        actionKey: 'E',
        label: 'دستگاه پخت شیشه (آزمایشگاه)',
        labelEn: 'Chemical Synthesis Rig (Meth Lab)',
        actionText: 'E برای شروع پخت',
        actionTextEn: 'Press E to Synthesize',
        icon: 'science',
        distance: dCook,
      });
    } else if (dLaunder < 4.0) {
      this.gameState.activeInteraction.set({
        id: 'launder_desk_station',
        type: 'launder_desk',
        titleKey: 'interact_launder_desk',
        subKey: 'interact_launder_desk_sub',
        actionKey: 'E',
        label: 'میز پول‌شویی و گاوصندوق',
        labelEn: 'Money Laundering Desk & Vault',
        actionText: 'E برای پول‌شویی',
        actionTextEn: 'Press E to Launder Cash',
        icon: 'payments',
        distance: dLaunder,
      });
    } else if (dSkyler < 4.5) {
      this.gameState.activeInteraction.set({
        id: 'skyler_npc',
        type: 'skyler',
        titleKey: 'interact_skyler',
        subKey: 'interact_skyler_sub',
        actionKey: 'E',
        label: 'اسکایلر وایت (داخل خانه)',
        labelEn: 'Skyler White (Living Room)',
        actionText: 'E برای صحبت با اسکایلر',
        actionTextEn: 'Press E to Talk',
        icon: 'record_voice_over',
        distance: dSkyler,
      });
    } else if (dJesse < 4.5) {
      this.gameState.activeInteraction.set({
        id: 'jesse_npc',
        type: 'jesse',
        titleKey: 'interact_jesse',
        subKey: 'interact_jesse_sub',
        actionKey: 'E',
        label: 'جسی پینکمن (کنار کاروان)',
        labelEn: 'Jesse Pinkman (Outside Lab)',
        actionText: 'E برای هماهنگی با جسی',
        actionTextEn: 'Press E to Coordinate',
        icon: 'groups',
        distance: dJesse,
      });
    } else if (dSaul < 5.0) {
      this.gameState.activeInteraction.set({
        id: 'saul_npc',
        type: 'saul',
        titleKey: 'interact_saul',
        subKey: 'interact_saul_sub',
        actionKey: 'E',
        label: 'سال گودمن (دفتر وکالت)',
        labelEn: 'Saul Goodman, Attorney',
        actionText: 'E برای مشاوره حقوقی',
        actionTextEn: 'Press E for Counsel',
        icon: 'gavel',
        distance: dSaul,
      });
    } else if (dGus < 5.0) {
      this.gameState.activeInteraction.set({
        id: 'gus_npc',
        type: 'gus',
        titleKey: 'interact_gus',
        subKey: 'interact_gus_sub',
        actionKey: 'E',
        label: 'گاس فرینگ (لوس پویوس)',
        labelEn: 'Gustavo Fring (Pollos)',
        actionText: 'E برای مذاکره با گاس',
        actionTextEn: 'Press E to Negotiate',
        icon: 'business_center',
        distance: dGus,
      });
    } else if (dRv < 5.0 && inVeh === 'none') {
      this.gameState.activeInteraction.set({
        id: 'rv_vehicle_station',
        type: 'rv_vehicle',
        titleKey: 'interact_rv',
        subKey: 'interact_rv_sub',
        actionKey: 'F',
        label: 'کاروان آزمایشگاهی فلیتوود Bounder',
        labelEn: 'Fleetwood RV Bounder',
        actionText: 'F سوار شدن / E پخت شیشه',
        actionTextEn: 'Press F to Drive / E to Cook',
        icon: 'rv_hookup',
        distance: dRv,
      });
    } else if (dAztek < 5.0 && inVeh === 'none') {
      this.gameState.activeInteraction.set({
        id: 'aztek_vehicle_station',
        type: 'aztek_vehicle',
        titleKey: 'interact_aztek',
        subKey: 'interact_aztek_sub',
        actionKey: 'F',
        label: 'پونتیاک آزتک والتر وایت',
        labelEn: "Walt's Pontiac Aztek",
        actionText: 'F برای سوار شدن',
        actionTextEn: 'Press F to Enter Car',
        icon: 'directions_car',
        distance: dAztek,
      });
    } else {
      this.gameState.activeInteraction.set(null);
    }

    // Camera follow logic with GTA-style mouse-look
    const camMode = this.gameState.cameraMode();
    const cosPitch = Math.cos(this.cameraPitch);
    const sinPitch = Math.sin(this.cameraPitch);

    if (camMode === 'first-person') {
      // 1st person eyes view (GTA style)
      this.characterGroup.visible = false;
      this.camera.position.set(pos.x, 2.05, pos.z);
      const lookTarget = new THREE.Vector3(
        pos.x - Math.sin(this.cameraYaw) * cosPitch,
        2.05 - sinPitch,
        pos.z - Math.cos(this.cameraYaw) * cosPitch
      );
      this.camera.lookAt(lookTarget);
    } else {
      // 3rd person orbit (GTA style free camera orbit)
      if (inVeh === 'none') {
        this.characterGroup.visible = true;
      }
      const cx = pos.x + Math.sin(this.cameraYaw) * cosPitch * this.cameraDist;
      const cy = Math.max(0.6, 1.8 + sinPitch * this.cameraDist);
      const cz = pos.z + Math.cos(this.cameraYaw) * cosPitch * this.cameraDist;

      this.camera.position.set(cx, cy, cz);
      this.camera.lookAt(pos.x, 1.6, pos.z);
    }
  }
}
