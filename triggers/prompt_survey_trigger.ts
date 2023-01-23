import { Trigger } from "deno-slack-api/types.ts";
import PromptSurveyWorkflow from "../workflows/prompt_survey.ts";

const createSurveyTrigger: Trigger<typeof PromptSurveyWorkflow.definition> = {
  type: "event",
  name: "Survey reacji added",
  description: "Initiate survey creation by adding a clipboard reacji",
  workflow: `#/workflows/${PromptSurveyWorkflow.definition.callback_id}`,
  event: {
    event_type: "slack#/events/reaction_added",
    channel_ids: ["C04KQTP20UE"],
    filter: {
      version: 1,
      root: { statement: "{{data.reaction}} == clipboard" },
    },
  },
  inputs: {
    channel_id: { value: "{{data.channel_id}}" },
    parent_ts: { value: "{{data.message_ts}}" },
    reactor_id: { value: "{{data.user_id}}" },
  },
};

export default createSurveyTrigger;
