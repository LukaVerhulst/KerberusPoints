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

export default mongoose.model('Schacht', schachtSchema);