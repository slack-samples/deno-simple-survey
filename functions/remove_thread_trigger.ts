import { DefineFunction, SlackFunction } from "deno-slack-sdk/mod.ts";
import SurveyDatastore, {
  SurveyDatastoreSchema,
} from "../datastores/survey_datastore.ts";
import { DataMapper } from "deno-slack-data-mapper/mod.ts";

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
  output_parameters: {
    properties: {},
    required: [],
  },
});

export default SlackFunction(
  RemoveThreadTriggerFunctionDefintion,
  async ({ inputs, client }) => {
    const { channel_id, parent_ts, reactor_id } = inputs;

    const mapper = new DataMapper<typeof SurveyDatastore.definition>({
      datastore: SurveyDatastore.definition,
      client,
    });

    // Gather information associated with the survey
    const SurveyThread = await mapper.findAllBy({
      where: { and: [{ channel_id, parent_ts, reactor_id }] },
    });

    if (!SurveyThread.ok) {
      return { error: `Failed to lookup survey info: ${SurveyThread.error}` };
    }

    SurveyThread.items.forEach(async (survey) => {
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
      const deleteSurvey = await mapper.deleteById({ id: survey.id });
      if (!deleteSurvey.ok) {
        return {
          error: `Failed to delete survey metadata: ${deleteSurvey.error}`,
        };
      }
    });

    return { outputs: {} };
  },
);
