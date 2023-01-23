import { DefineWorkflow, Schema } from "deno-slack-sdk/mod.ts";
import { CreatePromptTriggerFunctionDefinition } from "../functions/create_prompt_trigger.ts";
import { GetMessageLinkFunctionDefinition } from "../functions/get_message_link.ts";
import { SaveSurveyFunctionDefinition } from "../functions/save_survey.ts";

const PromptSurveyWorkflow = DefineWorkflow({
  callback_id: "prompt_survey",
  title: "Prompt survey creation",
  description: "Ask if the reacting user wants to create a new survey",
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
      reactor_id: {
        type: Schema.slack.types.user_id,
        description: "User that added the reacji",
      },
    },
    required: ["channel_id", "parent_ts", "reactor_id"],
  },
});

// Step 1: Collect the URL of the reacted message
const ParentPermalink = PromptSurveyWorkflow.addStep(
  GetMessageLinkFunctionDefinition,
  {
    channel_id: PromptSurveyWorkflow.inputs.channel_id,
    parent_ts: PromptSurveyWorkflow.inputs.parent_ts,
  },
);

// Step 2: Create a link trigger for the survey prompt
const PromptTrigger = PromptSurveyWorkflow.addStep(
  CreatePromptTriggerFunctionDefinition,
  {
    channel_id: PromptSurveyWorkflow.inputs.channel_id,
    parent_ts: PromptSurveyWorkflow.inputs.parent_ts,
    parent_url: ParentPermalink.outputs.permalink,
  },
);

// Step 3: Prompt the reactor for survey creation
const PromptMessage = PromptSurveyWorkflow.addStep(
  Schema.slack.functions.SendDm,
  {
    user_id: PromptSurveyWorkflow.inputs.reactor_id,
    message:
      `Would you like to <${PromptTrigger.outputs.prompt_url}|create a new survey> for <${ParentPermalink.outputs.permalink}|this message>?`,
  },
);

// Step 4: Store reaction and prompt metadata
PromptSurveyWorkflow.addStep(SaveSurveyFunctionDefinition, {
  channel_id: PromptSurveyWorkflow.inputs.channel_id,
  parent_ts: PromptSurveyWorkflow.inputs.parent_ts,
  reactor_id: PromptSurveyWorkflow.inputs.reactor_id,
  trigger_id: PromptTrigger.outputs.prompt_id,
  trigger_ts: PromptMessage.outputs.message_ts,
  survey_stage: "PROMPT",
});

export default PromptSurveyWorkflow;
