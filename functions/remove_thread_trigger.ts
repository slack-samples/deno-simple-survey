import { DefineFunction, SlackFunction } from "deno-slack-sdk/mod.ts";
import SurveyDatastore, {
  SurveyDatastoreSchema,
} from "../datastores/survey_datastore.ts";

export const RemoveThreadTriggerFunctionDefintion = DefineFunction({
  callback_id: "remove_thread_trigger",
  title: "Remove thread trigger",
  description: "Delete prompt and survey data for a message",
  source_file: "functions/remove_thread_trigger.ts",
  input_parameters: {
    properties: SurveyDatastoreSchema,
    required: [
      "channel_id",
      "parent_ts",
      "reactor_id",
    ],
  },
  output_parameters: { properties: {}, required: [] },
});

export default SlackFunction(
  RemoveThreadTriggerFunctionDefintion,
  async ({ inputs, client }) => {
    const { channel_id, parent_ts, reactor_id } = inputs;

    // Gather information associated with the survey
    const SurveyResponse = await client.apps.datastore.query<
      typeof SurveyDatastore.definition
    >({
      datastore: SurveyDatastore.name,
      expression:
        "#channel_id = :channel_id AND #parent_ts = :parent_ts AND #reactor_id = :reactor_id",
      expression_attributes: {
        "#channel_id": "channel_id",
        "#parent_ts": "parent_ts",
        "#reactor_id": "reactor_id",
      },
      expression_values: {
        ":channel_id": channel_id,
        ":parent_ts": parent_ts,
        ":reactor_id": reactor_id,
      },
    });

    if (!SurveyResponse.ok) {
      return { error: `Failed to lookup survey info: ${SurveyResponse.error}` };
    }

    SurveyResponse.items.forEach(async (survey) => {
      // Delete message containing prompt link trigger
      if (survey.survey_stage === "PROMPT") {
        const deletePromptMessage = await client.chat.delete({
          channel: reactor_id,
          ts: survey.trigger_ts,
        });

        if (!deletePromptMessage.ok) {
          return {
            error:
              `Failed to delete direct message with prompt: ${deletePromptMessage.error}`,
          };
        }
      }

      // Delete message containing survey link trigger
      if (survey.survey_stage === "SURVEY") {
        const deleteSurveyMessage = await client.chat.delete({
          channel: channel_id,
          ts: survey.trigger_ts,
        });

        if (!deleteSurveyMessage.ok) {
          return {
            error:
              `Failed to delete message with survey: ${deleteSurveyMessage.error}`,
          };
        }
      }

      // Delete link trigger
      const deleteTrigger = await client.workflows.triggers.delete({
        trigger_id: survey.trigger_id,
      });

      if (!deleteTrigger.ok) {
        return {
          error: `Failed to delete link trigger: ${deleteTrigger.error}`,
        };
      }

      // Remove datastore entry for survey metadata
      const deleteSurvey = await client.apps.datastore.delete({
        datastore: SurveyDatastore.name,
        id: survey.id,
      });

      if (!deleteSurvey.ok) {
        return {
          error: `Failed to delete survey metadata: ${deleteSurvey.error}`,
        };
      }
    });

    return { outputs: {} };
  },
);
