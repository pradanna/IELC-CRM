import React, { useState, useEffect, useRef } from "react";
import { Image as KonvaImage } from "react-konva";

// Helper hook for loading HTML images into Konva
export const useKonvaImage = (url) => {
    const [image, setImage] = useState(null);
    useEffect(() => {
        if (!url) {
            setImage(null);
            return;
        }
        const img = new window.Image();
        img.crossOrigin = "Anonymous";
        img.src = url;
        img.onload = () => setImage(img);
    }, [url]);
    return image;
};

// Render Individual Konva Image Element with Drag and Transform
export default function CanvasImageItem({
    element,
    isSelected,
    onSelect,
    onChange,
    onDragStart,
    dragBoundFunc,
}) {
    const image = useKonvaImage(element.src);
    const shapeRef = useRef(null);

    return (
        <KonvaImage
            id={element.id}
            ref={shapeRef}
            image={image}
            x={element.x}
            y={element.y}
            width={element.width || 120}
            height={element.height || 100}
            draggable
            dragBoundFunc={dragBoundFunc}
            onDragStart={onDragStart}
            onClick={(e) => onSelect && onSelect(e)}
            onTap={(e) => onSelect && onSelect(e)}
            onDragEnd={(e) => {
                onChange({
                    ...element,
                    x: e.target.x(),
                    y: e.target.y(),
                });
            }}
            onTransformEnd={() => {
                const node = shapeRef.current;
                const scaleX = node.scaleX();
                const scaleY = node.scaleY();
                node.scaleX(1);
                node.scaleY(1);
                onChange({
                    ...element,
                    x: node.x(),
                    y: node.y(),
                    width: Math.round(Math.max(20, node.width() * scaleX)),
                    height: Math.round(Math.max(20, node.height() * scaleY)),
                });
            }}
        />
    );
}
