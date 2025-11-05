# Codebuff Agent System Reference

**For LLMs**: This document provides a comprehensive reference for understanding and working with Codebuff's multi-agent architecture.

## System Overview

Codebuff is an open-source AI coding assistant that uses a **multi-agent orchestration system** to edit codebases through natural language. Instead of a single monolithic agent, it coordinates specialized agents that work together.

**Key Architecture**:
- **Agent Runtime**: `packages/agent-runtime/` - Core execution engine
- **Backend**: `backend/` - WebSocket server, LLM integration, orchestration
- **SDK**: `sdk/` - TypeScript SDK for programmatic usage
- **CLI**: `npm-app/` - Command-line interface
- **Agent Definitions**: `.agents/` - Built-in and custom agent templates

## Agent Types

### 1. Built-in Agents (`.agents/`)

**Base Agents** (Primary orchestrators):
- `base` - Main coding assistant (GPT-5, full toolset)
- `base-lite` - Lightweight version (GPT-5, reduced tools)
- `base-max` - Maximum capability (Claude Sonnet 4.5, all tools)
- `base-quick` - Fast iteration (GPT-5 Chat, streamlined)
- `ask` - Read-only Q&A mode (no code changes)

**Specialist Agents**:
- `file-explorer` - Codebase navigation and file discovery
- `file-picker` - Intelligent file selection for context
- `find-all-referencer` - Find all references to symbols
- `researcher-web` - Web search and documentation research
- `researcher-docs` - Library documentation lookup (Context7 integration)
- `thinker` / `gpt5-thinker` / `decomposing-thinker` - Deep reasoning and planning
- `reviewer` / `reviewer-lite` - Code review and validation
- `context-pruner` - Context window optimization
- `planner-pro` / `generate-plan` - Task planning and decomposition
- `editor` - Focused code editing
- `agent-builder` - Creates new agent templates

**Orchestrators**:
- `iterative-orchestrator` - Manages large tasks through batches
- `research-implement-orchestrator` - Research then implement pattern

### 2. Agent Definition Structure

```typescript
{
  id: string                    // Unique identifier (lowercase-hyphen)
  displayName: string           // Human-readable name
  model: ModelName              // Any OpenRouter model
  publisher?: string            // Publisher ID for store
  version?: string              // Semantic version
  
  // Tools & Capabilities
  toolNames: ToolName[]         // Available tools
  spawnableAgents: string[]     // Agents this can spawn
  mcpServers?: Record<string, MCPConfig>  // MCP integrations
  
  // Prompts
  systemPrompt?: string         // System-level instructions
  instructionsPrompt: string    // Main behavior instructions
  stepPrompt?: string           // Per-step guidance
  spawnerPrompt?: string        // When others should spawn this
  
  // Input/Output
  inputSchema?: {
    prompt?: { type: 'string', description?: string }
    params?: JsonObjectSchema
  }
  outputMode: 'last_message' | 'structured_output' | 'all_messages'
  
  // Behavior
  includeMessageHistory: boolean
  inheritParentSystemPrompt?: boolean
  reasoningOptions?: { enabled: boolean, effort: string }
  
  // Programmatic Control
  handleSteps?: (context) => Generator<ToolCall | 'STEP' | 'STEP_ALL'>
}
```

### 3. Programmatic Agents (handleSteps)

Agents can use TypeScript generators for deterministic control:

```typescript
handleSteps: function* ({ agentState, prompt, params, logger }) {
  // 1. Execute tools programmatically
  const { toolResult } = yield {
    toolName: 'read_files',
    input: { paths: ['src/config.ts'] }
  }
  
  // 2. Spawn subagents
  yield {
    toolName: 'spawn_agents',
    input: {
      agents: [{
        agent_type: 'thinker',
        prompt: 'Analyze this code'
      }]
    }
  }
  
  // 3. Let LLM take over
  yield 'STEP'      // Single LLM step
  yield 'STEP_ALL'  // Run until end_turn
  
  // 4. Set output
  yield {
    toolName: 'set_output',
    input: { result: 'Done' }
  }
}
```

## Available Tools

**File Operations**:
- `read_files` - Read file contents
- `write_file` - Create/edit files
- `str_replace` - Precise string replacement edits
- `find_files` - Search for files by pattern
- `list_directory` - List directory contents
- `glob` - Glob pattern matching

