import { Request, Response, RequestHandler } from "express";

export function asyncHandler<T>(
  fn: (req: Request, res: Response) => Promise<T>
): RequestHandler {
  return (req, res, next) => {
    fn(req, res).catch(next);
  };
}

export function respondError(res: Response, error: string | Error, statusCode: number = 400) {
  if (typeof error === "string") {
    return res.status(statusCode).json({ error });
  } else if (error instanceof Error) {
    return res.status(statusCode).json({ error: error.message });
  }

  // Just in case we get an unexpected error type. We should log it.
  console.error("Unexpected error:", error);
  return res.status(500).json({ error: "An unexpected error occurred" });
}