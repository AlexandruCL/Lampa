import { Router } from "express";

export function createTimeRouter(_deps: { now?: () => number } = {}): Router {
  return Router();
}
