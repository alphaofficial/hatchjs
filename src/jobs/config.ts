import { Queue } from "@/primitives/queue";
import { GraphileQueueDriver } from "./driver/graphile";

export function configureQueueDriver(): void {
    Queue.setDriver(new GraphileQueueDriver());
}
