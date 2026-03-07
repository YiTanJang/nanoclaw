export interface ContainerInput {
  prompt: string;
  sessionId?: string;
  groupFolder: string;
  chatJid: string;
  isMain: boolean;
  isScheduledTask?: boolean;
  assistantName?: string;
  secrets?: Record<string, string>;
  model?: string;
  mcpConfig?: {
    mcpServers: Record<string, any>;
  };
}

export interface ContainerOutput {
  status: 'success' | 'error';
  result: string | null;
  newSessionId?: string;
  error?: string;
}

export const OUTPUT_START_MARKER = '---NANOGEM_OUTPUT_START---';
export const OUTPUT_END_MARKER = '---NANOGEM_OUTPUT_END---';
export const IPC_DIR = '/workspace/ipc';
export const IPC_INPUT_DIR = path.join(IPC_DIR, 'input');
export const IPC_MESSAGES_DIR = path.join(IPC_DIR, 'messages');
export const TASKS_DIR = path.join(IPC_DIR, 'tasks');
export const IPC_INPUT_CLOSE_SENTINEL = path.join(IPC_INPUT_DIR, '_close');
export const IPC_POLL_MS = 1000;

export const MEMORY_DIR = '/workspace/group/.nanogem/memory';
export const CONTINUUM_DIR = path.join(MEMORY_DIR, 'continuum');
export const EPISODES_DIR = path.join(MEMORY_DIR, 'episodes');

import path from 'path';