**Code Analysis**:
- `code_search` - Ripgrep-based code search
- `read_subtree` - Read directory tree structure

**Execution**:
- `run_terminal_command` - Execute shell commands

**Agent Orchestration**:
- `spawn_agents` - Spawn multiple agents in parallel
- `spawn_agent_inline` - Spawn agent inline (shares message history)
- `lookup_agent_info` - Get agent capabilities

**Planning & State**:
- `create_plan` - Generate markdown plans
- `add_subgoal` / `update_subgoal` - Track progress
- `write_todos` - Maintain task lists

**Research**:
- `web_search` - Google search
- `read_docs` - Fetch library documentation (Context7)
- `browser_logs` - Access browser console logs

**Control Flow**:
- `end_turn` - Complete agent execution
- `think_deeply` - Internal reasoning (logged)
- `set_output` - Set structured output
- `set_messages` - Modify message history

**MCP Tools**: Custom tools via Model Context Protocol servers

## Agent Execution Flow

### 1. Lifecycle

```
User Input → loopAgentSteps() → [Loop]:
  ├─ runProgrammaticStep() (if handleSteps exists)
  │  └─ Execute generator yields
  ├─ runAgentStep()
  │  ├─ Build messages (system + history + user prompt)
  │  ├─ Get LLM stream
  │  ├─ processStreamWithTools()
  │  │  ├─ Parse tool calls from stream
  │  │  └─ Execute tools via handlers
  │  └─ Update agent state
  └─ Check end_turn or max steps
→ Return output
```

### 2. Agent State

```typescript
AgentState {
  agentId: string              // Unique run ID
  agentType: string            // Agent template ID
  runId?: string               // Database run ID
  parentId?: string            // Parent agent ID
  ancestorRunIds: string[]     // All ancestor run IDs

  messageHistory: Message[]    // Conversation history
  agentContext: Record<string, Subgoal>  // Tracked goals

  subagents: AgentState[]      // Spawned child agents
  childRunIds: string[]        // Child run IDs

  stepsRemaining: number       // Max steps limit
  creditsUsed: number          // Total cost (including children)
  directCreditsUsed: number    // Direct cost (this agent only)

  output?: Record<string, any> // Structured output
}
```

### 3. Agent Spawning

**Parallel Spawning** (`spawn_agents`):
- Creates independent child agents
- Runs in parallel
- Each has own message history
- Results returned as tool output

**Inline Spawning** (`spawn_agent_inline`):
- Shares parent's message history
- Runs sequentially
- Modifies shared context
- No tool result (messages added directly)

### 4. Context Management

**File Context**:
```typescript
ProjectFileContext {
  projectFiles: Record<string, string>      // All project files
  knowledgeFiles: Record<string, string>    // Knowledge base
  agentDefinitions: AgentDefinition[]       // Custom agents
  customToolDefinitions: Record<string, CustomToolDef>  // Custom tools
  maxAgentSteps: number                     // Step limit
}
```

**Context Pruning**:
- `context-pruner` agent runs before each step
- Removes irrelevant messages
- Keeps context under token limits
- Preserves critical information

## Model Support

**Supported via OpenRouter**:
- Anthropic: Claude 3.5 Sonnet, Claude 4 Sonnet
- OpenAI: GPT-4o, GPT-5, GPT-5 Chat, GPT-5 Nano
- Google: Gemini 1.5/2.0 Pro/Flash (with thinking)
- X.AI: Grok 4 Fast
- DeepSeek: DeepSeek Chat, DeepSeek Reasoner
- Qwen: Qwen 3 235B
- Any other OpenRouter model

**Model Selection**:
- Each agent specifies its model
- Different agents can use different models
- Cost tracking per model
- Automatic provider routing

## MCP (Model Context Protocol) Integration

**Configuration**:
```typescript
mcpServers: {
  'server-name': {
    type: 'stdio',           // or 'http', 'sse'
    command: 'npx',
    args: ['-y', '@package/mcp-server'],
    env: { API_KEY: 'xxx' }
  }
}
```

**Usage**:
```typescript
toolNames: [
  'read_files',              // Built-in tool
  'server-name/tool-name'    // MCP tool (format: server/tool)
]
```

