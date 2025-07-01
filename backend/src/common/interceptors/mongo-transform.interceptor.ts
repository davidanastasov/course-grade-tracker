import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class MongoTransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(map((data) => this.transformResponse(data, new WeakSet())));
  }

  private transformResponse(obj: unknown, visited: WeakSet<object> = new WeakSet()): unknown {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (typeof obj !== 'object') {
      return obj;
    }

    // Handle Mongoose documents by converting to plain objects
    if (obj && typeof obj === 'object' && typeof (obj as any).toObject === 'function') {
      obj = (obj as any).toObject();
    }

    // Prevent infinite recursion with circular references
    if (visited.has(obj as object)) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.transformResponse(item, visited));
    }

    // Mark this object as visited
    visited.add(obj as object);

    const transformed = { ...(obj as Record<string, unknown>) };

    // Add id field if _id exists (keep _id intact)
    if ('_id' in transformed && transformed._id) {
      transformed.id = transformed._id.toString();
    }

    // Only transform plain objects and avoid Mongoose internals
    Object.keys(transformed).forEach((key) => {
      const value = transformed[key];
      if (
        value &&
        typeof value === 'object' &&
        !key.startsWith('$') && // Skip Mongoose internal properties
        key !== '_id' &&
        key !== '__v' && // Skip these specific fields to avoid recursion
        !(value instanceof Date) && // Skip Date objects
        !Buffer.isBuffer(value) // Skip Buffer objects
      ) {
        transformed[key] = this.transformResponse(value, visited);
      }
    });

    return transformed;
  }
}
