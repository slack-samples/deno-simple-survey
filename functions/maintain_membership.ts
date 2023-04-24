import { DefineFunction, SlackFunction } from "deno-slack-sdk/mod.ts";
import {
  findReactionTriggers,
  ReactionTriggerResponseObject,
} from "./utils/trigger_operations.ts";
import { isTriggerOperationError } from "./utils/errors.ts";

export const MaintainMembershipFunctionDefinition = DefineFunction({
  callback_id: "maintain_membership",
  title: "Maintain channel memberships for active event triggers",
  source_file: "functions/maintain_membership.ts",
  input_parameters: { properties: {}, required: [] },
  output_parameters: { properties: {}, required: [] },
});

export default SlackFunction(
  MaintainMembershipFunctionDefinition,
  async ({ client }) => {
    // Search for existing reaction triggers
    let triggers: ReactionTriggerResponseObject[] = [];
    try {
      triggers = await findReactionTriggers(client);
    } catch (err) {
      if (isTriggerOperationError(err)) {
        console.log(err);
        return { error: `${err.error}` };
      }
    }

    // Union of all channels with active event triggers
    const channelIds = [...new Set(...triggers.map((t) => t.channel_ids))];

    // Join all channels as the bot user
    channelIds.forEach(async (channel) => {
      const response = await client.conversations.join({ channel });
      if (!response.ok) {
        return {
          error: `Failed to join channel <#${channel}>: ${response.error}`,
        };
      }
    });

    return { outputs: {} };
  },
);
