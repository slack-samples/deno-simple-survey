import { DefineWorkflow, Schema } from "deno-slack-sdk/mod.ts";
import { SaveResponseFunctionDefinition } from "../functions/save_response.ts";

/**
 * A workflow is a set of steps that are executed in order.
 * Each step in a workflow is a function.
 * https://api.slack.com/automation/workflows
 *
 * This workflow uses interactivity. Learn more at:
 * https://api.slack.com/automation/forms#add-interactivity
 */
const AnswerSurveyWorkflow = DefineWorkflow({
  callback_id: "answer_survey",
  title: "Respond to a survey",
  description: "Add comments and feedback to a survey",
  input_parameters: {
    properties: {
      interactivity: { type: Schema.slack.types.interactivity },
      google_spreadsheet_id: {
        type: Schema.types.string,
        description: "Spreadsheet ID for storing survey results",
      },
      reactor_access_token_id: {
        type: Schema.types.string,
        description: "External authentication access token for the reactor",
      },
    },
    required: [
      "interactivity",
      "google_spreadsheet_id",
      "reactor_access_token_id",
    ],
  },
});

/**
 * For collecting input from users, we recommend the
 * built-in OpenForm function as a first step.
 * https://api.slack.com/reference/functions/open_form
 */

// Step 1: Collect feedback in a form
const response = AnswerSurveyWorkflow.addStep(
  Schema.slack.functions.OpenForm,
  {
    title: "Survey your thoughts",
    description: "What do you think about the topic of this message?",
    interactivity: AnswerSurveyWorkflow.inputs.interactivity,
    submit_label: "Share",
    fields: {
      elements: [{
        name: "impression",
        title: "Overall impression",
        type: Schema.types.string,
        enum: [
          "Looks great to me!",
          "On the right track",
          "Not sure about this..",
        ],
      }, {
        name: "comments",
        title: "Comments",
        type: Schema.types.string,
        description: "Any additional ideas to share?",
        long: true,
      }],
      required: ["impression"],
    },
  },
);

// Step 2: Append responses to the spreadsheet
AnswerSurveyWorkflow.addStep(SaveResponseFunctionDefinition, {
  reactor_access_token_id: AnswerSurveyWorkflow.inputs.reactor_access_token_id,
  google_spreadsheet_id: AnswerSurveyWorkflow.inputs.google_spreadsheet_id,
  impression: response.outputs.fields.impression,
  comments: response.outputs.fields.comments,
});

export default AnswerSurveyWorkflow;
