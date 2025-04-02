/* eslint-disable @typescript-eslint/no-explicit-any */

//?  ***************************** Zod Utils   **********************************  */

import log from "@/utils/chalkLogger";
import { AnyZodObject, z, ZodError } from "zod";

import { NextFunction, Request, Response } from "express";
import createError from "http-errors";

/**
 * Creates a Zod schema for a non-empty string.
 * @param {z.ZodErrorMap} errorMap - An optional object that maps error types to error messages.
 * @returns {z.ZodString} - Returns a Zod schema that validates strings and ensures they are not empty.
 * @example
 * const schema = stringNonEmpty().length(5, 255);
 * const schemaII = stringNonEmpty(myErroMap).min(5).toLower();
 * const result = schema.parse("Hello World"); // "Hello World" ✅
 * const result2 = schema.parse(""); // Throws an error because the string is empty 💢
 */

export const stringNonEmpty = (errorMap?: z.ZodErrorMap): z.ZodString => {
  return z
    .string({ errorMap: errorMap })
    .min(1, { message: "cannot be empty" });
};

/**
 * @summary Function generate error map for  Zod schema
 * An object mapping error types to error messages or functions that generate error messages.
 * @example
 * z.setErrorMap(errorMap);
 *
 */

export const errorMap = z.setErrorMap((issue, ctx) => {
  switch (issue.code) {
    case z.ZodIssueCode.invalid_type:
      if (issue.received === undefined) {
        return { message: "is required" };
      }
      return { message: `${ctx.defaultError} : ${issue.received}` };

    case z.ZodIssueCode.invalid_string:
      if (issue.validation === "url") {
        return { message: `(${ctx.data}) must be a valid URL` };
      } else if (issue.validation === "email") {
        return { message: `(${ctx.data}) must be a valid email` };
      }
      return { message: `${ctx.data} : must be a string` };

    case z.ZodIssueCode.invalid_enum_value:
      return {
        message: `${ctx.data} : is not a valid enum value. Valid options: ${issue.options?.join(" | ")}`,
      };

    case z.ZodIssueCode.too_small:
      return {
        message: `value ${ctx.data} expected to be >= ${issue.minimum}`,
      };

    case z.ZodIssueCode.too_big:
      return {
        message: `value ${ctx.data} : expected to be <= ${issue.maximum}`,
      };

    default:
      return { message: ctx.defaultError };
  }
});

/**
 * This function converts a string to an array using a provided schema. If the input is already an array, it is returned as is.
 * @param {z.ZodSchema} schema - The Zod schema to validate the array elements.
 * @param {string} defult - An optional default value to use if the input is neither a string nor an array.
 * @returns {z.ZodArray<z.ZodString>} - Returns a Zod schema that validates arrays of strings and ensures they are not empty.
 * @example
 * const schema = z.string().url();
 * const arraySchema = arrayFromString(schema); // array of url strings
 * const result = arraySchema.parse("https:/test.fr,https:/git.com"); // ["https:/test.fr","https:/git.com"] ✅
 * const result = arraySchema.parse("Hello,World"); // ["Hello", "World"] // error not an URL 💢
 * const result2 = arraySchema.parse(["Hello", "World"]); // ["Hello", "World"] // error not an URL 💢
 * const result3 = arraySchema.parse(123); // Throws an error because the input is neither a string nor an array 💢
 */

export const arrayFromString = (
  schema: z.ZodSchema,
  defult: string = "",
): z.ZodArray<z.ZodString> => {
  return z.preprocess(
    (obj) => {
      if (Array.isArray(obj)) {
        return obj;
      } else if (typeof obj === "string") {
        return obj.split(",");
      } else {
        return defult;
      }
    },
    z.array(schema).nonempty({ message: "array cannot be empty" }),
  ) as unknown as z.ZodArray<z.ZodString>;
};

/**
 * @summary Function returns default object from Zod schema
 * @link https://gist.github.com/TonyGravagno/2b744ceb99e415c4b53e8b35b309c29c
 * @param schema z.object schema definition
 * @param options Optional object, see Example for details
 * @returns Object of type schema with defaults for all fields
 * @example
 * const schema = z.object( { ... } )
 * const default1 = defaultInstance<typeof schema>(schema)
 * const default2 = defaultInstance<typeof schema>(
 *   schema,{ // toggle from these defaults if required
 *     defaultArrayEmpty: false,
 *     defaultDateEmpty: false,
 *     defaultDateUndefined: false,
 *     defaultDateNull: false,
 * } )
 */
