import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { SSAOPass } from 'three/examples/jsm/postprocessing/SSAOPass.js';

// Declare model variable at the top level scope
let model;

// Create the scene and set a background color
const scene = new THREE.Scene();
// Darker background like in the reference images
scene.background = new THREE.Color(0x080808); // Darker background
scene.fog = new THREE.Fog(0x080808, 40, 80); // Darker fog

// Create the camera with wider field of view
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1, 5);

// Set up the renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0; // Increase exposure to make scene brighter
renderer.setClearColor(0x222222); // Set a dark gray background, not pure black
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// Post-processing setup
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

// Add SSAO (ambient occlusion) for more realistic shadows in crevices
const ssaoPass = new SSAOPass(scene, camera, window.innerWidth, window.innerHeight);
ssaoPass.kernelRadius = 16;
ssaoPass.minDistance = 0.005;
ssaoPass.maxDistance = 0.15;
ssaoPass.output = SSAOPass.OUTPUT.Default;
composer.addPass(ssaoPass);

// Add bloom effect for light glow - increase strength for better lamp glow
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.3,  // increased strength for better lamp glow
  0.4,
  0.7   // lower threshold to allow more elements to glow
);
composer.addPass(bloomPass);

// OrbitControls for interactivity
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.screenSpacePanning = false;
controls.minDistance = 3;
controls.maxDistance = 20;
controls.maxPolarAngle = Math.PI / 2;

// Drastically simplify the scene lighting to ensure visibility
// Remove any existing complex lighting setup and start with basics
scene.children.forEach(child => {
  if (child instanceof THREE.Light && !(child instanceof THREE.AmbientLight)) {
    scene.remove(child);
  }
});

// Update ambient light to be more realistic
const ambientLight = new THREE.AmbientLight(0x403020, 0.3); // Reduced ambient light intensity for more contrast
scene.add(ambientLight);

// Rename the directionalLight variable to mainLight
const mainLight = new THREE.DirectionalLight(0xffffff, 0.7); // Reduced intensity
mainLight.position.set(5, 10, 7.5);
mainLight.castShadow = true;
mainLight.shadow.mapSize.width = 2048;
mainLight.shadow.mapSize.height = 2048;
mainLight.shadow.camera.near = 0.1;
mainLight.shadow.camera.far = 50;
mainLight.shadow.camera.left = -10;
mainLight.shadow.camera.right = 10;
mainLight.shadow.camera.top = 10;
mainLight.shadow.camera.bottom = -10;
mainLight.shadow.bias = -0.001;
scene.add(mainLight);

// Add a fill light from another direction
const fillLight = new THREE.DirectionalLight(0xffffff, 0.5); // Reduced intensity
fillLight.position.set(-5, 5, -5);
scene.add(fillLight);

// Simple animation function
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  
  // Only render if model is loaded
  if (model) {
    renderer.render(scene, camera);
  } else {
    // Render the scene even without model during loading
    renderer.render(scene, camera);
  }
}

// Add loading screen handling
const loadingElement = document.getElementById('loading');
const errorElement = document.getElementById('error');
const errorDetailsElement = document.getElementById('error-details');

// Function to hide loading screen
function hideLoading() {
  if (loadingElement) {
    loadingElement.style.display = 'none';
  }
}

// Function to show error
function showError(message) {
  if (errorElement) {
    hideLoading();
    errorElement.style.display = 'flex';
    if (errorDetailsElement) {
      errorDetailsElement.textContent = message;
    }
  }
  console.error(message);
}

// Update the model loading code
const modelPath = './abandoned_warehouse_-_interior_scene/scene.gltf';

// Check if the model file exists before trying to load it
fetch(modelPath)
  .then(response => {
    if (!response.ok) {
      throw new Error(`Model file not found. Status: ${response.status}`);
    }
    console.log("Model file confirmed to exist, starting loader...");
    loadModel();
  })
  .catch(error => {
    showError(`Failed to locate model file: ${error.message}`);
  });

