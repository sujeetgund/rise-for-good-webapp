
import mongoose, { Schema, Document, models, Model } from 'mongoose';

export interface IUserCredit extends Document {
  userId: string; // Clerk User ID
  freeCredits: number;
  freeCreditsResetMonthYear: string; // Format: "YYYY-MM"
  purchasedCredits: number;
  lastUpdatedAt: Date;
}

const UserCreditSchema: Schema<IUserCredit> = new Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  freeCredits: {
    type: Number,
    required: true,
    default: 0,
  },
  freeCreditsResetMonthYear: {
    type: String,
    required: true,
  },
  purchasedCredits: {
    type: Number,
    required: true,
    default: 0,
  },
  lastUpdatedAt: {
    type: Date,
    default: Date.now,
  },
});

UserCreditSchema.pre<IUserCredit>('save', function (next) {
  this.lastUpdatedAt = new Date();
  next();
});

// Check if the model already exists before defining it
const UserCredit: Model<IUserCredit> = models.UserCredit || mongoose.model<IUserCredit>('UserCredit', UserCreditSchema);

export default UserCredit;
