# Simple Survey

This automation demonstrates workflows for requesting and collecting feedback on
messages and storing responses in a Google Sheet.

https://user-images.githubusercontent.com/18134219/215910112-68c08e0f-597d-4813-bce0-aae174289948.mp4

**Guide Outline**:

- [Included Workflows](#included-workflows)
- [Setup](#setup)
  - [Install the Slack CLI](#install-the-slack-cli)
  - [Clone the Sample App](#clone-the-sample-app)
  - [Prepare Google Services](#prepare-google-services)
- [Running Your Project Locally](#running-your-project-locally)
- [Creating Triggers](#creating-triggers)
- [Datastores](#datastores)
- [Testing](#testing)
- [Deploying Your App](#deploying-your-app)
- [Viewing Activity Logs](#viewing-activity-logs)
- [Project Structure](#project-structure)
- [Resources](#resources)

---

## Included Workflows

- **Prompt survey creation**: Ask if a user wants to create a survey when a
  :clipboard: reaction is added to a message
- **Create a survey**: Respond to the reacted message with a feedback form and
  make a new spreadsheet to store responses
- **Respond to a survey**: Open the feedback form and store responses in the
  spreadsheet
- **Remove a survey**: Delete messages with survey related link triggers
- **Event configurator**: Update the channels to survey and surveying users for
  reaction events
- **Maintenance job**: A daily run workflow that ensures bot user membership in
  channels specified for event reaction triggers. Recommended for
  production-grade operations

## Setup

Before getting started, first make sure you have a development workspace where
you have permission to install apps. **Please note that the features in this
project require that the workspace be part of
[a Slack paid plan](https://slack.com/pricing).**

### Install the Slack CLI

To use this sample, you need to install and configure the Slack CLI.
Step-by-step instructions can be found in our
[Quickstart Guide](https://api.slack.com/automation/quickstart).

### Clone the Sample App

Start by cloning this repository:

```zsh
# Clone this project onto your machine
$ slack create my-app -t slack-samples/deno-simple-survey

# Change into the project directory
$ cd my-app
```

### Prepare Google Services

With [external authentication](https://api.slack.com/automation/external-auth)
you can programmatically interact with Google services and APIs from your app,
as though you're the authorized user.

The client credentials needed for these interactions can be collected from a
Google Cloud project with OAuth enabled and with access to the appropriate
services.

#### Create a Google Cloud Project

Begin by creating a new project from
[the Google Cloud resource manager](https://console.cloud.google.com/cloud-resource-manager),
then
[enabling the Google Sheets API](https://console.cloud.google.com/apis/library/sheets.googleapis.com)
for this project.

Next,
[create an OAuth consent screen](https://console.cloud.google.com/apis/credentials/consent)
for your app. The "User Type" and other required app information can be
configured as you wish. No additional scopes need to be added here, and you can
add test users for development if you want.

Client credentials can be collected by
[creating an OAuth client ID](https://console.cloud.google.com/apis/credentials/oauthclient)
with an application type of "Web application". Under the "Authorized redirect
URIs" section, add `https://oauth2.slack.com/external/auth/callback` then click
"Create".

You'll use these newly created client credentials in the next steps.

#### Set the Client ID

Create a file named `.env` at the top level of your project. Copy the contents
of `.env.example` into your new `.env` file. Take your Client ID and set it as
the value for `GOOGLE_CLIENT_ID` (replacing `12345-example`) in your new `.env`
file. This value will be used in `external_auth/google_provider.ts` – the custom
OAuth2 provider definition for your Google project.[^0]

#### Validate Your App

At this point you should be able to build and start your project. Go ahead and
execute the following command to see if your app works properly.

When prompted:

- install the app to your workspace
- create the `triggers/configurator.ts` [trigger](#creating-triggers).

```zsh
# Run app locally
$ slack run

Connected, awaiting events
```

Note: Ignore warnings at this stage!

Once complete, press `<CTRL> + C` to end the process. You will need to create
additional secrets before using your application.

#### Save the Client Secret

With your client secret ready, run the following command, replacing
`GOOGLE_CLIENT_SECRET` with your own secret:

```sh
$ slack external-auth add-secret --provider google --secret GOOGLE_CLIENT_SECRET
```

When prompted to select an app, choose the `(dev)` app only if you're running
the app locally.

#### Initiate the OAuth2 Flow

With your Google project created and the Client ID and secret set, you're ready
to initiate the OAuth flow!

If all the right values are in place, the following command will prompt you to
choose an app, select a provider (hint: choose the `google` one), then pick the
Google account you want to authenticate with:

```sh
$ slack external-auth add
```

> :unlock: Spreadsheets generated as part of the **Create a survey** workflow
> will be created from the account you authenticate with! To limit the users
> that can create surveys, an **Event configurator** workflow is used.

Once you've successfully connected your account, you're almost ready to create
surveys at the press of a reaction!

## Running Your Project Locally

While building your app, you can see your changes appear in your workspace in
real-time with `slack run`. You'll know an app is the development version if the
name has the string `(local)` appended.

```zsh
# Run app locally
$ slack run

Connected, awaiting events
```

To stop running locally, press `<CTRL> + C` to end the process.

## Creating Triggers

[Triggers](https://api.slack.com/automation/triggers) are what cause workflows
to run. These triggers can be invoked by a user, or automatically as a response
to an event within Slack.

When you `run` or `deploy` your project for the first time, the CLI will prompt
you to create a trigger if one is found in the `triggers/` directory. For any
subsequent triggers added to the application, each must be
[manually added using the `trigger create` command](#manual-trigger-creation).

When creating triggers, you must select the workspace and environment that you'd
like to create the trigger in. Each workspace can have a local development
version (denoted by `(local)`), as well as a deployed version. _Triggers created
in a local environment will only be available to use when running the
application locally._

### Link Triggers

A [link trigger](https://api.slack.com/automation/triggers/link) is a type of
trigger that generates a **Shortcut URL** which, when posted in a channel or
added as a bookmark, becomes a link. When clicked, the link trigger will run the
associated workflow.

Link triggers are _unique to each installed version of your app_. This means
that Shortcut URLs will be different across each workspace, as well as between
[locally run](#running-your-project-locally) and
[deployed apps](#deploying-your-app).

With link triggers, after selecting a workspace and environment, the output
provided will include a Shortcut URL. Copy and paste this URL into a channel as
a message, or add it as a bookmark in a channel of the workspace you selected.
Interacting with this link will run the associated workflow.

**Note: triggers won't run the workflow unless the app is either running locally
or deployed!**

### Manual Trigger Creation

To manually create a trigger, use the following command:

```zsh
$ slack trigger create --trigger-def triggers/configurator.ts
```

### Using the Configurator Trigger

With the configurator link trigger (`triggers/configurator.ts`) you can
configure the channel list and surveying users, as shown below:

<img src="https://user-images.githubusercontent.com/18134219/215911063-e3ab2892-1644-4f63-9383-f37be2954172.gif" width="600">

Once the app is added to the channel being surveyed, configured users that add a
`:clipboard:` reaction to a message will begin the survey process with a prompt
to create a new survey.

## Datastores

For storing data related to your app, datastores offer secure storage on Slack
infrastructure. For an example of a datastore, see
`datastores/survey_datastore.ts`. The use of a datastore requires the
`datastore:write`/`datastore:read` scopes to be present in your manifest.

## Testing

Test filenames should be suffixed with `_test`.

Run all tests with `deno test`:

```zsh
$ deno test
```

## Deploying Your App

Once development is complete, deploy the app to Slack infrastructure using
`slack deploy`:

```zsh
$ slack deploy
```

When deploying for the first time, you'll be prompted to
[create a new link trigger](#creating-triggers) for the deployed version of your
app. When that trigger is invoked, the workflow should run just as it did when
developing locally (but without requiring your server to be running).

### Production Maintenance Job

For production, we recommend enabling the included `maintenance_job.ts`
workflow.

The app's bot user must be a member of a channel in order to listen for events
there. When you add a new channel in the configuration modal, the bot user
automatically joins the channel. **However, anyone can remove the bot user from
the channel at any time.**

To enable a job that will re-add the bot user to channel, run the following
command that generates a scheduled trigger to run daily:

```zsh
$ slack trigger create --trigger-def triggers/daily_maintenance_job.ts
```

## Viewing Activity Logs

Activity logs of your application can be viewed live and as they occur with the
following command:

```zsh
$ slack activity --tail
```

## Project Structure

### `.slack/`

Contains `apps.dev.json` and `apps.json`, which include installation details for
development and deployed apps.

### `datastores/`

[Datastores](https://api.slack.com/automation/datastores) securely store data
for your application on Slack infrastructure. Required scopes to use datastores
include `datastore:write` and `datastore:read`.

### `external_auth/`

[External authentication](https://api.slack.com/automation/external-auth)
enables connections to external services using OAuth2. Once connected, you can
perform actions as the authorized user on these services using custom functions.

### `functions/`

[Functions](https://api.slack.com/automation/functions) are reusable building
blocks of automation that accept inputs, perform calculations, and provide
outputs. Functions can be used independently or as steps in workflows.

### `triggers/`

[Triggers](https://api.slack.com/automation/triggers) determine when workflows
are run. A trigger file describes the scenario in which a workflow should be
run, such as a user pressing a button or when a specific event occurs.

### `workflows/`

A [workflow](https://api.slack.com/automation/workflows) is a set of steps
(functions) that are executed in order.

Workflows can be configured to run without user input or they can collect input
by beginning with a [form](https://api.slack.com/automation/forms) before
continuing to the next step.

### `manifest.ts`

The [app manifest](https://api.slack.com/automation/manifest) contains the app's
configuration. This file defines attributes like app name and description.

### `slack.json`

Used by the CLI to interact with the project's SDK dependencies. It contains
script hooks that are executed by the CLI and implemented by the SDK.

## Resources

To learn more about developing automations on Slack, visit the following:

- [Automation Overview](https://api.slack.com/automation)
- [CLI Quick Reference](https://api.slack.com/automation/cli/quick-reference)
- [Samples and Templates](https://api.slack.com/automation/samples)

[^0]: this environment variable is used to set a value that configures your
application and is not required at runtime, therefore you do **not** need to use
the `slack env add` command for [deployed apps](#deploying-your-app).
