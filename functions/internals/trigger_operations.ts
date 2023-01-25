import { SlackAPIClient } from "deno-slack-api/types.ts";

import PromptSurveyWorkflow from "../../workflows/prompt_survey.ts";
import RemoveSurveyWorkflow from "../../workflows/remove_survey.ts";

export async function findReactionTriggers(client: SlackAPIClient) {
  // Collect all existing triggers created by the app
  const allTriggers = await client.workflows.triggers.list({ is_owner: true });
  if (!allTriggers.ok) {
    return {
      error: `Failed to collect trigger information: ${allTriggers.error}`,
    };
  }

  // Find reaction event triggers to update
  const triggersToUpdate = allTriggers.triggers.filter((trigger) =>
    (
      trigger.workflow.callback_id ===
        PromptSurveyWorkflow.definition.callback_id &&
      trigger.event_type === "slack#/events/reaction_added"
    ) || (
      trigger.workflow.callback_id ===
        RemoveSurveyWorkflow.definition.callback_id &&
      trigger.event_type === "slack#/events/reaction_removed"
    )
  );

  return { triggers: triggersToUpdate };
}
