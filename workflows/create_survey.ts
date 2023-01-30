import { DefineWorkflow, Schema } from "deno-slack-sdk/mod.ts";

import { CreateGoogleSheetFunctionDefinition } from "../functions/create_google_sheet.ts";
import { CreateTriggerFunctionDefinition } from "../functions/create_survey_trigger.ts";
import { SaveSurveyFunctionDefinition } from "../functions/save_survey.ts";
import { RemoveThreadTriggerFunctionDefintion } from "../functions/remove_thread_trigger.ts";

const CreateSurveyWorkflow = DefineWorkflow({
  callback_id: "create_survey",
  title: "Create a survey",
  description: "Add a request for feedback to a message",
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
        description: "Permalink to the reacted message",
      },
      reactor_id: {
        type: Schema.slack.types.user_id,
        description: "User that added the reacji",
      },
    },
    required: ["channel_id", "parent_ts", "parent_url", "reactor_id"],
  },
});

// Step 1: Create a new Google spreadsheet
const sheet = CreateSurveyWorkflow.addStep(
  CreateGoogleSheetFunctionDefinition,
  {
    google_access_token_id: { credential_source: "END_USER" },
    title: CreateSurveyWorkflow.inputs.parent_ts,
  },
);

// Step 2: Create a link trigger for the survey
const trigger = CreateSurveyWorkflow.addStep(CreateTriggerFunctionDefinition, {
  google_spreadsheet_id: sheet.outputs.google_spreadsheet_id,
  reactor_access_token_id: sheet.outputs.reactor_access_token_id,
});

// Step 3: Send the survey into the reacted thread
const message = CreateSurveyWorkflow.addStep(
  Schema.slack.functions.SendMessage,
  {
    channel_id: CreateSurveyWorkflow.inputs.channel_id,
    thread_ts: CreateSurveyWorkflow.inputs.parent_ts,
    message:
      `Your feedback is requested – <${trigger.outputs.trigger_url}|survey now>!`,
  },
);

// Step 4: Delete the prompt message and metadata
CreateSurveyWorkflow.addStep(RemoveThreadTriggerFunctionDefintion, {
  channel_id: CreateSurveyWorkflow.inputs.channel_id,
  parent_ts: CreateSurveyWorkflow.inputs.parent_ts,
  reactor_id: CreateSurveyWorkflow.inputs.reactor_id,
});

// Step 5: Notify the reactor of the survey spreadsheet
CreateSurveyWorkflow.addStep(Schema.slack.functions.SendDm, {
  user_id: CreateSurveyWorkflow.inputs.reactor_id,
  message:
    `Feedback for <${CreateSurveyWorkflow.inputs.parent_url}|this message> is being <${sheet.outputs.google_spreadsheet_url}|collected here>!`,
});

// Step 6: Store new survey metadata
CreateSurveyWorkflow.addStep(SaveSurveyFunctionDefinition, {
  channel_id: CreateSurveyWorkflow.inputs.channel_id,
  parent_ts: CreateSurveyWorkflow.inputs.parent_ts,
  reactor_id: CreateSurveyWorkflow.inputs.reactor_id,
  trigger_ts: message.outputs.message_ts,
  trigger_id: trigger.outputs.trigger_id,
  survey_stage: "SURVEY",
});

export default CreateSurveyWorkflow;
