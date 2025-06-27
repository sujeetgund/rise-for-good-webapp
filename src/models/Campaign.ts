
import mongoose, { Schema, Document, models, Model, Types } from 'mongoose';

export interface ICampaign {
  _id: Types.ObjectId | string;
  title: string;
  description: string;
  category: string;
  organizerId: string; // Clerk User ID
  goalAmount: number;
  raisedAmount: number;
  donorsCount: number;
  imageUrl?: string; // Cloudinary URL
  imagePublicId?: string;
  location?: string;
  status: 'active' | 'completed' | 'draft';
  isVerified: boolean;
  contentWarning?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface ICampaignDocument extends Omit<ICampaign, '_id' | 'createdAt' | 'updatedAt'>, Document {}

const CampaignSchema: Schema<ICampaignDocument> = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 150 },
    description: { type: String, required: true, trim: true, maxlength: 50000 },
    category: { type: String, required: true },
    organizerId: { type: String, required: true, index: true },
    goalAmount: { type: Number, required: true, min: 1 },
    raisedAmount: { type: Number, default: 0 },
    donorsCount: { type: Number, default: 0 },
    imageUrl: { type: String, trim: true },
    imagePublicId: { type: String },
    location: { type: String, trim: true },
    status: {
      type: String,
      enum: ['active', 'completed', 'draft'],
      default: 'active',
    },
    isVerified: { type: Boolean, default: false },
    contentWarning: { type: String, trim: true, maxlength: 200 },
  },
  { 
    timestamps: true, // Adds createdAt and updatedAt automatically
    toJSON: {
      transform: function (doc, ret) {
        ret.id = ret._id?.toString();
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

const CampaignModel: Model<ICampaignDocument> =
  models.Campaign || mongoose.model<ICampaignDocument>('Campaign', CampaignSchema);

export default CampaignModel;
