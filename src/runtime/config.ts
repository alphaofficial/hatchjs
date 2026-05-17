import { configureCacheDriver } from "@/cache/config";
import { registerAppEventHandlers } from "@/events/events";
import { configureEventDriver } from "@/events/config";
import { configureQueueDriver } from "@/jobs/config";
import { configureMailDriver } from "@/mail/config";
import { configureSchedulerDriver } from "@/scheduler/config";
import { configureStorageDriver } from "@/storage/config";

export function configureRuntimeDrivers(): void {
    configureEventDriver();
    configureMailDriver();
    configureQueueDriver();
    configureSchedulerDriver();
    configureStorageDriver();
    configureCacheDriver();
    registerAppEventHandlers();
}
