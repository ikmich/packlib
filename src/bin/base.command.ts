import { Command } from 'commander';

export abstract class BaseCommand {
  constructor(protected readonly command: Command) {
  }

  async run(): Promise<void> {
  }
}