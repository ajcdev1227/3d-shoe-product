import {forwardRef, useImperativeHandle} from 'react';
import * as THREE from "three";
import {useThree} from "@react-three/fiber";
import {
    WebGLRenderTarget,
    NearestFilter,
    UnsignedByteType,
    ShaderMaterial
} from 'three';

const LinearDepthMaterial = new ShaderMaterial({
    vertexShader: `
    varying float vViewZDepth;
    void main() {
      vec4 viewPosition = modelViewMatrix * vec4( position, 1.0 );
      vViewZDepth = -viewPosition.z;
      gl_Position = projectionMatrix * viewPosition;
    }
  `,
    fragmentShader: `
    varying float vViewZDepth;

    uniform float minDepth;
    uniform float maxDepth;

    void main() {
      // Remap the depth value from [minDepth, maxDepth] to [0, 1]
      float depth = (vViewZDepth - minDepth) / (maxDepth - minDepth);
      depth = clamp(depth, 0.0, 1.0);

      // Invert the depth value
      depth = 1.0 - depth;

      // Optional: Apply non-linear scaling for better visualization
      // depth = pow(depth, 0.5); // Adjust exponent as needed

      gl_FragColor = vec4(vec3(depth), 1.0);
    }
  `,
    uniforms: {
        minDepth: {value: 0.01}, // Adjust as needed
        maxDepth: {value: 0.02}, // Adjust as needed
    },
});

