import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const UploadedResumeSchema = new Schema(
  {
    fileName: { type: String, required: true, trim: true },
    mimeType: { type: String, required: true, trim: true },
    uri: { type: String, required: true, trim: true },
    rawText: { type: String, default: '' },
    parsed: {
      personalInfo: {
        firstName: { type: String, required: true, default: 'Unknown' },
        lastName: { type: String, required: true, default: 'Candidate' },
        email: { type: String, default: null },
        phone: { type: String, default: null },
        location: { type: String, default: null },
      },
      skills: [{ type: String }],
      techStack: [{ type: String }],
      experienceLevel: { type: String, default: 'Junior' },
      education: [
        {
          institution: { type: String, required: true },
          degree: { type: String, required: true },
          year: { type: Number, default: null },
        },
      ],
      experience: [
        {
          company: { type: String, required: true },
          title: { type: String, required: true },
          startDate: { type: String, default: null },
          endDate: { type: String, default: null },
          current: { type: Boolean, default: false },
          duration: { type: String, default: null },
        },
      ],
      meta: {
        confidenceScore: { type: Number, default: 0.8 },
        processingTimeMs: { type: Number, default: 0 },
      },
    },
  },
  { timestamps: true },
);

const UserProfileSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, index: true, trim: true, lowercase: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true },
    sessionToken: { type: String, default: null },
    sessionExpiresAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export type UploadedResumeDocument = InferSchemaType<typeof UploadedResumeSchema>;
export type UserProfileDocument = InferSchemaType<typeof UserProfileSchema>;

export const UploadedResumeModel =
  mongoose.models.UploadedResume ||
  mongoose.model<UploadedResumeDocument>('UploadedResume', UploadedResumeSchema);

export const UserProfileModel =
  mongoose.models.UserProfile || mongoose.model<UserProfileDocument>('UserProfile', UserProfileSchema);
