import React, {useEffect, useState} from 'react';
import * as THREE from "three";
import {ChromePicker} from 'react-color';
import {MaterialInfo} from "../Interfaces"

const MaterialPanel: React.FC<any> = (
    {selectedLayer, back, materials, setMaterialChanged}: { selectedLayer: THREE.Mesh | null, back: any, materials: MaterialInfo[], setMaterialChanged: any },
) => {

    const [selectedColor, setSelectedColor] = useState<string>('#FF0000');
    const [selectedMaterialIndex, setSelectedMaterialIndex] = useState<number>(-1);

    useEffect(() => {
        if (selectedLayer instanceof THREE.Mesh) {
            setSelectedColor(selectedLayer.userData.color);
            setSelectedMaterialIndex(selectedLayer.userData.materialIndex);
        }
    }, [selectedLayer]);

    const changeName = (objectName: string) => {
        return objectName.replace('_', ' ');
    }

    const setColor = (color: string) => {
        if (selectedLayer !== null) {
            if (color !== '') {
                const material = selectedLayer.material as THREE.MeshBasicMaterial;
                material.color.set(color);
                selectedLayer.userData.currentMaterial = material.clone();
                selectedLayer.userData.color = color;
            }
        }
        setMaterialChanged(true);
        setSelectedColor(color);
    }

    const setMaterial = (index: number) => {
        if (selectedLayer === null)
            return;

        const textureLoader = new THREE.TextureLoader();
        selectedLayer.material = selectedLayer.userData.originalMaterial.clone();
        const material = selectedLayer.material as THREE.MeshBasicMaterial;
        material.color.set(selectedLayer.userData.currentMaterial.color);
        selectedLayer.userData.materialIndex = index;
        if (index === -1) {
            selectedLayer.userData.currentMaterial = material.clone();
            selectedLayer.material = new THREE.MeshStandardMaterial({color: 'red', transparent: true, opacity: 0.8});
        } else {
            material.map = textureLoader.load(materials[index].path);
            selectedLayer.userData.materialIndex = index;
            selectedLayer.userData.currentMaterial = material.clone();
        }
        material.needsUpdate = true;
        setMaterialChanged(true);
        setSelectedMaterialIndex(index)
    }

    return (
        <div className='absolute left-[54px] top-[100px] rounded-[17px] border border-white bg-gray-100 shadow-2xl'>
            <div className='flex flex-row gap-[5px] mt-[15px] ml-[19px] h-[20px]'>

                <svg onClick={() => back()} style={{cursor: 'pointer'}} width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 7L3 10L6 13" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M3 10H18" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>

                <div className="flex flex-cols items-center h-full justify-center">
                    <span className="text-[11px] text-gray-500 font-medium leading-none tracking-[0.66px] capitalize">
                        {(selectedLayer instanceof THREE.Mesh) ? changeName(selectedLayer.name) : ''}
                    </span>
                </div>
            </div>
            <div className='flex flex-col gap-[10px] bg-white m-[7px] rounded-[14px] py-[10px] px-[12px]'>
                <div className="flex flex-row gap-[5px] h-[20px]">
                    <div className="flex flex-col h-full justify-center items-center">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <g clipPath="url(#clip0_62_930)">
                                <path
                                    d="M7.87467 4.08333C8.03576 4.08333 8.16634 3.95275 8.16634 3.79167C8.16634 3.63058 8.03576 3.5 7.87467 3.5C7.71359 3.5 7.58301 3.63058 7.58301 3.79167C7.58301 3.95275 7.71359 4.08333 7.87467 4.08333Z"
                                    fill="#6B7280" stroke="#6B7280" strokeWidth="1.16667" strokeLinecap="round" strokeLinejoin="round"/>
                                <path
                                    d="M10.2087 6.41683C10.3697 6.41683 10.5003 6.28625 10.5003 6.12516C10.5003 5.96408 10.3697 5.8335 10.2087 5.8335C10.0476 5.8335 9.91699 5.96408 9.91699 6.12516C9.91699 6.28625 10.0476 6.41683 10.2087 6.41683Z"
                                    fill="#6B7280" stroke="#6B7280" strokeWidth="1.16667" strokeLinecap="round" strokeLinejoin="round"/>
                                <path
                                    d="M4.95866 4.66683C5.11974 4.66683 5.25033 4.53625 5.25033 4.37516C5.25033 4.21408 5.11974 4.0835 4.95866 4.0835C4.79758 4.0835 4.66699 4.21408 4.66699 4.37516C4.66699 4.53625 4.79758 4.66683 4.95866 4.66683Z"
                                    fill="#6B7280" stroke="#6B7280" strokeWidth="1.16667" strokeLinecap="round" strokeLinejoin="round"/>
                                <path
                                    d="M3.79167 7.58333C3.95275 7.58333 4.08333 7.45275 4.08333 7.29167C4.08333 7.13058 3.95275 7 3.79167 7C3.63058 7 3.5 7.13058 3.5 7.29167C3.5 7.45275 3.63058 7.58333 3.79167 7.58333Z"
                                    fill="#6B7280" stroke="#6B7280" strokeWidth="1.16667" strokeLinecap="round" strokeLinejoin="round"/>
                                <path
                                    d="M7.00033 1.1665C3.79199 1.1665 1.16699 3.7915 1.16699 6.99984C1.16699 10.2082 3.79199 12.8332 7.00033 12.8332C7.54049 12.8332 7.96166 12.398 7.96166 11.8485C7.96166 11.5936 7.85666 11.3614 7.70674 11.1923C7.53758 11.0237 7.45124 10.8119 7.45124 10.536C7.44903 10.4076 7.47269 10.2801 7.5208 10.1611C7.56892 10.042 7.64051 9.93386 7.7313 9.84306C7.8221 9.75227 7.93024 9.68068 8.04929 9.63256C8.16834 9.58445 8.29586 9.56079 8.42424 9.563H9.58858C11.3683 9.563 12.829 8.10292 12.829 6.32317C12.8132 3.50684 10.1859 1.1665 7.00033 1.1665Z"
                                    stroke="#6B7280" strokeWidth="1.16667" strokeLinecap="round" strokeLinejoin="round"/>
                            </g>
                            <defs>
                                <clipPath id="clip0_62_930">
                                    <rect width="14" height="14" fill="white"/>
                                </clipPath>
                            </defs>
                        </svg>
                    </div>
                    <span className='text-[14px] text-gray-500'>Color</span>
                </div>
                <ChromePicker
                    onChange={(color) => setColor(color.hex)}
                    disableAlpha={true}
                    color={selectedColor}
                />
            </div>
            <div className='flex flex-col gap-[10px] bg-white m-[7px] rounded-[14px] py-[10px] px-[12px]'>
                <div className="flex flex-row gap-[5px] h-[20px]">
                    <div className="flex flex-col h-full justify-center items-center">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M6.99967 6.545C6.41634 5.83158 5.83301 5.25 5.83301 4.66667C5.83301 4.35725 5.95592 4.0605 6.17472 3.84171C6.39351 3.62292 6.69026 3.5 6.99967 3.5C7.30909 3.5 7.60584 3.62292 7.82463 3.84171C8.04342 4.0605 8.16634 4.35725 8.16634 4.66667C8.16634 5.25 7.58417 5.8345 6.99384 6.545"
                                stroke="#6B7280" strokeWidth="1.16667" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M7 10.5002L8.49917 8.4585" stroke="#6B7280" strokeWidth="1.16667" strokeLinecap="round" strokeLinejoin="round"/>
                            <path
                                d="M3.6416 5.25916C4.01699 4.71656 4.51827 4.27301 5.10253 3.96647C5.6868 3.65993 6.33664 3.49954 6.99644 3.49902C7.65623 3.49851 8.30632 3.65788 8.89106 3.96351C9.47581 4.26913 9.97778 4.7119 10.354 5.25391"
                                stroke="#6B7280" strokeWidth="1.16667" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M5.4541 8.47575L6.99993 6.54492" stroke="#6B7280" strokeWidth="1.16667" strokeLinecap="round" strokeLinejoin="round"/>
                            <path
                                d="M5.45423 8.47567C4.50807 7.14334 3.50007 5.96209 3.50007 4.08317C3.50007 3.30962 3.86882 2.56776 4.52519 2.02078C5.18157 1.47379 6.07181 1.1665 7.00007 1.1665C7.92833 1.1665 8.81856 1.47379 9.47494 2.02078C10.1313 2.56776 10.5001 3.30962 10.5001 4.08317C10.4972 5.9615 9.4629 7.13692 8.49923 8.45817L10.5742 11.0989C10.6228 11.1608 10.6584 11.2319 10.6788 11.3079C10.6992 11.384 10.7041 11.4633 10.693 11.5413C10.6819 11.6192 10.6552 11.6941 10.6144 11.7614C10.5737 11.8288 10.5197 11.8872 10.4557 11.9331L9.3509 12.7264C9.22671 12.8154 9.07257 12.8521 8.92161 12.8287C8.77065 12.8052 8.63491 12.7235 8.54357 12.601L7.00007 10.4998L5.43732 12.5958C5.34573 12.719 5.20923 12.8012 5.05743 12.8245C4.90563 12.8477 4.75078 12.8102 4.62648 12.72L3.53857 11.9308C3.47531 11.8848 3.42192 11.8267 3.38158 11.7598C3.34123 11.6928 3.31475 11.6185 3.30371 11.5411C3.29266 11.4637 3.29728 11.3849 3.31728 11.3093C3.33728 11.2338 3.37227 11.163 3.42015 11.1013L5.45423 8.47567Z"
                                stroke="#6B7280" strokeWidth="1.16667" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </div>
                    <span className='text-[14px] text-gray-500'>Material</span>
                </div>
                <div className="grid grid-cols-2 gap-[10px]">
                    {materials.map((material, index) => (
                        <div
                            key={index}
                            className="flex flex-col gap-[5px] w-[110px]"
                        >
                            <img
                                className={`w-full h-[80px] rounded-[6px] border-[2px] ${(selectedMaterialIndex === index) ? 'border-[#2196F3]' : 'border-[#e0e0e0]'}`}
                                src={material.path}
                                alt={material.name}
                                onClick={() => {
                                    (selectedMaterialIndex === index) ? setMaterial(-1) : setMaterial(index);
                                }}
                            />
                            <span className="text-center text-gray-500 text-[14px]">{material.name}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

};

export default MaterialPanel
