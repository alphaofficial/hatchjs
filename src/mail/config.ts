import { Mailer } from "@/primitives/mail";
import { LogTransport } from "./driver/log";

export function configureMailDriver(): void {
    Mailer.setDriver(new LogTransport());
}
