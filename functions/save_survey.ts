import { DefineFunction, SlackFunction } from "deno-slack-sdk/mod.ts";
import SurveyDatastore, {
  SurveyDatastoreSchema,
} from "../datastores/survey_datastore.ts";

export const SaveSurveyFunctionDefinition = DefineFunction({
  callback_id: "save_survey",
  title: "Save survey metadata",
  description: "Store information about the created survey",
  source_file: "functions/save_survey.ts",
  input_parameters: {
    properties: SurveyDatastoreSchema,
    required: [
      "channel_id",
      "parent_ts",
      "reactor_id",
      "trigger_id",
      "trigger_ts",
      "survey_stage",
    ],
  },
  output_parameters: {
    properties: {},
    required: [],
  },
});

export default SlackFunction(
  SaveSurveyFunctionDefinition,
  async ({ inputs, client }) => {
    const uuid = crypto.randomUUID();

    // Create or update the survey metadata
    const putResponse = await client.apps.datastore.put<
      typeof SurveyDatastore.definition
    >({
      datastore: "survey_datastore",
      item: { id: uuid, ...inputs }, // `uuid` is overwritten by the optional `inputs.id`
    });

    if (!putResponse.ok) {
      return { error: `Failed to save survey info: ${putResponse.error}` };
    }
    return { outputs: {} };
  },
);
