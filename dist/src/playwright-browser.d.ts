export declare function initializeBrowser(): Promise<void>;
export declare function closeBrowser(): Promise<void>;
export declare function saveSession(): Promise<void>;
export declare function navigateTo(url: string): Promise<void>;
export declare function waitForElement(selector: string, timeout?: number): Promise<void>;
export declare function clickElement(selector: string): Promise<void>;
export declare function typeText(selector: string, text: string): Promise<void>;
export declare function evaluate(fn: (...args: any[]) => any, ...args: any[]): Promise<any>;
export declare function getInnerHTML(selector: string): Promise<string>;
export declare function getTextContent(selector: string): Promise<string>;
export declare function scrollPage(): Promise<void>;
//# sourceMappingURL=playwright-browser.d.ts.map