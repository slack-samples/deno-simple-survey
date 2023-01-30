import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";

// Configuration information for the storing spreadsheet
const GOOGLE_SPREADSHEET_RANGE = "Responses!A2:C2";

export const SaveResponseFunctionDefinition = DefineFunction({
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
      google_spreadsheet_id: {
        type: Schema.types.string,
        description: "Spreadsheet ID for storing survey results",
      },
      impression: {
        type: Schema.types.string,
        description: "General feelings of the response",
      },
      comments: {
        type: Schema.types.string,
        description: "Detailed feedback of the response",
      },
    },
    required: [
      "reactor_access_token_id",
      "google_spreadsheet_id",
      "impression",
      "comments",
    ],
  },
  output_parameters: { properties: {}, required: [] },
});

export default SlackFunction(
  SaveResponseFunctionDefinition,
  async ({ inputs, client }) => {
    const { google_spreadsheet_id, impression, comments } = inputs;
    const submissionTime = new Date().toISOString();

    // Collect Google access token of the reactor
    const auth = await client.apiCall("apps.auth.external.get", {
      external_token_id: inputs.reactor_access_token_id,
    });

    if (!auth.ok) {
      return { error: `Failed to collect Google auth token: ${auth.error}` };
    }

    // Append response to spreadsheet
    const url =
      `https://sheets.googleapis.com/v4/spreadsheets/${google_spreadsheet_id}/values/${GOOGLE_SPREADSHEET_RANGE}:append?valueInputOption=USER_ENTERED`;
    const sheets = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${auth.external_token}`,
      },
      body: JSON.stringify({
        range: GOOGLE_SPREADSHEET_RANGE,
        majorDimension: "ROWS",
        values: [[submissionTime, impression, comments]],
      }),
    });

    if (!sheets.ok) {
      return {
        error: `Failed to save survey response: ${sheets.statusText}`,
      };
    }

    return { outputs: {} };
  },
);
