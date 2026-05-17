import { Scheduler } from "@/primitives/scheduler";
import { NodeCronSchedulerDriver } from "./drivers/nodeCron";

export function configureSchedulerDriver(): void {
    Scheduler.setDriver(new NodeCronSchedulerDriver());
}
