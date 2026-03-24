import { INNER_RADIUS, RING_GAP, RING_THICKNESS } from './constants';

export function getRingInnerRadius(depth: number) {
    return INNER_RADIUS + (depth * (RING_THICKNESS + RING_GAP));
}

export function getRingOuterRadius(depth: number) {
    return getRingInnerRadius(depth) + RING_THICKNESS;
}

export function getNodeOrbitRadius(depth: number) {
    return getRingInnerRadius(depth) + (RING_THICKNESS / 2);
}

export function getRootLabelRadius() {
    return getRingOuterRadius(0) + 28;
}

export function getSegmentMidAngle(segment: { startAngle: number; endAngle: number }) {
    return segment.startAngle + ((segment.endAngle - segment.startAngle) / 2);
}

export function polarToCartesian(cx: number, cy: number, radius: number, angle: number) {
    return {
        x: cx + (Math.cos(angle) * radius),
        y: cy + (Math.sin(angle) * radius),
    };
}

export function getSegmentCenterPoint(
    segment: { depth: number; startAngle: number; endAngle: number },
    centerX: number,
    centerY: number,
    zoom: number,
) {
    return polarToCartesian(
        centerX,
        centerY,
        getNodeOrbitRadius(segment.depth) * zoom,
        getSegmentMidAngle(segment),
    );
}

export function getSegmentPalette(hue: number, depth: number): [string, string] {
    const saturation = Math.max(72 - (depth * 4), 54);
    const fillLightness = Math.min(86 + (depth * 2), 94);
    const strokeLightness = Math.min(74 + (depth * 2), 88);

    return [
        `hsla(${hue} ${saturation}% ${fillLightness}% / 1)`,
        `hsla(${hue} ${Math.min(saturation + 4, 82)}% ${strokeLightness}% / 1)`,
    ];
}

export function normalizeHue(hue: number) {
    const normalized = hue % 360;
    return normalized < 0 ? normalized + 360 : normalized;
}

export function describeAnnularSector(
    cx: number,
    cy: number,
    innerRadius: number,
    outerRadius: number,
    startAngle: number,
    endAngle: number,
) {
    const startOuter = polarToCartesian(cx, cy, outerRadius, startAngle);
    const endOuter = polarToCartesian(cx, cy, outerRadius, endAngle);
    const startInner = polarToCartesian(cx, cy, innerRadius, startAngle);
    const endInner = polarToCartesian(cx, cy, innerRadius, endAngle);
    const largeArcFlag = endAngle - startAngle > Math.PI ? 1 : 0;

    return [
        `M ${startOuter.x} ${startOuter.y}`,
        `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${endOuter.x} ${endOuter.y}`,
        `L ${endInner.x} ${endInner.y}`,
        `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${startInner.x} ${startInner.y}`,
        'Z',
    ].join(' ');
}
