import mongoose, { Model, Schema } from "mongoose";

export const createModel = <T = any>(
  modelName: string,
  schema: Schema<T>,
): Model<T> => {
  // Check if model already exists to avoid OverwriteModelError
  if (mongoose.models[modelName]) {
    return mongoose.models[modelName] as Model<T>;
  }

  return mongoose.model<T>(modelName, schema);
};
