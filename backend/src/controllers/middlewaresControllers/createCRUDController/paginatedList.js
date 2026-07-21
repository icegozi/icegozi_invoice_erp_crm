const paginatedList = async (Model, req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.items, 10) || 10));
  const skip = page * limit - limit;

  const { sortBy = 'enabled', sortValue = -1, filter, equal } = req.query;
  const allowedSortFields = ['enabled', 'created', 'updated', 'name', 'number', 'date'];
  const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'created';
  const safeSortValue = String(sortValue) === '1' ? 1 : -1;

  const fieldsArray = req.query.fields ? req.query.fields.split(',').slice(0, 5) : [];

  let fields;

  fields = fieldsArray.length === 0 ? {} : { $or: [] };

  const searchableFields = ['name', 'email', 'phone', 'number', 'status', 'taxName'];
  for (const field of fieldsArray.filter((field) => searchableFields.includes(field))) {
    fields.$or.push({ [field]: { $regex: new RegExp(String(req.query.q || '').slice(0, 100), 'i') } });
  }

  // Build filter condition safely: reject MongoDB operators in values
  let filterCondition = {};
  const allowedFilterFields = ['enabled', 'status', 'paymentStatus', 'client', 'assigned'];
  if (filter && equal !== undefined && allowedFilterFields.includes(filter)) {
    if (typeof equal === 'object') {
      return res.status(400).json({
        success: false,
        result: [],
        message: 'Invalid filter value',
      });
    }
    filterCondition = { [filter]: equal };
  }

  //  Query the database for a list of all results
  const resultsPromise = Model.find({
    removed: false,
    ...filterCondition,
    ...fields,
  })
    .skip(skip)
    .limit(limit)
    .sort({ [safeSortBy]: safeSortValue })
    .populate()
    .exec();

  // Counting the total documents
  const countPromise = Model.countDocuments({
    removed: false,
    ...filterCondition,
    ...fields,
  });
  // Resolving both promises
  const [result, count] = await Promise.all([resultsPromise, countPromise]);

  // Calculating total pages
  const pages = Math.ceil(count / limit);

  // Getting Pagination Object
  const pagination = { page, pages, count };
  if (count > 0) {
    return res.status(200).json({
      success: true,
      result,
      pagination,
      message: 'Successfully found all documents',
    });
  } else {
    return res.status(203).json({
      success: true,
      result: [],
      pagination,
      message: 'Collection is Empty',
    });
  }
};

module.exports = paginatedList;
