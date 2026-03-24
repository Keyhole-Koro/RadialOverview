"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';

import {
    MIN_CANVAS_HEIGHT,
    MIN_CANVAS_WIDTH,
    RADIAL_CANVAS_PADDING,
} from './constants';
import {
    describeAnnularSector,
    getRingOuterRadius,
    getRootLabelRadius,
    getSegmentCenterPoint,
    getSegmentMidAngle,
    getSegmentPalette,
    polarToCartesian,
} from './geometry';
import {
    buildAncestorPath,
    buildChildrenByParent,
    buildDescendantSet,
    buildNodeById,
    buildOrderedRootIds,
    buildParentById,
    buildSegments,
    buildSubtreeSizeById,
    buildVisibleChildrenByParent,
    buildVisibleNodeIds,
    type Segment,
} from './layout';
import { formatRootLabel, wrapText } from './text';
import type { RadialOverviewNode } from './types';

export type RadialOverviewProps<TPayload = unknown> = {
    nodes: RadialOverviewNode<TPayload>[];
    rootIds?: string[];
    selectedNodeIds?: string[];
    zoomBias?: number;
    className?: string;
    onNodeClick?: (node: RadialOverviewNode<TPayload>) => void;
    onNodeDoubleClick?: (node: RadialOverviewNode<TPayload>) => void;
    onHoverNode?: (node: RadialOverviewNode<TPayload> | null) => void;
};

