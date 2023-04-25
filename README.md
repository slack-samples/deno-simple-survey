# Deno Simple Survey App

This app demonstrates multi-stage workflows for requesting and collecting
feedback on messages, all starting at the press of a reaction, with responses
being stored in a dynamically created Google Sheet.

<https://user-images.githubusercontent.com/18134219/215910112-68c08e0f-597d-4813-bce0-aae174289948.mp4>

**Guide Outline**:

- [Deno Simple Survey App](#deno-simple-survey-app)
  - [Supported Workflows](#supported-workflows)
  - [Setup](#setup)
    - [Install the Slack CLI](#install-the-slack-cli)
    - [Clone the Sample App](#clone-the-sample-app)
    - [Prepare your Google Services](#prepare-your-google-services)
      - [Create a Google Cloud Project](#create-a-google-cloud-project)
      - [Set your Client ID](#set-your-client-id)
      - [Validate your app](#validate-your-app)
      - [Save your Client Secret](#save-your-client-secret)
      - [Initiate the OAuth2 Flow](#initiate-the-oauth2-flow)
  - [Running Your Project Locally](#running-your-project-locally)
  - [Deploying Your App](#deploying-your-app)
    - [Viewing Activity Logs](#viewing-activity-logs)
  - [Link Trigger](#link-trigger)
  - [Project Structure](#project-structure)
    - [`manifest.ts`](#manifestts)
    - [`slack.json`](#slackjson)
    - [`/functions`](#functions)
    - [`/workflows`](#workflows)
    - [`/triggers`](#triggers)
    - [`/datastores`](#datastores)
    - [`/external_auth`](#external_auth)
  - [Resources](#resources)

---

## Supported Workflows

- **Prompt survey creation**: Ask if a user wants to create a survey when a
  :clipboard: reaction is added to a message.
- **Create a survey**: Respond to the reacted message with a feedback form and
  make a new spreadsheet to store responses.
- **Respond to a survey**: Open the feedback form and store responses in the
  spreadsheet.
- **Remove a survey**: Delete messages with survey related link triggers.
- **Event configurator**: Update the channels to survey and surveying users for
  reaction events.
- **Maintenance job**: A daily run workflow that ensures bot user membership in
  channels specified for event reaction triggers. Recommended for
  production-grade operations.

## Setup

Before getting started, make sure you have a development workspace where you
have permissions to install apps. If you don’t have one set up, go ahead and
[create one](https://slack.com/create). Also, please note that the workspace
requires any of [the Slack paid plans](https://slack.com/pricing).

### Install the Slack CLI

To use this sample, you first need to install and configure the Slack CLI.
Step-by-step instructions can be found in our
[Quickstart Guide](https://api.slack.com/future/quickstart).

### Clone the Sample App

Start by cloning this repository:

```zsh
# Clone this project onto your machine
slack create my-app -t slack-samples/deno-simple-survey

# Change into this project directory
cd my-app
```

### Prepare your Google Services

With [external authentication](https://api.slack.com/future/external-auth) you
can programmatically interact with Google services and APIs from your app, as
though you're the authorized user.

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

#### Set your Client ID

Create a file named `.env` at the top level of your project. Copy the contents
of `.env.example` into your new `.env` file. Take your Client ID and set it as
the value for `GOOGLE_CLIENT_ID` (replacing `12345-example`) in your new `.env`
file. This value will be used in `external_auth/google_provider.ts` – the custom
OAuth2 provider definition for your Google project.

Note: this environment variable is used to set a value that configures your
application and is not required at runtime, therefore you do **not** need to use
the `slack env add` command for [deployed apps](#deploying-your-app).

#### Validate your app

At this point you should be able to build and start your project. Go ahead and
execute the following command to see if your app works properly.

When prompted:

- install the app to your workspace
- create the `triggers/configurator.ts` [trigger](#link-trigger).

```zsh
# Run app locally
$ slack run

Connected, awaiting events
```

Note: Ignore warnings at this stage!

Once complete, press `<CTRL> + C` to end the process. You will need to create
additional secrets before using your application.

#### Save your Client Secret

With your client secret ready, run the following command, replacing
`GOOGLE_CLIENT_SECRET` with your own secret:

```sh
slack external-auth add-secret --provider google --secret GOOGLE_CLIENT_SECRET
```

When prompted to select an app, choose the `(local)` app only if you're running
the app locally.

#### Initiate the OAuth2 Flow

With your Google project created and the Client ID and secret set, you're ready
to initiate the OAuth flow!

If all the right values are in place, the following command will prompt you to
choose an app, select a provider (hint: choose the `google` one), then pick the
Google account you want to authenticate with:

```sh
slack external-auth add
```

> :unlock: Spreadsheets generated as part of the **Create a survey** workflow
> will be created from the account you authenticate with! To limit the users
> that can create surveys, an **Event configurator** workflow is used.

Once you've successfully connected your account, you're almost ready to create
surveys at the press of a reaction!

## Running Your Project Locally

While building your app, you can see your changes propagated to your workspace
in real-time with `slack run`. In both the CLI and in Slack, you'll know an app
is the development version if the name has the string `(local)` appended.

```zsh
# Run app locally
$ slack run

Connected, awaiting events
```

Once running, you should be able to see the trigger relevant to your app below
`Listing triggers installed to the app...`. use the
[previously created Simple Survey configurator shortcut](#validate-your-app)
associated with the version of your app to configure the channel list for
reaction events.

To stop running locally, press `<CTRL> + C` to end the process.

When you click the link trigger URL in Slack, you can configure the channel list
and surveying users as shown below:

<img src="https://user-images.githubusercontent.com/18134219/215911063-e3ab2892-1644-4f63-9383-f37be2954172.gif" width="600">

Once the surveyor is added to the channel, configured users that add a
`:clipboard:` reaction to a message will begin the survey process with a prompt
to create a new survey!

## Deploying Your App

Once you're done with development, you can deploy the production version of your
app to Slack hosting using `slack deploy`:

```zsh
slack deploy
```

When prompted to choose a trigger definition file select
`triggers/configurator.ts` this will create a link trigger for the workflow that
enables end-users to configure the channels with active event triggers for your
deployed application. Once the trigger is invoked, the workflow should run just
as it did in when developing locally.

Also, for production-grade operations, we highly recommend enabling the
`maintenance_job.ts` workflow. This survey app requires the app's bot user to be
a member of channels to listen for events. When you add a new channel in the
configuration modal, the bot user automatically joins the channel. However,
anyone can remove the bot user from the channels at any time. To get the bot
user back again, running the daily maintenance job should be a good-enough
solution. You can enable it by creating a scheduled trigger for the workflow
that will to run it daily, with the following command and selecting
`triggers/daily_maintenance_job.ts`:

```zsh
slack trigger create

# Select triggers/daily_maintenance_job.ts when prompted
```

or

```zsh
slack trigger create --trigger-def triggers/daily_maintenance_job.ts
```

### Viewing Activity Logs

Activity logs for the production instance of your application can be viewed with
the `slack activity` command:

```zsh
slack activity
```

## Link Trigger

[Triggers](https://api.slack.com/future/triggers) are what cause workflows to
run. These triggers can be invoked by a user, or automatically as a response to
an event within Slack.

A [link trigger](https://api.slack.com/future/triggers/link) is a type of
trigger that generates a **Shortcut URL** which, when posted in a channel or
added as a bookmark, becomes a link. When clicked, the link trigger will run the
associated workflow.

Link triggers are _unique to each installed version of your app_. This means
that Shortcut URLs will be different across each workspace, as well as between
[locally run](#running-your-project-locally) and
[deployed apps](#deploying-your-app). When creating a trigger, you must select
the Workspace that you'd like to create the trigger in. Each Workspace has a
development version (denoted by `(local)`), as well as a deployed version.

You should have already created a link trigger for the workflow that enables
end-users to configure the channels with active event triggers, but if you did
not you can create one by running the following command:

```zsh
slack trigger create

# Select triggers/configurator.ts when prompted
```

or

```zsh
slack trigger create --trigger-def triggers/configurator.ts
```

After selecting a Workspace, the output provided will include the link trigger
Shortcut URL. Copy and paste this URL into a channel as a message, or add it as
a bookmark in a channel of the Workspace you selected.

**Note: this link won't run the workflow until the app is either running locally
or deployed!** Read on to learn how to run your app locally and eventually
deploy it to Slack hosting.

## Project Structure

### `manifest.ts`

The [app manifest](https://api.slack.com/future/manifest) contains the app's
configuration. This file defines attributes like app name and description.

### `slack.json`

Used by the CLI to interact with the project's SDK dependencies. It contains
script hooks that are executed by the CLI and implemented by the SDK.

### `/functions`

[Functions](https://api.slack.com/future/functions) are reusable building blocks
of automation that accept inputs, perform calculations, and provide outputs.
Functions can be used independently or as steps in workflows.

### `/workflows`

A [workflow](https://api.slack.com/future/workflows) is a set of steps that are
executed in order. Each step in a workflow is a function.

Workflows can be configured to run without user input or they can collect input
by beginning with a [form](https://api.slack.com/future/forms) before continuing
to the next step.

### `/triggers`

[Triggers](https://api.slack.com/future/triggers) determine when workflows are
executed. A trigger file describes a scenario in which a workflow should be run,
such as a user pressing a button or when a specific event occurs.

### `/datastores`

[Datastores](https://api.slack.com/future/datastores) can securely store and
retrieve data for your application. Required scopes to use datastores include
`datastore:write` and `datastore:read`.

### `/external_auth`

[External authentication](https://api.slack.com/future/external-auth) connects
your app to external services using OAuth2. Once connected, you can perform
actions as the authorized user on these services from a custom function.

## Resources

To learn more about developing with the CLI, you can visit the following guides:

- [Creating a new app with the CLI](https://api.slack.com/future/create)
- [Configuring your app](https://api.slack.com/future/manifest)
- [Developing locally](https://api.slack.com/future/run)

To view all documentation and guides available, visit the
[Overview page](https://api.slack.com/future/overview).
