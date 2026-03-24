export type RadialOverviewNode<TPayload = unknown> = {
    id: string;
    label: string;
    parentId?: string;
    depth: number;
    rootId?: string;
    hue?: number;
    payload?: TPayload;
};

export type RadialOverviewNodeLike = {
    id: string;
    data?: {
        label?: string;
        parentId?: string;
        nodeSource?: string;
        [key: string]: unknown;
    };
};

export type ActionAdapterOptions = {
    includeNode?: (node: RadialOverviewNodeLike) => boolean;
};
