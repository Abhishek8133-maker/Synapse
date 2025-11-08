interface ExtensionMessage {
    type: 'CAPTURE_TEXT' | 'CAPTURE_SCREENSHOT' | 'CAPTURE_URL' | 'GET_PAGE_INFO';
    data: any;
}
interface PageContext {
    url: string;
    title: string;
    favicon: string;
    selectedElement: string;
    author: string;
    publishDate: string;
    selectedText: string;
}
declare class BackgroundService {
    constructor();
    private setupEventListeners;
    private setupContextMenus;
    private handleCommand;
    private handleContextMenuClick;
    private handleMessage;
    private openPopup;
    private captureSelectedText;
    private saveSelectedText;
    private captureScreenshot;
    private savePage;
    private saveImage;
    private captureText;
    private captureUrl;
    private getPageContext;
    private getPageInfo;
    private sendToAPI;
}
