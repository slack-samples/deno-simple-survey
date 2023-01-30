import { DefineWorkflow, Schema } from "deno-slack-sdk/mod.ts";
import { ConfigureChannelsFunctionDefinition } from "../functions/configure_channels.ts";

const ConfiguratorWorkflow = DefineWorkflow({
  callback_id: "configurator",
  title: "Channel configurator",
  description: "Update the channels where reaction events are listened for",
  input_parameters: {
    properties: {
      interactivity: { type: Schema.slack.types.interactivity },
    },
    required: ["interactivity"],
  },
});

// Step 1: Prompt for channel configuration
ConfiguratorWorkflow.addStep(ConfigureChannelsFunctionDefinition, {
  interactivityPointer:
    ConfiguratorWorkflow.inputs.interactivity.interactivity_pointer,
});

export default ConfiguratorWorkflow;
