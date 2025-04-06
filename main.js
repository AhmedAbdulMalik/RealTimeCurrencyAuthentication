import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Create the scene and set a background color
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x222222);

// Create the camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 2, 10);

// Set up the renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// OrbitControls for interactivity
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Add ambient light for base illumination
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6); // Soft white light
scene.add(ambientLight);

// Add a hemisphere light for balanced ambient lighting
const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.8); // Sky color, ground color, intensity
hemisphereLight.position.set(0, 20, 0);
scene.add(hemisphereLight);

// Add a directional light for sunlight effect
const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
dirLight.position.set(10, 20, 10);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;
dirLight.shadow.camera.near = 0.5;
dirLight.shadow.camera.far = 50;
scene.add(dirLight);

// Add multiple spotlights for focused lighting
const spotLight1 = new THREE.SpotLight(0xffffff, 1);
spotLight1.position.set(-10, 15, 10);
spotLight1.angle = Math.PI / 6;
spotLight1.castShadow = true;
scene.add(spotLight1);

const spotLight2 = new THREE.SpotLight(0xffffff, 1);
spotLight2.position.set(10, 15, -10);
spotLight2.angle = Math.PI / 6;
spotLight2.castShadow = true;
scene.add(spotLight2);

// Add point lights for additional illumination
const pointLight1 = new THREE.PointLight(0xffffff, 0.8);
pointLight1.position.set(5, 5, 5);
scene.add(pointLight1);

const pointLight2 = new THREE.PointLight(0xffffff, 0.8);
pointLight2.position.set(-5, 5, -5);
scene.add(pointLight2);

// Load the GLTF model
const loader = new GLTFLoader();
loader.load(
  './abandoned_warehouse_-_interior_scene/scene.gltf', // Adjust path if needed
  (gltf) => {
    const model = gltf.scene;

    // Process all meshes to enable shadows and proper texture encoding
    model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;

        // Ensure textures are properly encoded
        if (child.material && child.material.map) {
          child.material.map.encoding = THREE.sRGBEncoding;
          child.material.map.needsUpdate = true;
        }
      }
    });

    // Center the model in the scene
    const bbox = new THREE.Box3().setFromObject(model);
    const center = bbox.getCenter(new THREE.Vector3());
    const size = bbox.getSize(new THREE.Vector3());
    model.position.sub(center); // Center the model
    model.position.y += size.y / 2; // Lift the model slightly above the ground
    scene.add(model);

    // Adjust camera and controls to focus on the model
    camera.position.set(0, size.y, size.z * 2);
    controls.target.copy(center);
    controls.update();
  },
  (xhr) => {
    console.log(`Loading model: ${(xhr.loaded / xhr.total) * 100}% loaded`);
  },
  (error) => {
    console.error('An error occurred while loading the model:', error);
  }
);

// Handle window resizing
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Animation loop
function animate() {
  controls.update();
  renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);