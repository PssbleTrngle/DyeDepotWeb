import { HttpError } from "@/errors";
import { defineMiddleware } from "astro:middleware";

const errorMiddleware = defineMiddleware(async (astro, next) => {
  try {
    return await next();
  } catch (ex) {
    if (ex instanceof HttpError) {
      if (ex.status === 404) return astro.rewrite("/404");
    }
    throw ex;
  }
});

export const onRequest = errorMiddleware;
