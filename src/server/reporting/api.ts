import { NextResponse } from "next/server";
import { ZodError, type ZodSchema } from "zod";

export function apiError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function parseJsonBody<T>(request: Request, schema: ZodSchema<T>) {
  try {
    const body = await request.json();
    return { data: schema.parse(body), error: null };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        data: null,
        error: error.issues.map((issue) => issue.message).join(", ")
      };
    }

    return { data: null, error: "Invalid request body." };
  }
}
