export interface AiParsedOption {
  name: string;
  price: number;
  is_default?: boolean;
}

export interface AiParsedCustomGroup {
  title: string;
  type: 'single' | 'multiple';
  options: AiParsedOption[];
}

export interface AiParsedMenuItem {
  name: string;
  price: number;
  description?: string;
  category?: string;
  is_sold_out?: boolean;
  custom_groups?: AiParsedCustomGroup[];
}

export interface AiParseResponse {
  store_name?: string;
  category_name?: string;
  items: AiParsedMenuItem[];
}

export interface DiagnosticsResult {
  healthy: boolean;
  latency: number;
  status: number;
  message: string;
  inferenceTest: string;
  supportedModels: string[];
  trace: string[];
}
