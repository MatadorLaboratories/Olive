"use client";

import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { Stage, Layer, Rect, Transformer, Text, Image as KonvaImage } from "react-konva";
import useImage from "use-image";
import type Konva from "konva";
import {
  DEFAULT_NAPKIN_PADDING,
  type DesignElement,
  type NapkinDesign,
  type TextElement,
  type ImageElement,
} from "@/services/napkin-design";

/**
 * The core canvas for the napkin design studio.
 *
 * Imported dynamically by `NapkinDesignStudio` (Konva needs `window`).
 * Renders a stage with:
 *   - the napkin field (rectangular, filled with the chosen colour)
 *   - an edge inset (hairline + edge colour)
 *   - the elements layer (text + image)
 *   - a Konva.Transformer attached to the selected element
 *
 * Exposes a `getSnapshotDataUrl()` imperative method on the forwarded ref
 * so the parent (the studio shell) can render a flattened PNG at submit
 * time.
 */
export type NapkinCanvasHandle = {
  getSnapshotDataUrl: () => string | null;
};

type Props = {
  design: NapkinDesign;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onChangeElement: (id: string, patch: Partial<DesignElement>) => void;
  /** The maximum width the canvas should occupy on screen. Used for fitting. */
  displayWidth: number;
};

export const NapkinCanvas = forwardRef<NapkinCanvasHandle, Props>(
  function NapkinCanvas(
    { design, selectedId, onSelect, onChangeElement, displayWidth },
    handleRef,
  ) {
    const stageRef = useRef<Konva.Stage>(null);
    const transformerRef = useRef<Konva.Transformer>(null);
    const elementRefs = useRef<Record<string, Konva.Node | null>>({});

    const stageSize = design.canvas.width;
    const scale = displayWidth / stageSize;

    // Attach the transformer to the selected node whenever the selection
    // changes — Konva refuses to redraw the handles otherwise.
    useEffect(() => {
      const tr = transformerRef.current;
      if (!tr) return;
      if (!selectedId) {
        tr.nodes([]);
        tr.getLayer()?.batchDraw();
        return;
      }
      const node = elementRefs.current[selectedId];
      if (node) {
        tr.nodes([node]);
        tr.getLayer()?.batchDraw();
      } else {
        tr.nodes([]);
      }
    }, [selectedId, design.elements.length]);

    // Re-draw on font load so text element fonts swap in cleanly.
    useEffect(() => {
      if (typeof document === "undefined") return;
      let cancelled = false;
      document.fonts.ready.then(() => {
        if (cancelled) return;
        stageRef.current?.batchDraw();
      });
      return () => {
        cancelled = true;
      };
    }, []);

    useImperativeHandle(handleRef, () => ({
      getSnapshotDataUrl() {
        const stage = stageRef.current;
        if (!stage) return null;
        // Render at the design resolution so the snapshot is high-fidelity
        // even when the on-screen scale is small.
        const pixelRatio = stageSize / displayWidth;
        return stage.toDataURL({ pixelRatio, mimeType: "image/png" });
      },
    }), [stageSize, displayWidth]);

    const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
      // Click on empty stage area → deselect.
      if (e.target === e.target.getStage()) onSelect(null);
    };

    const sortedElements = useMemo(
      () => [...design.elements].sort((a, b) => a.zIndex - b.zIndex),
      [design.elements],
    );

    // Edge inset for the hairline frame inside the napkin
    const inset = DEFAULT_NAPKIN_PADDING;

    return (
      <Stage
        ref={stageRef}
        width={displayWidth}
        height={displayWidth}
        scaleX={scale}
        scaleY={scale}
        onMouseDown={handleStageClick}
        onTouchStart={handleStageClick}
        style={{
          background: design.base.fillColor,
          // A subtle drop-shadow on the stage to lift the napkin off the canvas surface.
          boxShadow: "0 30px 60px rgba(45, 60, 30, 0.12)",
          borderRadius: 6,
        }}
      >
        {/* Field + edge layer */}
        <Layer listening={false}>
          {/* Background field (drawn so toDataURL captures it). */}
          <Rect
            x={0}
            y={0}
            width={stageSize}
            height={stageSize}
            fill={design.base.fillColor}
          />
          {/* Edge hairline inset */}
          <Rect
            x={inset}
            y={inset}
            width={stageSize - inset * 2}
            height={stageSize - inset * 2}
            stroke={design.base.edgeColor}
            strokeWidth={edgeWeightForStyle(design.base.edge)}
            dash={dashForStyle(design.base.edge)}
          />
        </Layer>

        {/* Element layer */}
        <Layer>
          {sortedElements.map((el) => {
            if (el.type === "text") {
              return (
                <KText
                  key={el.id}
                  el={el}
                  registerRef={(n) => (elementRefs.current[el.id] = n)}
                  isSelected={selectedId === el.id}
                  onSelect={() => onSelect(el.id)}
                  onChange={(patch) => onChangeElement(el.id, patch)}
                />
              );
            }
            return (
              <KImage
                key={el.id}
                el={el}
                registerRef={(n) => (elementRefs.current[el.id] = n)}
                isSelected={selectedId === el.id}
                onSelect={() => onSelect(el.id)}
                onChange={(patch) => onChangeElement(el.id, patch)}
              />
            );
          })}

          <Transformer
            ref={transformerRef}
            rotateEnabled
            keepRatio={false}
            anchorSize={10}
            anchorStroke="#1d2616"
            anchorFill="#fbf8f1"
            anchorCornerRadius={2}
            borderStroke="#1d2616"
            borderDash={[4, 4]}
            // Hide handles for locked elements
            shouldOverdrawWholeArea
          />
        </Layer>
      </Stage>
    );
  },
);

