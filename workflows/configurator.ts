import { DefineWorkflow, Schema } from "deno-slack-sdk/mod.ts";
import { ConfiguratorFunctionDefinition } from "../functions/configure.ts";

const ConfiguratorWorkflow = DefineWorkflow({
  callback_id: "configurator",
  title: "Configure Simple Survey channels",
  description: "Update the channels where reaction events are listened for",
  input_parameters: {
    properties: {
      interactivity: { type: Schema.slack.types.interactivity },
    },
    required: ["interactivity"],
  },
});

// Step 1: Prompt for channel configuration
ConfiguratorWorkflow.addStep(ConfiguratorFunctionDefinition, {
  interactivityPointer:
    ConfiguratorWorkflow.inputs.interactivity.interactivity_pointer,
});

export default ConfiguratorWorkflow;
