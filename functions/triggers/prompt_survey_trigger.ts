import { Trigger } from "deno-slack-sdk/types.ts";
import {
  TriggerContextData,
  TriggerEventTypes,
  TriggerTypes,
} from "deno-slack-api/mod.ts";
import PromptSurveyWorkflow from "../../workflows/prompt_survey.ts";

/**
 * Event triggers automatically invoke a workflow when a specific event
 * happens in any specified channels. Filters can be used in combination
 * for limiting which events begin a workflow.
 * https://api.slack.com/automation/triggers/event
 */
const promptSurveyTrigger: Trigger<typeof PromptSurveyWorkflow.definition> = {
  type: TriggerTypes.Event,
  name: "Survey reacji added",
  description: "Initiate survey creation by adding a clipboard reacji",
  workflow: `#/workflows/${PromptSurveyWorkflow.definition.callback_id}`,
  event: {
    event_type: TriggerEventTypes.ReactionAdded,
    channel_ids: [""], // Channel IDs are added by the configurator workflow
    filter: {
      version: 1,
      root: {
        statement:
          `${TriggerContextData.Event.ReactionAdded.reaction} == clipboard`,
      },
    },
  },
  inputs: {
    channel_id: { value: TriggerContextData.Event.ReactionAdded.channel_id },
    parent_ts: { value: TriggerContextData.Event.ReactionAdded.message_ts },
    reactor_id: { value: TriggerContextData.Event.ReactionAdded.user_id },
  },
};

export default promptSurveyTrigger;
