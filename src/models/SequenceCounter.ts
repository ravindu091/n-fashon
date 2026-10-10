import mongoose, { Schema, model, models, Document, Model } from 'mongoose'

// ─── SequenceCounter ─────────────────────────────────────────────────────────
export interface ISequenceCounter extends Document {
  key: string   // e.g. "TSH", "BAT-20261010", "SALE", "PO"
  seq: number
}

const SequenceCounterSchema = new Schema<ISequenceCounter>({
  key: { type: String, required: true, unique: true },
  seq: { type: Number, default: 0 },
})

export const SequenceCounter: Model<ISequenceCounter> =
  models.SequenceCounter ?? model<ISequenceCounter>('SequenceCounter', SequenceCounterSchema)

/**
 * Atomically increment and return the next sequence number for a given key.
 * Safe under concurrent requests.
 */
export async function nextSequence(key: string): Promise<number> {
  const doc = await SequenceCounter.findOneAndUpdate(
    { key },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  )
  return doc!.seq
}
