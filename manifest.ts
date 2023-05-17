import { Manifest } from "deno-slack-sdk/mod.ts";

import GoogleProvider from "./external_auth/google_provider.ts";
import SurveyDatastore from "./datastores/survey_datastore.ts";

import ConfiguratorWorkflow from "./workflows/configurator.ts";
import MaintenanceJobWorkflow from "./workflows/maintenance_job.ts";

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
    ConfiguratorWorkflow,
    MaintenanceJobWorkflow,
    AnswerSurveyWorkflow,
    CreateSurveyWorkflow,
    PromptSurveyWorkflow,
    RemoveSurveyWorkflow,
  ],
  outgoingDomains: ["sheets.googleapis.com", "raw.githubusercontent.com"],
  botScopes: [
    "channels:join",
    "chat:write",
    "chat:write.public",
    "commands",
    "datastore:read",
    "datastore:write",
    "reactions:read",
    "triggers:read",
    "triggers:write",
  ],
});
