import { NodeEventDriver } from "./drivers/node";
import { Emitter } from "@/primitives/events";

export function configureEventDriver(): void {
    Emitter.setDriver(new NodeEventDriver());
}
