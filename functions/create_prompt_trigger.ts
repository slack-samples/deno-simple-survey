import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";
import CreateSurveyWorkflow from "../workflows/create_survey.ts";

export const CreatePromptTriggerFunctionDefinition = DefineFunction({
  callback_id: "create_prompt_trigger",
  title: "Create prompt trigger link",
  description: "Create a link trigger that prompts survey creation",
  source_file: "functions/create_prompt_trigger.ts",
  input_parameters: {
    properties: {
      channel_id: {
        type: Schema.slack.types.channel_id,
        description: "The channel containing the reacted message",
      },
      parent_ts: {
        type: Schema.types.string,
        description: "Message timestamp of the reacted message",
      },
      parent_url: {
        type: Schema.types.string,
        description: "Permalink of the reacted message",
      },
    },
    required: ["channel_id", "parent_ts", "parent_url"],
  },
  output_parameters: {
    properties: {
      prompt_id: {
        type: Schema.types.string,
        description: "Link trigger ID of the prompt",
      },
      prompt_url: {
        type: Schema.types.string,
        description: "Link trigger URL of the prompt",
      },
    },
    required: ["prompt_id", "prompt_url"],
  },
});

export default SlackFunction(
  CreatePromptTriggerFunctionDefinition,
  async ({ inputs, client }) => {
    const trigger = await client.workflows.triggers.create<
      typeof CreateSurveyWorkflow.definition
    >({
      type: "shortcut",
      name: "Create a survey",
      description: "Collect feedback within a thread",
      workflow: `#/workflows/${CreateSurveyWorkflow.definition.callback_id}`,
      inputs: {
        channel_id: { value: inputs.channel_id },
        parent_ts: { value: inputs.parent_ts },
        parent_url: { value: inputs.parent_url },
        reactor_id: { value: "{{data.user_id}}" },
      },
      shortcut: { button_text: "Create" },
    });

    if (!trigger.ok || !trigger.trigger.shortcut_url) {
      return {
        error: `Failed to create link trigger for the survey: ${trigger.error}`,
      };
    }

    return {
      outputs: {
        prompt_id: trigger.trigger.id,
        prompt_url: trigger.trigger.shortcut_url,
      },
    };
  },
);
