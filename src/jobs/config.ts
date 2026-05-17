import { Queue } from "@/primitives/queue";
import { GraphileQueueDriver } from "./drivers/graphile";

export function configureQueueDriver(): void {
    Queue.setDriver(new GraphileQueueDriver());
}
