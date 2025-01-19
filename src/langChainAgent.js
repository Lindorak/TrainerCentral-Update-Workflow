// langChainAgent.js

import { ChatOpenAI } from "langchain/chat_models/openai";
import { Tool } from "langchain/tools";
import { initializeAgentExecutor } from "langchain/agents";

// Import your custom trainerCentralRequest function
import { trainerCentralRequest } from "./trainercentral.js";

/**
 * Example tool to wrap TrainerCentral requests inside a LangChain Tool interface.
 * Tools allow the agent to call external functions with arguments specified in plain text.
 */
class TrainerCentralTool extends Tool {
  name = "trainer-central-tool";
  description = `
    A tool for interacting with the TrainerCentral API.
    Input should be a JSON string with "path", "method" (GET, POST, PUT, etc.), and optionally "body" as an object.
    The output is the JSON response from TrainerCentral.
  `;

  constructor(env) {
    super();
    this.env = env;
  }

  async _call(arg) {
    // The agent will pass arguments as a string
    // e.g. '{"path": "/12345/courses.json", "method": "GET", "body": null}'
    let parsed;
    try {
      parsed = JSON.parse(arg);
    } catch (err) {
      return `Error: invalid JSON input. Received: ${arg}`;
    }

    const { path, method, body } = parsed;

    // Send request to TrainerCentral
    const response = await trainerCentralRequest(path, method, body, this.env);
    const jsonData = await response.json();

    // Return the JSON data as a string
    return JSON.stringify(jsonData);
  }
}

/**
 * Main function to run the LangChain agent.
 * - model: ChatOpenAI (OpenAI’s ChatGPT model).
 * - tools: an array of Tools the agent can use (TrainerCentralTool, etc.).
 * - agent type: "zero-shot-react-description" is a common choice for text-based tool calls.
 */
export async function runLangChainAgent(userMessage, env) {
  // Initialize the ChatOpenAI model with your environment’s key
  const model = new ChatOpenAI({
    openAIApiKey: env.OPENAI_API_KEY,
    temperature: 0  // For more deterministic responses
  });

  // Define Tools that the agent can call
  const tools = [
    new TrainerCentralTool(env),
    // You could add more Tools here if needed
  ];

  // Build an agent executor with these tools
  const executor = await initializeAgentExecutor(
    tools,
    model,
    "zero-shot-react-description"
  );

  // The agent tries to interpret userMessage and potentially call Tools to solve it
  const result = await executor.call({ input: userMessage });
  
  // result.output contains the agent’s final answer
  return result.output;
}
