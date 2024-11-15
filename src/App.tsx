import React, {useEffect, useState, useRef} from 'react';
import {Canvas} from "@react-three/fiber";
import {Grid, OrbitControls, PerspectiveCamera, Environment} from "@react-three/drei";
import * as THREE from "three";

import {ObjectsPanel, MaterialPanel, ConfigPanel, Model, SceneCapture} from "./components";
import {GenerationInfo, MaterialInfo, RequestConfigItem} from "./Interfaces";
import ImageSelector from "./components/ImageSelector";

const materials: MaterialInfo[] = [
    {
        path: "texture-alligator.png",
        name: "Alligator",
        value: "ALLIGATOR"
    },
    {
        path: "texture-leather.png",
        name: "Leather",
        value: "LEATHER"
    },
    {
        path: "texture-fur.png",
        name: "Fur",
        value: "FUR"
    },
    {
        path: "texture-denim.png",
        name: "Denim",
        value: "DENIM"
    }
];

const gridConfig = {
    gridSize: [10.5, 10.5],
    cellSize: 0.6,
    cellThickness: 1,
    cellColor: '#6f6f6f',
    sectionSize: 3.3,
    sectionThickness: 1.5,
    sectionColor: '#9d4b4b',
    fadeDistance: 25,
    fadeStrength: 1,
    followCamera: false,
    infiniteGrid: true
};

