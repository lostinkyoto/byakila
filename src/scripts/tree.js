import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

// Debug log - script execution started
console.log('🚀 Tree.js script starting execution');

const canvas = document.getElementById('tree-canvas');
console.log('🔍 Canvas element:', canvas);

if (!canvas) {
  console.error('❌ Canvas element not found! Make sure the element exists before script runs.');
  // Don't exit - some frameworks might execute this script before the DOM is ready
}

// Try to set up renderer with null check
let renderer;
try {
  if (canvas) {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    console.log('✅ Renderer created successfully');
  } else {
    console.warn('⚠️ Creating renderer postponed - waiting for canvas');
  }
} catch (error) {
  console.error('❌ Error creating renderer:', error);
}

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a1a);
console.log('✅ Scene created');

// Camera setup
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 1.5, 5);
console.log('✅ Camera positioned at:', camera.position);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
scene.add(ambientLight);
console.log('✅ Ambient light added');

// Add directional light for better visibility of 3D objects
const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);
console.log('✅ Directional light added at position:', directionalLight.position);

// Debug helper - shows XYZ axes
const axesHelper = new THREE.AxesHelper(2);
scene.add(axesHelper);
console.log('✅ Axes helper added');

// Model loading
const loader = new GLTFLoader();
let mixer;

// Try multiple paths in case the original path is incorrect
const possiblePaths = [
  '/images/stylized_tree.glb',
  '../images/stylized_tree.glb',
  '../../public/images/stylized_tree.glb',
  './images/stylized_tree.glb'
];

// Log all possible paths we're trying
console.log('🔍 Attempting to load model with these paths:', possiblePaths);

// Try the original path first
loader.load(possiblePaths[0], 
  // Success callback
  (gltf) => {
    console.log('✅ Model loaded successfully:', gltf);
    
    const model = gltf.scene;
    console.log('🌳 Model details:', {
      children: model.children.length,
      animations: gltf.animations.length
    });
    
    model.scale.set(3, 3, 3);
    model.position.set(0, -0.5, 0);
    model.rotation.y = Math.PI;
    
    // Add model to scene
    scene.add(model);
    console.log('✅ Model added to scene');
    
    // Check and setup animations
    if (gltf.animations.length > 0) {
      mixer = new THREE.AnimationMixer(model);
      gltf.animations.forEach((clip) => {
        const action = mixer.clipAction(clip);
        action.play();
        console.log('🎬 Playing animation:', clip.name);
      });
    } else {
      console.warn('⚠️ No animations found in the model.');
    }
  },
  // Progress callback
  (progress) => {
    const percentComplete = Math.round((progress.loaded / progress.total) * 100);
    console.log(`📊 Loading progress: ${percentComplete}%`);
  },
  // Error callback
  (error) => {
    console.error(`❌ Error loading model from ${possiblePaths[0]}:`, error);
    console.log('⚠️ Will try alternate paths...');
    
    // Try alternate paths if the first one fails
    let pathIndex = 1;
    const tryNextPath = () => {
      if (pathIndex < possiblePaths.length) {
        console.log(`🔄 Trying alternate path: ${possiblePaths[pathIndex]}`);
        loader.load(
          possiblePaths[pathIndex],
          (gltf) => {
            console.log(`✅ Model loaded successfully from alternate path: ${possiblePaths[pathIndex]}`);
            const model = gltf.scene;
            model.scale.set(3, 3, 3);
            model.position.set(0, -0.5, 0);
            model.rotation.y = Math.PI;
            scene.add(model);
            
            if (gltf.animations.length > 0) {
              mixer = new THREE.AnimationMixer(model);
              gltf.animations.forEach((clip) => {
                mixer.clipAction(clip).play();
              });
            }
          },
          undefined,
          (err) => {
            console.error(`❌ Error with alternate path ${possiblePaths[pathIndex]}:`, err);
            pathIndex++;
            tryNextPath();
          }
        );
      } else {
        console.error('❌ All paths failed. Please check file location and server configuration.');
      }
    };
    
    tryNextPath();
  }
);

// Animation loop
const clock = new THREE.Clock();

function animate() {
  // Only continue if we have a valid renderer and canvas
  if (!renderer || !canvas) {
    console.warn('⚠️ Animation frame skipped - waiting for renderer/canvas');
    requestAnimationFrame(animate);
    return;
  }
  
  requestAnimationFrame(animate);
  
  const delta = clock.getDelta();
  if (mixer) mixer.update(delta);
  
  renderer.render(scene, camera);
}

// Wait for DOM to be fully loaded before starting animation
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('🎬 DOM fully loaded, starting animation');
    animate();
  });
} else {
  console.log('🎬 DOM already loaded, starting animation immediately');
  animate();
}

// Handle window resizing
window.addEventListener('resize', () => {
  if (!camera || !renderer) return;
  
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  console.log('📐 Resized renderer to:', { width: window.innerWidth, height: window.innerHeight });
});

// Add a safety timeout to check if canvas appears later
setTimeout(() => {
  if (!canvas) {
    const lateCanvas = document.getElementById('tree-canvas');
    if (lateCanvas && !renderer) {
      console.log('🔄 Canvas found after delay, initializing renderer now');
      renderer = new THREE.WebGLRenderer({ canvas: lateCanvas, alpha: true, antialias: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(window.devicePixelRatio);
      animate();
    }
  }
}, 1000);

console.log('✅ Tree.js script fully loaded');