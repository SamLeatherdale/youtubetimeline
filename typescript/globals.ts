import { Timeouts } from "./classes"
import Session from "./Session"
export const API_KEY = process.env.API_KEY;

export const session = new Session();
export const timeouts = new Timeouts();
export const APPLICATION_VERSION = "103";
export const host_url = "/"