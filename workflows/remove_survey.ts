import { DefineWorkflow, Schema } from "deno-slack-sdk/mod.ts";
import { RemoveThreadTriggerFunctionDefinition } from "../functions/remove_thread_trigger.ts";

const RemoveSurveyWorkflow = DefineWorkflow({
  callback_id: "remove_survey",
  title: "Remove a survey",
  description: "Delete the threaded request for a survey",
  input_parameters: {
    properties: {
      channel_id: {
        type: Schema.slack.types.channel_id,
        description: "The channel containing the un-reacted message",
      },
      parent_ts: {
        type: Schema.slack.types.message_ts,
        description: "Message timestamp of the un-reacted message",
      },
      reactor_id: {
        type: Schema.slack.types.user_id,
        description: "User that removed the reacji",
      },
    },
    required: ["channel_id", "parent_ts", "reactor_id"],
  },
});

// Step 1: Delete prompt/survey message and link trigger
RemoveSurveyWorkflow.addStep(RemoveThreadTriggerFunctionDefinition, {
  channel_id: RemoveSurveyWorkflow.inputs.channel_id,
  parent_ts: RemoveSurveyWorkflow.inputs.parent_ts,
  reactor_id: RemoveSurveyWorkflow.inputs.reactor_id,
});

export default RemoveSurveyWorkflow;
