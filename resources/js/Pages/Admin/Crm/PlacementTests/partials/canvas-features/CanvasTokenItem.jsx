import React from "react";
import { Group, Circle, Rect, Text as KonvaText, Image as KonvaImage } from "react-konva";
import { useKonvaImage } from "./CanvasImageItem";

function CanvasImageTokenItem({
    tok,
    x,
    y,
    width,
    height,
    isSelected,
    isEditing,
    dragBoundFunc,
    onDragStart,
    onSelect,
    onDoubleClick,
    onDragEndClean,
    onUpdateToken,
}) {
    const image = useKonvaImage(tok.src);

    return (
        <Group
            id={tok.id}
            x={x}
            y={y}
            draggable={!isEditing}
            visible={!isEditing}
            dragBoundFunc={dragBoundFunc}
            onDragStart={onDragStart}
            onClick={(e) => onSelect(e)}
            onTap={(e) => onSelect(e)}
            onDblClick={onDoubleClick}
            onDblTap={onDoubleClick}
            onDragEnd={(e) => {
                onDragEndClean();
                onUpdateToken(tok.id, {
                    x: Math.round(e.target.x()),
                    y: Math.round(e.target.y()),
                });
            }}
        >
            <Rect
                width={width}
                height={height}
                cornerRadius={12}
                fill={isSelected ? "#e0e7ff" : "#ffffff"}
                stroke={isSelected ? "#4f46e5" : "#a5b4fc"}
                strokeWidth={isSelected ? 3 : 2}
                shadowColor="rgba(0,0,0,0.12)"
                shadowBlur={5}
            />
            {image && (
                <KonvaImage
                    image={image}
                    x={4}
                    y={4}
                    width={width - 8}
                    height={height - 8}
                    listening={false}
                />
            )}
            {tok.label && (
                <KonvaText
                    text={tok.label}
                    x={-10}
                    y={height + 2}
                    width={width + 20}
                    align="center"
                    fontSize={10}
                    fontStyle="bold"
                    fill="#4338ca"
                    listening={false}
                />
            )}
        </Group>
    );
}

