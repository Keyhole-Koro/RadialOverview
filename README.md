# RadialOverview

`Action/ActionAct/frontend/src/features/graph/components/RadialOverview.tsx` の UI を、Action 固有の `GraphNodeRender` 依存から切り離して再利用できる形へ整理したコンポーネント置き場です。

## Build

```bash
npm install
npm run dev
npm run typecheck
npm run build
```

`npm run dev` は watch build です。`src/` の変更に応じて `dist/` を更新します。

```bash
npm install
npm run typecheck
npm run build
```

生成物は `dist/index.js` と `dist/index.d.ts` です。

## 含まれるもの

- `src/RadialOverview.tsx`
  - 汎用ノード型 `RadialOverviewNode<T>` を受け取る radial overview UI
- `src/actionAdapter.ts`
  - Action の graph node 配列と `depthById` から汎用ノード配列へ変換するヘルパー
- `src/types.ts`
  - 共通型

## 汎用 props

```ts
type RadialOverviewNode<T = unknown> = {
  id: string;
  label: string;
  parentId?: string;
  depth: number;
  rootId?: string;
  hue?: number;
  payload?: T;
};
```

```tsx
import { RadialOverview } from "radial-overview";

<RadialOverview
  nodes={nodes}
  rootIds={rootIds}
  selectedNodeIds={selectedNodeIds}
  onNodeClick={(node) => {}}
  onNodeDoubleClick={(node) => {}}
  onHoverNode={(nodeOrNull) => {}}
  zoomBias={1.35}
/>
```

## Action からの移行例

```ts
import { RadialOverview, fromActionGraphNodes } from "radial-overview";

const overviewNodes = fromActionGraphNodes(radialOverviewNodes, radialOverviewGraph.depthById);

<RadialOverview
  nodes={overviewNodes}
  rootIds={radialOverviewGraph.rootIds}
  selectedNodeIds={selectedNodeIds}
  onNodeClick={(node) => activateRadialNode(node.id)}
  onNodeDoubleClick={(node) => commands.toggleBranch(node.id)}
/>
```

## メモ

- Action 側の元ファイルは未変更です
- 現状は Tailwind 系 class をそのまま使う前提です
- `payload` に元ノードを保持できるので、呼び出し側は Action 固有データへ戻れます
- package の entrypoint は `exports["."]` で `dist/index.js` を向いています