**Examples**:
- Notion: `@notionhq/notion-mcp-server`
- GitHub: `@modelcontextprotocol/server-github`
- Filesystem: `@modelcontextprotocol/server-filesystem`

## SDK Usage

### Basic Example

```typescript
import { CodebuffClient } from '@codebuff/sdk'

const client = new CodebuffClient({
  apiKey: process.env.CODEBUFF_API_KEY,
  cwd: process.cwd()
})

const run = await client.run({
  agent: 'codebuff/base@0.0.16',
  prompt: 'Add error handling to API endpoints',
  handleEvent: (event) => console.log(event)
})

// Continue conversation
const run2 = await client.run({
  agent: 'codebuff/base@0.0.16',
  prompt: 'Add tests for the error handling',
  previousRun: run
})
```

### Custom Agents & Tools

```typescript
const myAgent: AgentDefinition = {
  id: 'my-agent',
  model: 'x-ai/grok-4-fast',
  displayName: 'My Agent',
  toolNames: ['custom_tool'],
  instructionsPrompt: 'You are...'
}

const myTool = getCustomToolDefinition({
  toolName: 'custom_tool',
  description: 'Does something',
  inputSchema: z.object({ input: z.string() }),
  execute: async ({ input }) => [{
    type: 'json',
    value: { result: 'done' }
  }]
})

await client.run({
  agent: 'my-agent',
  prompt: 'Do something',
  agentDefinitions: [myAgent],
  customToolDefinitions: [myTool]
})
```

## CLI Usage

**Basic**:
```bash
codebuff                    # Interactive mode
codebuff "fix the bug"      # Direct prompt
```

**Agent Control**:
```bash
codebuff --agent file-picker           # Run specific agent
codebuff --spawn reviewer              # Spawn agent directly
codebuff --params '{"key":"value"}'    # Pass JSON params
```

**Modes**:
```bash
codebuff --lite             # Budget models, fewer files
codebuff --max              # Best models, more context
codebuff --ask              # Read-only mode
codebuff --print            # Run once and exit
```

**Debugging**:
```bash
codebuff --trace            # Log all subagent activity
codebuff --cwd /path        # Run in specific directory
```

**Agent Development**:
```bash
codebuff init-agents        # Initialize .agents/ directory
codebuff publish my-agent   # Publish to agent store
codebuff save-agent         # Save current session as agent
```

## Agent Store & Publishing

**Publishing Agents**:
1. Create agent in `.agents/`
2. Set `publisher` field
3. Run `codebuff publish agent-name`
4. Agent available at `publisher/agent-name@version`

**Using Published Agents**:
```typescript
// In agent definitions
spawnableAgents: [
  'codebuff/file-picker@0.0.1',    // Published agent
  'my-local-agent'                  // Local agent
]

// In SDK
agent: 'codebuff/base@0.0.16'
```

## Key Patterns

### 1. Research → Implement

```typescript
handleSteps: function* ({ prompt }) {
  // Research phase
  yield {
    toolName: 'spawn_agents',
    input: {
      agents: [
        { agent_type: 'file-explorer', prompt: 'Find relevant files' },
        { agent_type: 'researcher-web', prompt: 'Research best practices' }
      ]
    }
  }

  // Implementation phase
  yield 'STEP_ALL'
}
```

### 2. Iterative Refinement

```typescript
handleSteps: function* () {
  while (true) {
    yield 'STEP'  // Make changes

    const { toolResult } = yield {
      toolName: 'spawn_agents',
      input: {
        agents: [{ agent_type: 'reviewer', prompt: 'Review changes' }]
      }
    }

    if (toolResult.approved) break
  }
}
```

### 3. Parallel Execution

```typescript
handleSteps: function* ({ params }) {
  // Spawn multiple agents in parallel
  yield {
    toolName: 'spawn_agents',
    input: {
      agents: params.files.map(file => ({
        agent_type: 'editor',
        prompt: `Edit ${file}`,
        params: { filePath: file }
      }))
    }
  }
}
```

## Database Schema

