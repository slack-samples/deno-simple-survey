import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";

export const CreateSheetFunctionDefinition = DefineFunction({
  callback_id: "create_sheet",
  title: "Create spreadsheet",
  description: "Create a new Google Sheet",
  source_file: "functions/create_sheet.ts",
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
  CreateSheetFunctionDefinition,
  async ({ inputs, client }) => {
    // Collect Google access token
    const auth = await client.apiCall("apps.auth.external.get", {
      external_token_id: inputs.google_access_token_id,
    });

    if (!auth.ok) {
      return { error: `Failed to collect Google auth token: ${auth.error}` };
    }

    // Create spreadsheet
    const url = "https://sheets.googleapis.com/v4/spreadsheets";
    const sheets = await fetch(url, {
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

    if (!sheets.ok) {
      return {
        error: `Failed to create the survey spreadsheet: ${sheets.statusText}`,
      };
    }

    const body = await sheets.json();
    return {
      outputs: {
        google_spreadsheet_id: body.spreadsheetId,
        google_spreadsheet_url: body.spreadsheetUrl,
        reactor_access_token_id: inputs.google_access_token_id,
      },
    };
  },
);
