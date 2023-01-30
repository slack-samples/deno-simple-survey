import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";

import {
  createReactionTriggers,
  findReactionTriggers,
  updateReactionTriggers,
} from "./utils/trigger_operations.ts";

/**
 * Custom funcitons are the building blocks of workflows:
 * accepting input, performing calculations, handling view events,
 * and providing output.
 * https://api.slack.com/future/functions/custom
 */

export const ConfigureChannelsFunctionDefinition = DefineFunction({
  callback_id: "configure_channels",
  title: "Manage channels for the reaction event triggers",
  source_file: "functions/configure_channels.ts",
  input_parameters: {
    properties: {
      interactivityPointer: { type: Schema.types.string },
    },
    required: ["interactivityPointer"],
  },
  output_parameters: { properties: {}, required: [] },
});

export default SlackFunction(
  ConfigureChannelsFunctionDefinition,
  async ({ inputs, client }) => {
    const { error, triggers } = await findReactionTriggers(client);
    if (error) return { error };

    // Union of all channels with active event triggers
    const channelIds = triggers != undefined
      ? [...new Set(...triggers.map((t) => t.channel_ids))] as string[]
      : [];

    // Open the modal to configure the channel list for the workflows
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
).addViewSubmissionHandler(["configure-workflow"], async ({ view, client }) => {
  /**
   * Modal view events can be handled from functions to create
   * interactive experiences with multiple views.
   * https://api.slack.com/future/view-events
   */

  const channelIds = view.state.values.block.channels
    .selected_channels as string[];

  const { error, triggers } = await findReactionTriggers(client);
  if (error) {
    return { error: `Failed to collect trigger information: ${error}` };
  }

  // Create new event reaction triggers or update existing ones
  if (triggers === undefined || triggers.length === 0) {
    const { error } = await createReactionTriggers(client, channelIds);
    if (error) {
      return { error: `Failed to create new event triggers: ${error}` };
    }
  } else {
    const { error } = updateReactionTriggers(client, triggers, channelIds);
    if (error) {
      return { error: `Failed to update existing event triggers: ${error}` };
    }
  }

  // Join all selected channels as the bot user
  channelIds.forEach(async (channel) => {
    const response = await client.conversations.join({ channel });
    if (!response.ok) {
      return {
        error: `Failed to join channel <#${channel}>: ${response.error}`,
      };
    }
  });

  // Update the modal with a notice of successful configuration
  const modalMessage =
    "*You're all set!*\n\nAdd a :clipboard: reaction to messages in these channels to create a survey";
  return buildModalUpdateResponse(modalMessage);
}).addViewClosedHandler(["configure-workflow"], () => {
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
