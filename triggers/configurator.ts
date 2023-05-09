import { Trigger } from "deno-slack-sdk/types.ts";
import { TriggerContextData, TriggerTypes } from "deno-slack-api/mod.ts";
import ConfiguratorWorkflow from "../workflows/configurator.ts";

/**
 * Triggers determine when workflows are executed. A trigger
 * file describes a scenario in which a workflow should be run,
 * such as a user pressing a button or when a specific event occurs.
 * https://api.slack.com/automation/triggers
 */
const configuratorTrigger: Trigger<typeof ConfiguratorWorkflow.definition> = {
  type: TriggerTypes.Shortcut,
  name: "Simple Survey configurator",
  description: "Configure the channels to survey and surveying users",
  workflow: `#/workflows/${ConfiguratorWorkflow.definition.callback_id}`,
  inputs: {
    interactivity: { value: TriggerContextData.Shortcut.interactivity },
  },
};

export default configuratorTrigger;
