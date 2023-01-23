import { Manifest } from "deno-slack-sdk/mod.ts";

import GoogleProvider from "./external_auth/google_provider.ts";
import SurveyDatastore from "./datastores/survey_datastore.ts";

import AnswerSurveyWorkflow from "./workflows/answer_survey.ts";
import CreateSurveyWorkflow from "./workflows/create_survey.ts";
import RemoveSurveyWorkflow from "./workflows/remove_survey.ts";
import PromptSurveyWorkflow from "./workflows/prompt_survey.ts";

export default Manifest({
  name: "Simple Survey",
  description: "Gather input and ideas at the press of a reacji",
  icon: "assets/default_new_app_icon.png",
  externalAuthProviders: [GoogleProvider],
  datastores: [SurveyDatastore],
  workflows: [
    AnswerSurveyWorkflow,
    CreateSurveyWorkflow,
    PromptSurveyWorkflow,
    RemoveSurveyWorkflow,
  ],
  outgoingDomains: ["sheets.googleapis.com"],
  botScopes: [
    "commands",
    "chat:write",
    "chat:write.public",
    "reactions:read",
    "triggers:write",
    "datastore:read",
    "datastore:write",
  ],
});

// PROMPT: (after add emoji)
// 1. Create new link trigger ->(prompt_id, prompt_url) for CreateSurveyWorkflow with (parent_ts) values
// 2. Respond ephemeral in thread (message, prompt_url)->(prompt_ts)
// 3. Save thread info (channel_id, parent_ts, user_id, prompt_id, prompt_ts)

// CREATE
// 1. Create new spreadsheet (token_id)
// 2. Create new link trigger with (spreadsheet_id, token_id)
//  . Delete prompt: message (channel_id, prompt_ts) and trigger (prompt_id)
//  . Update thread info (channel_id, parent_ts, user_id)????
// 3. Send "request for feedback" message to (channel_id, parent_ts)
// 4. Ephemeral spreadsheet link (spreadsheet_url)
// 5. Save

// ANSWER
// 1. OpenForm to collect responses (impression, comments)
// 2. Save response:
//    a. Collect (token_id) from workflow input (NOT Schema.slack.types.oauth2, YES trigger value)
//    b. Append (impression, comments) to (spreadsheet_id)

// REMOVE EMOJI - must match (channel_id, parent_ts, user_id), catch "not found" errors!
//  . Lookup thread info      ^
//  . Delete prompt: message (channel_id, prompt_ts) and trigger (prompt_id)
//  . Delete survey: message (channel_id, survey_ts) and trigger (survey_id)
