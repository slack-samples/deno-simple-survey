import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";

/**
 * Custom functions can gather OAuth access tokens from external
 * authentication to perform individualized actions on external APIs.
 * https://api.slack.com/automation/external-auth
 */
export const CreateGoogleSheetFunctionDefinition = DefineFunction({
  callback_id: "create_google_sheet",
  title: "Create spreadsheet",
  description: "Create a new Google Sheet",
  source_file: "functions/create_google_sheet.ts",
  input_parameters: {
    properties: {
      google_access_token_id: {
        type: Schema.slack.types.oauth2,
        oauth2_provider_key: "google",
      },
      title: {
        type: Schema.types.string,
        description: "The title of the spreadsheet",
      },
    },
    required: ["google_access_token_id", "title"],
  },
  output_parameters: {
    properties: {
      google_spreadsheet_id: {
        type: Schema.types.string,
        description: "Newly created spreadsheet ID",
      },
      google_spreadsheet_url: {
        type: Schema.types.string,
        description: "Newly created spreadsheet URL",
      },
      reactor_access_token_id: {
        type: Schema.types.string,
        description: "The Google access token ID of the reactor",
      },
    },
    required: [
      "google_spreadsheet_id",
      "google_spreadsheet_url",
      "reactor_access_token_id",
    ],
  },
});

export default SlackFunction(
  CreateGoogleSheetFunctionDefinition,
  async ({ inputs, client }) => {
    // Collect Google access token
    const auth = await client.apps.auth.external.get({
      external_token_id: inputs.google_access_token_id,
    });

    if (!auth.ok) {
      return {
        error: `Failed to collect Google auth token: ${auth.error}`,
      };
    }

    // Create spreadsheet
    const url = "https://sheets.googleapis.com/v4/spreadsheets";
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${auth.external_token}`,
      },
      body: JSON.stringify({
        properties: { title: `Slack Survey - ${inputs.title}` },
        sheets: [{
          properties: { title: "Responses" },
          data: [{
            rowData: [{
              values: [
                { userEnteredValue: { stringValue: "Submitted" } },
                { userEnteredValue: { stringValue: "Impression" } },
                { userEnteredValue: { stringValue: "Comments" } },
              ],
            }],
          }],
        }],
      }),
    });

    const sheets = await response.json();
    if (sheets.error) {
      return {
        error:
          `Failed to create the survey spreadsheet: ${sheets.error.message}`,
      };
    }

    return {
      outputs: {
        google_spreadsheet_id: sheets.spreadsheetId,
        google_spreadsheet_url: sheets.spreadsheetUrl,
        reactor_access_token_id: inputs.google_access_token_id,
      },
    };
  },
);
