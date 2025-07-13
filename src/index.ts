#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import chalk from 'chalk';

import { EnhancedChainOfThoughtServer } from './server.js';
import {
  CHAIN_OF_THOUGHT_TOOL,
  CHAIN_SUMMARY_TOOL,
  LOAD_TEMPLATE_TOOL,
  RESET_CHAIN_TOOL
} from './tools.js';

// Server setup
const server = new Server(
  {
    name: "enhanced-cot-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

const cotServer = new EnhancedChainOfThoughtServer();

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [CHAIN_OF_THOUGHT_TOOL, CHAIN_SUMMARY_TOOL, LOAD_TEMPLATE_TOOL, RESET_CHAIN_TOOL],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  switch (request.params.name) {
    case "chainofthought":
      return cotServer.processThought(request.params.arguments);
    
    case "chainsummary":
      return cotServer.getChainSummary();
    
    case "loadtemplate":
      return cotServer.loadTemplate(
        (request.params.arguments as any).templateName
      );
    
    case "resetchain":
      return cotServer.reset();
    
    default:
      return {
        content: [{
          type: "text",
          text: `Unknown tool: ${request.params.name}`
        }],
        isError: true
      };
  }
});

async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(chalk.bold.green("🧠 Enhanced Chain of Thought MCP Server running"));
  console.error(chalk.gray("Modes: draft (≤5 words), concise (≤15 words), standard, auto"));
  console.error(chalk.gray("Set DISABLE_COT_LOGGING=true to disable thought visualization"));
}

runServer().catch((error) => {
  console.error("Fatal error running server:", error);
  process.exit(1);
});