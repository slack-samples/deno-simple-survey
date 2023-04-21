import { Trigger } from "deno-slack-sdk/types.ts";
import RemoveSurveyWorkflow from "../../workflows/remove_survey.ts";

const removeSurveyTrigger: Trigger<typeof RemoveSurveyWorkflow.definition> = {
  type: "event",
  name: "Survey reacji removed",
  description: "Remove a survey from thread by removing the reacji",
  workflow: `#/workflows/${RemoveSurveyWorkflow.definition.callback_id}`,
  event: {
    event_type: "slack#/events/reaction_removed",
    channel_ids: [""], // Channel IDs are added by the configurator workflow
    filter: {
      version: 1,
      root: {
        operator: "AND",
        inputs: [{
          statement: "{{data.reaction}} == clipboard",
        }, {
          operator: "OR",
          inputs: [{
            // User IDs are configured by the configurator workflow
            statement: "{{data.user_id}} == USLACKBOT",
          }],
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

export default removeSurveyTrigger;
