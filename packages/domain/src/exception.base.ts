export interface SerializedException {
  message: string
  code: string
  correlationId?: string
  stack?: string
  cause?: string
  metadata?: unknown
  /**
   * ^ Consider adding optional `metadata` object to
   * exceptions (if language doesn't support anything
   * similar by default) and pass some useful technical
   * information about the exception when throwing.
   * This will make debugging easier.
   */
}

/**
 * Base class for custom exceptions.
 *
 * @abstract
 * @class ExceptionBase
 * @extends {Error}
 */
export abstract class ExceptionBase extends Error {
  abstract code: string

  public readonly correlationId?: string

  /**
   *
   * @param message
   * @param correlationId
   * @param cause
   * @param metadata
   */
  constructor(
    readonly message: string,
    correlationId?: string,
    readonly cause?: Error,
    readonly metadata?: unknown,
  ) {
    super(message)
    Error.captureStackTrace(this, this.constructor)
    this.correlationId = correlationId
  }

  /**
   * By default in NodeJS Error objects are not
   * serialized properly when sending plain objects
   * to external processes. This method is a workaround.
   * Keep in mind not to return a stack trace to user when in production.
   * https://iaincollins.medium.com/error-handling-in-javascript-a6172ccdf9af
   */
  toJSON(): SerializedException {
    return {
      message: this.message,
      code: this.code,
      stack: this.stack,
      correlationId: this.correlationId,
      cause: JSON.stringify(this.cause),
      metadata: this.metadata,
    }
  }
}
