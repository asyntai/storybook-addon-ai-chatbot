/** Options for storybook-addon-ai-chatbot in .storybook/main. */
export interface AsyntaiAddonOptions {
  /** Your Asyntai widget ID from the Install page, for example "asyntai_1a2b3c4d5e6f". */
  widgetId: string;
  /** Advanced. Load the widget script from another URL. */
  scriptUrl?: string;
}

export declare const DEFAULT_SCRIPT_URL: string;
export declare function validateOptions(options: Partial<AsyntaiAddonOptions> | undefined): {
  widgetId: string;
  scriptUrl: string;
};
export declare function buildLoader(widgetId: string, scriptUrl: string): string;
export declare function buildTag(widgetId: string, scriptUrl: string): string;
export declare function managerHead(head: string | undefined, options: Partial<AsyntaiAddonOptions>): string;
