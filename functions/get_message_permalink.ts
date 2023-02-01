import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";

export const GetMessagePermalinkFunctionDefinition = DefineFunction({
  callback_id: "get_message_permalink",
  title: "Get message permalink",
  description: "Collect the URL of a message",
  source_file: "functions/get_message_permalink.ts",
  input_parameters: {
    properties: {
      channel_id: {
        type: Schema.slack.types.channel_id,
        description: "Channel ID the message was posted to",
      },
      parent_ts: {
        type: Schema.types.string,
        description: "Message timestamp of the message",
      },
    },
    required: ["channel_id", "parent_ts"],
  },
  output_parameters: {
    properties: {
      permalink: {
        type: Schema.types.string,
        description: "The URL of the message",
      },
    },
    required: ["permalink"],
  },
});

export default SlackFunction(
  GetMessagePermalinkFunctionDefinition,
  async ({ inputs, client }) => {
    const message = await client.chat.getPermalink({
      channel: inputs.channel_id,
      message_ts: inputs.parent_ts,
    });

    if (!message.ok) {
      return {
        error: `Failed to retrieve message permalink: ${message.error}`,
      };
    }

    return {
      outputs: { permalink: message.permalink },
    };
  },
);
