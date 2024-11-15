import React from 'react';
import * as THREE from "three";

const ObjectsPanel: React.FC<any> = ({objects, onLayerSelect}: { objects: THREE.Object3D[], onLayerSelect:any }) => {

    const changeName = (objectName: string) => {
        return objectName.replace('_', ' ');
    }

    return (
        <div className='absolute left-[54px] top-[50px] max-h-[calc(100vh-150px)] overflow-y-auto rounded-[17px] border border-white bg-gray-100 shadow-2xl'>
            <div className='mt-[15px] ml-[19px] text-[11px] text-gray-500 font-medium leading-none tracking-[0.66px] uppercase'>Customizations</div>
            <div className='flex flex-col gap-[5px] bg-white m-[7px] rounded-[14px] py-[10px] px-[12px]'>
                {objects.map((object, index) => (
                    <div
                        className="flex flex-row justify-between px-[13px] py-[6px] rounded-[53px] min-w-[225px] object"
                        onClick={() => onLayerSelect(object)}
                        key={index}>
                        <span className="capitalize text-[16px] font-semibold leading-[19.36px] text-left object-title">{changeName(object.name)}</span>
                        <div className="object-icon h-full justify-center items-center">
                            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <g clipPath="url(#clip0_105_12)">
                                    <path
                                        d="M13.2337 4.25774C13.5642 3.92738 13.7498 3.47928 13.7499 3.01202C13.7499 2.54476 13.5644 2.09662 13.234 1.76618C12.9037 1.43573 12.4556 1.25006 11.9883 1.25C11.521 1.24994 11.0729 1.4355 10.7425 1.76586L2.40121 10.109C2.2561 10.2537 2.14878 10.4318 2.08871 10.6277L1.26308 13.3477C1.24693 13.4018 1.24571 13.4592 1.25955 13.5139C1.2734 13.5686 1.30178 13.6185 1.34171 13.6584C1.38163 13.6982 1.4316 13.7265 1.48631 13.7403C1.54102 13.754 1.59843 13.7527 1.65246 13.7365L4.37308 12.9115C4.56882 12.852 4.74694 12.7453 4.89183 12.6009L13.2337 4.25774Z"
                                        stroke="#2563EA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M9.375 3.125L11.875 5.625" stroke="#2563EA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </g>
                                <defs>
                                    <clipPath id="clip0_105_12">
                                        <rect width="15" height="15" fill="white"/>
                                    </clipPath>
                                </defs>
                            </svg>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ObjectsPanel
