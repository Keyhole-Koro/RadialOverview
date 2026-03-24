import { DEFAULT_VISIBLE_DEPTH, ROOT_HUES } from './constants';
import { getRingInnerRadius, getRingOuterRadius, normalizeHue } from './geometry';
import type { RadialOverviewNode } from './types';

export type Segment<TPayload> = {
    node: RadialOverviewNode<TPayload>;
    depth: number;
    startAngle: number;
    endAngle: number;
    innerRadius: number;
    outerRadius: number;
    hue: number;
};

export function buildNodeById<TPayload>(nodes: RadialOverviewNode<TPayload>[]) {
    return new Map(nodes.map((node) => [node.id, node]));
}

export function buildChildrenByParent<TPayload>(
    nodes: RadialOverviewNode<TPayload>[],
    nodeById: Map<string, RadialOverviewNode<TPayload>>,
) {
    const grouped = new Map<string | undefined, string[]>();

    nodes.forEach((node) => {
        const bucket = grouped.get(node.parentId) ?? [];
        bucket.push(node.id);
        grouped.set(node.parentId, bucket);
    });

    for (const [parentId, childIds] of grouped.entries()) {
        grouped.set(parentId, childIds.sort((leftId, rightId) => {
            const left = nodeById.get(leftId);
            const right = nodeById.get(rightId);
            const leftDepth = left?.depth ?? 0;
            const rightDepth = right?.depth ?? 0;
            const leftLabel = left?.label ?? leftId;
            const rightLabel = right?.label ?? rightId;

            return leftDepth - rightDepth || leftLabel.localeCompare(rightLabel);
        }));
    }

    return grouped;
}

export function buildOrderedRootIds<TPayload>(
    nodes: RadialOverviewNode<TPayload>[],
    nodeById: Map<string, RadialOverviewNode<TPayload>>,
    rootIds?: string[],
) {
    if (rootIds && rootIds.length > 0) {
        return rootIds.filter((rootId) => nodeById.has(rootId));
    }

    return nodes
        .filter((node) => !node.parentId || !nodeById.has(node.parentId))
        .sort((left, right) => left.label.localeCompare(right.label))
        .map((node) => node.id);
}

export function buildParentById<TPayload>(nodes: RadialOverviewNode<TPayload>[]) {
    return new Map(nodes.map((node) => [node.id, node.parentId]));
}

export function buildAncestorPath(
    hoveredNodeId: string | null,
    parentById: Map<string, string | undefined>,
) {
    if (!hoveredNodeId) {
        return [];
    }

    const path: string[] = [];
    let currentId: string | undefined = hoveredNodeId;

    while (currentId) {
        path.unshift(currentId);
        currentId = parentById.get(currentId);
    }

    return path;
}

export function buildDescendantSet(
    hoveredNodeId: string | null,
    childrenByParent: Map<string | undefined, string[]>,
) {
    if (!hoveredNodeId) {
        return new Set<string>();
    }

    const result = new Set<string>([hoveredNodeId]);
    const queue: string[] = [hoveredNodeId];

    while (queue.length > 0) {
        const current = queue.pop()!;

        for (const childId of childrenByParent.get(current) ?? []) {
            if (!result.has(childId)) {
                result.add(childId);
                queue.push(childId);
            }
        }
    }

    return result;
}

export function buildVisibleNodeIds<TPayload>(
    nodes: RadialOverviewNode<TPayload>[],
    hoveredNodeId: string | null,
    ancestorSet: Set<string>,
    descendantSet: Set<string>,
) {
    const ids = new Set<string>();
    const depthLimit = DEFAULT_VISIBLE_DEPTH;

    nodes.forEach((node) => {
        if (hoveredNodeId === null) {
            if (node.depth <= depthLimit) {
                ids.add(node.id);
            }
            return;
        }

        if (node.depth <= depthLimit || ancestorSet.has(node.id) || descendantSet.has(node.id)) {
            ids.add(node.id);
        }
    });

    return ids;
}

export function buildVisibleChildrenByParent(
    childrenByParent: Map<string | undefined, string[]>,
    visibleNodeIds: Set<string>,
) {
    const filtered = new Map<string | undefined, string[]>();

    for (const [parentId, childIds] of childrenByParent.entries()) {
        const visibleChildren = childIds.filter((childId) => visibleNodeIds.has(childId));
        if (visibleChildren.length > 0) {
            filtered.set(parentId, visibleChildren);
        }
    }

    return filtered;
}

