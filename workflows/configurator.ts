import { DefineWorkflow, Schema } from "deno-slack-sdk/mod.ts";
import { ConfigureEventsFunctionDefinition } from "../functions/configure_events.ts";

/**
 * A workflow can be a single step, only calling one function.
 */
const ConfiguratorWorkflow = DefineWorkflow({
  callback_id: "configurator",
  title: "Event configurator",
  description:
    "Update the channels to survey and surveying users for reaction events",
  input_parameters: {
    properties: {
      interactivity: { type: Schema.slack.types.interactivity },
    },
    required: ["interactivity"],
  },
});

// Step 1: Prompt for channel configuration
ConfiguratorWorkflow.addStep(ConfigureEventsFunctionDefinition, {
  interactivityPointer:
    ConfiguratorWorkflow.inputs.interactivity.interactivity_pointer,
});

export default ConfiguratorWorkflow;
