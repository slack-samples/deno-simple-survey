import { SlackAPIClient } from "deno-slack-api/types.ts";
import { EventTriggerResponseObject } from "deno-slack-api/typed-method-types/workflows/triggers/event.ts";

import PromptSurveyWorkflow from "../../workflows/prompt_survey.ts";
import RemoveSurveyWorkflow from "../../workflows/remove_survey.ts";

import promptSurveyTrigger from "../../triggers/prompt_survey_trigger.ts";
import removeSurveyTrigger from "../../triggers/remove_survey_trigger.ts";

/**
 * The /utils directory exports commonly shared or abstracted
 * functions for use in other custom functions.
 */

export type ReactionTriggerResponseObject = EventTriggerResponseObject<
  | typeof PromptSurveyWorkflow.definition
  | typeof RemoveSurveyWorkflow.definition
>;

/**
 * findReactionTriggers returns the reaction_added and reaction_removed event
 * triggers that were created for the prompt survey and remove survey workflows.
 */
export async function findReactionTriggers(
  client: SlackAPIClient,
): Promise<{ error?: string; triggers?: ReactionTriggerResponseObject[] }> {
  // Collect all existing triggers created by the app
  const allTriggers = await client.workflows.triggers.list({ is_owner: true });
  if (!allTriggers.ok) {
    return { error: allTriggers.error };
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

  return { triggers: triggersToUpdate as ReactionTriggerResponseObject[] };
}

/**
 * createReactionTriggers creates new reaction_added and reaction_removed
 * event triggers for the prompt survey and remove survey workflows.
 */
export async function createReactionTriggers(
  client: SlackAPIClient,
  channelIds: string[],
): Promise<{ error?: string }> {
  promptSurveyTrigger.event.channel_ids = channelIds;
  const createPromptTrigger = await client.workflows.triggers.create(
    promptSurveyTrigger,
  );
  if (createPromptTrigger.error) {
    return { error: createPromptTrigger.error };
  }

  removeSurveyTrigger.event.channel_ids = channelIds;
  const createRemoveTrigger = await client.workflows.triggers.create(
    removeSurveyTrigger,
  );
  if (createRemoveTrigger.error) {
    return { error: createRemoveTrigger.error };
  }

  return {};
}

/**
 * updateReactionTriggers updates the reaction_added and reaction_removed
 * event triggers for the prompt and remove survey workflows.
 */
export function updateReactionTriggers(
  client: SlackAPIClient,
  triggers: ReactionTriggerResponseObject[],
  channelIds: string[],
): { error?: string } {
  triggers.forEach(async (trigger) => {
    if (trigger.event_type === "slack#/events/reaction_added") {
      promptSurveyTrigger.event.channel_ids = channelIds;
      const updatePromptTrigger = await client.workflows.triggers
        .update({ trigger_id: trigger.id, ...promptSurveyTrigger });
      if (updatePromptTrigger.error) {
        return { error: updatePromptTrigger.error };
      }
    }

    if (trigger.event_type === "slack#/events/reaction_removed") {
      removeSurveyTrigger.event.channel_ids = channelIds;
      const updateRemoveTrigger = await client.workflows.triggers
        .update({ trigger_id: trigger.id, ...removeSurveyTrigger });
      if (updateRemoveTrigger.error) {
        return { error: updateRemoveTrigger.error };
      }
    }
  });

  return {};
}