function loadModel() {
  const loader = new GLTFLoader();
  console.log("Loading model from path:", modelPath);

  loader.load(
    modelPath,
    (gltf) => {
      console.log("Model loaded successfully!");
      model = gltf.scene; // Assign to global model variable
      scene.add(model);

      // Process model materials and add enhanced textures
      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          
          // Ensure textures are properly encoded
          if (child.material && child.material.map) {
            child.material.map.encoding = THREE.sRGBEncoding;
            child.material.map.needsUpdate = true;
          }
          
          // Check for type of object to apply appropriate materials
          const name = child.name.toLowerCase();
          const materialName = child.material.name ? child.material.name.toLowerCase() : '';
          
          // Enhanced identification logic for different elements
          const isWindow = name.includes('window') || 
                          name.includes('glass') || 
                          materialName.includes('window') || 
                          materialName.includes('glass');
          
          const isLightFixture = name.includes('light') || 
                                name.includes('lamp') || 
                                name.includes('chandelier') ||
                                name.includes('bulb') ||
                                name.includes('luminaire') ||
                                materialName.includes('light') || 
                                materialName.includes('lamp');
          
          // Try to identify specific lamp types
          const isIndustrialLamp = isLightFixture && (
                                  name.includes('industrial') || 
                                  name.includes('factory') || 
                                  name.includes('pendant') ||
                                  name.includes('hang'));
          
          const isFluorescentLamp = isLightFixture && (
                                  name.includes('fluorescent') || 
                                  name.includes('tube') || 
                                  name.includes('strip') ||
                                  name.includes('panel'));
          
          const isPendantLamp = isLightFixture && (
                              name.includes('pendant') || 
                              name.includes('hang') || 
                              name.includes('drop') ||
                              name.includes('ceiling'));
          
          // Wall detection
          const isWall = name.includes('wall') || 
                        name.includes('brick') || 
                        name.includes('cube') || 
                        name.includes('structure') ||
                        name.includes('barrier') ||
                        name.includes('partition') ||
                        materialName.includes('wall') || 
                        materialName.includes('brick') ||
                        materialName.includes('concrete') ||
                        materialName.includes('plaster');
                        
          // Floor detection
          const isFloor = name.includes('floor') || 
                          name.includes('ground') || 
                          materialName.includes('floor') ||
                          name.includes('terrain');
          
          // Apply materials based on object type
          if (!child.material.isMeshStandardMaterial && !child.material.isMeshPhysicalMaterial) {
            // Convert basic materials to PBR materials
            const oldMaterial = child.material;
            let metalness = 0.3;
            let roughness = 0.7;
            
            if (isWindow) {
              // Apply broken glass texture for windows
              const glassTexture = createBrokenGlassTexture();
              
              const newMaterial = new THREE.MeshPhysicalMaterial({
                map: glassTexture,
                color: 0xffffff,
                metalness: 0.3,
                roughness: 0.2,
                transmission: 0.95,
                transparent: true,
                opacity: 0.8,
                envMapIntensity: 1.5, // Increased to better reflect environment
                clearcoat: 0.6,
                clearcoatRoughness: 0.2,
                side: THREE.DoubleSide,
                emissive: new THREE.Color(0x222222),
                emissiveIntensity: 0.1,
                reflectivity: 1.0,
                ior: 1.5 // Glass-like index of refraction
              });
              
              child.material = newMaterial;
            } 
            else if (isWall) {
              // Apply brick or concrete texture for walls
              const brickTexture = createBrickTexture();
              const roughnessMap = createRoughnessTexture();
              
              const newMaterial = new THREE.MeshStandardMaterial({
                map: brickTexture,
                roughnessMap: roughnessMap,
                roughness: 0.8,
                metalness: 0.1,
                envMapIntensity: 0.5
              });
              
              child.material = newMaterial;
            }
            else if (isFloor) {
              // Apply concrete floor texture
              const floorTexture = createFloorTexture();
              const roughnessMap = createRoughnessTexture();
              
              const newMaterial = new THREE.MeshStandardMaterial({
                map: floorTexture,
                roughnessMap: roughnessMap,
                roughness: 0.9,
                metalness: 0.1,
                envMapIntensity: 0.3
              });
              
              child.material = newMaterial;
            }
            else if (isLightFixture) {
              // Select appropriate lamp texture based on type
              let lampTexture, lampEmissiveMap, lampType;
              
              if (isIndustrialLamp) {
                lampType = 'industrial';
              } else if (isFluorescentLamp) {
                lampType = 'fluorescent';
              } else {
                lampType = 'pendant';
              }
              
              lampTexture = createLampTexture(lampType);
              lampEmissiveMap = createLampEmissiveMap(lampType);
              
              // Get position for adding actual light source
              const position = new THREE.Vector3();
              child.getWorldPosition(position);
              
              // Create a point light at the lamp position
              const lampLight = new THREE.PointLight(
                new THREE.Color(0xffc080), // More orange light color
                1.2, // Brightness
                10,  // Range
                2    // Decay
              );
              lampLight.position.copy(position);
              
              // Add slight random position offset for natural look
              lampLight.position.x += (Math.random() - 0.5) * 0.2;
              lampLight.position.y -= 0.2; // Slightly below the fixture
              lampLight.position.z += (Math.random() - 0.5) * 0.2;
              
              // Only some lamps cast shadows to prevent performance issues
              if (Math.random() > 0.5) { // Increased chance of shadow casting
                lampLight.castShadow = true;
                lampLight.shadow.bias = -0.001;
                lampLight.shadow.mapSize.width = 512;
                lampLight.shadow.mapSize.height = 512;
              }
              
              // Add a slight ambient glow around lamps using a sphere mesh
              const glowGeometry = new THREE.SphereGeometry(1.5, 16, 16);
              const glowMaterial = new THREE.MeshBasicMaterial({
                color: 0xfffbe5,
                transparent: true,
                opacity: 0.15,
                blending: THREE.AdditiveBlending
              });
              const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
              glowMesh.position.copy(lampLight.position);
              scene.add(glowMesh);
              
              // Update existing material
              child.material.map = lampTexture;
              child.material.metalness = lampType === 'industrial' ? 0.7 : 0.3;
              child.material.roughness = lampType === 'industrial' ? 0.4 : 0.6;
              child.material.emissive = new THREE.Color(0xfffbe5);
              child.material.emissiveIntensity = 1.0; // Increased to match Sketchfab
              child.material.emissiveMap = lampEmissiveMap;
              child.material.needsUpdate = true;
            }
            // Additional materials for chairs, railings, etc.
            else if (name.includes('chair') || name.includes('furniture')) {
              const chairTexture = createChairTexture();
              
              const newMaterial = new THREE.MeshStandardMaterial({
                map: chairTexture,
                roughness: 0.9,
                metalness: 0.05
              });
              
              child.material = newMaterial;
            }
          } else {
            // Enhance existing standard/physical materials
            if (isWindow) {
              const glassTexture = createBrokenGlassTexture();
              child.material.map = glassTexture;
              child.material.metalness = 0.2;
              child.material.roughness = 0.25;
              child.material.transmission = 0.95;
              child.material.transparent = true;
              child.material.opacity = 0.7;
              child.material.side = THREE.DoubleSide;
              child.material.emissive = new THREE.Color(0x111111);
              child.material.emissiveIntensity = 0.2;
              child.material.needsUpdate = true;
            }
            else if (isWall) {
              const brickTexture = createBrickTexture();
              const roughnessMap = createRoughnessTexture();
              
              child.material.map = brickTexture;
              child.material.roughnessMap = roughnessMap;
              child.material.roughness = 0.8;
              child.material.metalness = 0.1;
              child.material.needsUpdate = true;
            }
            else if (isFloor) {
              const floorTexture = createFloorTexture();
              const roughnessMap = createRoughnessTexture();
              
              child.material.map = floorTexture;
              child.material.roughnessMap = roughnessMap;
              child.material.roughness = 0.9;
              child.material.metalness = 0.1;
              child.material.needsUpdate = true;
            }
          }
        }
      });

      // Center the model in the scene
      const bbox = new THREE.Box3().setFromObject(model);
      const center = bbox.getCenter(new THREE.Vector3());
      const size = bbox.getSize(new THREE.Vector3());
      
      // Adjust model position
      model.position.x = -center.x;
      model.position.z = -center.z;
      model.position.y = -center.y;

      // Position camera relative to the model
      camera.position.set(0, 1, 5);
      controls.target.set(0, 1, 0);
      controls.update();
      
      // Add additional focused directional lights to mimic the Sketchfab lighting
      const sunLight = new THREE.DirectionalLight(0xffbe8a, 1.5); // Warm orangish light
      sunLight.position.set(-10, 20, 10);
      sunLight.castShadow = true;
      sunLight.shadow.mapSize.width = 2048;
      sunLight.shadow.mapSize.height = 2048;
      sunLight.shadow.camera.near = 0.1;
      sunLight.shadow.camera.far = 50;
      sunLight.shadow.camera.left = -15;
      sunLight.shadow.camera.right = 15;
      sunLight.shadow.camera.top = 15;
      sunLight.shadow.camera.bottom = -15;
      sunLight.shadow.bias = -0.001;
      scene.add(sunLight);

      // After model loading and before starting animation
      function setupWarehouseLighting() {
        console.log("Setting up atmospheric warehouse lighting");
        
        // Clear any existing lights except ambient
        scene.children.forEach(child => {
          if (child instanceof THREE.Light && 
              !(child instanceof THREE.AmbientLight) && 
              !(child instanceof THREE.HemisphereLight)) {
            scene.remove(child);
          }
        });
        
        // Add directional light for main illumination (simulating daylight)
        const sunlight = new THREE.DirectionalLight(0xaaddff, 0.4); // Cooler blue tone, less intensity
        sunlight.position.set(10, 15, 5);
        sunlight.castShadow = true;
        sunlight.shadow.mapSize.width = 2048;
        sunlight.shadow.mapSize.height = 2048;
        sunlight.shadow.bias = -0.001;
        scene.add(sunlight);
        
        // Add window lights - simulating light coming through windows
        addWindowLight(-5, 3, 0, 0xccddff, 0.8); // Left wall, cooler color
        addWindowLight(5, 3, 0, 0xc0d0ff, 0.7);  // Right wall, cooler color
        addWindowLight(0, 3, -5, 0xd0e0ff, 0.9); // Back wall, cooler color
        
        // Add industrial hanging lights
        addHangingLight(0, 4, -2, 0xd0d0ff, 0.3); // Cooler, less bright
        addHangingLight(-2, 4, 0, 0xc0c0ff, 0.25); // Cooler, less bright
        addHangingLight(2, 4, 1, 0xd5d5ff, 0.3); // Cooler, less bright
        
        // Add light beams - reduced number, more subtle
        addLightBeam(-3, 3, 0, 0xd0e0ff, 0.4);  // From left window, cooler and less intense
        
        // Add atmospheric fog
        scene.fog = new THREE.FogExp2(0x0a0a0a, 0.025); // Slightly less fog
      }
      
      // Function to add window light
      function addWindowLight(x, y, z, color, intensity) {
        const windowLight = new THREE.RectAreaLight(color, intensity, 2, 1);
        windowLight.position.set(x, y, z);
        windowLight.lookAt(0, 0, 0);
        scene.add(windowLight);
        
        // Add spotlight to create pool of light on floor - more subtle
        const spotlight = new THREE.SpotLight(color, intensity * 0.3, 15, Math.PI/3.5, 0.7); // Wider, softer beam
        spotlight.position.set(x, y, z);
        spotlight.target.position.set(x * 0.3, -2, z * 0.3);
        scene.add(spotlight);
        scene.add(spotlight.target);
        
        return { windowLight, spotlight };
      }
      
      // Function to add hanging industrial light
      function addHangingLight(x, y, z, color, intensity) {
        const hangingLight = new THREE.PointLight(color, intensity, 12, 2); // Shorter range
        hangingLight.position.set(x, y, z);
        scene.add(hangingLight);
        
        // Add light geometry
        const bulbGeometry = new THREE.SphereGeometry(0.08, 8, 8); // Smaller bulb
        const bulbMaterial = new THREE.MeshBasicMaterial({
          color: color,
          transparent: true,
          opacity: 0.6 // Less bright
        });
        const bulbMesh = new THREE.Mesh(bulbGeometry, bulbMaterial);
        bulbMesh.position.copy(hangingLight.position);
        scene.add(bulbMesh);
        
        // Add glow - smaller, less obvious
        const glowGeometry = new THREE.SphereGeometry(0.15, 16, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({
          color: color,
          transparent: true,
          opacity: 0.15, // Much more subtle
          blending: THREE.AdditiveBlending
        });
        const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
        glowMesh.position.copy(hangingLight.position);
        scene.add(glowMesh);
        
        // Add light fixture (simple cylinder)
        const fixtureGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.2, 8);
        const fixtureMaterial = new THREE.MeshStandardMaterial({
          color: 0x222222,
          roughness: 0.8,
          metalness: 0.5
        });
        const fixtureMesh = new THREE.Mesh(fixtureGeometry, fixtureMaterial);
        fixtureMesh.position.set(x, y + 0.15, z);
        scene.add(fixtureMesh);
        
        // Add wire
        const wireGeometry = new THREE.CylinderGeometry(0.01, 0.01, 1.5, 4);
        const wireMaterial = new THREE.MeshStandardMaterial({
          color: 0x111111,
          roughness: 0.9,
          metalness: 0.3
        });
        const wireMesh = new THREE.Mesh(wireGeometry, wireMaterial);
        wireMesh.position.set(x, y + 0.85, z);
        scene.add(wireMesh);
        
        return { hangingLight, bulbMesh, glowMesh, fixtureMesh, wireMesh };
      }
      
      // Function to add light beam (volumetric light)
      function addLightBeam(x, y, z, color, intensity) {
        // Create light beam geometry - smaller, less prominent
        const beamGeometry = new THREE.CylinderGeometry(0.3, 0.8, 5, 12, 4, true); // Smaller diameter, less segments
        beamGeometry.rotateX(Math.PI / 2);
        
        // Create custom material for light beam
        const beamMaterial = new THREE.ShaderMaterial({
          uniforms: {
            color: { value: new THREE.Color(color) },
            intensity: { value: intensity * 0.15 }, // Much lower intensity
            time: { value: 0 }
          },
          vertexShader: `
            varying vec2 vUv;
            varying float vDepth;
            
            void main() {
              vUv = uv;
              vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
              vDepth = 1.0 - abs(position.y) / 3.0;
              gl_Position = projectionMatrix * mvPosition;
            }
          `,
          fragmentShader: `
            uniform vec3 color;
            uniform float intensity;
            uniform float time;
            
            varying vec2 vUv;
            varying float vDepth;
            
            void main() {
              // Create dust effect
              float dust = sin(vUv.x * 5.0 + time * 0.0005) * sin(vUv.y * 4.0 + time * 0.001);
              dust = (dust * 0.5 + 0.5) * 0.2;
              
              // Fade from center to edges
              float fade = 1.0 - pow(abs(vUv.x - 0.5) * 2.0, 3.0); // Softer edge falloff
              
              // Combine with depth fade
              float alpha = fade * vDepth * intensity * (0.2 + dust);
              
              gl_FragColor = vec4(color, alpha);
            }
          `,
          transparent: true,
          blending: THREE.AdditiveBlending,
          side: THREE.DoubleSide,
          depthWrite: false
        });
        
        const beam = new THREE.Mesh(beamGeometry, beamMaterial);
        beam.position.set(x, y - 3, z);
        beam.rotation.z = Math.random() * Math.PI * 0.1 - Math.PI * 0.05;
        scene.add(beam);
        
        // Add dust particles in the beam - fewer particles, less visible
        const particlesGeometry = new THREE.BufferGeometry();
        const particleCount = 25; // Half as many particles
        const positionArray = new Float32Array(particleCount * 3);
        const sizeArray = new Float32Array(particleCount);
        
        for (let i = 0; i < particleCount; i++) {
          const i3 = i * 3;
          // Position within the beam
          const radius = Math.random() * 0.4; // Smaller radius
          const angle = Math.random() * Math.PI * 2;
          const height = Math.random() * 5 - 2.5;
          
          positionArray[i3] = x + Math.cos(angle) * radius;
          positionArray[i3 + 1] = y - height;
          positionArray[i3 + 2] = z + Math.sin(angle) * radius;
          
          sizeArray[i] = 0.01 + Math.random() * 0.03; // Smaller particles
        }
        
        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positionArray, 3));
        particlesGeometry.setAttribute('size', new THREE.BufferAttribute(sizeArray, 1));
        
        const particlesMaterial = new THREE.PointsMaterial({
          color: color,
          size: 0.05, // Smaller size
          transparent: true,
          opacity: 0.3, // Less visible
          map: createDustTexture(),
          blending: THREE.AdditiveBlending,
          depthWrite: false
        });
        
        const particles = new THREE.Points(particlesGeometry, particlesMaterial);
        scene.add(particles);
        
        // Animate dust particles - slower movement
        const animateBeam = () => {
          beamMaterial.uniforms.time.value = performance.now();
          
          // Slowly move particles
          const positions = particlesGeometry.attributes.position.array;
          for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            positions[i3] += (Math.random() - 0.5) * 0.002; // Slower movement
            positions[i3 + 1] += (Math.random() - 0.5) * 0.002; // Slower movement
            positions[i3 + 2] += (Math.random() - 0.5) * 0.002; // Slower movement
            
            // Keep particles within beam
            const dx = positions[i3] - x;
            const dz = positions[i3 + 2] - z;
            const dist = Math.sqrt(dx * dx + dz * dz);
            if (dist > 0.5 || positions[i3 + 1] > y || positions[i3 + 1] < y - 5) {
              // Reset particle
              const radius = Math.random() * 0.4;
              const angle = Math.random() * Math.PI * 2;
              const height = Math.random() * 5 - 2.5;
              
              positions[i3] = x + Math.cos(angle) * radius;
              positions[i3 + 1] = y - height;
              positions[i3 + 2] = z + Math.sin(angle) * radius;
            }
          }
          particlesGeometry.attributes.position.needsUpdate = true;
          
          requestAnimationFrame(animateBeam);
        };
        
        animateBeam();
        
        return { beam, particles };
      }
      
      // After model setup, add atmospheric lighting
      setupWarehouseLighting();
      
      // Start the currency notes animation
      createCurrencyAnimation();
      
      // Hide loading screen
      hideLoading();
    },
    (progress) => {
      // Log and update loading progress
      const percent = Math.round((progress.loaded / progress.total) * 100);
      console.log(`Loading progress: ${percent}%`);
      if (loadingElement) {
        loadingElement.textContent = `Loading model... ${percent}%`;
      }
    },
    (error) => {
      showError(`Error loading model: ${error.message}`);
    }
  );
}

