var mongoose = require('mongoose');

var assetSchema = new mongoose.Schema({
	id: String,
	flag_stock: String,
	flag_bond: String,
	flag_index: String,
	flag_currency: String,
	flag_commidities: String,
});

module.exports = mongoose.model('Asset', assetSchema);
