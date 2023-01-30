import { Trigger } from "deno-slack-api/types.ts";
import ConfiguratorWorkflow from "../workflows/configurator.ts";

/**
 * Triggers determine when workflows are executed. A trigger
 * file describes a scenario in which a workflow should be run,
 * such as a user pressing a button or when a specific event occurs.
 * https://api.slack.com/future/triggers
 */
const configuratorTrigger: Trigger<typeof ConfiguratorWorkflow.definition> = {
  type: "shortcut",
  name: "Channel configurator for Simple Survey",
  description: "Configure the channels where reactions prompt for a survey",
  workflow: `#/workflows/${ConfiguratorWorkflow.definition.callback_id}`,
  inputs: {
    interactivity: { value: "{{data.interactivity}}" },
  },
};

export default configuratorTrigger;