// Handle window resizing
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});

// Animation loop
// renderer.setAnimationLoop(animate);
animate(); // Start the animation loop using our new function

// Function to create a brick texture procedurally
function createBrickTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  
  // Dark mortar color
  ctx.fillStyle = '#222222';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Brick pattern with more realistic proportions
  const brickWidth = 70;
  const brickHeight = 25; // Traditional brick ratio
  const mortarSize = 5;
  
  // Draw bricks with realistic red-orange brick colors
  for (let y = 0; y < canvas.height; y += brickHeight + mortarSize) {
    // Offset every other row
    const offset = (Math.floor(y / (brickHeight + mortarSize)) % 2) * (brickWidth / 2);
    
    for (let x = -offset; x < canvas.width; x += brickWidth + mortarSize) {
      // More realistic brick color variation - red-orange hues
      const r = 160 + Math.floor(Math.random() * 60); // More red
      const g = 70 + Math.floor(Math.random() * 40);  // Some orange
      const b = 50 + Math.floor(Math.random() * 25);  // Slight brown
      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      
      // Draw brick with slight variations in size
      const brickWidthVar = brickWidth * (0.98 + Math.random() * 0.04);
      const brickHeightVar = brickHeight * (0.98 + Math.random() * 0.04);
      ctx.fillRect(x, y, brickWidthVar, brickHeightVar);
      
      // Add some texture/noise within the brick
      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
      for (let i = 0; i < 15; i++) {
        const spotX = x + Math.random() * brickWidthVar;
        const spotY = y + Math.random() * brickHeightVar;
        const spotSize = 1 + Math.random() * 4;
        ctx.beginPath();
        ctx.arc(spotX, spotY, spotSize, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Add highlights to some bricks for more dimension
      if (Math.random() > 0.5) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.beginPath();
        ctx.arc(
          x + brickWidthVar * (0.3 + Math.random() * 0.4),
          y + brickHeightVar * (0.3 + Math.random() * 0.4),
          3 + Math.random() * 8,
          0, Math.PI * 2
        );
        ctx.fill();
      }
      
      // Add darker edges to some bricks
      if (Math.random() > 0.6) {
        ctx.strokeStyle = 'rgba(30, 10, 0, 0.4)';
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 1, y + 1, brickWidthVar - 2, brickHeightVar - 2);
      }
    }
  }
  
  // Add dark patches for weathering
  ctx.fillStyle = 'rgba(20, 10, 0, 0.3)';
  for (let i = 0; i < 40; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const size = 10 + Math.random() * 60;
    ctx.globalAlpha = 0.1 + Math.random() * 0.3;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Add some water damage streaks in black/brown
  ctx.fillStyle = 'rgba(20, 10, 0, 0.4)';
  for (let i = 0; i < 10; i++) {
    const x = Math.random() * canvas.width;
    const y = 20 + Math.random() * 50;
    const width = 5 + Math.random() * 20;
    const height = 100 + Math.random() * 200;
    
    // Create streak gradient
    const gradient = ctx.createLinearGradient(0, y, 0, y + height);
    gradient.addColorStop(0, 'rgba(20, 10, 0, 0.4)');
    gradient.addColorStop(0.4, 'rgba(20, 10, 0, 0.2)');
    gradient.addColorStop(1, 'rgba(20, 10, 0, 0)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, width, height);
  }
  
  // Add more pronounced dark stains
  for (let i = 0; i < 25; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const size = 30 + Math.random() * 70;
    
    const type = Math.floor(Math.random() * 3);
    if (type === 0) {
      // Dark stain
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    } else if (type === 1) {
      // Rust stain
      ctx.fillStyle = 'rgba(120, 40, 30, 0.2)';
    } else {
      // Oil stain
      ctx.fillStyle = 'rgba(30, 30, 40, 0.25)';
    }
    
    ctx.globalAlpha = 0.2 + Math.random() * 0.4;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Add wear and tear - scratches
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
  for (let i = 0; i < 40; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const length = 5 + Math.random() * 20;
    const angle = Math.random() * Math.PI * 2;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(
      x + Math.cos(angle) * length,
      y + Math.sin(angle) * length
    );
    ctx.lineWidth = 0.5 + Math.random() * 1;
    ctx.stroke();
  }
  
  // Add darker patches for worn areas
  for (let i = 0; i < 10; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const size = 20 + Math.random() * 60;
    
    const gradient = ctx.createRadialGradient(
      x, y, 0,
      x, y, size
    );
    
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0.3)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Create texture from canvas
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 1);
  
  return texture;
}

// Function to create roughness texture
function createRoughnessTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  
  // Fill with base roughness
  ctx.fillStyle = '#777777';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Add roughness variation
  for (let i = 0; i < 5000; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const size = 1 + Math.random() * 3;
    const brightness = 100 + Math.floor(Math.random() * 155);
    ctx.fillStyle = `rgb(${brightness}, ${brightness}, ${brightness})`;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Function to create floor texture
function createFloorTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  
  // Base darker concrete color
  ctx.fillStyle = '#303030';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Add concrete texture/noise
  for (let i = 0; i < 12000; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const size = 1 + Math.random() * 2;
    const brightness = 45 + Math.floor(Math.random() * 25);
    ctx.fillStyle = `rgb(${brightness}, ${brightness}, ${brightness})`;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Add more pronounced cracks
  ctx.strokeStyle = '#1a1a1a';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 30; i++) {
    ctx.beginPath();
    const startX = Math.random() * canvas.width;
    const startY = Math.random() * canvas.height;
    ctx.moveTo(startX, startY);
    
    let lastX = startX;
    let lastY = startY;
    
    for (let j = 0; j < 5; j++) {
      const newX = lastX + (Math.random() * 100 - 50);
      const newY = lastY + (Math.random() * 100 - 50);
      ctx.lineTo(newX, newY);
      lastX = newX;
      lastY = newY;
    }
    
    ctx.stroke();
  }
  
  // Add some debris/papers on floor
  for (let i = 0; i < 70; i++) {
    const paperType = Math.floor(Math.random() * 3);
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    
    if (paperType === 0) {
      // Paper/document
      ctx.fillStyle = 'rgba(220, 220, 220, 0.9)';
      const width = 10 + Math.random() * 15;
      const height = 12 + Math.random() * 18;
      // Rotate paper
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.random() * Math.PI * 2);
      ctx.fillRect(-width/2, -height/2, width, height);
      // Add lines to paper
      if (Math.random() > 0.5) {
        ctx.strokeStyle = 'rgba(100, 100, 100, 0.5)';
        ctx.lineWidth = 0.5;
        for (let j = 0; j < 3; j++) {
          const lineY = -height/2 + (j + 1) * height/4;
          ctx.beginPath();
          ctx.moveTo(-width/2 + 2, lineY);
          ctx.lineTo(width/2 - 2, lineY);
          ctx.stroke();
        }
      }
      ctx.restore();
    } else if (paperType === 1) {
      // Small debris/trash
      ctx.fillStyle = `rgba(${50 + Math.random() * 50}, ${40 + Math.random() * 40}, ${30 + Math.random() * 30}, 0.8)`;
      const size = 2 + Math.random() * 6;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Dust/dirt pile
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, 5 + Math.random() * 15);
      gradient.addColorStop(0, 'rgba(60, 60, 60, 0.6)');
      gradient.addColorStop(1, 'rgba(60, 60, 60, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, 10 + Math.random() * 20, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// Function to create realistic broken window glass texture
function createBrokenGlassTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  
  // Base glass color - slightly dirty/tinted
  ctx.fillStyle = '#384048';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Add some texture to base glass
  for (let i = 0; i < 5000; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const size = 0.5 + Math.random() * 1;
    const alpha = Math.random() * 0.05;
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }

  // Add cracks - make more visible with higher contrast
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'; // Increased visibility
  for (let i = 0; i < 15; i++) {
    const startX = Math.random() * canvas.width;
    const startY = Math.random() * canvas.height;
    
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    
    // Fracture pattern - random branches from center
    const branches = 3 + Math.floor(Math.random() * 5);
    for (let j = 0; j < branches; j++) {
      let currentX = startX;
      let currentY = startY;
      
      // Create a branch with multiple segments
      const segments = 2 + Math.floor(Math.random() * 4);
      for (let k = 0; k < segments; k++) {
        const angle = Math.random() * Math.PI * 2;
        const length = 20 + Math.random() * 70;
        const newX = currentX + Math.cos(angle) * length;
        const newY = currentY + Math.sin(angle) * length;
        
        ctx.lineWidth = 0.5 + Math.random() * 1.5;
        ctx.lineTo(newX, newY);
        
        // Add some branches
        if (Math.random() > 0.7) {
          const branchAngle = angle + (Math.random() * Math.PI / 2 - Math.PI / 4);
          const branchLength = length * 0.4;
          const branchX = currentX + Math.cos(branchAngle) * branchLength;
          const branchY = currentY + Math.sin(branchAngle) * branchLength;
          
          ctx.moveTo(currentX, currentY);
          ctx.lineTo(branchX, branchY);
          ctx.moveTo(newX, newY);
        }
        
        currentX = newX;
        currentY = newY;
      }
    }
    
    ctx.stroke();
  }

  // Add bright areas for completely broken glass
  for (let i = 0; i < 8; i++) {
    if (Math.random() > 0.5) {
      // Broken section where outside light comes in
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const radius = 10 + Math.random() * 40;
      
      // Create gradient for light
      const gradient = ctx.createRadialGradient(
        x, y, 0,
        x, y, radius
      );
      
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
      gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.4)');
      gradient.addColorStop(1, 'rgba(200, 230, 255, 0)');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      
      // Create irregular shape for broken part
      ctx.moveTo(x, y);
      const points = 5 + Math.random() * 5;
      for (let j = 0; j < points; j++) {
        const angle = (j / points) * Math.PI * 2;
        const distance = radius * (0.5 + Math.random() * 0.5);
        ctx.lineTo(
          x + Math.cos(angle) * distance,
          y + Math.sin(angle) * distance
        );
      }
      
      ctx.closePath();
      ctx.fill();
    }
  }
  
  // Add dirt/dust build-up around edges
  ctx.fillStyle = 'rgba(20, 20, 20, 0.2)';
  for (let i = 0; i < 30; i++) {
    const x = Math.random() * canvas.width;
    const y = 5 + Math.random() * 10;
    const width = 10 + Math.random() * 80;
    const height = 5 + Math.random() * 20;
    
    ctx.globalAlpha = 0.1 + Math.random() * 0.3;
    ctx.beginPath();
    ctx.ellipse(x, y, width, height, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Also add some to bottom edge
    const bottomY = canvas.height - (5 + Math.random() * 10);
    ctx.beginPath();
    ctx.ellipse(x, bottomY, width, height, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Create texture from canvas
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 1);
  
  return texture;
}

// Function to create worn chair texture
function createChairTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  
  // Base wood color - dark and worn
  const baseColor = {
    r: 40 + Math.floor(Math.random() * 20),
    g: 25 + Math.floor(Math.random() * 15),
    b: 15 + Math.floor(Math.random() * 10)
  };
  
  ctx.fillStyle = `rgb(${baseColor.r}, ${baseColor.g}, ${baseColor.b})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Add wood grain
  for (let i = 0; i < 30; i++) {
    const x = 0;
    const y = Math.random() * canvas.height;
    const width = canvas.width;
    const height = 3 + Math.random() * 10;
    
    const grainColor = {
      r: baseColor.r + Math.floor(Math.random() * 20 - 10),
      g: baseColor.g + Math.floor(Math.random() * 15 - 5),
      b: baseColor.b + Math.floor(Math.random() * 10)
    };
    
    ctx.fillStyle = `rgba(${grainColor.r}, ${grainColor.g}, ${grainColor.b}, 0.3)`;
    ctx.fillRect(x, y, width, height);
  }
}

// Function to create internal-view broken glass texture (from inside looking out)
function createInternalGlassTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  
  // Base glass color - slightly tinted from inside
  ctx.fillStyle = '#345055';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Add outside light coming in - bright background
  const outsideGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  outsideGradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
  outsideGradient.addColorStop(0.5, 'rgba(200, 255, 255, 0.05)');
  outsideGradient.addColorStop(1, 'rgba(150, 200, 255, 0.1)');
  
  ctx.fillStyle = outsideGradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Add some basic texture to glass
  for (let i = 0; i < 5000; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const size = 0.5 + Math.random() * 1;
    const alpha = Math.random() * 0.05;
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }

  // Add visible cracks
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  for (let i = 0; i < 15; i++) {
    const startX = Math.random() * canvas.width;
    const startY = Math.random() * canvas.height;
    
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    
    // Fracture pattern - random branches from center
    const branches = 3 + Math.floor(Math.random() * 5);
    for (let j = 0; j < branches; j++) {
      let currentX = startX;
      let currentY = startY;
      
      // Create a branch with multiple segments
      const segments = 2 + Math.floor(Math.random() * 4);
      for (let k = 0; k < segments; k++) {
        const angle = Math.random() * Math.PI * 2;
        const length = 20 + Math.random() * 70;
        const newX = currentX + Math.cos(angle) * length;
        const newY = currentY + Math.sin(angle) * length;
        
        ctx.lineWidth = 0.5 + Math.random() * 1.5; // Slightly thicker lines
        ctx.lineTo(newX, newY);
        
        // Add some branches
        if (Math.random() > 0.7) {
          const branchAngle = angle + (Math.random() * Math.PI / 2 - Math.PI / 4);
          const branchLength = length * 0.4;
          const branchX = currentX + Math.cos(branchAngle) * branchLength;
          const branchY = currentY + Math.sin(branchAngle) * branchLength;
          
          ctx.moveTo(currentX, currentY);
          ctx.lineTo(branchX, branchY);
          ctx.moveTo(newX, newY);
        }
        
        currentX = newX;
        currentY = newY;
      }
    }
    
    ctx.stroke();
  }
  
  // Create texture from canvas
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 1);
  
  return texture;
}

// Function to create weathered concrete wall texture
function createConcreteWallTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  
  // Base concrete color - grayish
  const baseColor = {
    r: 150 + Math.floor(Math.random() * 30),
    g: 150 + Math.floor(Math.random() * 30),
    b: 150 + Math.floor(Math.random() * 30)
  };
  
  ctx.fillStyle = `rgb(${baseColor.r}, ${baseColor.g}, ${baseColor.b})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Add concrete texture - small speckles
  for (let i = 0; i < 10000; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const size = 0.5 + Math.random() * 1.5;
    
    const colorVariation = Math.random() * 50 - 25;
    const speckleColor = {
      r: Math.max(0, Math.min(255, baseColor.r + colorVariation)),
      g: Math.max(0, Math.min(255, baseColor.g + colorVariation)),
      b: Math.max(0, Math.min(255, baseColor.b + colorVariation))
    };
    
    ctx.fillStyle = `rgba(${speckleColor.r}, ${speckleColor.g}, ${speckleColor.b}, 0.5)`;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Add larger patches and stains
  for (let i = 0; i < 20; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const size = 20 + Math.random() * 80;
    
    // Darker or lighter patch
    const darkerOrLighter = Math.random() > 0.5;
    const alpha = 0.1 + Math.random() * 0.2;
    
    const gradient = ctx.createRadialGradient(
      x, y, 0,
      x, y, size
    );
    
    if (darkerOrLighter) {
      gradient.addColorStop(0, `rgba(0, 0, 0, ${alpha})`);
    } else {
      gradient.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
    }
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Add cracks
  ctx.strokeStyle = 'rgba(50, 50, 50, 0.4)';
  for (let i = 0; i < 10; i++) {
    const startX = Math.random() * canvas.width;
    const startY = Math.random() * canvas.height;
    
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    
    // Fracture pattern
    const segments = 3 + Math.floor(Math.random() * 5);
    let currentX = startX;
    let currentY = startY;
    
    for (let j = 0; j < segments; j++) {
      const angle = Math.random() * Math.PI * 2;
      const length = 20 + Math.random() * 80;
      const newX = currentX + Math.cos(angle) * length;
      const newY = currentY + Math.sin(angle) * length;
      
      ctx.lineTo(newX, newY);
      currentX = newX;
      currentY = newY;
    }
    
    ctx.stroke();
  }
}

// Function to create a painted wall texture (for interior walls)
function createPaintedWallTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  
  // Choose a wall paint color - muted colors
  const colorPalette = [
    {r: 240, g: 240, b: 235}, // off-white
    {r: 220, g: 220, b: 200}, // cream
    {r: 200, g: 210, b: 220}, // light blue-gray
    {r: 210, g: 200, b: 190}, // beige
    {r: 190, g: 200, b: 190}  // light sage
  ];
  
  const baseColor = colorPalette[Math.floor(Math.random() * colorPalette.length)];
  
  // Base color
  ctx.fillStyle = `rgb(${baseColor.r}, ${baseColor.g}, ${baseColor.b})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Add subtle texture - roller pattern
  ctx.globalAlpha = 0.05;
  for (let y = 0; y < canvas.height; y += 10) {
    for (let x = 0; x < canvas.width; x += 3) {
      const offset = (y % 20 === 0) ? 0 : 1.5;
      const height = 8;
      const colorVariation = Math.random() * 20 - 10;
      
      ctx.fillStyle = `rgb(
        ${Math.max(0, Math.min(255, baseColor.r + colorVariation))}, 
        ${Math.max(0, Math.min(255, baseColor.g + colorVariation))}, 
        ${Math.max(0, Math.min(255, baseColor.b + colorVariation))})`;
      
      ctx.fillRect(x + offset, y, 1, height);
    }
  }
  ctx.globalAlpha = 1.0;
}

// Function to create a realistic lamp texture
function createLampTexture(type = 'industrial') {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  
  // Clear canvas
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  if (type === 'industrial') {
    // Industrial/factory style lamp
    
    // Metal frame - dark gunmetal
    ctx.fillStyle = '#333740';
    ctx.beginPath();
    ctx.arc(canvas.width/2, canvas.height/2, canvas.width/2.2, 0, Math.PI * 2);
    ctx.fill();
    
    // Outer rim
    ctx.strokeStyle = '#555963';
    ctx.lineWidth = canvas.width/25;
    ctx.beginPath();
    ctx.arc(canvas.width/2, canvas.height/2, canvas.width/2.5, 0, Math.PI * 2);
    ctx.stroke();
    
    // Add rivets around rim
    ctx.fillStyle = '#60646e';
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const x = canvas.width/2 + Math.cos(angle) * (canvas.width/2.5);
      const y = canvas.height/2 + Math.sin(angle) * (canvas.width/2.5);
      ctx.beginPath();
      ctx.arc(x, y, canvas.width/40, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    // Default - simple pendant lamp
    
    // Metal housing/cap
    ctx.fillStyle = '#303030';
    ctx.beginPath();
    ctx.arc(canvas.width/2, canvas.height * 0.3, canvas.width/8, 0, Math.PI * 2);
    ctx.fill();
    
    // Reflective metal edge
    ctx.strokeStyle = '#606060';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(canvas.width/2, canvas.height * 0.3, canvas.width/8, 0, Math.PI * 2);
    ctx.stroke();
    
    // Cord
    ctx.fillStyle = '#101010';
    ctx.fillRect(canvas.width/2 - 2, 0, 4, canvas.height * 0.3);
    
    // Lamp shade - cone
    ctx.fillStyle = '#404040';
    ctx.beginPath();
    ctx.moveTo(canvas.width/2 - canvas.width/8, canvas.height * 0.3);
    ctx.lineTo(canvas.width/2 + canvas.width/8, canvas.height * 0.3);
    ctx.lineTo(canvas.width/2 + canvas.width/4, canvas.height * 0.6);
    ctx.lineTo(canvas.width/2 - canvas.width/4, canvas.height * 0.6);
    ctx.closePath();
    ctx.fill();
  }
  
  // Add stains and wear
  for (let i = 0; i < 15; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const size = 10 + Math.random() * 50;
    
    const gradient = ctx.createRadialGradient(
      x, y, 0,
      x, y, size
    );
    
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0.1)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Add some cracks or chips in the paint
  ctx.strokeStyle = 'rgba(100, 100, 100, 0.2)';
  for (let i = 0; i < 8; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const size = 5 + Math.random() * 15;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    
    for (let j = 0; j < 3; j++) {
      const angle = Math.random() * Math.PI * 2;
      const length = size * (0.5 + Math.random() * 0.5);
      ctx.lineTo(
        x + Math.cos(angle) * length,
        y + Math.sin(angle) * length
      );
    }
    
    ctx.lineWidth = 0.5 + Math.random() * 1;
    ctx.stroke();
  }
  
  // Light bulb
  ctx.fillStyle = '#f9f5e3';
  ctx.beginPath();
  ctx.arc(canvas.width/2, canvas.height * 0.5, canvas.width/10, 0, Math.PI * 2);
  ctx.fill();
  
  // Light glow
  const gradient = ctx.createRadialGradient(
    canvas.width/2, canvas.height * 0.5, 0,
    canvas.width/2, canvas.height * 0.5, canvas.width/5
  );
  gradient.addColorStop(0, 'rgba(255, 250, 230, 0.9)');
  gradient.addColorStop(0.5, 'rgba(255, 250, 230, 0.4)');
  gradient.addColorStop(1, 'rgba(255, 250, 230, 0)');
  
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(canvas.width/2, canvas.height * 0.5, canvas.width/5, 0, Math.PI * 2);
  ctx.fill();
  
  // Inside of lamp shade - lighter color reflecting light
  ctx.fillStyle = '#808080';
  ctx.beginPath();
  ctx.moveTo(canvas.width/2 - canvas.width/8 + 3, canvas.height * 0.3 + 3);
  ctx.lineTo(canvas.width/2 + canvas.width/8 - 3, canvas.height * 0.3 + 3);
  ctx.lineTo(canvas.width/2 + canvas.width/4 - 6, canvas.height * 0.6 - 3);
  ctx.lineTo(canvas.width/2 - canvas.width/4 + 6, canvas.height * 0.6 - 3);
  ctx.closePath();
  ctx.fill();

  // Create texture from canvas
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 1);
  
  return texture;
}

// Function to create lamp emissive map
function createLampEmissiveMap(type = 'industrial') {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  
  // Clear canvas to black (non-emissive)
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  if (type === 'industrial') {
    // Just the light/glass area is emissive
    const gradient = ctx.createRadialGradient(
      canvas.width/2, canvas.height/2, 0,
      canvas.width/2, canvas.height/2, canvas.width/2.7
    );
    gradient.addColorStop(0, '#fffbf0');
    gradient.addColorStop(0.7, '#ffeecc');
    gradient.addColorStop(1, '#000000');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(canvas.width/2, canvas.height/2, canvas.width/2.7, 0, Math.PI * 2);
    ctx.fill();
    
    // Extra bright center
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(canvas.width/2, canvas.height/2, canvas.width/6, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === 'fluorescent') {
    // The light tubes are emissive
    ctx.fillStyle = '#fffef0';
    ctx.fillRect(canvas.width * 0.2, canvas.height * 0.35, canvas.width * 0.6, canvas.height * 0.08);
    ctx.fillRect(canvas.width * 0.2, canvas.height * 0.57, canvas.width * 0.6, canvas.height * 0.08);
  }
}

// Directional light (simulating sun/moon)
const directionalLight = new THREE.DirectionalLight(0xcccccc, 1.0);
directionalLight.position.set(5, 10, 7.5);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.camera.near = 0.1;
directionalLight.shadow.camera.far = 50;
directionalLight.shadow.camera.left = -10;
directionalLight.shadow.camera.right = 10;
directionalLight.shadow.camera.top = 10;
directionalLight.shadow.camera.bottom = -10;
directionalLight.shadow.bias = -0.001;
scene.add(directionalLight);

// Add view button handlers
document.addEventListener('DOMContentLoaded', () => {
  // Set up view buttons
  const exteriorViewBtn = document.getElementById('exterior-view');
  const interiorViewBtn = document.getElementById('interior-view');
  const sideViewBtn = document.getElementById('side-view');
  
  if (exteriorViewBtn) {
    exteriorViewBtn.addEventListener('click', () => {
      window.location.hash = '';
      camera.position.set(5, 3, 5);
      controls.target.set(0, 1, 0);
      controls.update();
    });
  }
  
  if (interiorViewBtn) {
    interiorViewBtn.addEventListener('click', () => {
      window.location.hash = 'interior';
      camera.position.set(0, 1.5, 0);
      controls.target.set(0, 1.5, -3);
      controls.update();
    });
  }
  
  if (sideViewBtn) {
    sideViewBtn.addEventListener('click', () => {
      window.location.hash = 'side';
      camera.position.set(8, 3, 0);
      controls.target.set(0, 1, 0);
      controls.update();
    });
  }
});

// Add a skybox to the scene - add this after the scene creation
function createSkybox() {
  const loader = new THREE.CubeTextureLoader();
  const skyboxTexture = loader.load([
    './skybox/abandoned_warehouse_ft.jpg', // front
    './skybox/abandoned_warehouse_bk.jpg', // back
    './skybox/abandoned_warehouse_up.jpg', // up
    './skybox/abandoned_warehouse_dn.jpg', // down
    './skybox/abandoned_warehouse_rt.jpg', // right
    './skybox/abandoned_warehouse_lf.jpg', // left
  ]);
  
  scene.background = skyboxTexture;
  
  // Also use the skybox as environment map for reflections
  scene.environment = skyboxTexture;
  return skyboxTexture;
}

// Check if skybox folder exists before loading
fetch('./skybox/abandoned_warehouse_ft.jpg')
  .then(response => {
    if (response.ok) {
      // If skybox textures exist, create and apply skybox
      const skyboxTexture = createSkybox();
      console.log("Skybox loaded successfully");
    } else {
      // If skybox textures don't exist, create them programmatically
      console.log("Skybox textures not found, using procedural skybox");
      createProceduralSkybox();
    }
  })
  .catch(error => {
    console.log("Skybox textures not found, using procedural skybox");
    createProceduralSkybox();
  });

// Completely rewrite the createProceduralSkybox function for a more realistic effect
function createProceduralSkybox() {
  // We'll create a more sophisticated procedural skybox with warm central beam and cooler edges
  // Remove existing background
  scene.background = null;
  
  // Create a large sphere for the sky
  const skyGeometry = new THREE.SphereGeometry(500, 32, 32);
  
  // Create vertex shader for the sky
  const skyVertexShader = `
    varying vec3 vWorldPosition;
    varying vec3 vPosition;
    
    void main() {
      vPosition = position;
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPosition.xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;
  
  // Create fragment shader for the sky
  const skyFragmentShader = `
    uniform vec3 centerColor;
    uniform vec3 midColor;
    uniform vec3 edgeColor;
    uniform float beamWidth;
    uniform float beamPosition;
    
    varying vec3 vWorldPosition;
    varying vec3 vPosition;
    
    void main() {
      // Get position in normalized form
      vec3 direction = normalize(vPosition);
      
      // Create central beam effect - based on x position
      float distFromCenter = abs(direction.x - beamPosition);
      
      // Calculate beam intensity with soft falloff
      float beamIntensity = smoothstep(beamWidth, 0.0, distFromCenter);
      
      // Add subtle noise
      float noise = fract(sin(direction.x * 100.0 + direction.y * 43.0) * 1000.0) * 0.03;
      beamIntensity = beamIntensity + noise;
      
      // Blend colors based on beam intensity and position
      vec3 finalColor;
      
      if (distFromCenter < beamWidth * 1.5) {
        // Center to mid gradient
        finalColor = mix(midColor, centerColor, beamIntensity);
      } else {
        // Mid to edge gradient
        float edgeFactor = smoothstep(0.0, 0.8, distFromCenter - beamWidth);
        finalColor = mix(midColor, edgeColor, edgeFactor);
      }
      
      // Add some atmospheric fog near horizon
      float horizonFactor = 1.0 - abs(direction.y);
      finalColor = mix(finalColor, midColor * 0.8, horizonFactor * horizonFactor * 0.3);
      
      gl_FragColor = vec4(finalColor, 1.0);
    }
  `;

  // Create material with the shaders and warm golden beam
  const skyMaterial = new THREE.ShaderMaterial({
    uniforms: {
      centerColor: { value: new THREE.Color(0xc0a070) },   // Darker warm center
      midColor: { value: new THREE.Color(0x705a40) },      // Darker warm beige
      edgeColor: { value: new THREE.Color(0x353540) },     // Darker blue-gray edge
      beamWidth: { value: 0.15 },                          // Width of central beam
      beamPosition: { value: 0.0 }                         // Center beam at x=0
    },
    vertexShader: skyVertexShader,
    fragmentShader: skyFragmentShader,
    side: THREE.BackSide
  });
  
  const sky = new THREE.Mesh(skyGeometry, skyMaterial);
  scene.add(sky);
  
  // Create an environment map for reflections
  const envMapSize = 256;
  const envMapRenderTarget = new THREE.WebGLCubeRenderTarget(envMapSize);
  const envMapCamera = new THREE.CubeCamera(0.1, 1000, envMapRenderTarget);
  
  // Hide sky temporarily to create the environment map
  sky.visible = false;
  envMapCamera.update(renderer, scene);
  sky.visible = true;
  
  // Set the environment map for the scene
  scene.environment = envMapRenderTarget.texture;
  
  return { sky, envMapRenderTarget };
}

// Create volumetric light rays effect
function createLightRays(position, intensity = 1.0) {
  // Create a spotlight to create the light ray effect
  const spotlight = new THREE.SpotLight(
    new THREE.Color(0xffffff),
    intensity * 2.0,
    30,
    Math.PI / 6,
    0.5,
    1
  );
  
  spotlight.position.copy(position);
  // Aim slightly downward
  spotlight.target.position.set(
    position.x, 
    position.y - 5, 
    position.z
  );
  scene.add(spotlight.target);
  
  // Add visible light beam geometry
  const geometry = new THREE.CylinderGeometry(0.2, 4, 20, 8, 1, true);
  // Rotate the geometry to match spotlight direction
  geometry.applyMatrix4(new THREE.Matrix4().makeRotationX(Math.PI / 2));
  
// Cr eate custom material for light beam
  const material = new THREE.ShaderMaterial({
    uniforms: {
      color: { value: new THREE.Color(0xffffff) },
      spotPosition: { value: new THREE.Vector3() },
      time: { value: 0 },
      intensity: { value: intensity * 0.4 }
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vWorldPosition;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 color;
      uniform vec3 spotPosition;
      uniform float time;
      uniform float intensity;
      varying vec3 vNormal;
      varying vec3 vWorldPosition;
      void main() {
        // Calculate distance from center of beam
        vec3 directionToLight = normalize(spotPosition - vWorldPosition);
        float dotProduct = dot(vNormal, directionToLight);
        
        // Animated dust effect
        float dustEffect = sin(time * 0.001 + vWorldPosition.x * 2.0) * 0.5 + 0.5;
        dustEffect *= sin(time * 0.002 + vWorldPosition.z * 3.0) * 0.5 + 0.5;
        
        // Edge glow and fade out
        float edge = (1.0 - abs(dotProduct)) * 0.5;
        
        // Combined effect
        float alpha = edge * intensity * (0.5 + dustEffect * 0.5);
        alpha *= smoothstep(0.0, 0.3, 1.0 - length(vWorldPosition - spotPosition) / 20.0);
        
        gl_FragColor = vec4(color, alpha);
      }
    `,
    side: THREE.DoubleSide,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  // Create mesh and position it
  const lightBeam = new THREE.Mesh(geometry, material);
  lightBeam.position.copy(position);
  // Rotate to point downward
  lightBeam.rotation.x = Math.PI / 2;
  
  // Add dust particles in the light beam
  const particlesGeometry = new THREE.BufferGeometry();
  const particleCount = 200;
  const positions = new Float32Array(particleCount * 3);
  const particleSizes = new Float32Array(particleCount);
  
  for (let i = 0; i < particleCount; i++) {
    // Random position within a cone shape
    const radius = Math.random() * 2;
    const theta = Math.random() * Math.PI * 2;
    const y = Math.random() * 20;
    
    positions[i * 3] = position.x + radius * Math.cos(theta);
    positions[i * 3 + 1] = position.y - y;
    positions[i * 3 + 2] = position.z + radius * Math.sin(theta);
    
    particleSizes[i] = 0.05 + Math.random() * 0.15;
  }
  
  particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particlesGeometry.setAttribute('size', new THREE.BufferAttribute(particleSizes, 1));
  
  const particlesMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.1,
    transparent: true,
    opacity: 0.2,
    map: createDustTexture(),
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  
  const particles = new THREE.Points(particlesGeometry, particlesMaterial);
  
  // Animate the light beam and particles
  const clock = new THREE.Clock();
  
  function animateLightBeam() {
    const time = clock.getElapsedTime() * 1000;
    
    // Update shader time
    material.uniforms.time.value = time;
    material.uniforms.spotPosition.value = spotlight.position;
    
    // Animate dust particles
    const positions = particlesGeometry.attributes.position.array;
    for (let i = 0; i < particleCount; i++) {
      // Subtle movement
      positions[i * 3] += Math.sin(time * 0.001 + i) * 0.0005;
      positions[i * 3 + 2] += Math.cos(time * 0.001 + i * 0.7) * 0.0005;
      
      // Reset particles that fall too far
      positions[i * 3 + 1] += 0.01;
      if (positions[i * 3 + 1] > position.y) {
        positions[i * 3 + 1] = position.y - 20;
      }
    }
    particlesGeometry.attributes.position.needsUpdate = true;
    
    requestAnimationFrame(animateLightBeam);
  }
  
  animateLightBeam();
  
  scene.add(spotlight);
  scene.add(lightBeam);
  scene.add(particles);
  
  return { spotlight, lightBeam, particles };
}

// Helper function to create dust particle texture
function createDustTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');
  
  // Draw particle
  const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.5, 'rgba(240, 240, 240, 0.5)');
  gradient.addColorStop(1, 'rgba(220, 220, 220, 0)');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 32, 32);
  
  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

// Replace the createCurrencyAnimation function with a version that drops notes from the air
function createCurrencyAnimation() {
  console.log("Creating currency animation with continuous falling notes");
  
  // Create a very simple static display of rupee notes on the floor
  const centerPos = new THREE.Vector3(0, 0.05, 0);
  
  // Create rupee texture
  const rupeeTexture = (() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    // Base color
    ctx.fillStyle = '#D92D6F'; // Magenta color of 2000 rupee note
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add border
    ctx.strokeStyle = '#222222';
    ctx.lineWidth = 8;
    ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
    
    // Add "2000" text
    ctx.font = 'bold 80px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText('2000', canvas.width / 2, 100);
    
    return new THREE.CanvasTexture(canvas);
  })();
  
  // Create a group for the notes
  const pileGroup = new THREE.Group();
  scene.add(pileGroup);
  
  // Note properties
  const noteWidth = 0.5;
  const noteHeight = 0.25;
  const notes = [];
  const noteSpeeds = [];
  const noteRotations = [];
  const maxNotes = 150; // Increased from 30 to 150 maximum notes
  
  // Define floor height precisely - MUCH LOWER
  const floorHeight = -2.8; // Significantly lower floor detection height
  console.log("Floor detection height set to:", floorHeight);
  
  // Create a note function
  function createNote() {
    const noteGeometry = new THREE.PlaneGeometry(noteWidth, noteHeight);
    const noteMaterial = new THREE.MeshStandardMaterial({
      map: rupeeTexture,
      roughness: 0.4,
      metalness: 0.3,
      side: THREE.DoubleSide
    });
    
    const note = new THREE.Mesh(noteGeometry, noteMaterial);
    
    // Position notes inside the building with more spread
    const offsetX = (Math.random() * 1.2) - 0.6; // Wider spread
    const offsetZ = (Math.random() * 1.2) - 0.6; // Wider spread
    const height = 1.5 + Math.random() * 0.5; // Lower height inside the building
    
    note.position.set(centerPos.x + offsetX, height, centerPos.z + offsetZ);
    
    // Start with a flat orientation with slight variation
    note.rotation.x = Math.PI / 2 + (Math.random() * 0.1 - 0.05);
    note.rotation.y = Math.random() * Math.PI * 2;
    note.rotation.z = Math.random() * 0.1 - 0.05;
    
    note.castShadow = true;
    note.receiveShadow = true;
    
    // Add to the scene
    pileGroup.add(note);
    
    // Store animation data
    notes.push({
      mesh: note,
      landed: false,
      timeOnGround: 0, // Track how long the note has been on the ground
      speed: 0.07 + Math.random() * 0.05,
      rotation: {
        x: (Math.random() * 0.03) - 0.015,
        y: (Math.random() * 0.03) - 0.015,
        z: (Math.random() * 0.03) - 0.015
      }
    });
    
    // If we exceed the maximum, remove the oldest landed note
    if (notes.length > maxNotes) {
      // Find the oldest landed note
      const oldestIndex = notes.findIndex(note => note.landed);
      if (oldestIndex !== -1) {
        const oldestNote = notes[oldestIndex];
        pileGroup.remove(oldestNote.mesh);
        notes.splice(oldestIndex, 1);
      } else if (notes.length > maxNotes + 20) {
        // If we're really exceeding the limit and no landed notes found, 
        // remove the oldest note regardless of landed status
        const oldestNote = notes[0];
        pileGroup.remove(oldestNote.mesh);
        notes.splice(0, 1);
      }
    }
  }
  
  // Authentication box shown flag
  let authBoxShown = false;
  
  // Add an authentication box
  function showAuthBox() {
    if (authBoxShown) return;
    authBoxShown = true;
    
    // Create auth box
    const boxGeometry = new THREE.BoxGeometry(1, 0.5, 0.1);
    const boxMaterial = new THREE.MeshStandardMaterial({
      color: 0x444444,
      roughness: 0.5,
      metalness: 0.7
    });
    
    const authBox = new THREE.Mesh(boxGeometry, boxMaterial);
    authBox.position.set(centerPos.x, 1.5, centerPos.z);
    
    // Add simple text
    const textCanvas = document.createElement('canvas');
    textCanvas.width = 256;
    textCanvas.height = 128;
    const textCtx = textCanvas.getContext('2d');
    
    textCtx.fillStyle = '#000000';
    textCtx.fillRect(0, 0, textCanvas.width, textCanvas.height);
    
    textCtx.font = 'bold 32px Arial';
    textCtx.fillStyle = '#ffffff';
    textCtx.textAlign = 'center';
    textCtx.textBaseline = 'middle';
    textCtx.fillText('AUTHENTICATE', textCanvas.width / 2, textCanvas.height / 2);
    
    const textTexture = new THREE.CanvasTexture(textCanvas);
    const textGeometry = new THREE.PlaneGeometry(0.8, 0.4);
    const textMaterial = new THREE.MeshBasicMaterial({
      map: textTexture,
      transparent: true
    });
    
    const textMesh = new THREE.Mesh(textGeometry, textMaterial);
    textMesh.position.z = 0.051;
    
    authBox.add(textMesh);
    scene.add(authBox);
    
    // Position camera in front of the authentication box
    const moveCamera = () => {
      // Position camera in front of the box - higher angle looking down
      camera.position.set(centerPos.x, 5, centerPos.z + 8); // Higher position, further back
      
      // Make camera look directly at the box
      controls.target.set(centerPos.x, 0, centerPos.z);
      
      // Disable orbit controls temporarily to prevent user from moving away
      controls.enabled = false;
      setTimeout(() => { controls.enabled = true; }, 3000); // Re-enable after 3 seconds
      
      controls.update();
      
      console.log("Camera positioned with high angle view of authentication box");
    };
    
    // Move camera immediately, no delay
    moveCamera();
  }
  
  // Create initial batch of notes (removed duplicate code)
  for (let i = 0; i < 30; i++) {
    createNote();
  }
  
  // Set up a timer to spawn new notes periodically
  const spawnInterval = 50; // Decreased from 500ms to 50ms (10x faster)
  let lastSpawnTime = 0;
  
  // Burst function to create multiple notes at once
  function createNoteBurst(count) {
    for (let i = 0; i < count; i++) {
      createNote();
    }
  }
  
  // Track animation frame
  let animationFrame = 0;
  
  // We'll modify the global animate function to include our note animation
  const originalAnimate = animate;
  animate = function() {
    // Update animation frame counter
    animationFrame++;
    
    // Check if we should spawn new notes
    const currentTime = Date.now();
    if (currentTime - lastSpawnTime > spawnInterval) {
      // Create a burst of 3-5 notes at once instead of just one
      const burstCount = 3 + Math.floor(Math.random() * 3);
      createNoteBurst(burstCount);
      lastSpawnTime = currentTime;
    }
    
    // Update note positions
    for (let i = 0; i < notes.length; i++) {
      const note = notes[i];
      
      if (!note.landed) {
        // Move the note downward
        note.mesh.position.y -= note.speed;
        
        // Add some rotation as they fall
        note.mesh.rotation.x += note.rotation.x;
        note.mesh.rotation.y += note.rotation.y;
        note.mesh.rotation.z += note.rotation.z;
        
        // Check if the note has reached the floor with a much lower threshold
        if (note.mesh.position.y <= floorHeight + (i % 10) * 0.01) {
          // Set final position
          note.mesh.position.y = floorHeight + (i % 10) * 0.01;
          note.landed = true;
          
          // Add a slight randomization to the final position
          const finalOffsetX = (Math.random() * 0.2) - 0.1;
          const finalOffsetZ = (Math.random() * 0.2) - 0.1;
          note.mesh.position.x = centerPos.x + finalOffsetX;
          note.mesh.position.z = centerPos.z + finalOffsetZ;
          
          // Stabilize rotation to lay flat
          note.mesh.rotation.x = Math.PI / 2 + (Math.random() * 0.1 - 0.05);
          note.mesh.rotation.z = Math.random() * 0.1 - 0.05;
          
          // Log that a note has landed for debugging
          console.log(`Note landed at y=${note.mesh.position.y}`);
        }
      } else {
        // Increment time on ground for landed notes
        note.timeOnGround++;
      }
    }
    
    // Show the authentication box after enough notes have landed (about 5 seconds)
    if (animationFrame > 300 && !authBoxShown) {
      showAuthBox();
    }
    
    // Call the original animate function
    originalAnimate();
  };
  
  console.log("Continuous currency animation started");
}

// Create a text texture
function createTextTexture(text, fontSize = 48, color = '#ffffff', bgColor = 'transparent') {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  
  // Clear background
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Add text
  ctx.font = `bold ${fontSize}px Arial`;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);
  
  // Create texture
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

// Create texture for upload button
function createUploadButtonTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  
  // Draw button
  ctx.fillStyle = '#225588';
  ctx.roundRect(50, 10, canvas.width - 100, canvas.height - 20, 20);
  ctx.fill();
  
  // Add text
  ctx.font = 'bold 40px Arial';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('UPLOAD IMAGE', canvas.width / 2, canvas.height / 2);
  
  // Create texture
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
} 