function App() {

    const modelRef = useRef<THREE.Group>();
    const sceneCaptureRef = useRef<{
        captureMasks: Function;
        captureCurrentRender: Function,
        captureFull: Function,
        captureDepthPass: Function,
        captureNormalPass: Function
    }>(null);

    const [isCapturing, setIsCapturing] = useState(false);
    const [objects, setObjects] = useState<THREE.Mesh[]>([]);
    const [selectedLayer, setSelectedLayer] = useState<THREE.Mesh | null>(null);
    const [materialChanged, setMaterialChanged] = useState(false);
    const [progress, setProgress] = useState(0);
    const [generationInfos, setGenerationInfos] = useState<GenerationInfo[]>([])
    const [IsGenerate, setIsGenerate] = useState(false);

    useEffect(() => {
        const processGenerations = async () => {
            console.log("generations", generationInfos);
            const updatedGenerations = await Promise.all(
                generationInfos.map(async (genInfo) => {
                    if (genInfo.status !== "pending") {
                        return genInfo;
                    }

                    const formData = new FormData();
                    const response = await fetch(genInfo.render);
                    const blob = await response.blob();
                    formData.append('image', blob, 'render.png');

                    for (let i = 0; i < genInfo.mask_images.length; i++) {
                        const maskImage = genInfo.mask_images[i];
                        const maskResponse = await fetch(maskImage.imageUrl);
                        const maskBlob = await maskResponse.blob();
                        formData.append('mask_images', maskBlob, `${maskImage.layerName}.png`);
                    }

                    const fullMaskResponse = await fetch(genInfo.full_mask);
                    const fullMaskBlob = await fullMaskResponse.blob();
                    formData.append('full_mask', fullMaskBlob, 'full_mask.png');
                    formData.append("masks", JSON.stringify(genInfo.masks));

                    const req = await fetch("https://hassantsyed--3d-configurator-4-wrapper.modal.run/generate", {
                        method: "POST",
                        body: formData
                    });
                    console.log("request done")
                    const imageBlob = await req.blob();
                    console.log(imageBlob);
                    const imageUrl = URL.createObjectURL(imageBlob);
                    return {...genInfo, status: "complete", image: imageUrl};
                })
            );

            console.log("updated", updatedGenerations);
            setGenerationInfos(updatedGenerations);
        };
        if (generationInfos.length && IsGenerate) {
            setIsGenerate(false);
            processGenerations();
        }

    }, [IsGenerate]);

    const handleLayerSelect = (layer: THREE.Mesh) => {
        if (selectedLayer !== null && layer.name === selectedLayer.name)
            return;
        if (selectedLayer instanceof THREE.Mesh)
            selectedLayer.material = selectedLayer?.userData.currentMaterial.clone();
        layer.material = new THREE.MeshStandardMaterial({color: 'red', transparent: true, opacity: 0.8});
        setSelectedLayer(layer);
    }

    const back = () => {
        if (selectedLayer instanceof THREE.Mesh)
            selectedLayer.material = selectedLayer?.userData.currentMaterial.clone();
        setSelectedLayer(null);
    }

    const buildRequest = (): RequestConfigItem[] => {
        const requestConfigItems: RequestConfigItem[] = [];
        if (modelRef.current) {
            modelRef.current.traverse((object) => {
                if (object instanceof THREE.Mesh && (object.userData.materialIndex !== -1 || object.userData.color !== object.userData.originalMaterial.color.getHexString())) {
                    requestConfigItems.push({
                        "mask": `${object.name}.png`,
                        "maskName": object.name,
                        "texture": (object.userData.materialIndex === -1) ? null : materials[object.userData.materialIndex].value,
                        "color": (object.userData.color === object.userData.originalMaterial.color.getHexString()) ? null : object.userData.color,
                    })

                }
            });
        }
        return requestConfigItems;

    }

    const addGenerationInfo = (generationInfo: GenerationInfo) => {
        setGenerationInfos(prev => [generationInfo, ...prev]);
    }

    const exportFrame = async () => {
        if (sceneCaptureRef.current && modelRef.current) {
            setIsCapturing(true);
            setProgress(0);
            await new Promise(resolve => setTimeout(resolve, 1000));
            setProgress(10);
            const meshes: THREE.Mesh[] = [];
            modelRef.current.traverse((object) => {
                if (object instanceof THREE.Mesh) {
                    meshes.push(object!);
                }
            });
            setProgress(20);
            const configMeshes: THREE.Mesh[] = [];
            modelRef.current.traverse((object) => {
                if (object instanceof THREE.Mesh && (object.userData.materialIndex !== -1 || object.userData.color !== object.userData.originalMaterial.color.getHexString())) {
                    configMeshes.push(object);
                }
            });
            setProgress(30);
            let renderImageUrl = '';
            await sceneCaptureRef.current.captureCurrentRender((imageUrl: string) => {
                renderImageUrl = imageUrl;
            });
            setProgress(50);

            const maskImages: { layerName: string, imageUrl: string }[] = [];
            const onMaskCaptured = (layerName: string, imageUrl: string) => {
                maskImages.push({layerName, imageUrl});
            };

            await sceneCaptureRef.current.captureMasks(configMeshes, meshes, onMaskCaptured);
            setProgress(70); // Update progress

            let fullMaskImageUrl = '';
            await sceneCaptureRef.current.captureFull(meshes, (imageUrl: string) => {
                fullMaskImageUrl = imageUrl;
            });
            setProgress(90); // Update progress

            const masks = buildRequest().map((item) => ({
                ...item,
            }));

            const generationInfo: GenerationInfo = {
                status: 'pending',
                render: renderImageUrl,
                mask_images: maskImages,
                masks, // Pass the array instead of a JSON string
                image: null,
                full_mask: fullMaskImageUrl, // Include the full mask
            };

            // Add the new GenerationInfo to the state
            addGenerationInfo(generationInfo);
            setProgress(100); // Update progress
            setIsGenerate(true);
            setIsCapturing(false);
        }
    }

    const downloadImage = (url: string, filename: string) => {
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleCaptureMasks = async () => {
        if (sceneCaptureRef.current && modelRef.current) {
            setIsCapturing(true);

            await new Promise(resolve => setTimeout(resolve, 1000));

            // Collect all meshes
            const meshes: THREE.Mesh[] = [];
            modelRef.current.traverse((object) => {
                if (object instanceof THREE.Mesh) {
                    meshes.push(object);
                }
            });

            const configMeshes: THREE.Mesh[] = [];
            modelRef.current.traverse((object) => {
                if (object instanceof THREE.Mesh && (object.userData.materialIndex !== -1 || object.userData.color !== object.userData.originalMaterial.color.getHexString())) {
                    configMeshes.push(object);
                }
            });

            // **New Code: Capture current render before masks**
            await sceneCaptureRef.current.captureCurrentRender((imageUrl: string) => {
                downloadImage(imageUrl, `render.png`);
            });

            await sceneCaptureRef.current.captureFull(meshes, (imageUrl: string) => {
                downloadImage(imageUrl, "full.png")
            });

            // Callback to handle each captured mask
            const onMaskCaptured = (layerName: string, imageUrl: string) => {
                downloadImage(imageUrl, `${layerName}-mask.png`);
            };

            await sceneCaptureRef.current.captureNormalPass((imageUrl: string) => {
                downloadImage(imageUrl, `normal-pass.png`);
            });


            // Capture the masks
            await sceneCaptureRef.current.captureMasks(configMeshes, meshes, onMaskCaptured);

            setIsCapturing(false);
        }
    };
    return (
        <>
            <Canvas
                className="bg-[#f2f2f2]"
                shadows // Enable shadows
                camera={{
                    position: [0, 1, 4],
                    fov: 45,
                    near: 0.1, // Adjust if necessary
                    far: 100,  // Adjust if necessary
                }}
            >
                <Grid
                    position={[0, -0.01, 0]}
                    args={[10.5, 10.5]}
                    {...gridConfig}
                    visible={!isCapturing}
                />
                <PerspectiveCamera position={[0, 1, 3]} makeDefault fov={75} near={0.1} far={1000}/>
                <OrbitControls makeDefault/>
                <ambientLight intensity={0.7}/>
                <spotLight
                    intensity={0.5}
                    angle={0.1}
                    penumbra={1}
                    position={[10, 15, 10]}
                    castShadow
                />
                <Model
                    ref={modelRef}
                    onLayerSelect={handleLayerSelect}
                    setObjects={setObjects}
                />
                <Environment preset="city"/>
                <SceneCapture ref={sceneCaptureRef}/>
            </Canvas>
            <ImageSelector
                generations={generationInfos}
            />
            {objects.length > 0 && selectedLayer === null &&
                (
                    <ObjectsPanel
                        objects={objects}
                        onLayerSelect={handleLayerSelect}
                    />
                )}
            {selectedLayer !== null &&
                (
                    <MaterialPanel
                        selectedLayer={selectedLayer}
                        back={back}
                        setMaterialChanged={setMaterialChanged}
                        materials={materials}
                    />
                )}
            <ConfigPanel
                modelRef={modelRef}
                materialChanged={materialChanged}
                materials={materials}
                setMaterialChanged={setMaterialChanged}
            />
            <button
                className="absolute right-[50px] top-[28px] flex flex-col justify-center items-center text-center w-[146px] h-[39px] rounded-[96px] text-white bg-blue-600 text-base font-semibold"
                onClick={() => exportFrame()}
            >
                Export Frame
            </button>
            {/*<button*/}
            {/*    onClick={handleCaptureMasks}*/}
            {/*    className="absolute bottom-[20px] left-[20px] px-[20px] py-[10px] rounded-[4px] cursor-pointer font-bold z-[1000] text-white bg-[#2C2C2C] border-none"*/}
            {/*>*/}
            {/*    Capture Layer Masks*/}
            {/*</button>*/}
            {isCapturing && (
                <div className='absolute top-[96px] right-[44px] w-[379px] h-[98px] rounded-[14px] border-[1px] border-blue-200 bg-blue-100 flex'>
                    <div className='w-[66px] h-[62px] m-[18px]' style={{backgroundImage: "url('shoe.png')"}}/>
                    <div className='flex flex-col justify-center'>
                        <div className='text-blue-500 text-[30px] font-semibold leading-none'>{progress}%</div>
                        <div className='text-blue-500 text-[16px] font-normal leading-none'>Exporting In Progress</div>
                    </div>

                    <svg className="h-[17px] w-[17px] absolute top-[9px] right-[9px] text-gray-500"
                         xmlns="http://www.w3.org/2000/svg"
                         fill="none"
                         viewBox="0 0 24 24"
                         stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                    <div
                        className="absolute left-[38px] top-[36px] border-[6px] border-[#BEDAFD] border-t-[#3B81F5] rounded-full w-6 h-6 animate-spin-slow"
                    >
                    </div>
                </div>
            )}
        </>
    );
}

export default App;
