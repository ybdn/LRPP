import { ValueTransformer } from "typeorm";

export const isoDateTransformer: ValueTransformer = {
  to: (value?: Date | null) => (value ? value.toISOString() : null),
  from: (value?: string | null) => (value ? new Date(value) : null),
};

export const jsonTransformer: ValueTransformer = {
  to: (value?: Record<string, unknown> | null) =>
    value && Object.keys(value).length > 0 ? JSON.stringify(value) : null,
  from: (value?: string | null) => {
    if (!value) return null;
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  },
};
