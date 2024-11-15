import React, {useState, useCallback} from 'react';
import {GenerationInfo} from "../Interfaces";
import JSZip from 'jszip';

const ImageSelector = ({generations}: { generations: GenerationInfo[] }) => {
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [showModal, setShowModal] = useState(false);

    const handleImageClick = (index: number) => {
        setSelectedIndex(index);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
    };

    const handleDownload = useCallback(async (generation: GenerationInfo) => {
        try {
            // Create a new ZIP file
            const zip = new JSZip();

            // Add the main image to the ZIP
            const imageResponse = await fetch(generation.image!);
            const imageBlob = await imageResponse.blob();
            zip.file('design.png', imageBlob);

            // Add the configuration JSON to the ZIP
            const configJson = JSON.stringify({masks: generation.masks}, null, 2);
            zip.file('config.json', configJson);

            // Generate the ZIP file
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const zipBlob = await zip.generateAsync({type: 'blob'});

            // Download the ZIP file
            const zipUrl = URL.createObjectURL(zipBlob);
            const link = document.createElement('a');
            link.href = zipUrl;
            link.download = `shoe-design-${timestamp}.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(zipUrl);

        } catch (err) {
            console.error('Error creating ZIP file:', err);

            // Fallback to downloading individual files
            const link = document.createElement('a');
            link.href = generation.image!;
            link.download = 'shoe-design.png';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            const masksBlob = new Blob([JSON.stringify({masks: generation.masks}, null, 2)], {type: 'application/json'});
            const masksUrl = URL.createObjectURL(masksBlob);
            const masksLink = document.createElement('a');
            masksLink.href = masksUrl;
            masksLink.download = 'shoe-design-config.json';
            document.body.appendChild(masksLink);
            masksLink.click();
            document.body.removeChild(masksLink);
            URL.revokeObjectURL(masksUrl);
        }
    }, []);

    return (
        <>
            <div className="absolute bottom-0 w-[100vw] bg-[#FFFFFFCC] flex overflow-x-auto">
                {generations.map((generation, index) => (
                    <div
                        className={`w-[100px] h-[100px] rounded-[4px] flex justify-center items-center cursor-pointer mx-[5px] my-0`}
                        key={index}
                        style={{
                            backgroundColor: index === selectedIndex ? '#e0e0e0' : '#f0f0f0',
                            border: `2px solid ${index === selectedIndex ? '#2C2C2C' : 'transparent'}`,
                        }}
                        onClick={() => handleImageClick(index)}
                    >
                        {generation.status === 'pending' ? (
                            <div className="text-[#999] text-[12px]">
                                Loading...
                                <div
                                    className="absolute left-[38px] top-[36px] border-[2px] border-[#BEDAFD] border-t-[#3B81F5] rounded-full w-6 h-6 animate-spin-slow"
                                >
                                </div>
                            </div>
                        ) : generation.image ? (
                            <img
                                src={generation.image}
                                alt={`Shoe ${index + 1}`}
                                className="max-w-[100%] max-h-[100%] object-contain"
                            />
                        ) : (
                            <div className="text-[#999] text-[12px]">Failed</div>
                        )}
                    </div>
                ))}
            </div>

            {showModal && selectedIndex !== -1 && generations[selectedIndex].image && (
                <div
                    className="fixed top-0 left-0 w-[100vw] h-[100vh] bg-[#FFFFFFCC] flex items-center justify-center z-[1000]"
                    onClick={handleCloseModal}
                >
                    <div
                        className="relative max-w-[90%] max-h-[90%] bg-white p-[20px] rounded-[8px]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={handleCloseModal}
                            className="absolute top-[10px] right-[10px] bg-none border-none text-[24px] cursor-pointer text-[#2C2C2C]"
                        >
                            ×
                        </button>
                        <img
                            src={generations[selectedIndex].image!}
                            alt={`Shoe ${selectedIndex + 1}`}
                            className="max-w-[80vh] max-h-[80vh] object-contain"
                        />
                        <button
                            onClick={() => handleDownload(generations[selectedIndex])}
                            className="absolute bottom-[20px] right-[20px] py-[10px] px-[20px] bg-[#2C2C2C] text-white border-none rounded-[4px] cursor-pointer font-bold"
                        >
                            Download
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}

export default ImageSelector
