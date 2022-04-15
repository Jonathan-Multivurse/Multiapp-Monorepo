import { ApolloError, UserInputError } from "apollo-server";
import * as yup from "yup";
import * as _ from "lodash";

export enum ErrorCode {
  BAD_REQUEST = "BAD_REQUEST",
  NOT_FOUND = "NOT_FOUND",
  BAD_USER_INPUT = "BAD_USER_INPUT",
  UNPROCESSABLE_ENTITY = "UNPROCESSABLE_ENTITY",
  INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
}

export class NotFoundError extends ApolloError {
  constructor(resource: string = "User") {
    super(`${resource} not found`, ErrorCode.BAD_REQUEST);

    Object.defineProperty(this, "name", { value: "NotFoundError" });
  }
}

export class InvalidateError extends ApolloError {
  constructor(field: string, message: string) {
    super("Invalid input.", ErrorCode.BAD_USER_INPUT, {
      errors: { [field]: message },
    });

    Object.defineProperty(this, "name", { value: "InvalidateError" });
  }
}

export class BadRequestError extends ApolloError {
  constructor(message: string) {
    super(message, ErrorCode.BAD_REQUEST);

    Object.defineProperty(this, "name", { value: "BadRequestError" });
  }
}

export class UnprocessableEntityError extends ApolloError {
  constructor(message: string) {
    super(message, ErrorCode.UNPROCESSABLE_ENTITY);

    Object.defineProperty(this, "name", { value: "UnprocessableEntityError" });
  }
}

export class InternalServerError extends ApolloError {
  constructor(message?: string) {
    super("Internal Server Error", ErrorCode.INTERNAL_SERVER_ERROR, {
      message,
    });

    Object.defineProperty(this, "name", { value: "InternalServerError" });
  }
}

export function validateArgs<T>(schema: yup.BaseSchema<T>, args: Object): T {
  try {
    schema.validateSync(args, { abortEarly: false });
  } catch (err) {
    const errors: Record<string, string> = {};

    _.forEach((err as yup.ValidationError).inner, (inner) => {
      const field = inner.path as string;
      if (errors[field] && inner.type !== "required") {
        return;
      }
      errors[inner.path as string] = inner.message;
    });

    throw new UserInputError("Invalid input.", { errors });
  }

  return schema.cast(args);
}
