import React, { useState, useRef, useEffect } from "react";
import {
    Stage,
    Layer,
    Rect,
    Text as KonvaText,
    Transformer,
} from "react-konva";
import { ImageIcon } from "lucide-react";
import TextInput from "@/Components/form/TextInput";
import axios from "axios";
import { compressImageIfNeeded } from "@/Utils/imageCompressor";

// Modular Canvas Feature Sub-components
import CanvasElementItem from "./canvas-features/CanvasElementItem";
import CanvasTargetItem from "./canvas-features/CanvasTargetItem";
import CanvasTokenItem from "./canvas-features/CanvasTokenItem";
import CanvasToolbar from "./canvas-features/CanvasToolbar";
import CanvasShortcutsBar from "./canvas-features/CanvasShortcutsBar";
import TokenBankBar from "./canvas-features/TokenBankBar";
import InspectorElementsTab from "./canvas-features/InspectorElementsTab";
import InspectorTargetsTab from "./canvas-features/InspectorTargetsTab";
import InspectorTokensTab from "./canvas-features/InspectorTokensTab";

export default function KidsFreeformCanvasStudio({ value, onChange }) {
    const stageWidth = 1100;
    const stageHeight = 1000;

    // Normalization helper
    const normalizeState = (raw) => {
        if (!raw) {
            return {
                mode: "freeform_canvas",
                instruction: "",
                tokens: [],
                elements: [],
                targets: [],
            };
        }
        let parsed = typeof raw === "string" ? null : raw;
        if (typeof raw === "string") {
            try {
                parsed = JSON.parse(raw);
            } catch (e) {
                parsed = null;
            }
        }
        if (!parsed || typeof parsed !== "object") {
            return {
                mode: "freeform_canvas",
                instruction: "",
                tokens: [],
                elements: [],
                targets: [],
            };
        }

        // Parse Elements (Text, Images) with safe numeric conversion
        const elements = (
            Array.isArray(parsed.elements) ? parsed.elements : []
        ).map((el) => {
            const parsedX = Number(el.x);
            const parsedY = Number(el.y);
            const parsedWidth = Number(el.width);
            const parsedHeight = Number(el.height);
            const parsedFontSize = Number(el.fontSize);

            return {
                ...el,
                x: Number.isFinite(parsedX) ? parsedX : 50,
                y: Number.isFinite(parsedY) ? parsedY : 50,
                ...(Number.isFinite(parsedWidth) ? { width: parsedWidth } : {}),
                ...(Number.isFinite(parsedHeight) ? { height: parsedHeight } : {}),
                ...(Number.isFinite(parsedFontSize)
                    ? { fontSize: parsedFontSize }
                    : {}),
            };
        });

        // Parse Targets (Ring Target, Word Target, Box Target, Input Target, Example Markers)
        const targets = (
            Array.isArray(parsed.targets) ? parsed.targets : []
        ).map((tgt) => {
            const parsedX = Number(tgt.x);
            const parsedY = Number(tgt.y);
            const parsedWidth = Number(tgt.width);
            const parsedHeight = Number(tgt.height);
            const parsedRadius = Number(tgt.radius);
            const parsedFontSize = Number(tgt.fontSize);

            return {
                ...tgt,
                x: Number.isFinite(parsedX) ? parsedX : 100,
                y: Number.isFinite(parsedY) ? parsedY : 100,
                ...(Number.isFinite(parsedWidth) ? { width: parsedWidth } : {}),
                ...(Number.isFinite(parsedHeight) ? { height: parsedHeight } : {}),
                ...(Number.isFinite(parsedRadius) ? { radius: parsedRadius } : {}),
                ...(Number.isFinite(parsedFontSize)
                    ? { fontSize: parsedFontSize }
                    : {}),
            };
        });

        // Parse Tokens with safe numeric coordinates & fontSize & allowed_target_ids
        const tokens = (
            Array.isArray(parsed.tokens) ? parsed.tokens : []
        ).map((tok, idx) => {
            const parsedFontSize = Number(tok.fontSize);
            const parsedX = Number(tok.x);
            const parsedY = Number(tok.y);
            const allowedIds = Array.isArray(tok.allowed_target_ids)
                ? tok.allowed_target_ids
                : tok.allowed_target_id
                ? [tok.allowed_target_id]
                : [];

            return {
                ...tok,
                allowed_target_ids: allowedIds,
                x: Number.isFinite(parsedX) ? parsedX : 880,
                y: Number.isFinite(parsedY) ? parsedY : 120 + idx * 55,
                ...(Number.isFinite(parsedFontSize)
                    ? { fontSize: parsedFontSize }
                    : {}),
            };
        });

        return {
            mode: parsed.mode || "freeform_canvas",
            instruction: parsed.instruction || "",
            tokens,
            elements,
            targets,
        };
    };

    // Initial Canvas State
    const [canvasState, setCanvasState] = useState(() => normalizeState(value));
    const isInternalUpdateRef = useRef(false);
    const lastValueStringRef = useRef(JSON.stringify(normalizeState(value)));

    // Update canvasState when value prop changes externally
    useEffect(() => {
        if (isInternalUpdateRef.current) {
            isInternalUpdateRef.current = false;
            return;
        }

        const normalized = normalizeState(value);
        const normalizedString = JSON.stringify(normalized);
        const currentString = JSON.stringify(canvasState);

        if (normalizedString !== currentString) {
            setCanvasState(normalized);
            lastValueStringRef.current = normalizedString;
            historyRef.current = [normalized];
            historyStepRef.current = 0;
            setHistory([normalized]);
            setHistoryStep(0);
        }
    }, [value]);

    const [selectedIds, setSelectedIds] = useState([]); // Array of selected element IDs
    const [selectedTargetIds, setSelectedTargetIds] = useState([]); // Array of selected target IDs
    const [selectedTokenIds, setSelectedTokenIds] = useState([]); // Array of selected token IDs
    const [activeTab, setActiveTab] = useState("elements"); // 'elements' | 'targets' | 'tokens'
    const [newWordInput, setNewWordInput] = useState("");
    const [editingTextId, setEditingTextId] = useState(null);
    const [editingTextValue, setEditingTextValue] = useState("");
    const [editingTargetId, setEditingTargetId] = useState(null);
    const [editingTargetValue, setEditingTargetValue] = useState("");
    const [editingTokenId, setEditingTokenId] = useState(null);
    const [editingTokenValue, setEditingTokenValue] = useState("");
    const trRef = useRef(null);
    const stageRef = useRef(null);
    const textInputRef = useRef(null);
    const targetInputRef = useRef(null);
    const tokenInputRef = useRef(null);

    // Shift key tracker for Straight Axis Lock (Orthogonal drag / snapping)
    const isShiftPressedRef = useRef(false);
    const dragStartPosMapRef = useRef({});

    useEffect(() => {
        const handleKeyDownShift = (e) => {
            if (e.key === "Shift" || e.shiftKey)
                isShiftPressedRef.current = true;
        };
        const handleKeyUpShift = (e) => {
            if (e.key === "Shift" || !e.shiftKey)
                isShiftPressedRef.current = false;
        };
        const handleMouseMove = (e) => {
            isShiftPressedRef.current = !!e.shiftKey;
        };
        const handleWindowBlur = () => {
            isShiftPressedRef.current = false;
            dragStartPosMapRef.current = {};
        };

        window.addEventListener("keydown", handleKeyDownShift, true);
        window.addEventListener("keyup", handleKeyUpShift, true);
        window.addEventListener("mousemove", handleMouseMove, true);
        window.addEventListener("blur", handleWindowBlur);

        return () => {
            window.removeEventListener("keydown", handleKeyDownShift, true);
            window.removeEventListener("keyup", handleKeyUpShift, true);
            window.removeEventListener("mousemove", handleMouseMove, true);
            window.removeEventListener("blur", handleWindowBlur);
        };
    }, []);

    // Helper: dragBoundFunc to lock movement horizontally or vertically ONLY if Shift is held
    const createDragBoundFunc = (id) =>
        function (pos) {
            if (!isShiftPressedRef.current) {
                return pos;
            }

            let startPos = dragStartPosMapRef.current[id];
            if (!startPos || typeof startPos.x !== "number") {
                startPos = { x: pos.x, y: pos.y, lockAxis: null };
                dragStartPosMapRef.current[id] = startPos;
                return pos;
            }

            const dx = Math.abs(pos.x - startPos.x);
            const dy = Math.abs(pos.y - startPos.y);

            if (!startPos.lockAxis && (dx > 4 || dy > 4)) {
                startPos.lockAxis = dx >= dy ? "horizontal" : "vertical";
            }

            if (startPos.lockAxis === "horizontal") {
                return { x: pos.x, y: startPos.y };
            } else if (startPos.lockAxis === "vertical") {
                return { x: startPos.x, y: pos.y };
            }

            return pos;
        };

    const handleItemDragStart = (id, e) => {
        const x = e.target.x();
        const y = e.target.y();
        dragStartPosMapRef.current[id] = { x, y, lockAxis: null };
    };

    const handleItemDragEndClean = (id) => {
        delete dragStartPosMapRef.current[id];
    };

    // Undo / Redo History Stack (Ref-backed for guaranteed consistency)
    const [history, setHistory] = useState([canvasState]);
    const [historyStep, setHistoryStep] = useState(0);
    const historyRef = useRef([canvasState]);
    const historyStepRef = useRef(0);

    const pushHistory = (newState) => {
        const nextHistory = historyRef.current.slice(
            0,
            historyStepRef.current + 1
        );
        nextHistory.push(newState);
        if (nextHistory.length > 50) {
            nextHistory.shift();
        }
        historyRef.current = nextHistory;
        historyStepRef.current = nextHistory.length - 1;
        setHistory(nextHistory);
        setHistoryStep(historyStepRef.current);
    };

    const handleUndo = () => {
        if (historyStepRef.current > 0) {
            const prevStep = historyStepRef.current - 1;
            historyStepRef.current = prevStep;
            const targetState = historyRef.current[prevStep];
            setHistoryStep(prevStep);
            setCanvasState(targetState);
            setSelectedIds([]);
            setSelectedTargetIds([]);
            setEditingTextId(null);
            setEditingTargetId(null);
        }
    };

    const handleRedo = () => {
        if (historyStepRef.current < historyRef.current.length - 1) {
            const nextStep = historyStepRef.current + 1;
            historyStepRef.current = nextStep;
            const targetState = historyRef.current[nextStep];
            setHistoryStep(nextStep);
            setCanvasState(targetState);
            setSelectedIds([]);
            setSelectedTargetIds([]);
            setEditingTextId(null);
            setEditingTargetId(null);
        }
    };

    // Helper updater with history tracking
    const updateCanvasStateWithHistory = (updater) => {
        setCanvasState((prev) => {
            const next =
                typeof updater === "function"
                    ? updater(prev)
                    : { ...prev, ...updater };
            pushHistory(next);
            return next;
        });
    };

    const selectedId = selectedIds.length === 1 ? selectedIds[0] : null;
    const selectedTargetId =
        selectedTargetIds.length === 1 ? selectedTargetIds[0] : null;

    const setSelectedId = (id) => {
        setSelectedIds(id ? [id] : []);
    };

    const setSelectedTargetId = (id) => {
        setSelectedTargetIds(id ? [id] : []);
    };

    // Selection click handlers supporting Shift + Click multi-selection
    const handleSelectElementItem = (id, e) => {
        const isShift = e?.evt?.shiftKey || e?.shiftKey || isShiftPressedRef.current;
        if (isShift) {
            setSelectedIds((prev) =>
                prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
            );
        } else {
            setSelectedIds([id]);
            setSelectedTargetIds([]);
            setSelectedTokenIds([]);
        }
        setActiveTab("elements");
    };

    const handleSelectTargetItem = (id, e) => {
        const isShift = e?.evt?.shiftKey || e?.shiftKey || isShiftPressedRef.current;
        if (isShift) {
            setSelectedTargetIds((prev) =>
                prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
            );
        } else {
            setSelectedTargetIds([id]);
            setSelectedIds([]);
            setSelectedTokenIds([]);
        }
        setActiveTab("targets");
    };

    const handleSelectTokenItem = (id, e) => {
        const isShift = e?.evt?.shiftKey || e?.shiftKey || isShiftPressedRef.current;
        if (isShift) {
            setSelectedTokenIds((prev) =>
                prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
            );
        } else {
            setSelectedTokenIds([id]);
            setSelectedIds([]);
            setSelectedTargetIds([]);
        }
        setActiveTab("tokens");
    };

    // Synchronize to Parent Form
    useEffect(() => {
        isInternalUpdateRef.current = true;
        lastValueStringRef.current = JSON.stringify(canvasState);
        onChange(canvasState);
    }, [canvasState]);

    // Focus & select text when entering inline edit mode
    useEffect(() => {
        if (editingTextId && textInputRef.current) {
            textInputRef.current.focus();
            textInputRef.current.select();
        }
    }, [editingTextId]);

    // Focus & select target when entering inline edit mode
    useEffect(() => {
        if (editingTargetId && targetInputRef.current) {
            targetInputRef.current.focus();
            targetInputRef.current.select();
        }
    }, [editingTargetId]);

    // Handle selection transformer
    useEffect(() => {
        if (!trRef.current || !stageRef.current) return;
        if (
            (selectedIds.length === 0 && selectedTargetIds.length === 0) ||
            editingTextId ||
            editingTargetId
        ) {
            trRef.current.nodes([]);
            trRef.current.getLayer()?.batchDraw();
            return;
        }

        const nodes = [];
        selectedIds.forEach((id) => {
            const node = stageRef.current.findOne("#" + id);
            if (node) nodes.push(node);
        });
        selectedTargetIds.forEach((id) => {
            const node = stageRef.current.findOne("#" + id);
            if (node) nodes.push(node);
        });

        trRef.current.nodes(nodes);
        trRef.current.getLayer()?.batchDraw();
    }, [
        selectedIds,
        selectedTargetIds,
        editingTextId,
        editingTargetId,
        canvasState.elements,
        canvasState.targets,
    ]);

    // Inline Text Editing Actions
    const handleStartEditText = (el) => {
        setSelectedIds([el.id]);
        setSelectedTargetIds([]);
        setActiveTab("elements");
        setEditingTargetId(null);
        setEditingTextId(el.id);
        setEditingTextValue(el.text || "");
    };

    const handleFinishEditText = () => {
        if (editingTextId) {
            const trimmed = editingTextValue;
            handleUpdateElement(editingTextId, { text: trimmed });
            setEditingTextId(null);
        }
    };

    // Inline Target Label / Word Editing Actions
    const handleStartEditTarget = (tgt) => {
        setSelectedTargetIds([tgt.id]);
        setSelectedIds([]);
        setActiveTab("targets");
        setEditingTextId(null);
        setEditingTargetId(tgt.id);
        if (tgt.type === "input_target") {
            setEditingTargetValue(tgt.correct_text || tgt.label || "");
        } else {
            setEditingTargetValue(tgt.label || "");
        }
    };

    const handleFinishEditTarget = () => {
        if (editingTargetId) {
            const tgt = canvasState.targets.find(
                (t) => t.id === editingTargetId
            );
            if (tgt) {
                if (tgt.type === "input_target") {
                    handleUpdateTarget(editingTargetId, {
                        correct_text: editingTargetValue,
                        label: editingTargetValue || tgt.label,
                    });
                } else {
                    handleUpdateTarget(editingTargetId, {
                        label: editingTargetValue,
                    });
                }
            }
            setEditingTargetId(null);
        }
    };

    // 1. Add Text Element
    const handleAddText = () => {
        const newId = `txt_${Date.now()}`;
        const newElem = {
            id: newId,
            type: "text",
            text: "Teks Baru (Double click / edit)",
            x: 100,
            y: 100,
            fontSize: 18,
            fontStyle: "normal",
            fill: "#1e293b",
        };
        updateCanvasStateWithHistory((prev) => ({
            ...prev,
            elements: [...prev.elements, newElem],
        }));
        setSelectedId(newId);
        handleStartEditText(newElem);
    };

    const [isDragOverCanvas, setIsDragOverCanvas] = useState(false);

    // Process Image File with auto-upload
    const processImageFile = async (file, dropX = 150, dropY = 150) => {
        if (!file || !file.type.startsWith("image/")) return;

        let imageUrl = null;
        try {
            const compressedFile = await compressImageIfNeeded(
                file,
                2 * 1024 * 1024,
                1920,
                1920
            );
            const formData = new FormData();
            formData.append("image", compressedFile);

            const uploadUrl = route("admin.placement-tests.upload-canvas-image");
            const res = await axios.post(uploadUrl, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            if (res.data?.url) {
                imageUrl = res.data.url;
            }
        } catch (err) {
            console.warn(
                "Gagal auto-upload gambar ke server, fallback ke Base64 lokal:",
                err
            );
        }

        if (!imageUrl) {
            imageUrl = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result);
                reader.readAsDataURL(file);
            });
        }

        if (!imageUrl) return;

        const tempImg = new window.Image();
        tempImg.crossOrigin = "Anonymous";
        tempImg.src = imageUrl;
        tempImg.onload = () => {
            const maxDim = 180;
            let w = tempImg.naturalWidth || 120;
            let h = tempImg.naturalHeight || 100;
            if (w > maxDim || h > maxDim) {
                if (w > h) {
                    h = Math.round((h / w) * maxDim);
                    w = maxDim;
                } else {
                    w = Math.round((w / h) * maxDim);
                    h = maxDim;
                }
            }

            const finalX = Math.max(
                10,
                Math.min(stageWidth - w - 10, dropX - w / 2)
            );
            const finalY = Math.max(
                10,
                Math.min(stageHeight - h - 10, dropY - h / 2)
            );

            const newId = `img_${Date.now()}`;
            const newElem = {
                id: newId,
                type: "image",
                src: imageUrl,
                x: Math.round(finalX),
                y: Math.round(finalY),
                width: w,
                height: h,
            };
            updateCanvasStateWithHistory((prev) => ({
                ...prev,
                elements: [...prev.elements, newElem],
            }));
            setSelectedId(newId);
            setActiveTab("elements");
        };
    };

    // Select All Elements & Targets (Ctrl+A)
    const handleSelectAll = () => {
        const allElementIds = canvasState.elements.map((el) => el.id);
        const allTargetIds = canvasState.targets.map((tgt) => tgt.id);
        setSelectedIds(allElementIds);
        setSelectedTargetIds(allTargetIds);
        setActiveTab("elements");
    };

    // Duplicate Selected Items
    const handleDuplicateSelected = () => {
        let newElementIds = [];
        let newTargetIds = [];
        let duplicatedElements = [];
        let duplicatedTargets = [];

        if (selectedIds.length > 0) {
            canvasState.elements.forEach((el) => {
                if (selectedIds.includes(el.id)) {
                    const newId = `${el.type === "text" ? "txt" : "img"}_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
                    newElementIds.push(newId);
                    duplicatedElements.push({
                        ...el,
                        id: newId,
                        x: Math.min(stageWidth - (el.width || 120), el.x + 20),
                        y: Math.min(stageHeight - (el.height || 40), el.y + 20),
                    });
                }
            });
        }

        if (selectedTargetIds.length > 0) {
            canvasState.targets.forEach((tgt) => {
                if (selectedTargetIds.includes(tgt.id)) {
                    const newId = `tgt_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
                    newTargetIds.push(newId);
                    duplicatedTargets.push({
                        ...tgt,
                        id: newId,
                        label: `${tgt.label || "Target"} (Copy)`,
                        x: Math.min(stageWidth - (tgt.width || 60), tgt.x + 20),
                        y: Math.min(
                            stageHeight - (tgt.height || 40),
                            tgt.y + 20
                        ),
                    });
                }
            });
        }

        if (duplicatedElements.length > 0 || duplicatedTargets.length > 0) {
            updateCanvasStateWithHistory((prev) => ({
                ...prev,
                elements: [...prev.elements, ...duplicatedElements],
                targets: [...prev.targets, ...duplicatedTargets],
            }));
        }

        if (newElementIds.length > 0) {
            setSelectedIds(newElementIds);
            setActiveTab("elements");
        }
        if (newTargetIds.length > 0) {
            setSelectedTargetIds(newTargetIds);
            if (newElementIds.length === 0) setActiveTab("targets");
        }
    };

    // Center Selected Elements & Targets to Canvas (CorelDRAW 'P' shortcut)
    const handleCenterSelected = () => {
        if (selectedIds.length === 0 && selectedTargetIds.length === 0) return;

        updateCanvasStateWithHistory((prev) => {
            const nextElements = prev.elements.map((el) => {
                if (!selectedIds.includes(el.id)) return el;

                let w = el.width || 120;
                let h = el.height || 40;

                if (el.type === "text" && stageRef.current) {
                    const node = stageRef.current.findOne("#" + el.id);
                    if (node) {
                        w = node.width();
                        h = node.height();
                    } else {
                        w =
                            (el.text?.length || 10) *
                            ((el.fontSize || 18) * 0.55);
                        h = (el.fontSize || 18) * 1.3;
                    }
                }

                return {
                    ...el,
                    x: Math.round((stageWidth - w) / 2),
                    y: Math.round((stageHeight - h) / 2),
                };
            });

            const nextTargets = prev.targets.map((tgt) => {
                if (!selectedTargetIds.includes(tgt.id)) return tgt;

                if (tgt.type === "ring_target") {
                    return {
                        ...tgt,
                        x: Math.round(stageWidth / 2),
                        y: Math.round(stageHeight / 2),
                    };
                }

                let w = tgt.width || (tgt.type === "box_target" ? 36 : 100);
                let h = tgt.height || (tgt.type === "box_target" ? 36 : 32);

                return {
                    ...tgt,
                    x: Math.round((stageWidth - w) / 2),
                    y: Math.round((stageHeight - h) / 2),
                };
            });

            return {
                ...prev,
                elements: nextElements,
                targets: nextTargets,
            };
        });
    };

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            const tag = e.target.tagName.toLowerCase();
            const isEditingInput = tag === "input" || tag === "textarea";

            if (
                (e.ctrlKey || e.metaKey) &&
                (e.key === "z" || e.key === "Z") &&
                !e.shiftKey &&
                !isEditingInput
            ) {
                e.preventDefault();
                handleUndo();
            } else if (
                (((e.ctrlKey || e.metaKey) &&
                    (e.key === "y" || e.key === "Y")) ||
                    ((e.ctrlKey || e.metaKey) &&
                        e.shiftKey &&
                        (e.key === "z" || e.key === "Z"))) &&
                !isEditingInput
            ) {
                e.preventDefault();
                handleRedo();
            } else if (
                (e.ctrlKey || e.metaKey) &&
                (e.key === "a" || e.key === "A") &&
                !isEditingInput
            ) {
                e.preventDefault();
                handleSelectAll();
            } else if (
                (e.ctrlKey || e.metaKey) &&
                (e.key === "d" || e.key === "D") &&
                !isEditingInput
            ) {
                e.preventDefault();
                handleDuplicateSelected();
            } else if (
                (e.key === "p" || e.key === "P") &&
                !e.ctrlKey &&
                !e.metaKey &&
                !e.altKey &&
                !isEditingInput
            ) {
                if (selectedIds.length > 0 || selectedTargetIds.length > 0) {
                    e.preventDefault();
                    handleCenterSelected();
                }
            } else if (
                (e.key === "Delete" || e.key === "Backspace") &&
                !isEditingInput
            ) {
                if (selectedIds.length > 0 || selectedTargetIds.length > 0) {
                    e.preventDefault();
                    updateCanvasStateWithHistory((prev) => ({
                        ...prev,
                        elements: prev.elements.filter(
                            (el) => !selectedIds.includes(el.id)
                        ),
                        targets: prev.targets.filter(
                            (tgt) => !selectedTargetIds.includes(tgt.id)
                        ),
                    }));
                    setSelectedIds([]);
                    setSelectedTargetIds([]);
                }
            } else if (
                (e.ctrlKey || e.metaKey) &&
                (e.key === "]" || e.key === "}") &&
                !isEditingInput
            ) {
                e.preventDefault();
                const dir = e.shiftKey ? "front" : "forward";
                if (selectedId) handleMoveElementLayer(selectedId, dir);
                else if (selectedTargetId)
                    handleMoveTargetLayer(selectedTargetId, dir);
            } else if (
                (e.ctrlKey || e.metaKey) &&
                (e.key === "[" || e.key === "{") &&
                !isEditingInput
            ) {
                e.preventDefault();
                const dir = e.shiftKey ? "back" : "backward";
                if (selectedId) handleMoveElementLayer(selectedId, dir);
                else if (selectedTargetId)
                    handleMoveTargetLayer(selectedTargetId, dir);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [
        selectedIds,
        selectedTargetIds,
        canvasState,
        history,
        historyStep,
        stageWidth,
        stageHeight,
    ]);

    // Paste from Clipboard (Ctrl+V) handler
    useEffect(() => {
        const handlePaste = (e) => {
            const items = e.clipboardData?.items;
            if (!items) return;
            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf("image") !== -1) {
                    const file = items[i].getAsFile();
                    if (file) {
                        e.preventDefault();
                        processImageFile(file, stageWidth / 2, stageHeight / 2);
                        break;
                    }
                }
            }
        };

        window.addEventListener("paste", handlePaste);
        return () => window.removeEventListener("paste", handlePaste);
    }, [stageWidth, stageHeight]);

    // Handle Drop file gambar dari luar / file explorer ke Canvas
    const handleCanvasDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOverCanvas(false);

        if (!stageRef.current) return;
        stageRef.current.setPointersPositions(e);
        const pointerPos = stageRef.current.getPointerPosition() || {
            x: stageWidth / 2,
            y: stageHeight / 2,
        };

        const files = e.dataTransfer?.files;
        if (files && files.length > 0) {
            for (let i = 0; i < files.length; i++) {
                if (files[i].type.startsWith("image/")) {
                    const offsetX = pointerPos.x + i * 20;
                    const offsetY = pointerPos.y + i * 20;
                    processImageFile(files[i], offsetX, offsetY);
                }
            }
        }
    };

    const handleCanvasDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isDragOverCanvas) setIsDragOverCanvas(true);
    };

    const handleCanvasDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOverCanvas(false);
    };

    // 2. Add Image Element via file input button
    const handleAddImage = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        processImageFile(file, 150, 150);
        e.target.value = "";
    };

    // 3. Add Drop Target / Example Markers
    const handleAddTarget = (type) => {
        const newId = `tgt_${Date.now()}`;
        let newTarget;
        if (type === "ring_target") {
            newTarget = {
                id: newId,
                type: "ring_target",
                x: 200,
                y: 200,
                radius: 24,
                correct_token_type: "ring",
                label: "Ring Spot",
            };
        } else if (type === "box_target") {
            newTarget = {
                id: newId,
                type: "box_target",
                x: 350,
                y: 200,
                width: 36,
                height: 36,
                correct_symbol: "check",
                label: "Kotak True/False",
            };
        } else if (type === "input_target") {
            newTarget = {
                id: newId,
                type: "input_target",
                x: 300,
                y: 200,
                width: 120,
                height: 36,
                correct_text: "",
                label: "Isian Teks (Ketik)",
                placeholder: "Ketik jawaban...",
            };
        } else if (type === "example_circle" || type === "example_ring") {
            newTarget = {
                id: newId,
                type: "example_circle",
                is_example: true,
                x: 200,
                y: 250,
                radius: 28,
                label: "Contoh Lingkaran",
            };
        } else if (type === "example_box_check") {
            newTarget = {
                id: newId,
                type: "example_box",
                is_example: true,
                example_symbol: "check",
                x: 350,
                y: 250,
                width: 36,
                height: 36,
                label: "Contoh Centang",
            };
        } else if (type === "example_box_cross") {
            newTarget = {
                id: newId,
                type: "example_box",
                is_example: true,
                example_symbol: "cross",
                x: 350,
                y: 250,
                width: 36,
                height: 36,
                label: "Contoh Silang",
            };
        } else if (type === "example_box") {
            newTarget = {
                id: newId,
                type: "example_box",
                is_example: true,
                example_symbol: "check",
                x: 350,
                y: 250,
                width: 36,
                height: 36,
                label: "Contoh Kotak",
            };
        } else if (type === "example_word") {
            newTarget = {
                id: newId,
                type: "example_word",
                is_example: true,
                example_text: "Contoh",
                x: 300,
                y: 250,
                width: 100,
                height: 32,
                label: "Contoh Kata",
            };
        } else if (type === "example_input") {
            newTarget = {
                id: newId,
                type: "example_input",
                is_example: true,
                example_text: "Jawaban Contoh",
                x: 300,
                y: 250,
                width: 120,
                height: 36,
                label: "Contoh Isian",
            };
        } else {
            const firstWordId =
                canvasState.tokens.find((t) => t.type === "word")?.id || "";
            newTarget = {
                id: newId,
                type: "word_target",
                x: 300,
                y: 200,
                width: 100,
                height: 32,
                correct_token_id: firstWordId,
                label: "Word Spot",
            };
        }

        updateCanvasStateWithHistory((prev) => ({
            ...prev,
            targets: [...prev.targets, newTarget],
        }));
        setSelectedTargetId(newId);
        setActiveTab("targets");
    };

    // 4. Update Element Properties
    const handleUpdateElement = (id, newProps) => {
        updateCanvasStateWithHistory((prev) => ({
            ...prev,
            elements: prev.elements.map((el) =>
                el.id === id ? { ...el, ...newProps } : el
            ),
        }));
    };

    // 5. Delete Element
    const handleDeleteElement = (id) => {
        updateCanvasStateWithHistory((prev) => ({
            ...prev,
            elements: prev.elements.filter((el) => el.id !== id),
        }));
        if (selectedId === id) setSelectedId(null);
    };

    // Layer Reordering for Canvas Elements
    const handleMoveElementLayer = (id, direction) => {
        updateCanvasStateWithHistory((prev) => {
            const list = [...prev.elements];
            const index = list.findIndex((el) => el.id === id);
            if (index === -1) return prev;

            const [item] = list.splice(index, 1);

            if (direction === "front") {
                list.push(item);
            } else if (direction === "back") {
                list.unshift(item);
            } else if (direction === "forward") {
                const targetIdx = Math.min(list.length, index + 1);
                list.splice(targetIdx, 0, item);
            } else if (direction === "backward") {
                const targetIdx = Math.max(0, index - 1);
                list.splice(targetIdx, 0, item);
            }

            return {
                ...prev,
                elements: list,
            };
        });
    };

    // Layer Reordering for Drop Targets
    const handleMoveTargetLayer = (id, direction) => {
        updateCanvasStateWithHistory((prev) => {
            const list = [...prev.targets];
            const index = list.findIndex((t) => t.id === id);
            if (index === -1) return prev;

            const [item] = list.splice(index, 1);

            if (direction === "front") {
                list.push(item);
            } else if (direction === "back") {
                list.unshift(item);
            } else if (direction === "forward") {
                const targetIdx = Math.min(list.length, index + 1);
                list.splice(targetIdx, 0, item);
            } else if (direction === "backward") {
                const targetIdx = Math.max(0, index - 1);
                list.splice(targetIdx, 0, item);
            }

            return {
                ...prev,
                targets: list,
            };
        });
    };

    // 6. Update Target Properties
    const handleUpdateTarget = (id, newProps) => {
        updateCanvasStateWithHistory((prev) => ({
            ...prev,
            targets: prev.targets.map((t) =>
                t.id === id ? { ...t, ...newProps } : t
            ),
        }));
    };

    // 7. Delete Target
    const handleDeleteTarget = (id) => {
        updateCanvasStateWithHistory((prev) => ({
            ...prev,
            targets: prev.targets.filter((t) => t.id !== id),
        }));
        if (selectedTargetId === id) setSelectedTargetId(null);
    };

    // 8. Add Word Token
    const handleAddWordToken = (e) => {
        e?.preventDefault();
        const text = newWordInput.trim();
        if (!text) return;

        const newId = `tok_w_${Date.now()}`;
        const wordCount = canvasState.tokens.length;
        updateCanvasStateWithHistory((prev) => ({
            ...prev,
            tokens: [
                ...prev.tokens,
                {
                    id: newId,
                    type: "word",
                    text,
                    color: "#ea580c",
                    x: 880,
                    y: 120 + wordCount * 55,
                },
            ],
        }));
        setNewWordInput("");
        setSelectedTokenIds([newId]);
        setActiveTab("tokens");
    };

    // 9. Add Ring Token
    const handleAddRingToken = () => {
        const totalCount = canvasState.tokens.length;
        const newId = `tok_ring_${Date.now()}`;
        updateCanvasStateWithHistory((prev) => ({
            ...prev,
            tokens: [
                ...prev.tokens,
                {
                    id: newId,
                    type: "ring",
                    label: "",
                    color: "#22c55e",
                    x: 880,
                    y: 120 + totalCount * 55,
                },
            ],
        }));
        setSelectedTokenIds([newId]);
        setActiveTab("tokens");
    };

    // 9b. Add Checkmark Token (Centang Hijau)
    const handleAddCheckToken = () => {
        const checkCount =
            canvasState.tokens.filter((t) => t.type === "check").length + 1;
        const totalCount = canvasState.tokens.length;
        const newId = `tok_chk_${Date.now()}`;
        updateCanvasStateWithHistory((prev) => ({
            ...prev,
            tokens: [
                ...prev.tokens,
                {
                    id: newId,
                    type: "check",
                    label: `✔ Centang #${checkCount}`,
                    symbol: "✔",
                    color: "#16a34a",
                    x: 880,
                    y: 120 + totalCount * 55,
                },
            ],
        }));
        setSelectedTokenIds([newId]);
        setActiveTab("tokens");
    };

    // 9c. Add Cross Token (Silang Merah)
    const handleAddCrossToken = () => {
        const crossCount =
            canvasState.tokens.filter((t) => t.type === "cross").length + 1;
        const totalCount = canvasState.tokens.length;
        const newId = `tok_crs_${Date.now()}`;
        updateCanvasStateWithHistory((prev) => ({
            ...prev,
            tokens: [
                ...prev.tokens,
                {
                    id: newId,
                    type: "cross",
                    label: `✖ Silang #${crossCount}`,
                    symbol: "✖",
                    color: "#dc2626",
                    x: 880,
                    y: 120 + totalCount * 55,
                },
            ],
        }));
        setSelectedTokenIds([newId]);
        setActiveTab("tokens");
    };

    // 9d. Update Token Properties
    const handleUpdateToken = (id, newProps) => {
        updateCanvasStateWithHistory((prev) => ({
            ...prev,
            tokens: prev.tokens.map((tok) =>
                tok.id === id ? { ...tok, ...newProps } : tok
            ),
        }));
    };

    // 10. Delete Token
    const handleDeleteToken = (id) => {
        updateCanvasStateWithHistory((prev) => ({
            ...prev,
            tokens: prev.tokens.filter((t) => t.id !== id),
            targets: prev.targets.map((tgt) =>
                tgt.correct_token_id === id
                    ? { ...tgt, correct_token_id: "" }
                    : tgt
            ),
        }));
    };

    const elementsList = canvasState?.elements || [];
    const targetsList = canvasState?.targets || [];
    const tokensList = canvasState?.tokens || [];

    const selectedElement = elementsList.find((el) => el.id === selectedId);
    const selectedTarget = targetsList.find((t) => t.id === selectedTargetId);

    return (
        <div className="space-y-4 bg-slate-100/90 text-slate-800 p-6 rounded-3xl border border-slate-200 shadow-sm">
            {/* Top Toolbar */}
            <CanvasToolbar
                historyStep={historyStep}
                historyLength={history.length}
                onUndo={handleUndo}
                onRedo={handleRedo}
                onAddText={handleAddText}
                onAddImage={handleAddImage}
                onAddTarget={handleAddTarget}
                onAddRingToken={handleAddRingToken}
                onAddCheckToken={handleAddCheckToken}
            />

            {/* Instruction Banner */}
            <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                    Instruksi / Petunjuk Soal (Tampil di atas kanvas siswa):
                </label>
                <TextInput
                    value={canvasState.instruction}
                    onChange={(e) =>
                        setCanvasState((prev) => ({
                            ...prev,
                            instruction: e.target.value,
                        }))
                    }
                    placeholder="Contoh: Taruh lingkaran hijau di kata yang benar..."
                    className="!bg-white !border-slate-300 !text-slate-800 !py-2 !text-xs font-bold w-full shadow-sm"
                />
            </div>

            {/* Main Studio Grid: Canvas Workspace (Left) & Inspector / Token Panel (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* 1. Interactive Konva Canvas (8 Cols) */}
                <div className="lg:col-span-8 space-y-2">
                    {/* Shortcuts Bar */}
                    <CanvasShortcutsBar
                        stageWidth={stageWidth}
                        stageHeight={stageHeight}
                    />

                    <div
                        onDrop={handleCanvasDrop}
                        onDragOver={handleCanvasDragOver}
                        onDragLeave={handleCanvasDragLeave}
                        className={`relative bg-white rounded-3xl p-3 shadow-2xl border-4 transition-all overflow-x-auto overflow-y-hidden flex items-center justify-start lg:justify-center ${
                            isDragOverCanvas
                                ? "border-amber-500 ring-4 ring-amber-500/20 bg-amber-50/20"
                                : "border-slate-700/80"
                        }`}
                    >
                        {/* Drag & Drop Overlay Indicator */}
                        {isDragOverCanvas && (
                            <div className="absolute inset-0 z-30 bg-amber-500/10 backdrop-blur-xs flex flex-col items-center justify-center border-2 border-dashed border-amber-500 rounded-2xl pointer-events-none">
                                <div className="p-4 bg-white/95 rounded-2xl shadow-xl border border-amber-200 flex items-center gap-3 animate-bounce">
                                    <ImageIcon className="w-8 h-8 text-amber-600" />
                                    <div>
                                        <p className="text-sm font-black text-slate-800">
                                            Lepaskan File Gambar Di Sini
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            Gambar akan langsung ditempelkan ke
                                            titik kursor Anda
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Dedicated Inner Canvas Stage Wrapper */}
                        <div
                            style={{
                                width: `${stageWidth}px`,
                                height: `${stageHeight}px`,
                                position: "relative",
                                flexShrink: 0,
                            }}
                        >
                            <Stage
                                ref={stageRef}
                                width={stageWidth}
                                height={stageHeight}
                                onMouseDown={(e) => {
                                    if (
                                        e.target === e.target.getStage() ||
                                        e.target.name?.() === "bg_rect"
                                    ) {
                                        setSelectedIds([]);
                                        setSelectedTargetIds([]);
                                        setSelectedTokenIds([]);
                                    }
                                }}
                                className="bg-white rounded-2xl cursor-default select-none shadow-inner"
                            >
                                <Layer>
                                    {/* Background Canvas Paper */}
                                    <Rect
                                        name="bg_rect"
                                        x={0}
                                        y={0}
                                        width={stageWidth}
                                        height={stageHeight}
                                        fill="#ffffff"
                                    />

                                    {/* Empty Canvas Guide */}
                                    {canvasState.elements.length === 0 &&
                                        canvasState.targets.length === 0 && (
                                            <KonvaText
                                                text="Kanvas Bersih / Kosong. Klik tombol [+ Teks], [+ Gambar], [+ Centang/Silang], [+ Ring], [+ Kata], atau [+ Contoh] di toolbar atas untuk mulai menyusun soal."
                                                x={60}
                                                y={stageHeight / 2 - 20}
                                                width={stageWidth - 120}
                                                align="center"
                                                fontSize={14}
                                                fontStyle="italic"
                                                fill="#94a3b8"
                                            />
                                        )}

                                    {/* Render Elements (Text & Image) */}
                                    {canvasState.elements.map((el) => (
                                        <CanvasElementItem
                                            key={el.id}
                                            element={el}
                                            isSelected={selectedIds.includes(
                                                el.id
                                            )}
                                            isEditing={editingTextId === el.id}
                                            dragBoundFunc={createDragBoundFunc(
                                                el.id
                                            )}
                                            onDragStart={(e) =>
                                                handleItemDragStart(el.id, e)
                                            }
                                            onSelect={(e) =>
                                                handleSelectElementItem(
                                                    el.id,
                                                    e
                                                )
                                            }
                                            onDoubleClick={() =>
                                                handleStartEditText(el)
                                            }
                                            onDragEndClean={() =>
                                                handleItemDragEndClean(el.id)
                                            }
                                            onUpdateElement={
                                                handleUpdateElement
                                            }
                                        />
                                    ))}

                                    {/* Render Interactive Target Spots & Example Markers */}
                                    {canvasState.targets.map((tgt) => (
                                        <CanvasTargetItem
                                            key={tgt.id}
                                            tgt={tgt}
                                            isSelected={selectedTargetIds.includes(
                                                tgt.id
                                            )}
                                            isEditing={
                                                editingTargetId === tgt.id
                                            }
                                            dragBoundFunc={createDragBoundFunc(
                                                tgt.id
                                            )}
                                            onDragStart={(e) =>
                                                handleItemDragStart(tgt.id, e)
                                            }
                                            onSelect={(e) =>
                                                handleSelectTargetItem(
                                                    tgt.id,
                                                    e
                                                )
                                            }
                                            onDoubleClick={() =>
                                                handleStartEditTarget(tgt)
                                            }
                                            onDragEndClean={() =>
                                                handleItemDragEndClean(tgt.id)
                                            }
                                            onUpdateTarget={handleUpdateTarget}
                                        />
                                    ))}

                                    {/* Render Interactive Token Items (Tokens in Canvas) */}
                                    {canvasState.tokens.map((tok) => (
                                        <CanvasTokenItem
                                            key={tok.id}
                                            tok={tok}
                                            isSelected={selectedTokenIds.includes(
                                                tok.id
                                            )}
                                            isEditing={
                                                editingTokenId === tok.id
                                            }
                                            dragBoundFunc={createDragBoundFunc(
                                                tok.id
                                            )}
                                            onDragStart={(e) =>
                                                handleItemDragStart(tok.id, e)
                                            }
                                            onSelect={(e) =>
                                                handleSelectTokenItem(
                                                    tok.id,
                                                    e
                                                )
                                            }
                                            onDoubleClick={() => {
                                                if (tok.type === "word") {
                                                    setEditingTokenId(tok.id);
                                                    setEditingTokenValue(tok.text || "");
                                                }
                                            }}
                                            onDragEndClean={() =>
                                                handleItemDragEndClean(tok.id)
                                            }
                                            onUpdateToken={handleUpdateToken}
                                        />
                                    ))}

                                    {/* Transformer */}
                                    <Transformer
                                        ref={trRef}
                                        centeredScaling={false}
                                        rotateEnabled={false}
                                        keepRatio={false}
                                        enabledAnchors={[
                                            "top-left",
                                            "top-right",
                                            "bottom-left",
                                            "bottom-right",
                                            "middle-left",
                                            "middle-right",
                                            "top-center",
                                            "bottom-center",
                                        ]}
                                        borderStroke="#0284c7"
                                        borderStrokeWidth={1.5}
                                        anchorStroke="#0284c7"
                                        anchorFill="#ffffff"
                                        anchorSize={8}
                                        anchorCornerRadius={2}
                                        boundBoxFunc={(oldBox, newBox) => {
                                            if (
                                                newBox.width < 15 ||
                                                newBox.height < 15
                                            )
                                                return oldBox;
                                            return newBox;
                                        }}
                                    />
                                </Layer>
                            </Stage>

                            {/* Floating Direct Inline Text Editor */}
                            {editingTextId &&
                                (() => {
                                    const editingEl =
                                        canvasState.elements.find(
                                            (el) =>
                                                el.id === editingTextId &&
                                                el.type === "text"
                                        );
                                    if (!editingEl) return null;

                                    return (
                                        <textarea
                                            ref={textInputRef}
                                            value={editingTextValue}
                                            onChange={(e) => {
                                                setEditingTextValue(
                                                    e.target.value
                                                );
                                                handleUpdateElement(
                                                    editingTextId,
                                                    {
                                                        text: e.target.value,
                                                    }
                                                );
                                            }}
                                            onBlur={handleFinishEditText}
                                            onKeyDown={(e) => {
                                                if (
                                                    e.key === "Enter" &&
                                                    !e.shiftKey
                                                ) {
                                                    e.preventDefault();
                                                    handleFinishEditText();
                                                } else if (e.key === "Escape") {
                                                    handleFinishEditText();
                                                }
                                            }}
                                            style={{
                                                position: "absolute",
                                                left: `${editingEl.x}px`,
                                                top: `${editingEl.y}px`,
                                                fontSize: `${editingEl.fontSize || 18}px`,
                                                fontStyle:
                                                    editingEl.fontStyle?.includes(
                                                        "italic"
                                                    )
                                                        ? "italic"
                                                        : "normal",
                                                fontWeight:
                                                    editingEl.fontStyle?.includes(
                                                        "bold"
                                                    )
                                                        ? "bold"
                                                        : "normal",
                                                fontFamily:
                                                    "'Comic Sans MS', 'Outfit', 'Inter', sans-serif",
                                                color:
                                                    editingEl.fill || "#1e293b",
                                                textAlign:
                                                    editingEl.align || "left",
                                                lineHeight: 1.2,
                                                zIndex: 40,
                                                minWidth: "120px",
                                                minHeight: `${(editingEl.fontSize || 18) * 1.5}px`,
                                            }}
                                            className="bg-white/95 border-2 border-amber-500 rounded-lg p-1.5 shadow-2xl outline-none ring-4 ring-amber-500/20 resize"
                                            placeholder="Ketik teks di sini..."
                                        />
                                    );
                                })()}

                            {/* Floating Direct Target Editor */}
                            {editingTargetId &&
                                (() => {
                                    const editingTgt = canvasState.targets.find(
                                        (t) => t.id === editingTargetId
                                    );
                                    if (!editingTgt) return null;

                                    const isInputTgt =
                                        editingTgt.type === "input_target";

                                    return (
                                        <input
                                            ref={targetInputRef}
                                            type="text"
                                            value={editingTargetValue}
                                            onChange={(e) => {
                                                setEditingTargetValue(
                                                    e.target.value
                                                );
                                                if (isInputTgt) {
                                                    handleUpdateTarget(
                                                        editingTargetId,
                                                        {
                                                            correct_text:
                                                                e.target.value,
                                                            label:
                                                                e.target
                                                                    .value ||
                                                                editingTgt.label,
                                                        }
                                                    );
                                                } else {
                                                    handleUpdateTarget(
                                                        editingTargetId,
                                                        {
                                                            label: e.target
                                                                .value,
                                                        }
                                                    );
                                                }
                                            }}
                                            onBlur={handleFinishEditTarget}
                                            onKeyDown={(e) => {
                                                if (
                                                    e.key === "Enter" ||
                                                    e.key === "Escape"
                                                ) {
                                                    e.preventDefault();
                                                    handleFinishEditTarget();
                                                }
                                            }}
                                            style={{
                                                position: "absolute",
                                                left:
                                                    editingTgt.type === "ring_target"
                                                        ? `${editingTgt.x - (editingTgt.radius || 24) * 1.5}px`
                                                        : `${editingTgt.x}px`,
                                                top:
                                                    editingTgt.type === "ring_target"
                                                        ? `${editingTgt.y - (editingTgt.radius || 24)}px`
                                                        : `${editingTgt.y}px`,
                                                width:
                                                    editingTgt.type === "ring_target"
                                                        ? `${(editingTgt.radius || 24) * 3}px`
                                                        : `${editingTgt.width || 100}px`,
                                                height:
                                                    editingTgt.type === "ring_target"
                                                        ? `${(editingTgt.radius || 24) * 2}px`
                                                        : `${editingTgt.height || 32}px`,
                                                fontSize:
                                                    editingTgt.type === "ring_target"
                                                        ? `${editingTgt.fontSize || 16}px`
                                                        : undefined,
                                                zIndex: 40,
                                            }}
                                            className={`bg-white border-2 rounded-lg px-2 text-xs font-black text-center shadow-2xl outline-none ring-4 ${
                                                isInputTgt
                                                    ? "border-sky-500 text-sky-950 ring-sky-500/20"
                                                    : editingTgt.type === "ring_target"
                                                      ? "border-emerald-500 text-slate-900 ring-emerald-500/20"
                                                      : "border-amber-500 text-amber-950 ring-amber-500/20"
                                            }`}
                                            placeholder={
                                                isInputTgt
                                                    ? "Kunci jawaban..."
                                                    : editingTgt.type === "ring_target"
                                                      ? "Teks ring..."
                                                      : "Label Word Spot..."
                                            }
                                        />
                                    );
                                })()}

                            {/* Floating Direct Token Editor */}
                            {editingTokenId &&
                                (() => {
                                    const editingTok = canvasState.tokens.find(
                                        (t) => t.id === editingTokenId
                                    );
                                    if (!editingTok) return null;

                                    return (
                                        <input
                                            ref={tokenInputRef}
                                            type="text"
                                            value={editingTokenValue}
                                            onChange={(e) => {
                                                setEditingTokenValue(e.target.value);
                                                handleUpdateToken(editingTokenId, {
                                                    text: e.target.value,
                                                    label: e.target.value,
                                                });
                                            }}
                                            onBlur={() => {
                                                setEditingTokenId(null);
                                                setEditingTokenValue("");
                                            }}
                                            onKeyDown={(e) => {
                                                if (
                                                    e.key === "Enter" ||
                                                    e.key === "Escape"
                                                ) {
                                                    e.preventDefault();
                                                    setEditingTokenId(null);
                                                    setEditingTokenValue("");
                                                }
                                            }}
                                            style={{
                                                position: "absolute",
                                                left: `${editingTok.x}px`,
                                                top: `${editingTok.y}px`,
                                                minWidth: "90px",
                                                height: "36px",
                                                fontSize: `${editingTok.fontSize || 18}px`,
                                                zIndex: 40,
                                            }}
                                            className="bg-white border-2 border-orange-500 rounded-lg px-2 text-xs font-black text-center text-orange-950 shadow-2xl outline-none ring-4 ring-orange-500/20"
                                            placeholder="Teks token..."
                                        />
                                    );
                                })()}
                        </div>
                    </div>

                    {/* Live Token Bank Preview Bar */}
                    <TokenBankBar tokens={canvasState.tokens} />
                </div>

                {/* 2. Inspector / Settings Tabs (4 Cols) */}
                <div className="lg:col-span-4 space-y-4">
                    {/* Navigation Tabs */}
                    <div className="grid grid-cols-3 gap-1 bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
                        <button
                            type="button"
                            onClick={() => setActiveTab("elements")}
                            className={`py-2 text-[11px] font-black uppercase tracking-wider rounded-xl transition-all ${
                                activeTab === "elements"
                                    ? "bg-amber-500 text-white shadow-sm"
                                    : "text-slate-500 hover:text-slate-800"
                            }`}
                        >
                            Elements
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab("targets")}
                            className={`py-2 text-[11px] font-black uppercase tracking-wider rounded-xl transition-all ${
                                activeTab === "targets"
                                    ? "bg-amber-500 text-white shadow-sm"
                                    : "text-slate-500 hover:text-slate-800"
                            }`}
                        >
                            Drop Targets
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab("tokens")}
                            className={`py-2 text-[11px] font-black uppercase tracking-wider rounded-xl transition-all ${
                                activeTab === "tokens"
                                    ? "bg-amber-500 text-white shadow-sm"
                                    : "text-slate-500 hover:text-slate-800"
                            }`}
                        >
                            Token Bank
                        </button>
                    </div>

                    {/* Tab 1: Elements Inspector */}
                    {activeTab === "elements" && (
                        <InspectorElementsTab
                            elements={canvasState.elements}
                            selectedElement={selectedElement}
                            selectedId={selectedId}
                            selectedIds={selectedIds}
                            onSelectElement={(id, e) => {
                                handleSelectElementItem(id, e);
                            }}
                            onUpdateElement={handleUpdateElement}
                            onDeleteElement={handleDeleteElement}
                            onMoveElementLayer={handleMoveElementLayer}
                        />
                    )}

                    {/* Tab 2: Targets Inspector */}
                    {activeTab === "targets" && (
                        <InspectorTargetsTab
                            targets={canvasState.targets}
                            tokens={canvasState.tokens}
                            selectedTargetId={selectedTargetId}
                            selectedTargetIds={selectedTargetIds}
                            onSelectTarget={(id, e) => {
                                handleSelectTargetItem(id, e);
                            }}
                            onUpdateTarget={handleUpdateTarget}
                            onDeleteTarget={handleDeleteTarget}
                            onMoveTargetLayer={handleMoveTargetLayer}
                        />
                    )}

                    {/* Tab 3: Tokens Bank Manager */}
                    {activeTab === "tokens" && (
                        <InspectorTokensTab
                            tokens={canvasState.tokens}
                            targets={canvasState.targets}
                            newWordInput={newWordInput}
                            onChangeNewWordInput={setNewWordInput}
                            onAddWordToken={handleAddWordToken}
                            onAddCheckToken={handleAddCheckToken}
                            onAddCrossToken={handleAddCrossToken}
                            onAddRingToken={handleAddRingToken}
                            onUpdateToken={handleUpdateToken}
                            onDeleteToken={handleDeleteToken}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
