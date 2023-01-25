import { DefineWorkflow } from "deno-slack-sdk/mod.ts";
import { MaintainMembershipFunctionDefinition } from "../functions/maintain_membership.ts";

const MaintenanceJobWorkflow = DefineWorkflow({
  callback_id: "maintenance_job",
  title: "Maintenance job",
  description: "Maintain trigger settings and bot user membership",
  input_parameters: { properties: {}, required: [] },
});

// Step 1: Join channels specified by reaction event triggers
MaintenanceJobWorkflow.addStep(MaintainMembershipFunctionDefinition, {});

export default MaintenanceJobWorkflow;
