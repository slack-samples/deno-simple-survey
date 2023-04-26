import { DefineOAuth2Provider, Schema } from "deno-slack-sdk/mod.ts";
import "std/dotenv/load.ts";

if (!Deno.env.get("GOOGLE_CLIENT_ID")) {
  console.error(
    'Missing environment variable "GOOGLE_CLIENT_ID" look into README.md to fix',
  );
}

/**
 * External authentication uses the OAuth 2.0 protocol to connect with
 * accounts across various services. Once authenticated, an access token
 * can be used to interact with the service on behalf of the user.
 * https://api.slack.com/automation/external-auth
 */
const GoogleProvider = DefineOAuth2Provider({
  provider_key: "google",
  provider_type: Schema.providers.oauth2.CUSTOM,
  options: {
    "provider_name": "Google",
    "authorization_url": "https://accounts.google.com/o/oauth2/auth",
    "token_url": "https://oauth2.googleapis.com/token",
    "client_id": Deno.env.get("GOOGLE_CLIENT_ID")!,
    "scope": [
      "https://www.googleapis.com/auth/spreadsheets",
      "https://www.googleapis.com/auth/userinfo.email",
    ],
    "authorization_url_extras": {
      "prompt": "consent",
      "access_type": "offline",
    },
    "identity_config": {
      "url": "https://www.googleapis.com/oauth2/v1/userinfo",
      "account_identifier": "$.email",
    },
  },
});

export default GoogleProvider;
