import type { ActionAdapterOptions, RadialOverviewNode, RadialOverviewNodeLike } from './types';

export function fromActionGraphNodes<TNode extends RadialOverviewNodeLike>(
    nodes: TNode[],
    depthById: Map<string, number>,
    options: ActionAdapterOptions = {},
): RadialOverviewNode<TNode>[] {
    const includeNode = options.includeNode ?? ((node: RadialOverviewNodeLike) => node.data?.nodeSource === 'persisted');

    return nodes
        .filter(includeNode)
        .map((node) => ({
            id: node.id,
            label: typeof node.data?.label === 'string' && node.data.label.length > 0
                ? node.data.label
                : node.id,
            parentId: typeof node.data?.parentId === 'string' ? node.data.parentId : undefined,
            depth: depthById.get(node.id) ?? 0,
            payload: node,
        }));
}
