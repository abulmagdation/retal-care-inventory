import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const userSchema = new Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ['admin', 'storekeeper', 'viewer'], default: 'storekeeper' },
  active: { type: Boolean, default: true },
  lastLoginAt: Date,
  deletedAt: { type: Date, default: null, index: true },
  deletedBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

const imageSchema = new Schema({
  fileId: { type: Schema.Types.ObjectId, required: true }, filename: String, contentType: String,
  deletedAt: { type: Date, default: null },
}, { _id: false });

const deviceSchema = new Schema({
  name: { type: String, required: true, trim: true, index: true },
  serialNumber: { type: String, required: true, unique: true, trim: true, uppercase: true, index: true },
  category: { type: String, default: 'عام', trim: true, index: true },
  manufacturer: { type: String, trim: true }, model: { type: String, trim: true },
  status: { type: String, enum: ['available', 'rented', 'maintenance', 'reserved'], default: 'available', index: true },
  location: { type: String, default: 'المخزن الرئيسي' },
  condition: { type: String, enum: ['new', 'excellent', 'good', 'fair', 'needs_repair'], default: 'excellent' },
  purchaseDate: Date, purchasePrice: Number, notes: String, accessories: String, images: [imageSchema],
  archived: { type: Boolean, default: false, index: true },
  deletedAt: { type: Date, default: null },
  deletedBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });
deviceSchema.index({ name: 'text', serialNumber: 'text', category: 'text', manufacturer: 'text', model: 'text' });
deviceSchema.set('toJSON', { transform: (_doc, value) => {
  value.images = value.images?.filter((image) => !image.deletedAt) || [];
  return value;
} });

const customerSchema = new Schema({
  name: { type: String, required: true }, phone: { type: String, required: true },
  nationalId: String, address: String,
}, { _id: false });

const rentalSchema = new Schema({
  device: { type: Schema.Types.ObjectId, ref: 'Device', required: true, index: true },
  customer: { type: customerSchema, required: true },
  startDate: { type: Date, required: true }, endDate: { type: Date, required: true, index: true },
  dailyRate: { type: Number, default: 0, min: 0 }, deposit: { type: Number, default: 0, min: 0 },
  status: { type: String, enum: ['active', 'completed', 'overdue', 'cancelled'], default: 'active', index: true },
  returnedAt: Date, conditionOut: String, conditionIn: String, notes: String, returnNotes: String,
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });
rentalSchema.index({ status: 1, endDate: 1 });

const movementSchema = new Schema({
  device: { type: Schema.Types.ObjectId, ref: 'Device', required: true, index: true },
  rental: { type: Schema.Types.ObjectId, ref: 'Rental' },
  type: { type: String, enum: ['added', 'rented', 'returned', 'maintenance_in', 'maintenance_out', 'transferred', 'updated', 'extended'], required: true },
  fromStatus: String, toStatus: String, details: String,
  performedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

export const User = model('User', userSchema);
export const Device = model('Device', deviceSchema);
export const Rental = model('Rental', rentalSchema);
export const Movement = model('Movement', movementSchema);

const auditLogSchema = new Schema({
  actor: { type: Schema.Types.ObjectId, ref: 'User' },
  actorName: { type: String, required: true },
  actorEmail: String,
  action: { type: String, required: true, index: true },
  entityType: { type: String, required: true, index: true },
  entityId: { type: Schema.Types.ObjectId, index: true },
  label: String,
  details: Schema.Types.Mixed,
}, { timestamps: true });
auditLogSchema.index({ createdAt: -1 });
export const AuditLog = model('AuditLog', auditLogSchema);
