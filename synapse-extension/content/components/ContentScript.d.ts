interface ContentScriptProps {
    selectedText: string;
    pageContext: {
        url: string;
        title: string;
        favicon?: string;
    };
    onClose: () => void;
    onSave: (data: any) => void;
}
export declare function ContentScript({ selectedText, pageContext, onClose, onSave }: ContentScriptProps): import("react/jsx-runtime").JSX.Element;
export {};
