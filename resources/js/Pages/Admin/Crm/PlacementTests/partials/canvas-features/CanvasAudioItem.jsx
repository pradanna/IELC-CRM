import React, { useState, useRef, useEffect } from "react";
import { Group, Rect, Circle, Text as KonvaText, Path } from "react-konva";

export default function CanvasAudioItem({
    element,
    isSelected,
    onSelect,
    onChange,
    onDragStart,
    dragBoundFunc,
}) {
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef(null);

    // Maintain audio instance
    useEffect(() => {
        if (!element.src) {
            audioRef.current = null;
            return;
        }
        const audio = new window.Audio(element.src);
        audio.onended = () => setIsPlaying(false);
        audio.onpause = () => setIsPlaying(false);
        audio.onerror = () => setIsPlaying(false);
        audioRef.current = audio;

        return () => {
            audio.pause();
            audioRef.current = null;
        };
    }, [element.src]);

    const togglePlay = (e) => {
        if (e) e.cancelBubble = true;
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            audioRef.current.play().catch((err) => {
                console.warn("Audio play blocked or error:", err);
                setIsPlaying(false);
            });
            setIsPlaying(true);
        }
    };

    const width = element.width || 180;
    const height = element.height || 48;
    const label = element.label || element.name || "Audio Track";

    // Play triangle icon path or pause two bars
    // Play path inside 20x20 box
    const playPath = "M 6 4 L 16 10 L 6 16 Z";
    // Pause bars path
    const pausePath = "M 5 4 L 8 4 L 8 16 L 5 16 Z M 12 4 L 15 4 L 15 16 L 12 16 Z";

    return (
        <Group
            id={element.id}
            x={element.x}
            y={element.y}
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
        >
            {/* Background pill / card */}
            <Rect
                x={0}
                y={0}
                width={width}
                height={height}
                cornerRadius={16}
                fill={isSelected ? "#f5f3ff" : "#ffffff"}
                stroke={isSelected ? "#7c3aed" : isPlaying ? "#8b5cf6" : "#cbd5e1"}
                strokeWidth={isSelected ? 2.5 : 1.5}
                shadowColor="#000000"
                shadowBlur={isSelected ? 10 : 4}
                shadowOpacity={isSelected ? 0.15 : 0.08}
                shadowOffsetY={2}
            />

            {/* Play/Pause Button Circle */}
            <Group
                x={24}
                y={height / 2}
                onClick={togglePlay}
                onTap={togglePlay}
            >
                <Circle
                    radius={16}
                    fill={isPlaying ? "#7c3aed" : "#8b5cf6"}
                    shadowColor="#7c3aed"
                    shadowBlur={isPlaying ? 8 : 2}
                    shadowOpacity={0.3}
                />
                <Path
                    data={isPlaying ? pausePath : playPath}
                    x={-10}
                    y={-10}
                    fill="#ffffff"
                />
            </Group>

            {/* Audio Title / Label */}
            <KonvaText
                x={48}
                y={height / 2 - 12}
                text={label}
                width={width - 56}
                fontSize={12}
                fontStyle="bold"
                fontFamily="'Comic Sans MS', 'Outfit', 'Inter', sans-serif"
                fill="#1e1b4b"
                ellipsis={true}
                wrap="none"
            />

            {/* Sub-label */}
            <KonvaText
                x={48}
                y={height / 2 + 3}
                text={isPlaying ? "▶ Sedang Memutar..." : "🔊 Klik untuk dengar"}
                fontSize={9}
                fontFamily="'Inter', sans-serif"
                fill={isPlaying ? "#7c3aed" : "#64748b"}
            />
        </Group>
    );
}
