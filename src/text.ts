export function formatRootLabel(label: string) {
    return truncateLabel(label, 20);
}

export function wrapText(label: string, depth: number, isFocused: boolean): string[] {
    const maxLength = isFocused
        ? (depth === 0 ? 18 : (depth === 1 ? 14 : 12))
        : (depth === 0 ? 12 : (depth === 1 ? 8 : 6));

    if (label.length <= maxLength) {
        return [label];
    }

    const lines: string[] = [];
    let current = label;

    while (current.length > 0 && lines.length < 3) {
        if (current.length <= maxLength) {
            lines.push(current);
            break;
        }

        let splitIdx = maxLength;
        const lastSpace = current.lastIndexOf(' ', maxLength);

        if (lastSpace > maxLength / 2) {
            splitIdx = lastSpace;
        }

        lines.push(current.slice(0, splitIdx));
        current = current.slice(splitIdx).trim();

        if (lines.length === 3 && current.length > 0) {
            lines[2] = truncateLabel(lines[2], maxLength);
        }
    }

    return lines;
}

export function truncateLabel(label: string, maxLength: number) {
    return label.length <= maxLength ? label : `${label.slice(0, maxLength - 1)}…`;
}
