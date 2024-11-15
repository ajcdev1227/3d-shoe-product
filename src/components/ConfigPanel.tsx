import React, {useEffect, useState} from 'react';
import * as THREE from "three";
import {MaterialInfo} from "../Interfaces";

interface ConfigItem {
    name: string;
    color: string;
    path: string;
}

const ConfigPanel: React.FC<any> = ({modelRef, materialChanged, materials, setMaterialChanged}: { modelRef: any, materialChanged: boolean, materials: MaterialInfo[], setMaterialChanged: any }) => {

    const [configItems, setConfigItems] = useState<ConfigItem[]>([]);

    const changeName = (objectName: string) => {
        return objectName.replace('_', ' ');
    }

    useEffect(() => {
        if (materialChanged && modelRef.current) {
            let configItems: ConfigItem[] = [];
            modelRef.current.traverse((object: any) => {
                if (object instanceof THREE.Mesh && (object.userData.materialIndex !== -1 || object.userData.color !== object.userData.originalMaterial.color.getHexString())) {
                    let configItem: ConfigItem = {name: '', color: '', path: ''};
                    configItem.name = changeName(object.name);
                    if (object.userData.materialIndex !== -1)
                        configItem.path = materials[object.userData.materialIndex].name;
                    if (object.userData.color !== object.userData.originalMaterial.color.getHexString())
                        configItem.color = object.userData.color;
                    configItems.push(configItem);
                }
            });
            setConfigItems(configItems);
            setMaterialChanged(false);
        }
    }, [materialChanged]);

    return (
        <div className={`absolute right-[210px] top-[200px] rounded-[17px] border border-white bg-gray-100 shadow-2xl max-h-[600px] overflow-auto ${(configItems.length === 0) ? 'hidden' : ''}`}>
            <div className='my-[15px] ml-[19px] text-[11px] text-gray-500 font-medium leading-none tracking-[0.66px] uppercase'>Current Config</div>
            <div className='flex flex-col gap-0 bg-white rounded-[14px] w-[199px] m-[7px]'>
                {configItems.map((configItem, index) => (
                    <div className="flex flex-col gap-[2px] border-b-[2px] border-gray-100 px-[20px] py-[10px]" key={index}>
                        <span className="text-gray-500 text-base font-bold text-[11px] capitalize">{configItem.name}</span>
                        <div className="flex flex-col border-l-[2px] border-slate-200 m-[5px] pl-[5px]">
                            <div className="flex flex-col gap-[5px]">
                                {configItem.color && (
                                    <div className="flex flex-col gap-0">
                                        <span className="text-gray-400 text-xs font-medium">Color</span>
                                        <span className="text-gray-500 text-sm font-semibold uppercase">{configItem.color}</span>
                                    </div>)}
                                {configItem.path && (
                                    <div className="flex flex-col gap-0">
                                        <span className="text-gray-400 text-xs font-medium">Material</span>
                                        <span className="text-gray-500 text-sm font-semibold">{configItem.path}</span>
                                    </div>)}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ConfigPanel
