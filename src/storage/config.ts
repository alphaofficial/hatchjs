import { Storage } from "@/primitives/storage";
import { LocalDiskDriver } from "./driver/localDisk";

export function configureStorageDriver(): void {
    Storage.setDriver(new LocalDiskDriver());
}
