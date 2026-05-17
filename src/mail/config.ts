import { Mailer } from "@/primitives/mail";
import { LogTransport } from "./drivers/log";

export function configureMailDriver(): void {
    Mailer.setDriver(new LogTransport());
}
