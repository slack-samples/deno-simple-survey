import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";

export const GetExternalAuth = DefineFunction({
  callback_id: "save_response",
  title: "Save survey response",
  description: "Store shared feedback in a Google sheet",
  source_file: "functions/save_response.ts",
  input_parameters: {
    properties: {
      reactor_access_token_id: {
        type: Schema.types.string,
        description: "The Google access token ID of the reactor",
      },
    },
    required: [
      "reactor_access_token_id",
    ],
  },
  output_parameters: {
    properties: {
      external_token: {
        type: Schema.types.string,
      },
    },
    required: ["external_token"],
  },
});

export default SlackFunction(
  GetExternalAuth,
  async ({ inputs, client }) => {
    // Collect Google access token of the reactor
    const auth = await client.apps.auth.external.get({
      external_token_id: inputs.reactor_access_token_id,
    });

    if (!auth.ok) {
      return { error: `Failed to collect Google auth token: ${auth.error}` };
    }

    return { outputs: { external_token: auth.external_token } };
  },
);
