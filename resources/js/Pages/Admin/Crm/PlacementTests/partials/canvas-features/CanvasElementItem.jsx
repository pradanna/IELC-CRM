import React from "react";
import { Text as KonvaText } from "react-konva";
import CanvasImageItem from "./CanvasImageItem";

export default function CanvasElementItem({
    element,
    isSelected,
    isEditing,
    dragBoundFunc,
    onDragStart,
    onSelect,
    onDoubleClick,
    onDragEndClean,
    onUpdateElement,
}) {
    if (element.type === "text") {
        return (
            <KonvaText
                id={element.id}
                text={element.text}
                x={element.x}
                y={element.y}
                fontSize={element.fontSize || 18}
                fontStyle={element.fontStyle || "normal"}
                fontFamily="'Comic Sans MS', 'Outfit', 'Inter', sans-serif"
                fill={element.fill || "#1e293b"}
                align={element.align || "left"}
                draggable={!isEditing}
                dragBoundFunc={dragBoundFunc}
                onDragStart={onDragStart}
                onClick={(e) => onSelect(e)}
                onTap={(e) => onSelect(e)}
                onDblClick={onDoubleClick}
                onDblTap={onDoubleClick}
                onDragEnd={(e) => {
                    onDragEndClean();
                    onUpdateElement(element.id, {
                        x: e.target.x(),
                        y: e.target.y(),
                    });
                }}
                onTransformEnd={(e) => {
                    const node = e.target;
                    const scaleX = node.scaleX();
                    node.scaleX(1);
                    node.scaleY(1);
                    const currentFontSize = element.fontSize || 18;
                    const newFontSize = Math.round(
                        Math.max(10, currentFontSize * scaleX)
                    );
                    onUpdateElement(element.id, {
                        x: node.x(),
                        y: node.y(),
                        fontSize: newFontSize,
                    });
                }}
            />
        );
    }

    if (element.type === "image") {
        return (
            <CanvasImageItem
                element={element}
                isSelected={isSelected}
                dragBoundFunc={dragBoundFunc}
                onDragStart={onDragStart}
                onSelect={onSelect}
                onChange={(newProps) => {
                    onDragEndClean();
                    onUpdateElement(element.id, newProps);
                }}
            />
        );
    }

    return null;
}