**Agent Runs** (`agent_run` table):
- `id` - Run UUID
- `user_id` - User ID
- `agent_id` - Agent type
- `ancestor_run_ids` - Parent run chain
- `status` - running | completed | cancelled | failed
- `total_steps` - Steps executed
- `direct_credits` - Direct cost
- `total_credits` - Total cost (including children)
- `created_at` / `completed_at` - Timestamps

**Agent Steps** (`agent_step` table):
- `id` - Step UUID
- `agent_run_id` - Parent run
- `step_number` - Step index
- `status` - completed | failed
- `credits` - Step cost
- `child_run_ids` - Spawned agents
- `message_id` - LLM message ID
- `created_at` / `completed_at` - Timestamps

## Cost Tracking

**Credit System**:
- 1 credit = $0.01 USD
- Tracked per agent step
- Aggregated to parent agents
- Model-specific pricing in `message-cost-tracker.ts`

**Cost Calculation**:
```typescript
directCreditsUsed    // This agent's LLM calls
creditsUsed          // Total (direct + all children)
```

## Environment Variables

**Backend**:
- `ANTHROPIC_API_KEY` - Claude models
- `OPENAI_API_KEY` - GPT models
- `GOOGLE_API_KEY` - Gemini models
- `OPENROUTER_API_KEY` - OpenRouter access
- `DATABASE_URL` - PostgreSQL connection
- `WEBSOCKET_URL` - WebSocket server

**SDK**:
- `CODEBUFF_API_KEY` - User API key

## File Locations

**Agent Definitions**: `.agents/`
- `base/` - Base agent variants
- `file-explorer/` - File navigation agents
- `researcher/` - Research agents
- `reviewer/` - Code review agents
- `thinker/` - Reasoning agents
- `planners/` - Planning agents
- `types/` - TypeScript definitions

**Core Packages**:
- `packages/agent-runtime/` - Agent execution engine
- `packages/code-map/` - Code analysis
- `packages/billing/` - Credit management
- `common/` - Shared utilities
- `backend/` - Server implementation
- `sdk/` - SDK implementation
- `npm-app/` - CLI implementation

## Testing

**Unit Tests**:
```bash
cd cli && bun test
cd backend && bun test
```

**E2E Tests**:
```bash
cd cli/src/__tests__
# Requires tmux
```

**Evaluation Framework** (`evals/`):
- `buffbench/` - Benchmark suite
- `git-evals/` - Git commit-based evals
- Compares Codebuff vs Claude Code
- 175+ real-world coding tasks

## Best Practices

### Agent Design

1. **Single Responsibility**: Each agent should have one clear purpose
2. **Minimal Tools**: Only include tools the agent needs
3. **Clear Prompts**: Explicit instructions for behavior
4. **Appropriate Model**: Match model capability to task complexity

### Context Management

1. **Spawn Strategically**: Use subagents to manage context windows
2. **Prune Regularly**: Let context-pruner clean up
3. **Knowledge Files**: Pre-load frequently needed context
4. **File Selection**: Use file-picker for intelligent context

### Performance

1. **Parallel Spawning**: Use spawn_agents for independent tasks
2. **Inline for Shared State**: Use spawn_agent_inline when sharing context
3. **Model Selection**: Use faster models for simple tasks
4. **Step Limits**: Set reasonable maxAgentSteps

### Debugging

1. **Enable Tracing**: Use `--trace` flag
2. **Check Logs**: Review `.agents/traces/*.log`
3. **Inspect State**: Use `agentState` in handleSteps
4. **Test Incrementally**: Build complex agents step-by-step

## Common Issues

**Context Window Overflow**:
- Solution: Spawn more subagents, use context-pruner

**Infinite Loops**:
- Solution: Set maxAgentSteps, add explicit end conditions

**Tool Not Found**:
- Solution: Check toolNames array, verify MCP server config

**Agent Not Spawnable**:
- Solution: Add to spawnableAgents array in parent

**High Costs**:
- Solution: Use lite mode, smaller models, fewer steps

## Resources

- **Documentation**: https://codebuff.com/docs
- **Agent Store**: https://codebuff.com/store
- **Discord**: https://codebuff.com/discord
- **GitHub**: https://github.com/CodebuffAI/codebuff
- **NPM SDK**: https://www.npmjs.com/package/@codebuff/sdk
- **OpenRouter Models**: https://openrouter.ai/models


