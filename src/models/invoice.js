const mongoose = require("mongoose");

const invoiceSchema = mongoose.Schema({
  stripeCustomerId: { type: String },
  stripe_subscription_id: {
    type: String,
  },
  stripe_pdf_url: { type: String },
  stripe_invoice_id: { type: String },
  total_Paid: { type: Number },
});



const invoice = mongoose.model("invoice", invoiceSchema);

module.exports = invoice;