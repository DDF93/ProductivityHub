
export interface PluginInterface {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly icon: string;
  
  // Plugin state
  enabled: boolean;
  
  enable(): void;
  disable(): void;
  initialize(): Promise<void>;  // Setup when plugin loads
  cleanup(): Promise<void>;     // Cleanup when plugin unloads
  
  getStatus(): 'active' | 'inactive' | 'error';
  getDisplayInfo(): PluginDisplayInfo;
}

export type PluginDisplayInfo = {
  name: string;
  status: string;
  icon: string;
  description: string;
};