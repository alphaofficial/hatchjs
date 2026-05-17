import { Cache } from "@/primitives/cache";
import { MemoryCache } from "./driver/memory";

export function configureCacheDriver(): void {
    Cache.setDriver(new MemoryCache());
}
