const useDate = ({ settings }) => {
  const { invoice_app_date_format } = settings;

  const dateFormat = invoice_app_date_format;

  return {
    dateFormat,
  };
};

module.exports = useDate;
