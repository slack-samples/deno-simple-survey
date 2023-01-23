import { DefineWorkflow, Schema } from "deno-slack-sdk/mod.ts";
import { RemoveThreadTriggerFunctionDefintion } from "../functions/remove_thread_trigger.ts";

const RemoveSurveyWorkflow = DefineWorkflow({
  callback_id: "remove_survey",
  title: "Remove a survey",
  description: "Delete the threaded request for a survey",
  input_parameters: {
    properties: {
      channel_id: { type: Schema.slack.types.channel_id },
      message_ts: { type: Schema.types.string },
      reactor_id: { type: Schema.slack.types.user_id },
    },
    required: ["channel_id", "message_ts", "reactor_id"],
  },
});

// Step 1: Delete prompt/survey message and link trigger
RemoveSurveyWorkflow.addStep(RemoveThreadTriggerFunctionDefintion, {
  channel_id: RemoveSurveyWorkflow.inputs.channel_id,
  parent_ts: RemoveSurveyWorkflow.inputs.message_ts,
  reactor_id: RemoveSurveyWorkflow.inputs.reactor_id,
});

export default RemoveSurveyWorkflow;
