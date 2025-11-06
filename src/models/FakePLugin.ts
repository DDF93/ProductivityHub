import { PluginInterface, PluginDisplayInfo } from '../interfaces/PluginInterface';

export class FakePlugin implements PluginInterface {
  public readonly id: string;
  public readonly name: string;
  public readonly description: string;
  public readonly icon: string;
  
  // Mutable state
  public enabled: boolean;

  constructor(id: string, name: string, description: string, icon: string) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.icon = icon;
    this.enabled = false;
  }

  public enable(): void {
    this.enabled = true;
    console.log(`${this.name} has been enabled!`);
  }

  public disable(): void {
    this.enabled = false;
    console.log(`${this.name} has been disabled!`);
  }

  public async initialize(): Promise<void> {
    console.log(`Initializing ${this.name}...`);
  }

  public async cleanup(): Promise<void> {
    console.log(`Cleaning up ${this.name}...`);
  }

  public getStatus(): 'active' | 'inactive' | 'error' {
    return this.enabled ? 'active' : 'inactive';
  }

  public getDisplayInfo(): PluginDisplayInfo {
    return {
      name: this.name,
      status: this.getStatus(),
      icon: this.icon,
      description: this.description
    };
  }
}