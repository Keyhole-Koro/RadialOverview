import React from 'react';
import ReactDOM from 'react-dom/client';

import { RadialOverview } from '../src';
import type { RadialOverviewNode } from '../src';

import './styles.css';

type DemoPayload = {
    description: string;
};

const nodes: RadialOverviewNode<DemoPayload>[] = [
    { id: 'root-strategy', label: 'Strategy', depth: 0, payload: { description: 'Top-level strategy track.' } },
    { id: 'root-product', label: 'Product', depth: 0, payload: { description: 'Top-level product track.' } },
    { id: 'root-ops', label: 'Operations', depth: 0, payload: { description: 'Top-level operations track.' } },
    { id: 's-vision', label: 'Vision Mapping', parentId: 'root-strategy', depth: 1, payload: { description: 'Define long-term direction.' } },
    { id: 's-market', label: 'Market Scan', parentId: 'root-strategy', depth: 1, payload: { description: 'Identify demand and whitespace.' } },
    { id: 's-metrics', label: 'Metrics Tree', parentId: 'root-strategy', depth: 1, payload: { description: 'Clarify success signals.' } },
    { id: 'p-roadmap', label: 'Roadmap', parentId: 'root-product', depth: 1, payload: { description: 'Sequence deliverables.' } },
    { id: 'p-discovery', label: 'Discovery', parentId: 'root-product', depth: 1, payload: { description: 'Interview and synthesis work.' } },
    { id: 'p-design', label: 'Design System', parentId: 'root-product', depth: 1, payload: { description: 'Shared UI decisions.' } },
    { id: 'o-staffing', label: 'Staffing', parentId: 'root-ops', depth: 1, payload: { description: 'Team planning and roles.' } },
    { id: 'o-budget', label: 'Budget', parentId: 'root-ops', depth: 1, payload: { description: 'Spending guardrails.' } },
    { id: 'o-risk', label: 'Risk Review', parentId: 'root-ops', depth: 1, payload: { description: 'Operational risk tracking.' } },
    { id: 's-vision-principles', label: 'Product Principles', parentId: 's-vision', depth: 2, payload: { description: 'Shared tradeoff principles.' } },
    { id: 's-vision-story', label: 'Narrative', parentId: 's-vision', depth: 2, payload: { description: 'Internal story for the roadmap.' } },
    { id: 's-market-personas', label: 'Personas', parentId: 's-market', depth: 2, payload: { description: 'Segment definitions.' } },
    { id: 's-market-competition', label: 'Competition', parentId: 's-market', depth: 2, payload: { description: 'Relative positioning.' } },
    { id: 's-metrics-northstar', label: 'North Star', parentId: 's-metrics', depth: 2, payload: { description: 'Primary metric.' } },
    { id: 's-metrics-inputs', label: 'Input Metrics', parentId: 's-metrics', depth: 2, payload: { description: 'Leading indicators.' } },
    { id: 'p-roadmap-q2', label: 'Q2 Goals', parentId: 'p-roadmap', depth: 2, payload: { description: 'Short-term milestones.' } },
    { id: 'p-roadmap-q3', label: 'Q3 Bets', parentId: 'p-roadmap', depth: 2, payload: { description: 'Mid-term initiatives.' } },
    { id: 'p-discovery-interviews', label: 'Interviews', parentId: 'p-discovery', depth: 2, payload: { description: 'User conversations.' } },
    { id: 'p-discovery-analysis', label: 'Synthesis', parentId: 'p-discovery', depth: 2, payload: { description: 'Pull patterns from data.' } },
    { id: 'p-design-tokens', label: 'Tokens', parentId: 'p-design', depth: 2, payload: { description: 'Theme primitives.' } },
    { id: 'p-design-components', label: 'Components', parentId: 'p-design', depth: 2, payload: { description: 'Reusable UI components.' } },
    { id: 'o-staffing-hiring', label: 'Hiring Plan', parentId: 'o-staffing', depth: 2, payload: { description: 'Headcount proposal.' } },
    { id: 'o-staffing-capacity', label: 'Capacity Map', parentId: 'o-staffing', depth: 2, payload: { description: 'Allocation view.' } },
    { id: 'o-budget-forecast', label: 'Forecast', parentId: 'o-budget', depth: 2, payload: { description: 'Quarterly forecast.' } },
    { id: 'o-budget-controls', label: 'Controls', parentId: 'o-budget', depth: 2, payload: { description: 'Approval process.' } },
    { id: 'o-risk-incidents', label: 'Incident Tabletop', parentId: 'o-risk', depth: 2, payload: { description: 'Response rehearsals.' } },
    { id: 'o-risk-vendors', label: 'Vendor Review', parentId: 'o-risk', depth: 2, payload: { description: 'Third-party dependency review.' } },
    { id: 'p-design-components-shell', label: 'App Shell', parentId: 'p-design-components', depth: 3, payload: { description: 'Navigation and shell frame.' } },
    { id: 'p-design-components-data', label: 'Data Cards', parentId: 'p-design-components', depth: 3, payload: { description: 'Readable analytics cards.' } },
    { id: 'o-risk-vendors-sla', label: 'SLA Audit', parentId: 'o-risk-vendors', depth: 3, payload: { description: 'Service level review.' } },
    { id: 'o-risk-vendors-security', label: 'Security Review', parentId: 'o-risk-vendors', depth: 3, payload: { description: 'Security questionnaires.' } },
];

