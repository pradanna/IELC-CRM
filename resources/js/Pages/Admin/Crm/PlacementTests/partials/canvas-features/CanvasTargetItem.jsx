import React from "react";
import { Group, Circle, Rect, Text as KonvaText } from "react-konva";

export default function CanvasTargetItem({
    tgt,
    isSelected,
    isEditing,
    dragBoundFunc,
    onDragStart,
    onSelect,
    onDoubleClick,
    onDragEndClean,
    onUpdateTarget,
}) {
    if (tgt.type === "ring_target") {
        const radius = tgt.radius || 24;
        const fontSize = tgt.fontSize || 16;
        const textWidth = Math.round(radius * 3);

        return (
            <Group
                id={tgt.id}
                x={tgt.x}
                y={tgt.y}
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
                    onUpdateTarget(tgt.id, {
                        x: e.target.x(),
                        y: e.target.y(),
                    });
                }}
                onTransformEnd={(e) => {
                    const node = e.target;
                    const scaleX = node.scaleX();
                    node.scaleX(1);
                    node.scaleY(1);
                    const currentRadius = tgt.radius || 24;
                    const newRadius = Math.round(
                        Math.max(12, currentRadius * scaleX)
                    );
                    onUpdateTarget(tgt.id, {
                        x: node.x(),
                        y: node.y(),
                        radius: newRadius,
                    });
                }}
            >
                {/* Dotted Green Ring Target Outline */}
                <Circle
                    radius={radius}
                    scaleX={1.5}
                    stroke="#22c55e"
                    strokeWidth={isSelected ? 4 : 2.5}
                    dash={[6, 4]}
                    fill="rgba(34, 197, 94, 0.08)"
                />
                {/* Plain black text inside the ring */}
                <KonvaText
                    text={tgt.label || "Jawaban Benar"}
                    fontSize={fontSize}
                    fontFamily="'Comic Sans MS', 'Outfit', 'Inter', sans-serif"
                    fontStyle="normal"
                    fill="#0f172a"
                    width={textWidth}
                    offsetX={textWidth / 2}
                    offsetY={Math.round(fontSize * 0.6)}
                    align="center"
                />
            </Group>
        );
    }

    if (tgt.type === "box_target") {
        const isCross =
            tgt.correct_symbol === "cross" ||
            tgt.correct_token_id?.includes("crs");

        return (
            <Group
                id={tgt.id}
                x={tgt.x}
                y={tgt.y}
                draggable
                dragBoundFunc={dragBoundFunc}
                onDragStart={onDragStart}
                onClick={(e) => onSelect(e)}
                onTap={(e) => onSelect(e)}
                onDragEnd={(e) => {
                    onDragEndClean();
                    onUpdateTarget(tgt.id, {
                        x: e.target.x(),
                        y: e.target.y(),
                    });
                }}
                onTransformEnd={(e) => {
                    const node = e.target;
                    const scaleX = node.scaleX();
                    const scaleY = node.scaleY();
                    node.scaleX(1);
                    node.scaleY(1);
                    const newWidth = Math.round(
                        Math.max(20, (tgt.width || 36) * scaleX)
                    );
                    const newHeight = Math.round(
                        Math.max(20, (tgt.height || 36) * scaleY)
                    );
                    onUpdateTarget(tgt.id, {
                        x: node.x(),
                        y: node.y(),
                        width: newWidth,
                        height: newHeight,
                    });
                }}
            >
                <Rect
                    width={tgt.width || 36}
                    height={tgt.height || 36}
                    stroke="#16a34a"
                    strokeWidth={isSelected ? 3 : 2}
                    dash={[4, 3]}
                    cornerRadius={6}
                    fill="rgba(22, 163, 74, 0.08)"
                />
                <KonvaText
                    text={isCross ? "✖" : "✔"}
                    fontSize={16}
                    fontStyle="bold"
                    fill={isCross ? "#dc2626" : "#16a34a"}
                    width={tgt.width || 36}
                    align="center"
                    y={9}
                />
            </Group>
        );
    }

    if (tgt.type === "input_target") {
        return (
            <Group
                id={tgt.id}
                x={tgt.x}
                y={tgt.y}
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
                    onUpdateTarget(tgt.id, {
                        x: e.target.x(),
                        y: e.target.y(),
                    });
                }}
                onTransformEnd={(e) => {
                    const node = e.target;
                    const scaleX = node.scaleX();
                    const scaleY = node.scaleY();
                    node.scaleX(1);
                    node.scaleY(1);
                    const newWidth = Math.round(
                        Math.max(40, (tgt.width || 120) * scaleX)
                    );
                    const newHeight = Math.round(
                        Math.max(24, (tgt.height || 36) * scaleY)
                    );
                    onUpdateTarget(tgt.id, {
                        x: node.x(),
                        y: node.y(),
                        width: newWidth,
                        height: newHeight,
                    });
                }}
            >
                <Rect
                    width={tgt.width || 120}
                    height={tgt.height || 36}
                    stroke="#0284c7"
                    strokeWidth={isSelected ? 3 : 2}
                    cornerRadius={8}
                    fill="#f0f9ff"
                />
                <KonvaText
                    text={
                        tgt.correct_text
                            ? `⌨ "${tgt.correct_text}"`
                            : "⌨ [Kotak Ketik]"
                    }
                    fontSize={tgt.fontSize || 11}
                    fontStyle="bold"
                    fill="#0369a1"
                    width={tgt.width || 120}
                    align="center"
                    y={Math.max(
                        4,
                        Math.round(
                            ((tgt.height || 36) - (tgt.fontSize || 11) * 1.2) /
                                2
                        )
                    )}
                />
            </Group>
        );
    }

    if (tgt.type === "word_target") {
        return (
            <Group
                id={tgt.id}
                x={tgt.x}
                y={tgt.y}
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
                    onUpdateTarget(tgt.id, {
                        x: e.target.x(),
                        y: e.target.y(),
                    });
                }}
                onTransformEnd={(e) => {
                    const node = e.target;
                    const scaleX = node.scaleX();
                    const scaleY = node.scaleY();
                    node.scaleX(1);
                    node.scaleY(1);
                    const newWidth = Math.round(
                        Math.max(30, (tgt.width || 100) * scaleX)
                    );
                    const newHeight = Math.round(
                        Math.max(20, (tgt.height || 30) * scaleY)
                    );
                    onUpdateTarget(tgt.id, {
                        x: node.x(),
                        y: node.y(),
                        width: newWidth,
                        height: newHeight,
                    });
                }}
            >
                <Rect
                    width={tgt.width || 100}
                    height={tgt.height || 30}
                    stroke="#ea580c"
                    strokeWidth={isSelected ? 3 : 2}
                    dash={[5, 4]}
                    cornerRadius={8}
                    fill="rgba(234, 88, 12, 0.08)"
                />
                <KonvaText
                    text={`[ ${tgt.label || "Drop Word"} ]`}
                    fontSize={tgt.fontSize || 10}
                    fontStyle="bold"
                    fill="#c2410c"
                    width={tgt.width || 100}
                    align="center"
                    y={Math.max(
                        4,
                        Math.round(
                            ((tgt.height || 30) - (tgt.fontSize || 10) * 1.2) /
                                2
                        )
                    )}
                />
            </Group>
        );
    }

    if (tgt.type === "example_circle") {
        const radius = tgt.radius || 28;
        const fontSize = tgt.fontSize || 14;
        const textWidth = Math.round(radius * 3);
        const isAnsweredRing = !!tgt.label && tgt.label !== "Contoh Lingkaran";

        return (
            <Group
                id={tgt.id}
                x={tgt.x}
                y={tgt.y}
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
                    onUpdateTarget(tgt.id, {
                        x: e.target.x(),
                        y: e.target.y(),
                    });
                }}
                onTransformEnd={(e) => {
                    const node = e.target;
                    const scaleX = node.scaleX();
                    node.scaleX(1);
                    node.scaleY(1);
                    onUpdateTarget(tgt.id, {
                        x: node.x(),
                        y: node.y(),
                        radius: Math.round(
                            Math.max(12, (tgt.radius || 28) * scaleX)
                        ),
                    });
                }}
            >
                {/* Dotted / Solid Example Ring Outline (Emerald if answered ring, Violet if general example circle) */}
                <Circle
                    radius={radius}
                    scaleX={1.5}
                    stroke={isAnsweredRing ? "#10b981" : "#7c3aed"}
                    strokeWidth={isSelected ? 4 : 2.5}
                    dash={isAnsweredRing ? [5, 3] : [6, 4]}
                    fill={isAnsweredRing ? "rgba(16, 185, 129, 0.14)" : "rgba(124, 58, 237, 0.08)"}
                />
                <KonvaText
                    text={tgt.label || "CONTOH"}
                    fontSize={fontSize}
                    fontFamily="'Comic Sans MS', 'Outfit', 'Inter', sans-serif"
                    fontStyle="bold"
                    fill={isAnsweredRing ? "#047857" : "#6d28d9"}
                    width={textWidth}
                    offsetX={textWidth / 2}
                    offsetY={Math.round(fontSize * 0.6)}
                    align="center"
                />
                <KonvaText
                    text="CONTOH"
                    fontSize={8}
                    fontStyle="bold"
                    fill="#7c3aed"
                    offsetX={16}
                    offsetY={Math.round(radius + 10)}
                    align="center"
                />
            </Group>
        );
    }

    if (tgt.type === "example_box") {
        const isCross = tgt.example_symbol === "cross";
        const symbol = isCross ? "✖" : "✔";
        const symbolColor = isCross ? "#dc2626" : "#16a34a";
        const width = tgt.width || 36;
        const height = tgt.height || 36;

        return (
            <Group
                id={tgt.id}
                x={tgt.x}
                y={tgt.y}
                draggable
                dragBoundFunc={dragBoundFunc}
                onDragStart={onDragStart}
                onClick={(e) => onSelect(e)}
                onTap={(e) => onSelect(e)}
                onDragEnd={(e) => {
                    onDragEndClean();
                    onUpdateTarget(tgt.id, {
                        x: e.target.x(),
                        y: e.target.y(),
                    });
                }}
                onTransformEnd={(e) => {
                    const node = e.target;
                    const scaleX = node.scaleX();
                    const scaleY = node.scaleY();
                    node.scaleX(1);
                    node.scaleY(1);
                    onUpdateTarget(tgt.id, {
                        x: node.x(),
                        y: node.y(),
                        width: Math.round(
                            Math.max(20, width * scaleX)
                        ),
                        height: Math.round(
                            Math.max(20, height * scaleY)
                        ),
                    });
                }}
            >
                <Rect
                    width={width}
                    height={height}
                    stroke={isCross ? "#f43f5e" : "#10b981"}
                    strokeWidth={isSelected ? 3 : 2}
                    dash={[4, 3]}
                    cornerRadius={6}
                    fill={isCross ? "rgba(244, 63, 94, 0.1)" : "rgba(16, 185, 129, 0.1)"}
                />
                {/* Active answered symbol inside example box */}
                <KonvaText
                    text={symbol}
                    fontSize={Math.round(Math.min(width, height) * 0.55)}
                    fontStyle="bold"
                    fill={symbolColor}
                    width={width}
                    align="center"
                    y={Math.max(2, Math.round((height - Math.min(width, height) * 0.55 * 1.2) / 2))}
                />
                {/* Mini example badge */}
                <KonvaText
                    text="CONTOH"
                    fontSize={7}
                    fontStyle="bold"
                    fill="#7c3aed"
                    width={width}
                    align="center"
                    y={-10}
                />
            </Group>
        );
    }

    if (tgt.type === "example_word") {
        const width = tgt.width || 100;
        const height = tgt.height || 32;
        const text = tgt.example_text || "Contoh";

        return (
            <Group
                id={tgt.id}
                x={tgt.x}
                y={tgt.y}
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
                    onUpdateTarget(tgt.id, {
                        x: e.target.x(),
                        y: e.target.y(),
                    });
                }}
                onTransformEnd={(e) => {
                    const node = e.target;
                    const scaleX = node.scaleX();
                    const scaleY = node.scaleY();
                    node.scaleX(1);
                    node.scaleY(1);
                    onUpdateTarget(tgt.id, {
                        x: node.x(),
                        y: node.y(),
                        width: Math.round(
                            Math.max(30, width * scaleX)
                        ),
                        height: Math.round(
                            Math.max(20, height * scaleY)
                        ),
                    });
                }}
            >
                <Rect
                    width={width}
                    height={height}
                    stroke="#ea580c"
                    strokeWidth={isSelected ? 3 : 2}
                    dash={[4, 3]}
                    cornerRadius={8}
                    fill="rgba(251, 146, 60, 0.15)"
                />
                {/* Active answered word text */}
                <KonvaText
                    text={text}
                    fontSize={tgt.fontSize || 13}
                    fontStyle="bold"
                    fill="#ea580c"
                    width={width}
                    align="center"
                    y={Math.max(
                        4,
                        Math.round(((height) - (tgt.fontSize || 13) * 1.2) / 2)
                    )}
                />
                <KonvaText
                    text="CONTOH"
                    fontSize={7}
                    fontStyle="bold"
                    fill="#7c3aed"
                    width={width}
                    align="center"
                    y={-10}
                />
            </Group>
        );
    }

    if (tgt.type === "example_input") {
        const width = tgt.width || 120;
        const height = tgt.height || 36;
        const text = tgt.example_text || "Jawaban Contoh";

        return (
            <Group
                id={tgt.id}
                x={tgt.x}
                y={tgt.y}
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
                    onUpdateTarget(tgt.id, {
                        x: e.target.x(),
                        y: e.target.y(),
                    });
                }}
                onTransformEnd={(e) => {
                    const node = e.target;
                    const scaleX = node.scaleX();
                    const scaleY = node.scaleY();
                    node.scaleX(1);
                    node.scaleY(1);
                    onUpdateTarget(tgt.id, {
                        x: node.x(),
                        y: node.y(),
                        width: Math.round(
                            Math.max(40, width * scaleX)
                        ),
                        height: Math.round(
                            Math.max(24, height * scaleY)
                        ),
                    });
                }}
            >
                <Rect
                    width={width}
                    height={height}
                    stroke="#0284c7"
                    strokeWidth={isSelected ? 3 : 2}
                    dash={[4, 3]}
                    cornerRadius={8}
                    fill="#f0f9ff"
                />
                {/* Active answered input text */}
                <KonvaText
                    text={`⌨ "${text}"`}
                    fontSize={tgt.fontSize || 11}
                    fontStyle="bold"
                    fill="#0369a1"
                    width={width}
                    align="center"
                    y={Math.max(
                        4,
                        Math.round(((height) - (tgt.fontSize || 11) * 1.2) / 2)
                    )}
                />
                <KonvaText
                    text="CONTOH"
                    fontSize={7}
                    fontStyle="bold"
                    fill="#7c3aed"
                    width={width}
                    align="center"
                    y={-10}
                />
            </Group>
        );
    }

    return null;
}