export function defaultInstance<T extends z.ZodTypeAny>(
  schema: z.AnyZodObject | z.ZodDefault<any> | z.ZodEffects<any>,
  options: object = {},
): z.infer<T> {
  const defaultArrayEmpty =
    "defaultArrayEmpty" in options ? options.defaultArrayEmpty : false;
  const defaultDateEmpty =
    "defaultDateEmpty" in options ? options.defaultDateEmpty : false;
  const defaultDateUndefined =
    "defaultDateUndefined" in options ? options.defaultDateUndefined : false;
  const defaultDateNull =
    "defaultDateNull" in options ? options.defaultDateNull : false;

  function run(): z.infer<T> {
    if (schema instanceof z.ZodEffects) {
      if (schema.innerType() instanceof z.ZodEffects) {
        return defaultInstance(schema.innerType(), options); // recursive ZodEffect
      }
      // return schema inner shape as a fresh zodObject
      return defaultInstance(
        z.ZodObject.create(schema.innerType().shape),
        options,
      );
    }

    if (schema instanceof z.ZodDefault) {
      const defValues = schema._def.defaultValue();
      const shape = schema._def.innerType._def.shape;

      const temp = Object.entries(shape).map(([key, value]) => {
        if (defValues[key] !== undefined) {
          return [key, defValues[key]];
        } else if (
          value instanceof z.ZodEffects ||
          value instanceof z.ZodDefault
        ) {
          return [key, defaultInstance(value as any, options)];
        } else {
          return [key, getDefaultValue(value as any)];
        }
      });

      return {
        ...Object.fromEntries(temp),
        ...defValues,
      };
    }

    if (schema instanceof z.ZodType) {
      const the_shape = schema.shape as z.ZodAny; // eliminates 'undefined' issue
      const entries = Object.entries(the_shape);
      const temp = entries.map(([key, value]) => {
        const this_default =
          value instanceof z.ZodEffects
            ? defaultInstance(value, options)
            : getDefaultValue(value);
        return [key, this_default];
      });
      return Object.fromEntries(temp);
    } else {
      console.error(`Error: Unable to process this schema`);
      return null; // unknown or undefined here results in complications
    }

    function getDefaultValue(dschema: z.ZodTypeAny): any {
      if (dschema instanceof z.ZodDefault) {
        if (!("_def" in dschema)) return undefined; // error
        if (!("defaultValue" in dschema._def)) return undefined; // error
        return dschema._def.defaultValue();
      }
      if (dschema instanceof z.ZodArray) {
        if (!("_def" in dschema)) return undefined; // error
        if (!("type" in dschema._def)) return undefined; // error
        // return empty array or array with one empty typed element
        return defaultArrayEmpty
          ? []
          : [getDefaultValue(dschema._def.type as z.ZodAny)];
      }
      if (dschema instanceof z.ZodString) return "";
      if (dschema instanceof z.ZodNumber || dschema instanceof z.ZodBigInt) {
        return dschema.minValue ?? 0;
      }
      if (dschema instanceof z.ZodDate) {
        return defaultDateEmpty
          ? ""
          : defaultDateNull
            ? null
            : defaultDateUndefined
              ? undefined
              : (dschema as z.ZodDate).minDate;
      }
      if (dschema instanceof z.ZodSymbol) return "";
      if (dschema instanceof z.ZodBoolean) return false;
      if (dschema instanceof z.ZodNull) return null;
      if (dschema instanceof z.ZodPipeline) {
        if (!("out" in dschema._def)) return undefined; // error
        return getDefaultValue(dschema._def.out);
      }
      if (dschema instanceof z.ZodObject) {
        return defaultInstance(dschema, options);
      }
      if (dschema instanceof z.ZodAny && !("innerType" in dschema._def))
        return undefined; // error?
      return getDefaultValue(dschema._def.innerType);
    }
  }
  return run();
}

/**
 * Handles errors during environment variable validation.
 *
 * @param {unknown} error - The error object to handle.
 * @param {Response} [res] - The Express response object (optional).
 * @throws Will throw an HTTP error with status code 500 for environment variable validation errors.
 * @example
 *
 * try {
 *   schema.parseAsync(req)
 *   // or
 *	 envSchema.parse(process.env);
 * } catch (error) {
 *   handleZodError(error); // handle ENV validation error and log to server
 *  // or
 *  handleZodError(error, res); // handle zod validation error and expose to client
 * }
 */
export function handleZodError(error: unknown, res?: Response): void {
  if (error instanceof ZodError) {
    if (res) {
      // handle zod validation error and expose to client
      res.status(400).json({
        message: "Validation error",
        errors: error.errors,
      });
    } else {
      // handle ENV validation error and log to server
      log.info(
        "\n 💠💠💠💠💠💠 Environment variable validation error 💠💠💠💠💠💠\n",
      );
      error.errors.forEach((err) => {
        const currentPath = formatPath(err.path);
        log.error(`* ${currentPath}  : `, `${err.message}`);
        console.log("-------------");
      });
      throw createError(500, "Environment variable validation error");
    }
  } else {
    log.error(
      "An unexpected Server error occurred while Zod validating (handleZodError) 💥: \n",
      error as string,
    );
    throw createError(500, "Unexpected error", { error });
  }
}

