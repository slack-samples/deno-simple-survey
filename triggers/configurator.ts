import { Trigger } from "deno-slack-api/types.ts";
import ConfiguratorWorkflow from "../workflows/configurator.ts";

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
