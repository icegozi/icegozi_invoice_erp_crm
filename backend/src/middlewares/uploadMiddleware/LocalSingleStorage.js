// LocalSingleStorage is kept as an alias for backwards compatibility.
// The implementation lives in ./singleStorageUpload to avoid two near-identical
// files drifting out of sync (they previously diverged and introduced a
// filename bug). Import singleStorageUpload directly for new code.
module.exports = require('./singleStorageUpload');