export function RadialOverview<TPayload = unknown>({
    nodes,
    rootIds,
    selectedNodeIds = [],
    zoomBias = 1,
    className,
    onNodeClick,
    onNodeDoubleClick,
    onHoverNode,
}: RadialOverviewProps<TPayload>) {
    const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
    const [zoom, setZoom] = useState(1);
    const viewportRef = useRef<HTMLDivElement | null>(null);
    const viewportAnimationRef = useRef<number | null>(null);
    const viewportTargetRef = useRef<{ left: number; top: number } | null>(null);

    useEffect(() => {
        return () => {
            if (viewportAnimationRef.current !== null) {
                cancelAnimationFrame(viewportAnimationRef.current);
                viewportAnimationRef.current = null;
            }
        };
    }, []);

    const nodeById = useMemo(() => buildNodeById(nodes), [nodes]);

    const selectedNodeIdSet = useMemo(() => new Set(selectedNodeIds), [selectedNodeIds]);

    const childrenByParent = useMemo(() => buildChildrenByParent(nodes, nodeById), [nodeById, nodes]);
    const orderedRootIds = useMemo(
        () => buildOrderedRootIds(nodes, nodeById, rootIds),
        [nodeById, nodes, rootIds],
    );
    const parentById = useMemo(() => buildParentById(nodes), [nodes]);
    const ancestorPath = useMemo(
        () => buildAncestorPath(hoveredNodeId, parentById),
        [hoveredNodeId, parentById],
    );

    const ancestorSet = useMemo(() => new Set(ancestorPath), [ancestorPath]);

    const descendantSet = useMemo(
        () => buildDescendantSet(hoveredNodeId, childrenByParent),
        [childrenByParent, hoveredNodeId],
    );
    const visibleNodeIds = useMemo(
        () => buildVisibleNodeIds(nodes, hoveredNodeId, ancestorSet, descendantSet),
        [ancestorSet, descendantSet, hoveredNodeId, nodes],
    );
    const visibleChildrenByParent = useMemo(
        () => buildVisibleChildrenByParent(childrenByParent, visibleNodeIds),
        [childrenByParent, visibleNodeIds],
    );
    const subtreeSizeById = useMemo(
        () => buildSubtreeSizeById(visibleChildrenByParent, visibleNodeIds),
        [visibleChildrenByParent, visibleNodeIds],
    );
    const segments = useMemo(
        () => buildSegments({
            orderedRootIds,
            visibleNodeIds,
            nodeById,
            childrenByParent,
            subtreeSizeById,
            hoveredNodeId,
        }),
        [childrenByParent, hoveredNodeId, nodeById, orderedRootIds, subtreeSizeById, visibleNodeIds],
    );

    const layoutMetrics = useMemo(() => {
        const maxDepth = nodes.reduce((max, node) => Math.max(max, node.depth), 0);
        const radialExtent = getRingOuterRadius(maxDepth) + 84;
        const canvasRadius = radialExtent + RADIAL_CANVAS_PADDING;
        const width = Math.max(MIN_CANVAS_WIDTH, Math.ceil(canvasRadius * 2));
        const height = Math.max(MIN_CANVAS_HEIGHT, Math.ceil(canvasRadius * 2));

        return {
            centerX: width / 2,
            centerY: height / 2,
            width,
            height,
        };
    }, [nodes]);

    const effectiveZoom = Math.min(Math.max(zoom * zoomBias, 0.6), 2.4);
    const scaledCanvasWidth = Math.ceil(layoutMetrics.width * effectiveZoom);
    const scaledCanvasHeight = Math.ceil(layoutMetrics.height * effectiveZoom);
    const scaledCenterX = layoutMetrics.centerX * effectiveZoom;
    const scaledCenterY = layoutMetrics.centerY * effectiveZoom;

    useEffect(() => {
        const viewport = viewportRef.current;
        if (!viewport) {
            return;
        }

        viewport.scrollLeft = Math.max((scaledCanvasWidth - viewport.clientWidth) / 2, 0);
        viewport.scrollTop = Math.max((scaledCanvasHeight - viewport.clientHeight) / 2, 0);
    }, [scaledCanvasHeight, scaledCanvasWidth]);

    const lockHover = (nodeId: string) => {
        const node = nodeById.get(nodeId) ?? null;
        setHoveredNodeId(nodeId);
        onHoverNode?.(node);
    };

    const releaseHover = () => {
        setHoveredNodeId(null);
        onHoverNode?.(null);
    };

    const focusViewportOnPoint = (x: number, y: number) => {
        const viewport = viewportRef.current;
        if (!viewport) {
            return;
        }

        const nextLeft = Math.max(
            Math.min(x - (viewport.clientWidth / 2), scaledCanvasWidth - viewport.clientWidth),
            0,
        );
        const nextTop = Math.max(
            Math.min(y - (viewport.clientHeight / 2), scaledCanvasHeight - viewport.clientHeight),
            0,
        );

        viewportTargetRef.current = { left: nextLeft, top: nextTop };

        if (viewportAnimationRef.current !== null) {
            return;
        }

        const LERP_FACTOR = 0.04;

        const step = () => {
            const currentViewport = viewportRef.current;
            const currentTarget = viewportTargetRef.current;

            if (!currentViewport || !currentTarget) {
                viewportAnimationRef.current = null;
                return;
            }

            const dx = currentTarget.left - currentViewport.scrollLeft;
            const dy = currentTarget.top - currentViewport.scrollTop;

            currentViewport.scrollLeft += dx * LERP_FACTOR;
            currentViewport.scrollTop += dy * LERP_FACTOR;

            if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
                viewportAnimationRef.current = window.requestAnimationFrame(step);
            } else {
                currentViewport.scrollLeft = currentTarget.left;
                currentViewport.scrollTop = currentTarget.top;
                viewportAnimationRef.current = null;
            }
        };

        viewportAnimationRef.current = window.requestAnimationFrame(step);
    };

    const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
        const viewport = viewportRef.current;
        if (!viewport) {
            return;
        }

        if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            setZoom((currentZoom: number) => {
                const nextZoom = currentZoom + (event.deltaY < 0 ? 0.08 : -0.08);
                return Math.min(Math.max(nextZoom, 0.85), 2);
            });
            return;
        }

        const SCROLL_SPEED = 0.05;
        viewport.scrollLeft += event.deltaX * SCROLL_SPEED;
        viewport.scrollTop += event.deltaY * SCROLL_SPEED;
    };

    const handleViewportMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
        const viewport = viewportRef.current;
        if (!viewport) {
            return;
        }

        const rect = viewport.getBoundingClientRect();
        const localX = event.clientX - rect.left;
        const localY = event.clientY - rect.top;
        const edgeRatio = 0.18;
        const edgeWidth = rect.width * edgeRatio;
        const edgeHeight = rect.height * edgeRatio;

        let deltaX = 0;
        let deltaY = 0;

        if (localX < edgeWidth) {
            deltaX = -((edgeWidth - localX) / edgeWidth);
        } else if (localX > rect.width - edgeWidth) {
            deltaX = (localX - (rect.width - edgeWidth)) / edgeWidth;
        }

        if (localY < edgeHeight) {
            deltaY = -((edgeHeight - localY) / edgeHeight);
        } else if (localY > rect.height - edgeHeight) {
            deltaY = (localY - (rect.height - edgeHeight)) / edgeHeight;
        }

        if (deltaX === 0 && deltaY === 0) {
            viewportTargetRef.current = null;
            return;
        }

        const maxPanStep = 220;
        const targetX = viewport.scrollLeft + (deltaX * maxPanStep);
        const targetY = viewport.scrollTop + (deltaY * maxPanStep);

        focusViewportOnPoint(
            targetX + (viewport.clientWidth / 2),
            targetY + (viewport.clientHeight / 2),
        );
    };

    return (
        <div
            ref={viewportRef}
            className={cx(
                'relative h-full w-full overflow-auto rounded-[28px] bg-slate-50',
                className,
            )}
            onMouseLeave={releaseHover}
            onMouseMove={handleViewportMouseMove}
            onWheel={handleWheel}
        >
            <div className="relative" style={{ width: scaledCanvasWidth, height: scaledCanvasHeight }}>
                <svg className="absolute inset-0" width={scaledCanvasWidth} height={scaledCanvasHeight}>
                    {segments.map((segment: Segment<TPayload>) => {
                        const isSelected = selectedNodeIdSet.has(segment.node.id);
                        const isFocused = hoveredNodeId !== null
                            && (ancestorSet.has(segment.node.id) || descendantSet.has(segment.node.id));
                        const isMuted = hoveredNodeId !== null && !isFocused;
                        const palette = getSegmentPalette(segment.hue, segment.depth);
                        const segmentCenterPoint = getSegmentCenterPoint(
                            segment,
                            scaledCenterX,
                            scaledCenterY,
                            effectiveZoom,
                        );

                        return (
                            <g key={`segment-${segment.node.id}`} className="group">
                                <path
                                    d={describeAnnularSector(
                                        scaledCenterX,
                                        scaledCenterY,
                                        segment.innerRadius * effectiveZoom,
                                        segment.outerRadius * effectiveZoom,
                                        segment.startAngle,
                                        segment.endAngle,
                                    )}
                                    fill={palette[0]}
                                    fillOpacity={isMuted ? 0.12 : (isFocused ? 0.98 : 0.85)}
                                    stroke={isSelected ? 'var(--color-primary, #2563eb)' : palette[1]}
                                    strokeOpacity={isMuted ? 0.15 : (isSelected ? 1 : 0.92)}
                                    strokeWidth={isSelected ? 3.5 : (isFocused ? 2.2 : 1.2)}
                                    className="cursor-pointer transition-all duration-500 ease-out hover:brightness-95"
                                    onMouseEnter={() => lockHover(segment.node.id)}
                                    onClick={(event: React.MouseEvent<SVGPathElement>) => {
                                        if (event.detail === 2) {
                                            onNodeDoubleClick?.(segment.node);
                                            return;
                                        }
                                        onNodeClick?.(segment.node);
                                    }}
                                />
                                <text
                                    x={segmentCenterPoint.x}
                                    y={segmentCenterPoint.y}
                                    textAnchor="middle"
                                    dominantBaseline="central"
                                    className="pointer-events-none select-none font-bold tracking-tight fill-slate-800 transition-opacity duration-500"
                                    style={{
                                        fontSize: (segment.depth === 0 ? 13 : (segment.depth === 1 ? 11 : 9.5)) * effectiveZoom,
                                        opacity: isMuted ? 0.1 : 1,
                                    }}
                                >
                                    {wrapText(segment.node.label, segment.depth, isFocused).map((line, index, all) => (
                                        <tspan
                                            key={`${segment.node.id}-${index}`}
                                            x={segmentCenterPoint.x}
                                            dy={index === 0 ? `-${(all.length - 1) * 0.6}em` : '1.15em'}
                                        >
                                            {line}
                                        </tspan>
                                    ))}
                                </text>
                            </g>
                        );
                    })}
                </svg>

                {segments
                    .filter((segment: Segment<TPayload>) => segment.depth === 0)
                    .map((segment: Segment<TPayload>) => {
                        const labelPoint = polarToCartesian(
                            scaledCenterX,
                            scaledCenterY,
                            getRootLabelRadius() * effectiveZoom,
                            getSegmentMidAngle(segment),
                        );
                        const isHovered = hoveredNodeId === segment.node.id || descendantSet.has(segment.node.id);

                        return (
                            <button
                                key={`root-label-${segment.node.id}`}
                                type="button"
                                className={cx(
                                    'absolute -translate-x-1/2 -translate-y-1/2 rounded-full border px-3 py-1 text-[11px] font-semibold transition-all duration-500 ease-out',
                                    isHovered
                                        ? 'border-slate-400 bg-white text-slate-900 shadow-md'
                                        : 'border-white/90 bg-white/92 text-slate-600 shadow-sm',
                                )}
                                style={{ left: labelPoint.x, top: labelPoint.y }}
                                onMouseEnter={() => lockHover(segment.node.id)}
                                onFocus={() => lockHover(segment.node.id)}
                                onBlur={releaseHover}
                                onClick={() => onNodeClick?.(segment.node)}
                            >
                                {formatRootLabel(segment.node.label)}
                            </button>
                        );
                    })}
            </div>
        </div>
    );
}

function cx(...values: Array<string | undefined | false>) {
    return values.filter(Boolean).join(' ');
}
