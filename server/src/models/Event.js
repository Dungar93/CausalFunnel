import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema(
  {
    session_id: {
      type: String,
      required: [true, 'session_id is required'],
      trim: true,
      index: true,
    },
    event_type: {
      type: String,
      required: [true, 'event_type is required'],
      enum: {
        values: ['page_view', 'click'],
        message: '{VALUE} is not a valid event_type. Allowed: page_view, click',
      },
    },
    page_url: {
      type: String,
      required: [true, 'page_url is required'],
      trim: true,
      index: true,
    },
    timestamp: {
      type: Date,
      required: [true, 'timestamp is required'],
      default: Date.now,
    },
    coordinates: {
      x: {
        type: Number,
        required: function () {
          return this.event_type === 'click';
        },
      },
      y: {
        type: Number,
        required: function () {
          return this.event_type === 'click';
        },
      },
    },
    viewport: {
      width: { type: Number },
      height: { type: Number },
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  }
);

// Compound indexes for optimal query performance
eventSchema.index({ session_id: 1, timestamp: 1 });
eventSchema.index({ page_url: 1, event_type: 1 });
eventSchema.index({ timestamp: -1 });

const Event = mongoose.model('Event', eventSchema);

export default Event;
