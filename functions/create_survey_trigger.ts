import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";
import AnswerSurveyWorkflow from "../workflows/answer_survey.ts";

export const CreateTriggerFunctionDefinition = DefineFunction({
  callback_id: "create_trigger",
  title: "Create survey link",
  description: "Create a link trigger for a survey",
  source_file: "functions/create_survey_trigger.ts",
  input_parameters: {
    properties: {
      google_spreadsheet_id: {
        type: Schema.types.string,
        description: "Spreadsheet ID to store survey results",
      },
      reactor_access_token_id: {
        type: Schema.types.string,
        description: "The Google access token ID of the reactor",
      },
    },
    required: ["google_spreadsheet_id", "reactor_access_token_id"],
  },
  output_parameters: {
    properties: {
      trigger_id: {
        type: Schema.types.string,
        description: "Link trigger ID",
      },
      trigger_url: {
        type: Schema.types.string,
        description: "Link trigger URL",
      },
    },
    required: ["trigger_id", "trigger_url"],
  },
});

export default SlackFunction(
  CreateTriggerFunctionDefinition,
  async ({ inputs, client }) => {
    const { google_spreadsheet_id, reactor_access_token_id } = inputs;

    const trigger = await client.workflows.triggers.create<
      typeof AnswerSurveyWorkflow.definition
    >({
      type: "shortcut",
      name: "Survey your thoughts",
      description: "Share your thoughts about this post",
      workflow: `#/workflows/${AnswerSurveyWorkflow.definition.callback_id}`,
      inputs: {
        interactivity: { value: "{{data.interactivity}}" },
        google_spreadsheet_id: { value: google_spreadsheet_id },
        reactor_access_token_id: { value: reactor_access_token_id },
      },
    });

    if (!trigger.ok || !trigger.trigger.shortcut_url) {
      return {
        error: `Failed to create link trigger for the survey: ${trigger.error}`,
      };
    }

    return {
      outputs: {
        trigger_id: trigger.trigger.id,
        trigger_url: trigger.trigger.shortcut_url,
      },
    };
  },
);
