interface ConfigItem {
    id: string;
    color: string;
    path: string;
}

interface MaterialInfo {
    path: string;
    name: string;
    value: string;
}

interface RequestConfigItem {
    mask: string;
    maskName: string;
    color: string | null;
    texture: string | null;
}

interface GenerationInfo {
    status: string;
    render: string;
    mask_images: { layerName: string; imageUrl: string }[];
    masks: RequestConfigItem[]; // Adjusted type
    image: string | null;
    full_mask: string; // Add this line
}

interface RequestConfigItem {
    mask: string;
    maskName: string;
    color: string | null;
    texture: string | null;
}

export type {ConfigItem, MaterialInfo, GenerationInfo, RequestConfigItem};
