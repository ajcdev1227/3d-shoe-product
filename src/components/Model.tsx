import React, {forwardRef, useEffect} from 'react';
import * as THREE from "three";
import {useGLTF} from "@react-three/drei";

const Model = forwardRef(({onLayerSelect, setObjects}: { onLayerSelect: any, setObjects: any }, ref) => {
    const {scene} = useGLTF("shoe-model-10.glb");

    useEffect(() => {
        let objects: THREE.Object3D[] = [];
        scene.traverse((object) => {
            if (object instanceof THREE.Mesh) {
                object.userData.originalMaterial = object.material.clone();
                object.userData.currentMaterial = object.material.clone();
                object.userData.materialIndex = -1;
                object.userData.color = object.material.color.getHexString();
                objects.push(object);
            }
        });
        setObjects(objects)
    }, [scene, setObjects]);

    // @ts-ignore
    const handleClick = (event) => {
        event.stopPropagation();
        onLayerSelect(event.object);
    };

    return <primitive ref={ref} object={scene} onClick={handleClick} position={[0, 0, 0]}/>;
});

export default Model
