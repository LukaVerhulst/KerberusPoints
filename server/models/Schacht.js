import mongoose from 'mongoose';

const schachtSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    points: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true,
    collection: 'schachten' 
});

// Add indexes for frequently queried fields
schachtSchema.index({ points: -1 }); // For sorting leaderboard
schachtSchema.index({ name: 1 }); // For name lookups (unique already creates an index, but explicit is good)

export default mongoose.model('Schacht', schachtSchema);