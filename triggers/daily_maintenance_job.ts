import { Trigger } from "deno-slack-api/types.ts";
import MaintenanceJobWorkflow from "../workflows/maintenance_job.ts";

const maintenanceJobTrigger: Trigger<typeof MaintenanceJobWorkflow.definition> =
  {
    type: "scheduled",
    name: "Trigger a scheduled maintenance job",
    workflow: `#/workflows/${MaintenanceJobWorkflow.definition.callback_id}`,
    inputs: {},
    schedule: {
      // This is a simple example that begins 60 seconds later
      start_time: new Date(new Date().getTime() + 60000).toISOString(),
      end_time: "2037-12-31T23:59:59Z",
      frequency: { type: "daily", repeats_every: 1 },
    },
  };

export default maintenanceJobTrigger;