export function buildSubtreeSizeById(
    visibleChildrenByParent: Map<string | undefined, string[]>,
    visibleNodeIds: Set<string>,
) {
    const memo = new Map<string, number>();

    const countSubtree = (nodeId: string): number => {
        const cached = memo.get(nodeId);
        if (cached !== undefined) {
            return cached;
        }

        const childIds = visibleChildrenByParent.get(nodeId) ?? [];
        const size = 1 + childIds.reduce((sum, childId) => sum + countSubtree(childId), 0);
        memo.set(nodeId, size);
        return size;
    };

    visibleNodeIds.forEach((nodeId) => {
        countSubtree(nodeId);
    });

    return memo;
}

export function buildSegments<TPayload>({
    orderedRootIds,
    visibleNodeIds,
    nodeById,
    childrenByParent,
    subtreeSizeById,
    hoveredNodeId,
}: {
    orderedRootIds: string[];
    visibleNodeIds: Set<string>;
    nodeById: Map<string, RadialOverviewNode<TPayload>>;
    childrenByParent: Map<string | undefined, string[]>;
    subtreeSizeById: Map<string, number>;
    hoveredNodeId: string | null;
}) {
    const result: Segment<TPayload>[] = [];
    const visibleRootIds = orderedRootIds.filter((rootId) => visibleNodeIds.has(rootId));
    if (visibleRootIds.length === 0) {
        return result;
    }

    assignSegments({
        nodeIds: visibleRootIds,
        startAngle: -Math.PI / 2,
        endAngle: (Math.PI * 3) / 2,
        depth: 0,
        result,
        nodeById,
        childrenByParent,
        visibleNodeIds,
        subtreeSizeById,
        hoveredNodeId,
        branchHue: null,
    });

    return result;
}

function assignSegments<TPayload>({
    nodeIds,
    startAngle,
    endAngle,
    depth,
    result,
    nodeById,
    childrenByParent,
    visibleNodeIds,
    subtreeSizeById,
    hoveredNodeId,
    branchHue,
}: {
    nodeIds: string[];
    startAngle: number;
    endAngle: number;
    depth: number;
    result: Segment<TPayload>[];
    nodeById: Map<string, RadialOverviewNode<TPayload>>;
    childrenByParent: Map<string | undefined, string[]>;
    visibleNodeIds: Set<string>;
    subtreeSizeById: Map<string, number>;
    hoveredNodeId: string | null;
    branchHue: number | null;
}) {
    const availableIds = nodeIds.filter((nodeId) => visibleNodeIds.has(nodeId));
    if (availableIds.length === 0) {
        return;
    }

    const siblingGap = Math.min(0.08, depth === 0 ? 0.06 : (depth === 1 ? 0.04 : 0.025));
    const totalGap = siblingGap * Math.max(availableIds.length - 1, 0);
    const span = Math.max(endAngle - startAngle - totalGap, 0.24);

    const weightedChildren = availableIds.map((nodeId) => {
        const subtreeSize = subtreeSizeById.get(nodeId) ?? 1;
        const sizeFactor = Math.min(Math.log2(subtreeSize + 1), 3) / 3;
        const branchMultiplier = hoveredNodeId === null
            ? 1
            : (nodeId === hoveredNodeId ? 1.22 + (sizeFactor * 0.26) : 1);

        return {
            nodeId,
            weight: subtreeSize * branchMultiplier,
        };
    });

    const totalWeight = weightedChildren.reduce((sum, child) => sum + child.weight, 0);
    let cursor = startAngle;

    weightedChildren.forEach(({ nodeId, weight }, siblingIndex) => {
        const node = nodeById.get(nodeId);
        if (!node) {
            return;
        }

        const childSpan = span * (weight / Math.max(totalWeight, 1));
        const childStart = cursor;
        const childEnd = childStart + childSpan;
        const innerRadius = getRingInnerRadius(depth);
        const outerRadius = getRingOuterRadius(depth);
        const siblingCount = availableIds.length;
        const normalizedOffset = siblingCount <= 1
            ? 0
            : ((siblingIndex / (siblingCount - 1)) - 0.5);
        const rootHue = node.hue ?? branchHue ?? ROOT_HUES[siblingIndex % ROOT_HUES.length];
        const childHue = normalizeHue(rootHue + (normalizedOffset * Math.max(28 - (depth * 5), 8)));

        result.push({
            node,
            depth,
            startAngle: childStart,
            endAngle: childEnd,
            innerRadius,
            outerRadius,
            hue: childHue,
        });

        assignSegments({
            nodeIds: childrenByParent.get(nodeId) ?? [],
            startAngle: childStart,
            endAngle: childEnd,
            depth: depth + 1,
            result,
            nodeById,
            childrenByParent,
            visibleNodeIds,
            subtreeSizeById,
            hoveredNodeId,
            branchHue: childHue,
        });

        cursor = childEnd + siblingGap;
    });
}
