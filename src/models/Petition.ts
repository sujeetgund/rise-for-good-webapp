
import mongoose, { Schema, Document, models, Model, Types } from 'mongoose';

export interface IPetition {
  _id: Types.ObjectId | string; // Allow string for toJSON/toObject results
  title: string;
  description: string;
  category: string;
  authorId: string; // Clerk User ID
  goal: number;
  supportersCount: number;
  imageUrl?: string; // Cloudinary URL
  location?: string;
  status: 'active' | 'completed' | 'draft';
  contentWarning?: string;
  createdAt: Date | string; // Allow string for toJSON/toObject results
  updatedAt: Date | string; // Allow string for toJSON/toObject results
}

export interface IPetitionDocument extends Omit<IPetition, '_id' | 'createdAt' | 'updatedAt'>, Document {}

const PetitionSchema: Schema<IPetitionDocument> = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 150 },
    description: { type: String, required: true, trim: true, maxlength: 5000 },
    category: { type: String, required: true },
    authorId: { type: String, required: true, index: true },
    goal: { type: Number, required: true, min: 1 },
    supportersCount: { type: Number, default: 0 },
    imageUrl: { type: String, trim: true },
    location: { type: String, trim: true },
    status: {
      type: String,
      enum: ['active', 'completed', 'draft'],
      default: 'active',
    },
    contentWarning: { type: String, trim: true, maxlength: 200 },
  },
  { 
    timestamps: true, // Adds createdAt and updatedAt automatically
    toJSON: {
      transform: function (doc, ret) {
        ret.id = ret._id?.toString(); // Ensure _id is converted to id string
        delete ret._id;
        delete ret.__v;
      }
    },
    toObject: {
      transform: function (doc, ret) {
        ret.id = ret._id?.toString();
        delete ret._id;
        delete ret.__v;
      }
    }
  }
);

const PetitionModel: Model<IPetitionDocument> =
  models.Petition || mongoose.model<IPetitionDocument>('Petition', PetitionSchema);

export default PetitionModel;