// ---------- text element wrapper ----------

function KText({
  el,
  registerRef,
  isSelected,
  onSelect,
  onChange,
}: {
  el: TextElement;
  registerRef: (n: Konva.Node | null) => void;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (patch: Partial<TextElement>) => void;
}) {
  const ref = useRef<Konva.Text>(null);

  useEffect(() => {
    registerRef(ref.current);
    return () => registerRef(null);
  }, [registerRef]);

  return (
    <Text
      ref={ref}
      text={el.text}
      x={el.x}
      y={el.y}
      width={el.width}
      height={el.height}
      rotation={el.rotation}
      opacity={el.opacity}
      fontFamily={el.fontFamily}
      fontSize={el.fontSize}
      fontStyle={el.fontStyle === "italic" ? "italic" : "normal"}
      fontVariant={el.fontWeight >= 600 ? "bold" : "normal"}
      letterSpacing={el.letterSpacing}
      align={el.align}
      verticalAlign="middle"
      fill={el.fill}
      draggable={!el.locked}
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={(e) => onChange({ x: e.target.x(), y: e.target.y() })}
      onTransformEnd={(e) => {
        const node = e.target as Konva.Text;
        const sx = node.scaleX();
        const sy = node.scaleY();
        node.scaleX(1);
        node.scaleY(1);
        onChange({
          x: node.x(),
          y: node.y(),
          width: Math.max(40, node.width() * sx),
          height: Math.max(20, node.height() * sy),
          rotation: node.rotation(),
          fontSize: Math.max(8, el.fontSize * ((sx + sy) / 2)),
        });
      }}
    />
  );
}

// ---------- image element wrapper ----------

function KImage({
  el,
  registerRef,
  isSelected,
  onSelect,
  onChange,
}: {
  el: ImageElement;
  registerRef: (n: Konva.Node | null) => void;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (patch: Partial<ImageElement>) => void;
}) {
  const ref = useRef<Konva.Image>(null);
  const [img] = useImage(el.url, "anonymous");

  useEffect(() => {
    registerRef(ref.current);
    return () => registerRef(null);
  }, [registerRef]);

  // When the underlying image first loads, capture its natural size so
  // future resizes can preserve aspect ratio.
  useEffect(() => {
    if (!img || el.naturalWidth) return;
    onChange({ naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight });
  }, [img, el.naturalWidth, onChange]);

  return (
    <KonvaImage
      ref={ref}
      image={img ?? undefined}
      x={el.x}
      y={el.y}
      width={el.width}
      height={el.height}
      rotation={el.rotation}
      opacity={el.opacity}
      draggable={!el.locked}
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={(e) => onChange({ x: e.target.x(), y: e.target.y() })}
      onTransformEnd={(e) => {
        const node = e.target as Konva.Image;
        const sx = node.scaleX();
        const sy = node.scaleY();
        node.scaleX(1);
        node.scaleY(1);
        onChange({
          x: node.x(),
          y: node.y(),
          width: Math.max(20, node.width() * sx),
          height: Math.max(20, node.height() * sy),
          rotation: node.rotation(),
        });
      }}
    />
  );
}

// ---------- helpers ----------

function edgeWeightForStyle(edge: string): number {
  switch (edge) {
    case "scallop": return 2.5;
    case "trimmed": return 2;
    case "specialty": return 3;
    default: return 1;
  }
}

function dashForStyle(edge: string): number[] | undefined {
  switch (edge) {
    case "scallop": return [10, 6];
    case "specialty": return [2, 4];
    default: return undefined;
  }
}
