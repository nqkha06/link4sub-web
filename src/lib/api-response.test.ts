import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { UseFormSetError } from "react-hook-form";

import {
  ApiRequestError,
  applyApiValidationErrors,
  getApiErrorMessage,
  readApiData,
  readPaginatedApiResponse,
} from "./api-response.ts";

describe("web API response helpers", () => {
  it("unwraps resource data", async () => {
    const response = Response.json({
      success: true,
      message: "Resource retrieved successfully.",
      data: { id: 7 },
    });

    assert.deepEqual(await readApiData<{ id: number }>(response), { id: 7 });
  });

  it("keeps pagination metadata", async () => {
    const response = Response.json({
      success: true,
      message: "Resources retrieved successfully.",
      data: [{ id: 1 }],
      meta: { page: 1, perPage: 20, total: 1, totalPages: 1 },
    });

    const result = await readPaginatedApiResponse<{ id: number }>(response);
    assert.equal(result.meta.total, 1);
    assert.deepEqual(result.data, [{ id: 1 }]);
  });

  it("throws a structured error and exposes its message", async () => {
    const response = Response.json(
      {
        success: false,
        message: "Validation failed.",
        error: {
          code: "VALIDATION_ERROR",
          details: { email: ["Email is required."] },
        },
      },
      { status: 422 },
    );

    await assert.rejects(
      () => readApiData(response),
      (error: unknown) => {
        assert.ok(error instanceof ApiRequestError);
        assert.equal(error.code, "VALIDATION_ERROR");
        assert.equal(getApiErrorMessage(error), "Validation failed.");
        return true;
      },
    );
  });

  it("maps validation details to form fields", () => {
    type FormValues = { email: string };
    const calls: Array<{ field: string; message?: string }> = [];
    const setError = ((
      field: string,
      options: { message?: string },
    ) => calls.push({ field, message: options.message })) as unknown as UseFormSetError<FormValues>;
    const error = new ApiRequestError(
      {
        success: false,
        message: "Validation failed.",
        error: {
          code: "VALIDATION_ERROR",
          details: { email: ["Email is already in use."] },
        },
      },
      422,
    );

    assert.equal(applyApiValidationErrors(error, setError), true);
    assert.deepEqual(calls, [
      { field: "email", message: "Email is already in use." },
    ]);
  });
});
