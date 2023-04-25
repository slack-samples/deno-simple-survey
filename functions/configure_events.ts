import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";

import {
  createReactionTriggers,
  findReactionTriggers,
  getReactionTriggerChannelIds,
  getReactionTriggerSurveyorIds,
  ReactionTriggerResponseObject,
  updateReactionTriggers,
} from "./utils/trigger_operations.ts";
import { isTriggerOperationError } from "./utils/errors.ts";

/**
 * Custom functions are the building blocks of workflows:
 * accepting input, performing calculations, handling view events,
 * and providing output.
 * https://api.slack.com/future/functions/custom
 */

export const ConfigureEventsFunctionDefinition = DefineFunction({
  callback_id: "configure_events",
  title: "Manage channel and user filters for the reaction event triggers",
  source_file: "functions/configure_events.ts",
  input_parameters: {
    properties: {
      interactivityPointer: { type: Schema.types.string },
    },
    required: ["interactivityPointer"],
  },
  output_parameters: { properties: {}, required: [] },
});

export default SlackFunction(
  ConfigureEventsFunctionDefinition,
  async ({ inputs, client }) => {
    // Search for existing reaction triggers
    let triggers: ReactionTriggerResponseObject[] = [];
    try {
      triggers = await findReactionTriggers(client);
    } catch (err) {
      if (isTriggerOperationError(err)) {
        console.error(err);
        return { error: `${err.error}` };
      }
    }

    // Retrieve existing channel and surveyor info
    const channelIds = getReactionTriggerChannelIds(triggers);
    const surveyorIds = getReactionTriggerSurveyorIds(triggers);

    // Open the modal to configure the channel list for the workflows
    const viewOpenResponse = await client.views.open({
      interactivity_pointer: inputs.interactivityPointer,
      view: buildModalView(channelIds, surveyorIds),
    });
    if (!viewOpenResponse.ok) {
      return {
        error: `Failed to open configurator modal: ${viewOpenResponse.error}`,
      };
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

  // Gather input from the modal
  const channelIds = view.state.values.channel_block.channels
    .selected_channels as string[];
  const reactorIds = view.state.values.user_block.users
    .selected_users as string[];
  const filters = { channelIds, reactorIds };

  let triggers: ReactionTriggerResponseObject[] = [];

  try {
    // Search for existing reaction triggers
    triggers = await findReactionTriggers(client);

    // Create new event reaction triggers or update existing ones
    if (triggers.length === 0) {
      await createReactionTriggers(client, filters);
    } else {
      updateReactionTriggers(client, triggers, filters);
    }
  } catch (err) {
    console.error(err);
    return { error: `${err.error}` };
  }

  // Join all selected channels as the bot user
  channelIds.forEach(async (channel) => {
    const joinResponse = await client.conversations.join({ channel });
    if (!joinResponse.ok) {
      return {
        error: `Failed to join channel <#${channel}>: ${joinResponse.error}`,
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

function buildModalView(channelIds: Set<string>, surveyorIds: Set<string>) {
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
        "block_id": "channel_block",
        "element": {
          "type": "multi_channels_select",
          "placeholder": {
            "type": "plain_text",
            "text": "Select channels to survey in",
          },
          "initial_channels": Array.from(channelIds),
          "action_id": "channels",
        },
        "label": {
          "type": "plain_text",
          "text": "Channels to survey",
        },
      },
      {
        "type": "input",
        "block_id": "user_block",
        "element": {
          "type": "multi_users_select",
          "placeholder": {
            "type": "plain_text",
            "text": "Select users that can create surveys",
          },
          "initial_users": Array.from(surveyorIds),
          "action_id": "users",
        },
        "label": {
          "type": "plain_text",
          "text": "Surveying users",
        },
      },
      {
        "type": "context",
        "elements": [
          {
            "type": "plain_text",
            "text":
              "Spreadsheets will be created using the external auth tokens added from the CLI",
          },
        ],
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