function App() {
    const [selectedNodeIds, setSelectedNodeIds] = React.useState<string[]>(['p-design']);
    const [activeNodeId, setActiveNodeId] = React.useState<string | null>(null);
    const activeNode = nodes.find((node) => node.id === activeNodeId) ?? null;

    return (
        <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.92),_rgba(226,232,240,0.96)_38%,_rgba(203,213,225,1)_100%)] text-slate-900">
            <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col gap-6 px-6 py-6 lg:flex-row">
                <section className="flex min-h-[760px] flex-1 flex-col overflow-hidden rounded-[32px] border border-white/60 bg-white/70 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur">
                    <div className="flex items-center justify-between border-b border-slate-200/80 px-5 py-4">
                        <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Playground</p>
                            <h1 className="text-lg font-semibold text-slate-900">RadialOverview</h1>
                        </div>
                        <div className="text-right text-xs text-slate-500">
                            <p>Single click: select</p>
                            <p>Double click: toggle sample selection</p>
                        </div>
                    </div>
                    <div className="h-[760px] p-4">
                        <RadialOverview
                            nodes={nodes}
                            rootIds={['root-strategy', 'root-product', 'root-ops']}
                            selectedNodeIds={selectedNodeIds}
                            onNodeClick={(node) => {
                                setSelectedNodeIds([node.id]);
                                setActiveNodeId(node.id);
                            }}
                            onNodeDoubleClick={(node) => {
                                setSelectedNodeIds((current) => (
                                    current.includes(node.id)
                                        ? current.filter((id) => id !== node.id)
                                        : [...current, node.id]
                                ));
                                setActiveNodeId(node.id);
                            }}
                            onHoverNode={(node) => {
                                setActiveNodeId(node?.id ?? null);
                            }}
                        />
                    </div>
                </section>

                <aside className="flex w-full max-w-[360px] flex-col gap-4">
                    <section className="rounded-[28px] border border-white/60 bg-slate-950 px-5 py-5 text-slate-100 shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Active Node</p>
                        <h2 className="mt-3 text-2xl font-semibold">{activeNode?.label ?? 'Hover a segment'}</h2>
                        <p className="mt-3 text-sm leading-6 text-slate-300">
                            {activeNode?.payload?.description ?? 'The panel updates from hover and click handlers so you can verify interaction wiring.'}
                        </p>
                        <div className="mt-5 flex flex-wrap gap-2 text-xs text-slate-300">
                            {selectedNodeIds.map((id) => (
                                <span key={id} className="rounded-full border border-slate-700 bg-slate-900 px-2.5 py-1">
                                    {id}
                                </span>
                            ))}
                        </div>
                    </section>
                </aside>
            </div>
        </main>
    );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
);
