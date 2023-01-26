import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";

import { findReactionTriggers } from "./internals/trigger_operations.ts";
import promptSurveyTrigger from "../triggers/prompt_survey_trigger.ts";
import removeSurveyTrigger from "../triggers/remove_survey_trigger.ts";

export const ConfiguratorFunctionDefinition = DefineFunction({
  callback_id: "configure",
  title: "Manage a reaction event triggers",
  source_file: "functions/configure.ts",
  input_parameters: {
    properties: {
      interactivityPointer: { type: Schema.types.string },
    },
    required: ["interactivityPointer"],
  },
  output_parameters: {
    properties: {},
    required: [],
  },
});

export default SlackFunction(
  ConfiguratorFunctionDefinition,
  async ({ inputs, client }) => {
    const { error, triggers } = await findReactionTriggers(client);
    if (error) return { error };

    // Union of all channels with active event triggers
    const channelIds = triggers != undefined
      ? [...new Set(...triggers.map((t) => t.channel_ids))] as string[]
      : [];

    // Open the modal to configure the channel list to enable this workflow
    const response = await client.views.open({
      interactivity_pointer: inputs.interactivityPointer,
      view: buildModalView(channelIds),
    });
    if (!response.ok) {
      return { error: `Failed to open configurator modal: ${response.error}` };
    }

    // Set this to continue the interaction with this user
    return { completed: false };
  },
).addViewSubmissionHandler(
  ["configure-workflow"],
  async ({ view, client }) => {
    const channelIds = view.state.values.block.channels
      .selected_channels as string[];

    const { error, triggers } = await findReactionTriggers(client);
    if (error) return { error };

    if (triggers === undefined || triggers.length === 0) {
      // Create new event triggers if none exist
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
    } else {
      // Update existing event triggers otherwise
      triggers.forEach(async (t) => {
        if (t.event_type === "slack#/events/reaction_added") {
          promptSurveyTrigger.event.channel_ids = channelIds;
          const updatePromptTrigger = await client.workflows.triggers
            .update({ trigger_id: t.id, ...promptSurveyTrigger });
          if (updatePromptTrigger.error) {
            return { error: updatePromptTrigger.error };
          }
        }

        if (t.event_type === "slack#/events/reaction_removed") {
          removeSurveyTrigger.event.channel_ids = channelIds;
          const updateRemoveTrigger = await client.workflows.triggers
            .update({ trigger_id: t.id, ...removeSurveyTrigger });
          if (updateRemoveTrigger.error) {
            return { error: updateRemoveTrigger.error };
          }
        }
      });
    }

    // Join all channels as the bot user
    channelIds.forEach(async (channel) => {
      const response = await client.conversations.join({ channel });
      if (!response.ok) {
        return {
          error: `Failed to join channel <#${channel}>: ${response.error}`,
        };
      }
    });

    // Notify of successful configuration
    const modalMessage =
      "*You're all set!*\n\nAdd a :clipboard: reaction to messages in these channels to create a survey";
    return buildModalUpdateResponse(modalMessage);
  },
).addViewClosedHandler(["configure-workflow"], () => {
  return { outputs: {}, completed: true };
});

// ---------------------------
// Internal functions
// ---------------------------

function buildModalView(channelIds: string[]) {
  return {
    "type": "modal",
    "callback_id": "configure-workflow",
    "title": {
      "type": "plain_text",
      "text": "Simple Survey",
    },
    "notify_on_close": true,
    "submit": {
      "type": "plain_text",
      "text": "Confirm",
    },
    "blocks": [
      {
        "type": "input",
        "block_id": "block",
        "element": {
          "type": "multi_channels_select",
          "placeholder": {
            "type": "plain_text",
            "text": "Select channels to add",
          },
          "initial_channels": channelIds,
          "action_id": "channels",
        },
        "label": {
          "type": "plain_text",
          "text": "Channels to survey",
        },
      },
    ],
  };
}

function buildModalUpdateResponse(modalMessage: string) {
  return {
    response_action: "update",
    view: {
      "type": "modal",
      "callback_id": "configure-workflow",
      "notify_on_close": true,
      "title": {
        "type": "plain_text",
        "text": "Simple survey",
      },
      "blocks": [
        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": modalMessage,
          },
        },
      ],
    },
  };
}