// EGIZ Navigator: the brand mark (a horizon under a partial orbit) built as a small studio object.
// Ceramic upper hemisphere, graphite lower hemisphere, a recessed seam where the horizon would be,
// engraved latitudes, an open brass orbit with rounded ends, and a glass lens it points with.
// No sharp edge anywhere: every part is a sphere, a torus or a capped curve.
// AI-assisted implementation; human review pending.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

export interface Pose { x: number; y: number; s: number; floor: number }
const damp = (k: number, dt: number) => 1 - Math.exp(-k * dt);

function shadowTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d')!;
  const r = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  r.addColorStop(0, 'rgba(0,0,0,0.62)'); r.addColorStop(.35, 'rgba(0,0,0,0.34)'); r.addColorStop(.7, 'rgba(0,0,0,0.08)'); r.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = r; g.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export class NavigatorScene {
  readonly renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private rig = new THREE.Group();      // position + banking
  private body = new THREE.Group();     // where the lens points
  private orbit = new THREE.Group();
  private iris: THREE.MeshPhysicalMaterial;
  private shadow: THREE.Mesh;
  private ray = new THREE.Raycaster();
  private plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  private pose: Pose = { x: .72, y: .55, s: 1, floor: 0 };
  private look: { x: number; y: number } | null = null;
  private pointer = { x: .5, y: .5 };
  private pos = new THREE.Vector3(); private vel = new THREE.Vector3();
  private scale = 0; private floor = 0; private spin = 0; private t = 0;
  private reduced: boolean;
  private qTarget = new THREE.Quaternion();

  constructor(private canvas: HTMLCanvasElement, opts: { compact: boolean; reduced: boolean }) {
    this.reduced = opts.reduced;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance', premultipliedAlpha: true });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.06;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, opts.compact ? 1.75 : 2));

    // long lens, three-quarter view from slightly above
    this.camera = new THREE.PerspectiveCamera(28, 1, .1, 100);
    this.camera.position.set(0, 2.2, 13); this.camera.lookAt(0, 0, 0);

    // studio light: soft room reflections, a warm key, a cool rim
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), .035).texture;
    this.scene.environmentIntensity = .5;
    pmrem.dispose();
    const key = new THREE.DirectionalLight(0xfff0dd, 2.6); key.position.set(-7, 5, 4); this.scene.add(key);
    const crown = new THREE.DirectionalLight(0xfff8f0, .9); crown.position.set(1, 9, 2); this.scene.add(crown);
    const rim = new THREE.DirectionalLight(0x9cc6ff, 1.7); rim.position.set(6, 2.5, -6); this.scene.add(rim);
    const low = new THREE.DirectionalLight(0xffb27a, .45); low.position.set(2, -5, 3); this.scene.add(low);

    const seg = opts.compact ? [72, 48] : [128, 96];
    const ceramic = new THREE.MeshPhysicalMaterial({ color: 0xc9bfae, roughness: .62, clearcoat: .45, clearcoatRoughness: .32, sheen: .35, sheenRoughness: .5, sheenColor: new THREE.Color(0xffe7cc) });
    const graphite = new THREE.MeshPhysicalMaterial({ color: 0x4a4e57, metalness: .93, roughness: .24, envMapIntensity: 2.2, clearcoat: .3, clearcoatRoughness: .2 });
    const groove = new THREE.MeshStandardMaterial({ color: 0x141518, roughness: .75, metalness: .2 });
    const brass = new THREE.MeshPhysicalMaterial({ color: 0xc9a46c, metalness: .94, roughness: .24, envMapIntensity: 1.8, clearcoat: .15 });
    const steel = new THREE.MeshPhysicalMaterial({ color: 0x9aa0a8, metalness: .93, roughness: .2, envMapIntensity: 2 });
    const glass = new THREE.MeshPhysicalMaterial({ color: 0xe6eef6, metalness: 0, roughness: .04, transmission: 1, thickness: .35, ior: 1.46, clearcoat: 1, clearcoatRoughness: .03, attenuationColor: new THREE.Color(0xbfd2e6), attenuationDistance: 1.2 });
    this.iris = new THREE.MeshPhysicalMaterial({ color: 0x120c08, roughness: .3, metalness: .4, emissive: new THREE.Color(0xff8a3a), emissiveIntensity: .45, clearcoat: 1 });

    // the horizon: ceramic above, graphite below, a recessed seam between them
    const top = new THREE.Mesh(new THREE.SphereGeometry(1, seg[0], seg[1] / 2, 0, Math.PI * 2, 0, Math.PI / 2), ceramic);
    const bottom = new THREE.Mesh(new THREE.SphereGeometry(.997, seg[0], seg[1] / 2, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), graphite);
    const seam = new THREE.Mesh(new THREE.TorusGeometry(.995, .016, 16, seg[0] * 2), groove); seam.rotation.x = Math.PI / 2;
    this.body.add(top, bottom, seam);
    // engraved latitudes on the ceramic
    for (const lat of [32, 58]) {
      const a = lat * Math.PI / 180; const ring = new THREE.Mesh(new THREE.TorusGeometry(Math.cos(a) * .999, .0055, 8, seg[0] * 2), groove);
      ring.rotation.x = Math.PI / 2; ring.position.y = Math.sin(a) * .999; this.body.add(ring);
    }
    // a soft bevelled band under the seam: graphite collar, reads as machined
    const collar = new THREE.Mesh(new THREE.TorusGeometry(.985, .028, 20, seg[0] * 2), graphite); collar.rotation.x = Math.PI / 2; collar.position.y = -.035; this.body.add(collar);

    // the lens: a steel bezel, an amber iris, a glass dome over it, slightly above the horizon
    const lens = new THREE.Group();
    const bezel = new THREE.Mesh(new THREE.TorusGeometry(.33, .045, 24, 96), steel);
    const iris = new THREE.Mesh(new THREE.SphereGeometry(.24, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2.4), this.iris); iris.rotation.x = Math.PI / 2; iris.position.z = -.08;
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(.085, 32, 16), new THREE.MeshPhysicalMaterial({ color: 0x0b0806, roughness: .2, clearcoat: 1 })); pupil.position.z = .05;
    const dome = new THREE.Mesh(new THREE.SphereGeometry(.32, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2), glass); dome.rotation.x = Math.PI / 2; dome.scale.set(1, .55, 1);
    lens.add(bezel, iris, pupil, dome);
    const up = 12 * Math.PI / 180; lens.position.set(0, Math.sin(up) * .985, Math.cos(up) * .985); lens.lookAt(0, Math.sin(up) * 3, Math.cos(up) * 3);
    this.body.add(lens);

    // the open orbit: a brass arc with rounded ends
    const arc = Math.PI * 1.62, R = 1.55, tube = .048;
    const ringMesh = new THREE.Mesh(new THREE.TorusGeometry(R, tube, 28, 220, arc), brass);
    const capA = new THREE.Mesh(new THREE.SphereGeometry(tube, 24, 16), brass); capA.position.set(R, 0, 0);
    const capB = new THREE.Mesh(new THREE.SphereGeometry(tube, 24, 16), brass); capB.position.set(Math.cos(arc) * R, Math.sin(arc) * R, 0);
    const bead = new THREE.Mesh(new THREE.SphereGeometry(.085, 32, 16), steel); bead.position.set(Math.cos(arc * .62) * R, Math.sin(arc * .62) * R, 0);
    this.orbit.add(ringMesh, capA, capB, bead);
    this.orbit.rotation.set(Math.PI / 2 - .32, .18, 0);

    this.rig.add(this.body, this.orbit);
    this.scene.add(this.rig);

    // soft contact shadow, baked into a texture
    this.shadow = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 4.2), new THREE.MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false, opacity: 0 }));
    this.shadow.rotation.x = -Math.PI / 2; this.scene.add(this.shadow);
    this.resize();
  }

  resize() {
    const w = this.canvas.clientWidth || window.innerWidth, h = this.canvas.clientHeight || window.innerHeight;
    this.renderer.setSize(w, h, false); this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
  }
  setPose(p: Pose) { this.pose = p; }
  setLook(l: { x: number; y: number } | null) { this.look = l; }
  setPointer(x: number, y: number) { this.pointer.x = x; this.pointer.y = y; }

  /** viewport fraction (0..1 from top-left) → point on the stage plane z = 0 */
  private toWorld(x: number, y: number, out = new THREE.Vector3()) {
    this.ray.setFromCamera(new THREE.Vector2(x * 2 - 1, -(y * 2 - 1)), this.camera);
    this.ray.ray.intersectPlane(this.plane, out); return out;
  }

  /** world units per viewport height at the stage plane: keeps the object a constant share of the screen */
  private unit() { return 2 * this.camera.position.length() * Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2)); }

  frame(dt: number) {
    this.t += dt;
    const { x, y, s, floor } = this.pose;
    const target = this.toWorld(x, y);
    const narrow = this.camera.aspect < .9;
    const size = s * this.unit() * (narrow ? .1 : .13);
    if (this.reduced) { this.pos.copy(target); this.scale = size; }
    else {
      // a heavy, floating flight: critically damped toward the pose, with a slow bob
      const prev = this.pos.clone();
      this.pos.lerp(target, damp(2.6, dt));
      this.vel.copy(this.pos).sub(prev).divideScalar(Math.max(dt, 1e-3));
      this.scale += (size - this.scale) * damp(3, dt);
    }
    const bob = this.reduced ? 0 : Math.sin(this.t * 1.1) * .06 * this.scale;
    this.rig.position.set(this.pos.x, this.pos.y + bob, 0);
    this.rig.scale.setScalar(Math.max(this.scale, 1e-4));
    // bank into the direction of travel, like a craft
    if (!this.reduced) { this.rig.rotation.z += ((-this.vel.x * .05) - this.rig.rotation.z) * damp(4, dt); this.rig.rotation.x += ((this.vel.y * .03) - this.rig.rotation.x) * damp(4, dt); }

    // the lens points: at the scene's subject when it has one, otherwise toward the visitor's pointer
    const focus = this.look ? this.toWorld(this.look.x, this.look.y) : this.toWorld(this.pointer.x, this.pointer.y);
    const dir = focus.sub(this.rig.position).multiplyScalar(this.look ? .55 : .2).add(new THREE.Vector3(0, .15, this.look ? 2.2 : 3.4)).normalize();
    const m = new THREE.Matrix4().lookAt(new THREE.Vector3(), dir, new THREE.Vector3(0, 1, 0));
    this.qTarget.setFromRotationMatrix(m);
    // lookAt aims -Z; the lens faces +Z
    this.qTarget.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI));
    if (this.reduced) this.body.quaternion.copy(this.qTarget); else this.body.quaternion.slerp(this.qTarget, damp(this.look ? 3.2 : 2, dt));

    // the orbit turns slowly, faster while flying; the iris breathes
    const speed = this.vel.length() / Math.max(this.scale, .01);
    this.spin += dt * (this.reduced ? 0 : .22 + Math.min(2.5, speed * .35));
    this.orbit.rotation.z = this.spin;
    this.iris.emissiveIntensity = this.reduced ? .45 : .38 + Math.sin(this.t * 2.2) * .1 + (this.look ? .14 : 0);

    // contact shadow only where the object rests on a stage
    this.floor += (floor - this.floor) * damp(3, dt);
    const sm = this.shadow.material as THREE.MeshBasicMaterial;
    sm.opacity = this.floor * (1 - Math.min(1, Math.abs(bob) / Math.max(this.scale, 1e-3) * 2)) * .85;
    this.shadow.position.set(this.pos.x, this.pos.y - this.scale * 1.32, 0);
    this.shadow.scale.setScalar(this.scale);
    this.shadow.visible = sm.opacity > .01;

    this.renderer.render(this.scene, this.camera);
  }

  dispose() { this.renderer.dispose(); this.scene.traverse(o => { const m = o as THREE.Mesh; m.geometry?.dispose?.(); }); }
}
