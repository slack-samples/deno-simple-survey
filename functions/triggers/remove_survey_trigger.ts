import { Trigger } from "deno-slack-sdk/types.ts";
import {
  TriggerContextData,
  TriggerEventTypes,
  TriggerTypes,
} from "deno-slack-api/mod.ts";
import RemoveSurveyWorkflow from "../../workflows/remove_survey.ts";

const removeSurveyTrigger: Trigger<typeof RemoveSurveyWorkflow.definition> = {
  type: TriggerTypes.Event,
  name: "Survey reacji removed",
  description: "Remove a survey from thread by removing the reacji",
  workflow: `#/workflows/${RemoveSurveyWorkflow.definition.callback_id}`,
  event: {
    event_type: TriggerEventTypes.ReactionRemoved,
    channel_ids: [""], // Channel IDs are added by the configurator workflow
    filter: {
      version: 1,
      root: {
        statement:
          `${TriggerContextData.Event.ReactionRemoved.reaction} == clipboard`,
      },
    },
  },
  inputs: {
    channel_id: { value: TriggerContextData.Event.ReactionRemoved.channel_id },
    parent_ts: { value: TriggerContextData.Event.ReactionRemoved.message_ts },
    reactor_id: { value: TriggerContextData.Event.ReactionRemoved.user_id },
  },
};

export default removeSurveyTrigger;
