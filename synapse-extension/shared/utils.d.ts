export declare function injectStyles(): void;
export declare function getSelectionInfo(): {
    text: string;
    range: Range;
    rect: DOMRect;
    element: Node;
} | null;
export declare function createTooltip(element: HTMLElement, text: string): {
    remove: () => void;
};
