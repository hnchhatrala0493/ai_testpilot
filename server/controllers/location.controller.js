const locationService = require("../services/location.service");

exports.getCountries = async (req, res) => {
  try {
    const countries = await locationService.getCountries(req.query.search);
    res.status(200).json({ result: countries });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getStates = async (req, res) => {
  try {
    const states = await locationService.getStates({
      country: req.query.country,
      search: req.query.search,
    });
    res.status(200).json({ result: states });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getCities = async (req, res) => {
  try {
    const cities = await locationService.getCities({
      country: req.query.country,
      state: req.query.state,
      search: req.query.search,
    });
    res.status(200).json({ result: cities });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
