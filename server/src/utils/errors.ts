import { Response } from 'express';

export function handleControllerError(res: Response, error: any, defaultMessage: string = 'An unexpected server error occurred.'): void {
  // Mask sensitive database traces and connection strings
  const rawMsg = error?.message || '';
  console.error('[Internal Error]:', rawMsg, error?.stack || '');

  let sanitizedMessage = defaultMessage;
  if (rawMsg.includes('duplicate key value') || rawMsg.includes('UNIQUE constraint')) {
    sanitizedMessage = 'A record with this unique value already exists.';
  } else if (rawMsg.includes('foreign key constraint') || rawMsg.includes('REFERENCES')) {
    sanitizedMessage = 'Referenced entity does not exist or has active dependencies.';
  }

  res.status(500).json({
    success: false,
    error: sanitizedMessage
  });
}
