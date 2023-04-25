import { SlackAPIClient } from "deno-slack-sdk/types.ts";
import { EventTriggerResponseObject } from "deno-slack-api/typed-method-types/workflows/triggers/event.ts";

import PromptSurveyWorkflow from "../../workflows/prompt_survey.ts";
import RemoveSurveyWorkflow from "../../workflows/remove_survey.ts";

import promptSurveyTrigger from "../triggers/prompt_survey_trigger.ts";
import removeSurveyTrigger from "../triggers/remove_survey_trigger.ts";
import { TriggerOperationError } from "./errors.ts";

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
): Promise<ReactionTriggerResponseObject[]> {
  // Collect all existing triggers created by the app
  const allTriggers = await client.workflows.triggers.list({ is_owner: true });
  if (!allTriggers.ok) {
    throw new TriggerOperationError(
      allTriggers.error,
      `Failed to list all triggers!`,
    );
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

  return triggersToUpdate as ReactionTriggerResponseObject[];
}

/**
 * createReactionTriggers creates new reaction_added and reaction_removed
 * event triggers for the prompt survey and remove survey workflows.
 */
export async function createReactionTriggers(
  client: SlackAPIClient,
  filters: { channelIds: string[]; reactorIds: string[] },
) {
  const { channelIds, reactorIds } = filters;
  const reactorFilter = reactorIds.map((id) => {
    return { statement: `{{data.user_id}} == ${id}` };
  });

  promptSurveyTrigger.event.channel_ids = channelIds;
  promptSurveyTrigger.event.filter.root.inputs[1].inputs = reactorFilter;
  const createPromptTrigger = await client.workflows.triggers.create(
    promptSurveyTrigger,
  );
  if (!createPromptTrigger.ok) {
    throw new TriggerOperationError(
      createPromptTrigger.error,
      `Failed to create createPromptTrigger: ${removeSurveyTrigger}`,
    );
  }

  removeSurveyTrigger.event.channel_ids = channelIds;
  removeSurveyTrigger.event.filter.root.inputs[1].inputs = reactorFilter;
  const createRemoveTrigger = await client.workflows.triggers.create(
    removeSurveyTrigger,
  );
  if (!createRemoveTrigger.ok) {
    throw new TriggerOperationError(
      createRemoveTrigger.error,
      `Failed to create removeSurveyTrigger: ${removeSurveyTrigger}`,
    );
  }
}

/**
 * updateReactionTriggers updates the reaction_added and reaction_removed
 * event triggers for the prompt and remove survey workflows.
 */
export function updateReactionTriggers(
  client: SlackAPIClient,
  triggers: ReactionTriggerResponseObject[],
  filters: { channelIds: string[]; reactorIds: string[] },
) {
  const { channelIds, reactorIds } = filters;
  const reactorFilter = reactorIds.map((id) => {
    return { statement: `{{data.user_id}} == ${id}` };
  });

  triggers.forEach(async (trigger) => {
    if (trigger.event_type === "slack#/events/reaction_added") {
      promptSurveyTrigger.event.channel_ids = channelIds;
      promptSurveyTrigger.event.filter.root.inputs[1].inputs = reactorFilter;
      const updatePromptTrigger = await client.workflows.triggers
        .update({ trigger_id: trigger.id, ...promptSurveyTrigger });
      if (!updatePromptTrigger.ok) {
        throw new TriggerOperationError(
          updatePromptTrigger.error,
          `failed to update PromptTrigger: ${trigger.id}`,
        );
      }
    }

    removeSurveyTrigger.event.event_type;
    if (trigger.event_type === removeSurveyTrigger.event.event_type) {
      removeSurveyTrigger.event.channel_ids = channelIds;
      removeSurveyTrigger.event.filter.root.inputs[1].inputs = reactorFilter;
      const updateRemoveTrigger = await client.workflows.triggers
        .update({ trigger_id: trigger.id, ...removeSurveyTrigger });
      if (!updateRemoveTrigger.ok) {
        throw new TriggerOperationError(
          updateRemoveTrigger.error,
          `failed to update RemoveTrigger: ${trigger.id}`,
        );
      }
    }
  });
}

/**
 * getReactionTriggerChannelIds returns all channel_ids
 */
export function getReactionTriggerChannelIds(
  triggers: ReactionTriggerResponseObject[],
): Set<string> {
  return new Set(...triggers.map((t) => t.channel_ids));
}

/**
 * getReactionTriggerSurveyorIds returns all user_ids filtered by
 * active reaction event triggers
 */
export function getReactionTriggerSurveyorIds(
  triggers: ReactionTriggerResponseObject[],
): Set<string> {
  return new Set(
    triggers.flatMap((t) => t.filter.root.inputs[1].inputs)
      .map((filter) => filter.statement.split(" ").pop()),
  );
}
