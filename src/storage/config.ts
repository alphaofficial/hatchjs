import { Storage } from "@/primitives/storage";
import { LocalDiskDriver } from "./drivers/localDisk";

export function configureStorageDriver(): void {
    Storage.setDriver(new LocalDiskDriver());
}
