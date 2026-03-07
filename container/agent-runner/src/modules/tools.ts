import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { CronExpressionParser } from 'cron-parser';
import { 
  IPC_MESSAGES_DIR, 
  TASKS_DIR, 
  MEMORY_DIR,
  ContainerInput 
} from './types.js';
import { updateMemory, recallMemory } from './memory.js';

export function writeIpcFile(dir: string, data: object): void {
  fs.mkdirSync(dir, { recursive: true });
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.json`;
  const filepath = path.join(dir, filename);
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
}

export const toolDeclarations = [
  {
    name: 'bash',
    description: 'Execute a bash command in the isolated pod environment.',
    parameters: {
      type: 'OBJECT' as const,
      properties: {
        command: { type: 'STRING' as const, description: 'The command to execute' },
      },
      required: ['command'],
    },
  },
  {
    name: 'read_file',
    description: 'Read the contents of a file in the workspace.',
    parameters: {
      type: 'OBJECT' as const,
      properties: {
        path: { type: 'STRING' as const, description: 'Path relative to /workspace/group' },
      },
      required: ['path'],
    },
  },
  {
    name: 'write_file',
    description: 'Write or overwrite a file in the workspace.',
    parameters: {
      type: 'OBJECT' as const,
      properties: {
        path: { type: 'STRING' as const, description: 'Path relative to /workspace/group' },
        content: { type: 'STRING' as const, description: 'Content to write' },
      },
      required: ['path', 'content'],
    },
  },
  {
    name: 'edit_file',
    description: 'Edit a file using search and replace.',
    parameters: {
      type: 'OBJECT' as const,
      properties: {
        path: { type: 'STRING' as const, description: 'Path to the file' },
        oldText: { type: 'STRING' as const, description: 'The exact text to replace' },
        newText: { type: 'STRING' as const, description: 'The replacement text' },
      },
      required: ['path', 'oldText', 'newText'],
    },
  },
  {
    name: 'glob',
    description: 'Find files matching a pattern.',
    parameters: {
      type: 'OBJECT' as const,
      properties: {
        pattern: { type: 'STRING' as const, description: 'Glob pattern' },
      },
      required: ['pattern'],
    },
  },
  {
    name: 'grep',
    description: 'Search for a string in files.',
    parameters: {
      type: 'OBJECT' as const,
      properties: {
        query: { type: 'STRING' as const, description: 'Search string' },
        path: { type: 'STRING' as const, description: 'Directory to search' },
      },
      required: ['query'],
    },
  },
  {
    name: 'web_search',
    description: 'Search the live web for current information using Google Search.',
    parameters: {
      type: 'OBJECT' as const,
      properties: {
        query: { type: 'STRING' as const, description: 'The search query' },
      },
      required: ['query'],
    },
  },
  {
    name: 'web_fetch',
    description: 'Fetch the content of a URL.',
    parameters: {
      type: 'OBJECT' as const,
      properties: {
        url: { type: 'STRING' as const, description: 'URL to fetch' },
      },
      required: ['url'],
    },
  },
  {
    name: 'send_message',
    description: 'Send a message to a user or another agent.',
    parameters: {
      type: 'OBJECT' as const,
      properties: {
        text: { type: 'STRING' as const, description: 'Message content' },
        sender: { type: 'STRING' as const, description: 'Optional display name' },
        targetJid: { type: 'STRING' as const, description: 'Optional target JID' },
      },
      required: ['text'],
    },
  },
  {
    name: 'delegate_task',
    description: 'Assign a structured task to another agent.',
    parameters: {
      type: 'OBJECT' as const,
      properties: {
        targetJid: { type: 'STRING' as const, description: 'The JID of the agent to delegate to' },
        task: { type: 'STRING' as const, description: 'Task description' },
        expectedOutput: { type: 'STRING' as const, description: 'Definition of final result' },
      },
      required: ['targetJid', 'task', 'expectedOutput'],
    },
  },
  {
    name: 'submit_work',
    description: 'Submit the final result of your assigned Mission.',
    parameters: {
      type: 'OBJECT' as const,
      properties: {
        result: { type: 'STRING' as const, description: 'The final outcome' },
      },
      required: ['result'],
    },
  },
  {
    name: 'recall_memory',
    description: 'Recall information from long-term memory (facts, workflows, or episodes).',
    parameters: {
      type: 'OBJECT' as const,
      properties: {
        category: { type: 'STRING' as const, enum: ['facts', 'workflows', 'episodes'] },
      },
      required: ['category'],
    },
  },
  {
    name: 'update_memory',
    description: 'Update your long-term memory (Continuum).',
    parameters: {
      type: 'OBJECT' as const,
      properties: {
        category: { type: 'STRING' as const, enum: ['facts', 'workflows'] },
        content: { type: 'STRING' as const, description: 'The updated Markdown content' },
      },
      required: ['category', 'content'],
    },
  },
];

export const getFunctions = (
  input: ContainerInput,
  client: any,
  modelName: string
) => ({
  bash: ({ command }: any) => {
    try {
      const output = execSync(command, { encoding: 'utf-8', timeout: 30000 });
      return output || 'Success (no output).';
    } catch (err: any) {
      return `Error: ${err.message}\n${err.stderr || ''}`;
    }
  },
  read_file: ({ path: filePath }: any) => {
    try {
      const fullPath = path.isAbsolute(filePath) ? filePath : path.resolve('/workspace/group', filePath);
      if (!fullPath.startsWith('/workspace/group') && !fullPath.startsWith('/workspace/project'))
        return 'Error: Access denied.';
      return fs.readFileSync(fullPath, 'utf-8');
    } catch (err: any) {
      return `Error: ${err.message}`;
    }
  },
  write_file: ({ path: filePath, content }: any) => {
    try {
      const fullPath = path.isAbsolute(filePath) ? filePath : path.resolve('/workspace/group', filePath);
      if (!fullPath.startsWith('/workspace/group') && !fullPath.startsWith('/workspace/project'))
        return 'Error: Access denied.';
      fs.mkdirSync(path.dirname(fullPath), { recursive: true });
      fs.writeFileSync(fullPath, content);
      return `Successfully wrote to ${filePath}`;
    } catch (err: any) {
      return `Error: ${err.message}`;
    }
  },
  edit_file: ({ path: filePath, oldText, newText }: any) => {
    try {
      const fullPath = path.isAbsolute(filePath) ? filePath : path.resolve('/workspace/group', filePath);
      if (!fullPath.startsWith('/workspace/group') && !fullPath.startsWith('/workspace/project'))
        return 'Error: Access denied.';
      const content = fs.readFileSync(fullPath, 'utf-8');
      if (!content.includes(oldText)) return 'Error: oldText not found.';
      const newContent = content.replace(oldText, newText);
      fs.writeFileSync(fullPath, newContent);
      return `Successfully edited ${filePath}`;
    } catch (err: any) {
      return `Error: ${err.message}`;
    }
  },
  glob: ({ pattern }: any) => {
    try {
      const output = execSync(`find . -name "${pattern}"`, {
        cwd: pattern.startsWith('/workspace/project') ? '/workspace/project' : '/workspace/group',
        encoding: 'utf-8',
      });
      return output || 'No matches.';
    } catch (err: any) {
      return `Error: ${err.message}`;
    }
  },
  grep: ({ query, path: searchPath = '.' }: any) => {
    try {
      const fullPath = searchPath.startsWith('/') ? searchPath : path.resolve('/workspace/group', searchPath);
      const output = execSync(`grep -r "${query}" "${fullPath}"`, {
        encoding: 'utf-8',
      });
      return output || 'No matches.';
    } catch (err: any) {
      return `Error: ${err.message}`;
    }
  },
  web_search: async ({ query }: any) => {
    try {
      const searchResponse = await client.models.generateContent({
        model: modelName,
        contents: [{ role: 'user', parts: [{ text: `Search the web and summary: ${query}` }] }],
        config: { tools: [{ googleSearch: {} }] }
      });
      return (searchResponse.text || 'No information found.') + '\n\n[Sources: Google Search]';
    } catch (err: any) {
      return `Error: ${err.message}`;
    }
  },
  web_fetch: async ({ url }: any) => {
    try {
      const output = execSync(`curl -sL "${url}" | head -c 15000`, { encoding: 'utf-8', timeout: 10000 });
      return output || 'Empty response.';
    } catch (err: any) {
      return `Error: ${err.message}`;
    }
  },
  send_message: ({ text, sender, targetJid }: any) => {
    const finalTargetJid = targetJid || input.chatJid;
    writeIpcFile(IPC_MESSAGES_DIR, {
      type: 'message',
      chatJid: finalTargetJid,
      text,
      sender,
      groupFolder: input.groupFolder,
      timestamp: new Date().toISOString(),
    });
    return `Message sent to ${finalTargetJid}.`;
  },
  delegate_task: ({ targetJid, task, expectedOutput }: any) => {
    const missionText = `[MISSION_ASSIGNED]\nTask: ${task}\nExpected Output: ${expectedOutput}`;
    writeIpcFile(IPC_MESSAGES_DIR, {
      type: 'message',
      chatJid: targetJid,
      text: missionText,
      sender: input.assistantName || 'Manager',
      groupFolder: input.groupFolder,
      timestamp: new Date().toISOString(),
    });
    writeIpcFile(TASKS_DIR, {
      type: 'write_mission',
      targetJid,
      mission: { task, expectedOutput, assignedBy: input.chatJid, assignedByFolder: input.groupFolder, timestamp: new Date().toISOString() }
    });
    return `Task delegated to ${targetJid}.`;
  },
  submit_work: ({ result }: any) => {
    const missionPath = path.join('/workspace/group', '.nanogem', 'mission.json');
    let reportJid = input.chatJid;
    if (fs.existsSync(missionPath)) {
      try {
        const mission = JSON.parse(fs.readFileSync(missionPath, 'utf-8'));
        if (mission.assignedBy) reportJid = mission.assignedBy;
      } catch {}
    }
    writeIpcFile(IPC_MESSAGES_DIR, {
      type: 'message',
      chatJid: reportJid,
      text: `[MISSION_COMPLETED]\nResult: ${result}`,
      sender: input.assistantName || 'Worker',
      groupFolder: input.groupFolder,
      timestamp: new Date().toISOString(),
    });
    return `Work submitted to ${reportJid}.`;
  },
  recall_memory: ({ category }: any) => recallMemory(category),
  update_memory: ({ category, content }: any) => updateMemory(category, content),
});