export default function CanvasTokenItem({
    tok,
    isSelected,
    isEditing,
    dragBoundFunc,
    onDragStart,
    onSelect,
    onDoubleClick,
    onDragEndClean,
    onUpdateToken,
}) {
    const x = typeof tok.x === "number" ? tok.x : 850;
    const y = typeof tok.y === "number" ? tok.y : 150;

    // 1. Ring Token
    if (tok.type === "ring") {
        const radius = tok.radius || 24;
        const textWidth = Math.round(radius * 3);

        return (
            <Group
                id={tok.id}
                x={x}
                y={y}
                draggable={!isEditing}
                visible={!isEditing}
                dragBoundFunc={dragBoundFunc}
                onDragStart={onDragStart}
                onClick={(e) => onSelect(e)}
                onTap={(e) => onSelect(e)}
                onDblClick={onDoubleClick}
                onDblTap={onDoubleClick}
                onDragEnd={(e) => {
                    onDragEndClean();
                    onUpdateToken(tok.id, {
                        x: Math.round(e.target.x()),
                        y: Math.round(e.target.y()),
                    });
                }}
            >
                {/* Ring Outline */}
                <Circle
                    radius={radius}
                    scaleX={1.5}
                    stroke={isSelected ? "#0284c7" : "#10b981"}
                    strokeWidth={isSelected ? 3 : 2.5}
                    fill={isSelected ? "rgba(16, 185, 129, 0.15)" : "rgba(16, 185, 129, 0.08)"}
                    shadowColor="rgba(0,0,0,0.15)"
                    shadowBlur={isSelected ? 6 : 2}
                />
                {/* Ring Center Label (jika ada, default kosong bersih) */}
                {tok.label ? (
                    <KonvaText
                        text={tok.label}
                        x={-Math.max(textWidth, 80) / 2}
                        y={-10}
                        width={Math.max(textWidth, 80)}
                        align="center"
                        fontSize={11}
                        fontStyle="bold"
                        fontFamily="'Comic Sans MS', 'Outfit', 'Inter', sans-serif"
                        fill={isSelected ? "#0369a1" : "#047857"}
                        listening={false}
                    />
                ) : null}
                {/* Centang di tengah saat ring token terpilih (Selected) */}
                {isSelected && (
                    <KonvaText
                        text="✔"
                        fontSize={20}
                        fontStyle="bold"
                        fill="#0284c7"
                        width={textWidth}
                        offsetX={textWidth / 2}
                        offsetY={12}
                        align="center"
                        listening={false}
                    />
                )}
                {/* Drag Handle Indicator */}
                <Circle
                    radius={3}
                    x={0}
                    y={radius * 0.8}
                    fill={isSelected ? "#0284c7" : "#10b981"}
                    listening={false}
                />
            </Group>
        );
    }

    // 2. Checkmark Token
    if (tok.type === "check") {
        const size = 38;
        return (
            <Group
                id={tok.id}
                x={x}
                y={y}
                draggable={!isEditing}
                visible={!isEditing}
                dragBoundFunc={dragBoundFunc}
                onDragStart={onDragStart}
                onClick={(e) => onSelect(e)}
                onTap={(e) => onSelect(e)}
                onDblClick={onDoubleClick}
                onDblTap={onDoubleClick}
                onDragEnd={(e) => {
                    onDragEndClean();
                    onUpdateToken(tok.id, {
                        x: Math.round(e.target.x()),
                        y: Math.round(e.target.y()),
                    });
                }}
            >
                <Rect
                    width={size}
                    height={size}
                    cornerRadius={12}
                    fill={isSelected ? "#dcfce7" : "#ffffff"}
                    stroke={isSelected ? "#0284c7" : "#16a34a"}
                    strokeWidth={isSelected ? 3 : 2}
                    shadowColor="rgba(0,0,0,0.1)"
                    shadowBlur={4}
                />
                <KonvaText
                    text="✔"
                    x={0}
                    y={6}
                    width={size}
                    align="center"
                    fontSize={22}
                    fontStyle="bold"
                    fill="#16a34a"
                    listening={false}
                />
            </Group>
        );
    }

    // 3. Cross Token
    if (tok.type === "cross") {
        const size = 38;
        return (
            <Group
                id={tok.id}
                x={x}
                y={y}
                draggable={!isEditing}
                visible={!isEditing}
                dragBoundFunc={dragBoundFunc}
                onDragStart={onDragStart}
                onClick={(e) => onSelect(e)}
                onTap={(e) => onSelect(e)}
                onDblClick={onDoubleClick}
                onDblTap={onDoubleClick}
                onDragEnd={(e) => {
                    onDragEndClean();
                    onUpdateToken(tok.id, {
                        x: Math.round(e.target.x()),
                        y: Math.round(e.target.y()),
                    });
                }}
            >
                <Rect
                    width={size}
                    height={size}
                    cornerRadius={12}
                    fill={isSelected ? "#fee2e2" : "#ffffff"}
                    stroke={isSelected ? "#0284c7" : "#dc2626"}
                    strokeWidth={isSelected ? 3 : 2}
                    shadowColor="rgba(0,0,0,0.1)"
                    shadowBlur={4}
                />
                <KonvaText
                    text="✖"
                    x={0}
                    y={6}
                    width={size}
                    align="center"
                    fontSize={22}
                    fontStyle="bold"
                    fill="#dc2626"
                    listening={false}
                />
            </Group>
        );
    }

    // 3. Image Token
    if (tok.type === "image") {
        const width = tok.width || 100;
        const height = tok.height || 100;
        return (
            <CanvasImageTokenItem
                tok={tok}
                x={x}
                y={y}
                width={width}
                height={height}
                isSelected={isSelected}
                isEditing={isEditing}
                dragBoundFunc={dragBoundFunc}
                onDragStart={onDragStart}
                onSelect={onSelect}
                onDoubleClick={onDoubleClick}
                onDragEndClean={onDragEndClean}
                onUpdateToken={onUpdateToken}
            />
        );
    }

    // 4. Word Token (Default)
    const fontSize = tok.fontSize || 18;
    const textStr = tok.text || "Kata";
    const textWidth = Math.max(70, textStr.length * fontSize * 0.7 + 24);
    const textHeight = fontSize + 16;

    return (
        <Group
            id={tok.id}
            x={x}
            y={y}
            draggable={!isEditing}
            visible={!isEditing}
            dragBoundFunc={dragBoundFunc}
            onDragStart={onDragStart}
            onClick={(e) => onSelect(e)}
            onTap={(e) => onSelect(e)}
            onDblClick={onDoubleClick}
            onDblTap={onDoubleClick}
            onDragEnd={(e) => {
                onDragEndClean();
                onUpdateToken(tok.id, {
                    x: Math.round(e.target.x()),
                    y: Math.round(e.target.y()),
                });
            }}
        >
            <Rect
                width={textWidth}
                height={textHeight}
                cornerRadius={12}
                fill={isSelected ? "#ffedd5" : "#ffffff"}
                stroke={isSelected ? "#0284c7" : "#ea580c"}
                strokeWidth={isSelected ? 2.5 : 1.8}
                shadowColor="rgba(0,0,0,0.08)"
                shadowBlur={3}
            />
            <KonvaText
                text={textStr}
                x={8}
                y={8}
                width={textWidth - 16}
                align="center"
                fontSize={fontSize}
                fontStyle="bold"
                fontFamily="'Comic Sans MS', 'Outfit', 'Inter', sans-serif"
                fill={tok.color || "#ea580c"}
                listening={false}
            />
        </Group>
    );
}
