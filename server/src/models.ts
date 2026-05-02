import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const UploadedResumeSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, index: true, ref: 'UserProfile' },
    fileName: { type: String, required: true, trim: true },
    mimeType: { type: String, required: true, trim: true },
    uri: { type: String, required: true, trim: true },
    fileHash: { type: String, required: true, trim: true },
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
      achievements: [{ type: String }],
      projects: [
        {
          name: { type: String, required: true },
          description: { type: String, default: '' },
          url: { type: String, default: null },
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

UploadedResumeSchema.index({ userId: 1, fileHash: 1 }, { unique: true });

const UserProfileSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, index: true, trim: true, lowercase: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true },
    sessionToken: { type: String, default: null },
    sessionExpiresAt: { type: Date, default: null },
    /** Clerk user id when using Clerk SSO; omit for email/password-only users. Never store null—Mongo unique indexes duplicate on null. */
    clerkUserId: { type: String },
  },
  { timestamps: true },
);

// Replace legacy unique(clerkUserId) that duplicated on null: only index non-empty strings.
UserProfileSchema.index(
  { clerkUserId: 1 },
  {
    unique: true,
    partialFilterExpression: { clerkUserId: { $gt: '' } },
  },
);

const SavedJobAnalysisSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, index: true, ref: 'UserProfile' },
    industry: { type: String, required: true, trim: true },
    jobRole: { type: String, required: true, trim: true },
    requiredSkills: [{ type: String, default: [] }],
    yearsOfExperience: { type: String, default: '', trim: true },
    strengths: { type: String, default: '', trim: true },
    otherRequirements: { type: String, default: '', trim: true },
    rankedCandidateCount: { type: Number, required: true, min: 0 },
    rankedResumes: [
      {
        id: { type: String, required: true, trim: true },
        name: { type: String, required: true, trim: true },
        title: { type: String, default: null },
        location: { type: String, default: null },
        skills: [{ type: String }],
        experienceLevel: { type: String, required: true, trim: true },
        matchScore: { type: Number, required: true, min: 0 },
        summary: { type: String, default: null },
        rankedAt: { type: Date, required: true },
      },
    ],
  },
  { timestamps: true },
);

export type UploadedResumeDocument = InferSchemaType<typeof UploadedResumeSchema>;
export type UserProfileDocument = InferSchemaType<typeof UserProfileSchema>;
export type SavedJobAnalysisDocument = InferSchemaType<typeof SavedJobAnalysisSchema>;

export const UploadedResumeModel =
  mongoose.models.UploadedResume ||
  mongoose.model<UploadedResumeDocument>('UploadedResume', UploadedResumeSchema);

export const UserProfileModel =
  mongoose.models.UserProfile || mongoose.model<UserProfileDocument>('UserProfile', UserProfileSchema);

export const SavedJobAnalysisModel =
  mongoose.models.SavedJobAnalysis ||
  mongoose.model<SavedJobAnalysisDocument>('SavedJobAnalysis', SavedJobAnalysisSchema);

/**
 * Drops the old Mongo unique index on clerkUserId that treats many nulls as duplicates (E11000),
 * removes stored nulls, then syncs schema indexes (partial unique on non-empty clerkUserId).
 */
export async function ensureUserProfileIndexes() {
  const coll = mongoose.connection.collection('userprofiles');
  try {
    await coll.dropIndex('clerkUserId_1');
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (!/not found|ns not found/i.test(msg)) {
      console.warn('[database]: drop clerkUserId_1:', msg);
    }
  }
  await UserProfileModel.updateMany({ clerkUserId: null }, { $unset: { clerkUserId: '' } });
  await UserProfileModel.syncIndexes();
}