/**
 * Parses a request object using a Zod schema.
 *
 * @template T - The Zod schema type.
 * @param {T} schema - The Zod schema to validate against.
 * @param {Request} req - The request object to validate.
 * @returns {Promise<z.infer<T>>} The parsed and validated data.
 * @throws Will throw an error if validation fails.
 *
 * @example
 *
 * const schema = z.object({
 *   name: z.string(),
 *   age: z.number().int(),
 * });
 *
 * async function handler(req: Request, res: Response) {
 *     const data = await zParse(schema, req);
 *     const { params, query: {page, pageSize}, body } = await zParse(anotherSchema, req);
 *     res.json(data);
 * }
 */
export async function zParse<T extends AnyZodObject>(
  schema: T,
  req: Request,
): Promise<z.infer<T>> {
  try {
    return schema.parseAsync(req);
  } catch (error) {
    handleZodError(error);
    return createError(500, "Unexpected error", { error });
  }
}

/**
 * Middleware function to validate request data.
 * @param {AnyZodObject} schema - The Zod schema to validate the request data against.
 * @returns {Function} The Express middleware function.
 * @link https://dev.to/franciscomendes10866/schema-validation-with-zod-and-expressjs-111p
 * @example
 * import { z } from 'zod';
 * import { validate } from './utils/zodUtils';
 *  const resetPassword = {
 *      params: Joi.object().keys({
 *         userId: Joi.string().custom(objectId),
 *      }),
 *      query: Joi.object().keys({
 *         token: Joi.string().required(),
 *      }),
 *      body: Joi.object().keys({
 *         password: Joi.string().custom(password),
 *      }),
 *  };
 *
 *
 * app.post('/reset-password', validate(resetPassword), yourController);
 */
export const validate =
  (
    schema: AnyZodObject,
  ): ((req: Request, res: Response, next: NextFunction) => Promise<void>) =>
    /**
     * Express middleware function.
     * @param {Request} req - The Express request object.
     * @param {Response} res - The Express response object.
     * @param {NextFunction} next - The Express next function.
     * @returns {Promise<void>} A Promise that resolves when the validation is done.
     */
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        await schema.parseAsync({
          body: req.body,
          query: req.query,
          params: req.params,
        });
        return next();
      } catch (error) {
        handleZodError(error, res);
      }
    };

/**
 * Formats a path array into a string representation. (from zod paths)
 *
 * @param {Array<string | number>} path - The path array to format.
 * @returns {string} The formatted path string.
 * @throws Will throw an error if the path is not a non-empty array.
 *
 * @example
 * import { formatPath } from "./zodUtils";
 * // Example of Zod  fails validation error
 * const data = {
 *   user: {
 *     name: "John Doe",
 *     address: {
 *       street: 123, // Invalid type, should be a string
 *       city: "New York",
 *     },
 *   },
 * };
 *
 * if (error instanceof ZodError) {
 *   error.errors.forEach((err) => {
 *     const formattedPath = formatPath(err.path);
 *     console.error(`Validation error at ${formattedPath}: ${err.message}`);
 *   });
 *
 *  // Outputs: "Validation error at user.address.street: Expected string, received number
 */

export function formatPath(path: Array<string | number>): string {
  if (!Array.isArray(path) || path.length === 0) {
    throw new Error("Path must be a non-empty array");
  }

  return path
    .map((element, index) => {
      if (
        Number.isInteger(element) &&
        index > 0 &&
        Number.isInteger(path[index - 1])
      ) {
        // This is an array index, format it as such
        return `[${element}]`;
      } else {
        // This is not an array index, just convert it to a string
        return element.toString();
      }
    })
    .join(".");
}

// Preprocess URLs to replace ${PORT} with actual port value
/**
 * Preprocesses a URL string to replace `${PORT}` with the actual port value.
 * @param {string} url - The URL string to preprocess.
 * @param {number} port - The port value to replace `${PORT}` with.
 * @returns {string} The preprocessed URL string.
 * @example
 * const url = "http://localhost:${PORT}/api/v2";
 * const port = 3000;
 * const preprocessedUrl = preprocessUrl(url, port);
 * console.log(preprocessedUrl); // http://localhost:3000/api/v2
 */
export const preprocessUrl = (url: string, port: number): string =>
  url.replace("${PORT}", port.toString());
