import { DefineFunction, SlackFunction } from "deno-slack-sdk/mod.ts";
import SurveyDatastore, {
  SurveyDatastoreSchema,
} from "../datastores/survey_datastore.ts";
import { DataMapper } from "deno-slack-data-mapper/mod.ts";

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

    const mapper = new DataMapper<typeof SurveyDatastore.definition>({
      datastore: SurveyDatastore.definition,
      client,
    });

    const creation = await mapper.save({ attributes: { id: uuid, ...inputs } });
    if (!creation.ok) {
      return { error: `Failed to save survey info: ${creation.error}` };
    }
    return { outputs: {} };
  },
);
