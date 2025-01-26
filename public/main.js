import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { DragControls } from 'three/addons/controls/DragControls.js';
import 'https://cdn.jsdelivr.net/npm/gif.js@0.2.0/dist/gif.min.js';

const scene = new THREE.Scene();
const loader = new GLTFLoader();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
camera.position.z = 5;

const renderer = new THREE.WebGLRenderer({ alpha: true });
renderer.setClearColor(0x000000, 0);

let controls;
let currentObject = null;

const gifContainer = document.getElementById('gif-container');
const blurrer = document.getElementById('blurrer');
const dropZone = document.getElementById('drop-zone');

// Create a separate drop zone for textures
const textureDropZone = document.createElement('div');
textureDropZone.id = 'texture-drop-zone';
textureDropZone.style.position = 'fixed';
textureDropZone.style.bottom = '20px';
textureDropZone.style.left = '50%';
textureDropZone.style.transform = 'translateX(-50%)';
textureDropZone.style.backgroundColor = 'rgba(0,0,0,0.7)';
textureDropZone.style.color = 'white';
textureDropZone.style.padding = '10px';
textureDropZone.style.borderRadius = '5px';
textureDropZone.style.zIndex = '1000';
textureDropZone.innerText = 'Drop Texture Image Here';
document.body.appendChild(textureDropZone);

['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    textureDropZone.addEventListener(eventName, preventDefaults, false);
    document.body.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

['dragenter', 'dragover'].forEach(eventName => {
    textureDropZone.addEventListener(eventName, highlight, false);
});

['dragleave', 'drop'].forEach(eventName => {
    textureDropZone.addEventListener(eventName, unhighlight, false);
});

function highlight(e) {
    textureDropZone.style.backgroundColor = 'rgba(0,255,0,0.5)';
}

function unhighlight(e) {
    textureDropZone.style.backgroundColor = 'rgba(0,0,0,0.7)';
}

textureDropZone.addEventListener('drop', handleTextureDrop, false);

function handleTextureDrop(event) {
    const file = event.dataTransfer.files[0];
    
    if (!currentObject) {
        alert('Please load a 3D model first');
        return;
    }

    if (file && (file.type === 'image/jpeg' || file.type === 'image/png')) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const textureLoader = new THREE.TextureLoader();
            textureLoader.load(e.target.result, function(texture) {
                if (currentObject.children.length > 0) {
                    const mesh = currentObject.children[0];
                    
                    const material = new THREE.MeshStandardMaterial({ 
                        map: texture,
                        roughness: 0.5,
                        metalness: 0.5
                    });
                    
                    mesh.material = material;
                }
            });
        };
        reader.readAsDataURL(file);
    } else {
        alert('Please drop a valid JPEG or PNG image');
    }
}

document.body.addEventListener('dragover', (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
});

document.body.addEventListener('drop', (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    console.log("Got file:", file.name);
    if (file && file.name.endsWith('.glb')) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const arrayBuffer = e.target.result;
            loader.parse(arrayBuffer, '', function (gltf) {
                if (currentObject) {
                    scene.remove(currentObject);
                }

                const object = gltf.scene;
                currentObject = object;

                if (object.children.length === 2) {
                    object.remove(object.children[1]);
                }

                const box = new THREE.Box3().setFromObject(object);
                const center = box.getCenter(new THREE.Vector3());
                object.position.sub(center);

                const size = box.getSize(new THREE.Vector3());
                const maxDim = Math.max(size.x, size.y, size.z);
                const scaleFactor = 3 / maxDim;
                object.scale.set(scaleFactor, scaleFactor, scaleFactor);

                const dragControls = new DragControls([object], camera, renderer.domElement);
                dragControls.addEventListener('dragstart', function (event) {
                    controls.enabled = false;
                });
                dragControls.addEventListener('dragend', function (event) {
                    controls.enabled = true;
                });

                scene.add(object);
                
                console.log("Object added to scene:", object);
                startAnimation();
            }, function (error) {
                console.error(error);
            });
        };
        reader.readAsArrayBuffer(file);
    } else {
        console.error('Please drop a valid .glb file.');
    }
});

function startAnimation() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    const displayDiv = document.getElementById('display-div');
    displayDiv.innerHTML = '';
    displayDiv.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLights = [
        [1, 1, 1],
        [-1, 1, 1],
        [1, 1, -1],
        [-1, 1, -1]
    ].map(pos => {
        const light = new THREE.DirectionalLight(0xffffff, 0.5);
        light.position.set(...pos).normalize();
        scene.add(light);
        return light;
    });

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.enableZoom = true;

    renderer.setAnimationLoop(() => {
        controls.update();
        renderer.render(scene, camera);
    });
}


