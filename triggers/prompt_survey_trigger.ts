import { Trigger } from "deno-slack-sdk/types.ts";
import PromptSurveyWorkflow from "../workflows/prompt_survey.ts";

/**
 * Event triggers automatically invoke a workflow when a specific event
 * happens in any specified channels. Filters can be used in combination
 * for limiting which events begin a workflow.
 * https://api.slack.com/future/triggers/event
 */
const promptSurveyTrigger: Trigger<typeof PromptSurveyWorkflow.definition> = {
  type: "event",
  name: "Survey reacji added",
  description: "Initiate survey creation by adding a clipboard reacji",
  workflow: `#/workflows/${PromptSurveyWorkflow.definition.callback_id}`,
  event: {
    event_type: "slack#/events/reaction_added",
    channel_ids: [""], // Channel IDs are added by the configurator workflow
    filter: {
      version: 1,
      root: {
        operator: "AND",
        inputs: [{
          statement: "{{data.reaction}} == clipboard",
        }, {
          // User IDs are configured by the configurator workflow
          operator: "OR",
          inputs: [{ statement: "{{data.user_id}} == USLACKBOT" }],
        }],
      },
    },
  },
  inputs: {
    channel_id: { value: "{{data.channel_id}}" },
    parent_ts: { value: "{{data.message_ts}}" },
    reactor_id: { value: "{{data.user_id}}" },
  },
};

export default promptSurveyTrigger;
