import { DefineDatastore, Schema } from "deno-slack-sdk/mod.ts";

interface DatastoreAttribute {
  type: string;
  description?: string;
  enum?: string[];
  required?: boolean;
}

export const SurveyDatastoreSchema: Record<string, DatastoreAttribute> = {
  id: {
    type: Schema.types.string,
    description: "Datastore record id of the survey",
  },
  channel_id: {
    type: Schema.slack.types.channel_id,
    description: "Channel the survey was posted to",
  },
  parent_ts: {
    type: Schema.types.string,
    description: "Timestamp of the reacji'd message",
  },
  reactor_id: {
    type: Schema.slack.types.user_id,
    description: "User that updated the reacji",
  },
  trigger_id: {
    type: Schema.types.string,
    description: "Link trigger ID of the prompt or survey",
  },
  trigger_ts: {
    type: Schema.types.string,
    description: "Timestamp of the message with the link trigger",
  },
  survey_stage: {
    type: Schema.types.string,
    description: "The current step of the survey process",
    enum: ["PROMPT", "SURVEY"],
  },
};

// Add a required property to all elements of the datastore
const RequiredSurveyDatastoreSchema: Record<string, DatastoreAttribute> = {};
for (const key in SurveyDatastoreSchema) {
  RequiredSurveyDatastoreSchema[key] = {
    ...SurveyDatastoreSchema[key],
    required: true,
  };
}

export default DefineDatastore({
  name: "survey_datastore",
  primary_key: "id",
  attributes: RequiredSurveyDatastoreSchema,
});