const SceneCapture = forwardRef((props, ref) => {
    const {gl, scene, camera} = useThree();

    const pixelDataToImage = (pixelBuffer: Uint8Array, width: number, height: number): HTMLCanvasElement => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext('2d')!;
        const imageData = context.createImageData(width, height);

        // Copy pixelBuffer into imageData.data
        imageData.data.set(pixelBuffer);

        // Flip the image vertically
        context.putImageData(flipImageData(imageData), 0, 0);

        return canvas;
    }

    const flipImageData = (imageData: ImageData): ImageData => {
        const {width, height, data} = imageData;
        const halfHeight = Math.floor(height / 2);

        for (let y = 0; y < halfHeight; y++) {
            for (let x = 0; x < width; x++) {
                const index = (x + y * width) * 4;
                const mirrorIndex = (x + (height - y - 1) * width) * 4;

                for (let i = 0; i < 4; i++) {
                    const temp = data[index + i];
                    data[index + i] = data[mirrorIndex + i];
                    data[mirrorIndex + i] = temp;
                }
            }
        }

        return imageData;
    }

    useImperativeHandle(ref, () => ({
        // **New Method: captureCurrentRender**
        captureCurrentRender: async (onRenderCaptured: (imageUrl: string) => void) => {
            // Render the scene as is
            gl.render(scene, camera);

            // Capture image
            const imageBlob = await new Promise<Blob>((resolve) => {
                gl.domElement.toBlob((blob) => {
                    if (blob) {
                        resolve(blob);
                    }
                }, 'image/png');
            });

            // Create a URL for the image and pass it to the callback
            const imageUrl = URL.createObjectURL(imageBlob);
            onRenderCaptured(imageUrl);
        },

        captureFullWhiteRender: async (onRenderCaptured: (imageUrl: string) => void) => {
            // Store original materials
            const originalMaterials = new Map<THREE.Mesh, THREE.Material | THREE.Material[]>();
            scene.traverse((object) => {
                if (object instanceof THREE.Mesh) {
                    originalMaterials.set(object, object.material);
                    object.material = new THREE.MeshBasicMaterial({color: 'white'});
                    object.material.needsUpdate = true;
                }
            });

            // Render and capture
            gl.render(scene, camera);

            // Capture image
            const imageBlob = await new Promise<Blob>((resolve) => {
                gl.domElement.toBlob((blob) => {
                    if (blob) {
                        resolve(blob);
                    }
                }, 'image/png');
            });

            // Create a URL for the image and pass it to the callback
            const imageUrl = URL.createObjectURL(imageBlob);
            onRenderCaptured(imageUrl);

            // Restore original materials
            scene.traverse((object) => {
                if (object instanceof THREE.Mesh) {
                    object.material = originalMaterials.get(object)!;
                    object.material.needsUpdate = true;
                }
            });
        },

        // Existing captureMasks method
        // Inside SceneCapture component's useImperativeHandle
        captureMasks: async (configuredMeshes: THREE.Mesh[], allMeshes: THREE.Mesh[], onMaskCaptured: (layerName: string, imageUrl: string) => void) => {
            // Store original materials for all meshes
            const originalMaterials = new Map<THREE.Mesh, THREE.Material | THREE.Material[]>();
            allMeshes.forEach((mesh) => {
                originalMaterials.set(mesh, mesh.material);
            });

            // Generate mask for each configured mesh
            for (const targetMesh of configuredMeshes) {
                // Set materials: target mesh to white, all others to black
                allMeshes.forEach((mesh) => {
                    if (mesh === targetMesh) {
                        mesh.material = new THREE.MeshBasicMaterial({color: 'white'});
                    } else {
                        mesh.material = new THREE.MeshBasicMaterial({color: 'black'});
                    }
                    mesh.material.needsUpdate = true;
                });

                // Render and capture
                gl.render(scene, camera);

                // Capture image
                const imageBlob = await new Promise<Blob>((resolve) => {
                    gl.domElement.toBlob((blob) => {
                        if (blob) {
                            resolve(blob);
                        }
                    }, 'image/png');
                });

                // Create a URL for the image and pass it to the callback
                const imageUrl = URL.createObjectURL(imageBlob);
                onMaskCaptured(targetMesh.name, imageUrl);
            }

            // Restore original materials for all meshes
            allMeshes.forEach((mesh) => {
                mesh.material = originalMaterials.get(mesh)!;
                // @ts-ignore
                mesh.material.needsUpdate = true;
            });

            return Promise.resolve();
        },

        // Existing captureMasks method
        captureFull: async (meshes: THREE.Mesh[], onMaskCaptured: (imageUrl: string) => void) => {
            // Store original materials
            const originalMaterials = new Map<THREE.Mesh, THREE.Material | THREE.Material[]>();
            meshes.forEach((mesh) => {
                originalMaterials.set(mesh, mesh.material);
            });

            // Set materials: target mesh to white, others to black
            meshes.forEach((mesh) => {
                mesh.material = new THREE.MeshBasicMaterial({color: 'white'});
                mesh.material.needsUpdate = true;
            });

            // Render and capture
            gl.render(scene, camera);

            // Capture image
            const imageBlob = await new Promise<Blob>((resolve) => {
                gl.domElement.toBlob((blob) => {
                    if (blob) {
                        resolve(blob);
                    }
                }, 'image/png');
            });

            // Create a URL for the image and pass it to the callback
            const imageUrl = URL.createObjectURL(imageBlob);
            onMaskCaptured(imageUrl);

            // Restore original materials
            meshes.forEach((mesh) => {
                mesh.material = originalMaterials.get(mesh)!;
                // Needed to refresh the material
                // @ts-ignore
                mesh.material.needsUpdate = true;
            });


            // Ensure all captures are complete before returning
            return Promise.resolve();
        },

        captureDepthPass: async (onDepthCaptured: (imageUrl: string) => void) => {

            // Update the depth range uniforms
            LinearDepthMaterial.uniforms.minDepth.value = 2.0; // Camera near plane
            LinearDepthMaterial.uniforms.maxDepth.value = 5.0; // Shader's desired far plane

            // Store original materials
            const originalMaterials = new Map<THREE.Object3D, THREE.Material | THREE.Material[]>();
            scene.traverse((object) => {
                if ((object as THREE.Mesh).isMesh) {
                    const mesh = object as THREE.Mesh;
                    originalMaterials.set(mesh, mesh.material);
                    // Use the custom linear depth material
                    mesh.material = LinearDepthMaterial;
                }
            });

            // **Store original background**
            const originalBackground = scene.background;

            // **Set background to black**
            scene.background = new THREE.Color(0x000000);

            // Create a render target
            const renderTarget = new WebGLRenderTarget(gl.domElement.width, gl.domElement.height, {
                minFilter: NearestFilter,
                magFilter: NearestFilter,
                format: THREE.RGBAFormat,
                type: UnsignedByteType,
                depthBuffer: true,
            });

            // Render the scene into the render target
            gl.setRenderTarget(renderTarget);
            gl.render(scene, camera);
            gl.setRenderTarget(null);

            // Read pixels from the render target
            const pixelBuffer = new Uint8Array(gl.domElement.width * gl.domElement.height * 4); // RGBA
            gl.readRenderTargetPixels(renderTarget, 0, 0, gl.domElement.width, gl.domElement.height, pixelBuffer);

            // Create an image from the pixel buffer
            const depthImage = pixelDataToImage(pixelBuffer, gl.domElement.width, gl.domElement.height);

            // Create a URL for the image and pass it to the callback
            const imageUrl = depthImage.toDataURL('image/png');
            onDepthCaptured(imageUrl);

            // **Restore original background**
            scene.background = originalBackground;

            // Restore original materials
            scene.traverse((object) => {
                if ((object as THREE.Mesh).isMesh) {
                    const mesh = object as THREE.Mesh;
                    mesh.material = originalMaterials.get(mesh)!;
                }
            });

            // Clean up
            renderTarget.dispose();
        },

        captureNormalPass: async (onNormalCaptured: (imageUrl: string) => void) => {
            // Store original materials
            const originalMaterials = new Map<THREE.Object3D, THREE.Material | THREE.Material[]>();
            scene.traverse((object) => {
                if ((object as THREE.Mesh).isMesh) {
                    const mesh = object as THREE.Mesh;
                    originalMaterials.set(mesh, mesh.material);
                    // Use the custom normal material
                    mesh.material = new THREE.MeshNormalMaterial();
                }
            });

            // Store original background
            const originalBackground = scene.background;
            scene.background = new THREE.Color(0x000000);

            // Create a render target
            const renderTarget = new WebGLRenderTarget(gl.domElement.width, gl.domElement.height, {
                minFilter: NearestFilter,
                magFilter: NearestFilter,
                format: THREE.RGBAFormat,
                type: UnsignedByteType,
            });

            // Render the scene into the render target
            gl.setRenderTarget(renderTarget);
            gl.render(scene, camera);
            gl.setRenderTarget(null);

            // Read pixels from the render target
            const pixelBuffer = new Uint8Array(gl.domElement.width * gl.domElement.height * 4);
            gl.readRenderTargetPixels(renderTarget, 0, 0, gl.domElement.width, gl.domElement.height, pixelBuffer);

            // Create an image from the pixel buffer
            const normalImage = pixelDataToImage(pixelBuffer, gl.domElement.width, gl.domElement.height);

            // Create a URL for the image and pass it to the callback
            const imageUrl = normalImage.toDataURL('image/png');
            onNormalCaptured(imageUrl);

            // Restore original background
            scene.background = originalBackground;

            // Restore original materials
            scene.traverse((object) => {
                if ((object as THREE.Mesh).isMesh) {
                    const mesh = object as THREE.Mesh;
                    mesh.material = originalMaterials.get(mesh)!;
                }
            });

            // Clean up
            renderTarget.dispose();
        }

    }));

    return null;
});

export default SceneCapture
