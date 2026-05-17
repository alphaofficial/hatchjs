import { Scheduler } from "@/primitives/scheduler";
import { NodeCronSchedulerDriver } from "./driver/nodeCron";

export function configureSchedulerDriver(): void {
    Scheduler.setDriver(new NodeCronSchedulerDriver());
}
