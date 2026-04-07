const mongoose = require("mongoose");

const machineSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      required: true
    },
    machine_name: {
      type: String,
      required: true,
      trim: true
    },
    long: {
      type: Number,
      required: true
    },
    lat: {
      type: Number,
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    }
  },
  {
    timestamps: true
  }
);

const Machine = mongoose.model("Machine", machineSchema);

module.exports = Machine; 