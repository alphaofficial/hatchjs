import { NodeEventDriver } from "./driver/node";
import { Emitter } from "@/primitives/events";

export function configureEventDriver(): void {
    Emitter.setDriver(new NodeEventDriver());
}
