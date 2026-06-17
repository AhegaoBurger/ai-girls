import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { VRMLoaderPlugin, VRMUtils } from "@pixiv/three-vrm";
import type { VRM } from "@pixiv/three-vrm";

// Load Avatar
// renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

// camera
const camera = new THREE.PerspectiveCamera(
  30.0,
  window.innerWidth / window.innerHeight,
  0.1,
  20.0,
);
camera.position.set(0.0, 1.0, 5.0);

// camera controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.screenSpacePanning = true;
controls.target.set(0.0, 1.0, 0.0);
controls.update();

// scene
const scene = new THREE.Scene();

// light
const light = new THREE.DirectionalLight(0xffffff, Math.PI);
light.position.set(1.0, 1.0, 1.0).normalize();
scene.add(light);

// lookat target
const lookAtTarget = new THREE.Object3D();
camera.add(lookAtTarget);

// gltf and vrm
let currentVrm: VRM | null = null;
const loader = new GLTFLoader();
loader.crossOrigin = "anonymous";

// Install a GLTFLoader plugin that enables VRM support
loader.register((parser) => {
  return new VRMLoaderPlugin(parser);
});

loader.load(
  "/testy.vrm",

  (gltf) => {
    const vrm: VRM = gltf.userData.vrm;

    // calling these functions greatly improves the performance
    VRMUtils.removeUnnecessaryVertices(gltf.scene);
    VRMUtils.combineSkeletons(gltf.scene);
    VRMUtils.combineMorphs(vrm);

    // Disable frustum culling
    vrm.scene.traverse((obj) => {
      obj.frustumCulled = false;
    });

    scene.add(vrm.scene);
    currentVrm = vrm;

    vrm.lookAt!.target = lookAtTarget;

    console.log(vrm);
  },

  (progress) =>
    console.log(
      "Loading model...",
      100.0 * (progress.loaded / progress.total),
      "%",
    ),

  (error) => console.error(error),
);

// helpers
const gridHelper = new THREE.GridHelper(10, 10);
scene.add(gridHelper);

const axesHelper = new THREE.AxesHelper(5);
scene.add(axesHelper);

// animate
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const deltaTime = clock.getDelta();

  if (currentVrm) {
    // update vrm
    currentVrm.update(deltaTime);
  }

  renderer.render(scene, camera);
}

animate();

// mouse listener
window.addEventListener("mousemove", (event) => {
  lookAtTarget.position.x =
    10.0 * ((event.clientX - 0.5 * window.innerWidth) / window.innerHeight);
  lookAtTarget.position.y =
    -10.0 * ((event.clientY - 0.5 * window.innerHeight) / window.innerHeight);
});

// Follow cursor