window.captureGif = function () {
    const renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(window.innerWidth, window.innerHeight);
    const displayDiv = document.getElementById('display-div');
    displayDiv.innerHTML = '';
    displayDiv.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLights = [
        [1, 1, 1],
        [-1, 1, 1],
        [1, 1, -1],
        [-1, 1, -1]
    ].map(pos => {
        const light = new THREE.DirectionalLight(0xffffff, 0.5);
        light.position.set(...pos).normalize();
        scene.add(light);
        return light;
    });

    const frames = [];
    let frameCount = 0;
    const totalFrames = 60;

    const initialCameraPosition = camera.position.clone();
    const initialCameraQuaternion = camera.quaternion.clone();
    const initialCameraDistance = camera.position.distanceTo(scene.position);

    function animate() {
        if (frameCount < totalFrames) {
            requestAnimationFrame(animate);
            
            const angle = (frameCount / totalFrames) * 2 * Math.PI;
            
            const rotationMatrix = new THREE.Matrix4().makeRotationAxis(
                new THREE.Vector3(0, 1, 0),
                angle
            );
            
            const rotatedPosition = initialCameraPosition.clone().applyMatrix4(rotationMatrix);
            
            camera.position.copy(rotatedPosition);
            camera.lookAt(scene.position);
            
            renderer.render(scene, camera);
    
            frames.push(renderer.domElement.toDataURL('image/png'));
            frameCount++;
        } else {
            camera.position.copy(initialCameraPosition);
            camera.quaternion.copy(initialCameraQuaternion);
            createGif(frames);
        }
    }

    animate();
}


function createGif(frames) {
    console.log("Creating GIF");

    fetch('https://cdn.jsdelivr.net/npm/gif.js@0.2.0/dist/gif.worker.js')
        .then((response) => {
            if (!response.ok) {
                throw new Error("Failed to fetch worker script");
            }
            return response.blob();
        })
        .then((workerBlob) => {
            const workerScriptURL = URL.createObjectURL(workerBlob);

            const qualityRange = document.getElementById('quality-range');
            const quality = Math.round(qualityRange.value);
            const gif = new GIF({
                workers: 4,
                workerScript: workerScriptURL,
                quality: quality,
                width: window.innerWidth,
                height: window.innerHeight,
                transparent: true,
                background: '#00000000'
            });

            const progressContainer = document.createElement('div');
            progressContainer.style.position = 'fixed';
            progressContainer.style.top = '10px';
            progressContainer.style.left = '10px';
            progressContainer.style.background = 'rgba(0,0,0,0.7)';
            progressContainer.style.color = 'white';
            progressContainer.style.padding = '10px';
            progressContainer.style.borderRadius = '5px';
            document.body.appendChild(progressContainer);

            const fpsRange = document.getElementById('fps-range');
            const fps = Math.round(fpsRange.value);
            
            gif.on('start', () => {
                progressContainer.innerHTML = 'GIF Rendering Started...';
            });

            gif.on('progress', (progress) => {
                const percentage = Math.round(progress * 100);
                progressContainer.innerHTML = `Rendering GIF: ${percentage}%`;
            });

            gif.on('finished', (blob) => {
                console.log("GIF rendering complete");
                progressContainer.innerHTML = 'GIF Rendering Complete!';
                setTimeout(() => {
                    progressContainer.remove();
                    showGifContainer(blob);
                    startAnimation();
                }, 1000);
            });

            gif.on('error', (err) => {
                console.error('GIF creation error:', err);
                progressContainer.innerHTML = 'Error creating GIF';
            });

            let loadedFrames = 0;
            frames.forEach((frame, index) => {
                console.log("Loading frame:", index);
                const img = new Image();
                img.crossOrigin = 'Anonymous';
                img.src = frame;

                img.onerror = () => {
                    console.error(`Failed to load frame ${index}`);
                    progressContainer.innerHTML = `Failed to load frame ${index}`;
                };

                img.onload = () => {
                    try {
                        gif.addFrame(img, { delay: 1000 / fps, copy: true });
                        loadedFrames++;

                        if (loadedFrames === frames.length) {
                            console.log("All frames loaded. Starting GIF rendering...");
                            gif.render();
                        }
                    } catch (error) {
                        console.error('Error adding frame:', error);
                        progressContainer.innerHTML = 'Error adding frames';
                    }
                };
            });
        })
        .catch((error) => {
            console.error('Error initializing GIF.js:', error);
        });
}

function showGifContainer(gifBlob) {
    const gifContainer = document.getElementById('gif-container');
    const blurrer = document.getElementById('blurrer');
    
    gifContainer.innerHTML = '';
    
    const gifImage = document.createElement('img');
    gifImage.src = URL.createObjectURL(gifBlob);
    gifContainer.appendChild(gifImage);
    
    const controlsDiv = document.createElement('div');
    controlsDiv.classList.add('gif-controls');
    
    const downloadLink = document.createElement('a');
    downloadLink.href = URL.createObjectURL(gifBlob);
    downloadLink.download = 'animation.gif';
    downloadLink.classList.add('download-btn');
    downloadLink.innerText = 'Download GIF';
    
    const closeButton = document.createElement('button');
    closeButton.innerText = 'Close';
    closeButton.onclick = () => {
        gifContainer.style.display = 'none';
        blurrer.style.display = 'none';
        gifContainer.classList.remove('visible');
    };
    
    controlsDiv.appendChild(downloadLink);
    controlsDiv.appendChild(closeButton);
    gifContainer.appendChild(controlsDiv);
    
    gifContainer.style.display = 'flex';
    blurrer.style.display = 'block';
    
    setTimeout(() => {
        gifContainer.classList.add('visible');
    }, 50);
}

blurrer.addEventListener('click', () => {
    gifContainer.style.display = 'none';
    blurrer.style.display = 'none';
});

window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});

window.setBackgroundColor = function() {
    scene.background = null;
}