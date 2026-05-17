import { Cache } from "@/primitives/cache";
import { MemoryCache } from "./drivers/memory";

export function configureCacheDriver(): void {
    Cache.setDriver(new MemoryCache());
}
