const { City, Country, State } = require("../models/location.model");

const seedLocations = [
  {
    name: "India",
    code: "IN",
    states: [
      { name: "Gujarat", code: "GJ", cities: ["Ahmedabad", "Surat", "Vadodara", "Rajkot"] },
      { name: "Karnataka", code: "KA", cities: ["Bengaluru", "Mysuru", "Mangaluru", "Hubballi"] },
      { name: "Maharashtra", code: "MH", cities: ["Mumbai", "Pune", "Nagpur", "Nashik"] },
      { name: "Delhi", code: "DL", cities: ["New Delhi", "Dwarka", "Rohini", "Saket"] },
    ],
  },
  {
    name: "United States",
    code: "US",
    states: [
      { name: "California", code: "CA", cities: ["Los Angeles", "San Francisco", "San Diego", "San Jose"] },
      { name: "New York", code: "NY", cities: ["New York City", "Buffalo", "Rochester", "Albany"] },
      { name: "Texas", code: "TX", cities: ["Austin", "Dallas", "Houston", "San Antonio"] },
    ],
  },
  {
    name: "United Kingdom",
    code: "GB",
    states: [
      { name: "England", code: "ENG", cities: ["London", "Manchester", "Birmingham", "Leeds"] },
      { name: "Scotland", code: "SCT", cities: ["Edinburgh", "Glasgow", "Aberdeen", "Dundee"] },
    ],
  },
  {
    name: "Canada",
    code: "CA",
    states: [
      { name: "Ontario", code: "ON", cities: ["Toronto", "Ottawa", "Hamilton", "London"] },
      { name: "British Columbia", code: "BC", cities: ["Vancouver", "Victoria", "Surrey", "Burnaby"] },
    ],
  },
  {
    name: "Australia",
    code: "AU",
    states: [
      { name: "New South Wales", code: "NSW", cities: ["Sydney", "Newcastle", "Wollongong", "Parramatta"] },
      { name: "Victoria", code: "VIC", cities: ["Melbourne", "Geelong", "Ballarat", "Bendigo"] },
    ],
  },
];

async function ensureLocationSeed() {
  const countryCount = await Country.countDocuments();
  if (countryCount > 0) return;

  for (const countryData of seedLocations) {
    const country = await Country.findOneAndUpdate(
      { code: countryData.code },
      { name: countryData.name, code: countryData.code },
      { new: true, upsert: true, runValidators: true },
    );

    for (const stateData of countryData.states) {
      const state = await State.findOneAndUpdate(
        { country: country._id, name: stateData.name },
        { name: stateData.name, code: stateData.code, country: country._id },
        { new: true, upsert: true, runValidators: true },
      );

      await Promise.all(
        stateData.cities.map((cityName) =>
          City.findOneAndUpdate(
            { state: state._id, name: cityName },
            { name: cityName, state: state._id, country: country._id },
            { new: true, upsert: true, runValidators: true },
          ),
        ),
      );
    }
  }
}

function normalizeSearch(value) {
  return String(value || "").trim();
}

function exactNameRegex(value) {
  return new RegExp(`^${String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
}

exports.getCountries = async (search) => {
  await ensureLocationSeed();
  const query = {};
  const term = normalizeSearch(search);
  if (term) query.name = { $regex: term, $options: "i" };

  return Country.find(query).sort({ name: 1 });
};

exports.getStates = async ({ country, search }) => {
  await ensureLocationSeed();
  const countryTerm = normalizeSearch(country);
  if (!countryTerm) return [];

  const countryDoc = await Country.findOne({
    $or: [
      { _id: countryTerm.match(/^[a-f\d]{24}$/i) ? countryTerm : undefined },
      { name: exactNameRegex(countryTerm) },
      { code: countryTerm.toUpperCase() },
    ].filter((condition) => !Object.values(condition).includes(undefined)),
  });

  if (!countryDoc) return [];

  const query = { country: countryDoc._id };
  const term = normalizeSearch(search);
  if (term) query.name = { $regex: term, $options: "i" };

  return State.find(query).sort({ name: 1 }).populate("country", "name code");
};

exports.getCities = async ({ state, country, search }) => {
  await ensureLocationSeed();
  const stateTerm = normalizeSearch(state);
  if (!stateTerm) return [];

  const stateQuery = {
    $or: [
      { _id: stateTerm.match(/^[a-f\d]{24}$/i) ? stateTerm : undefined },
      { name: exactNameRegex(stateTerm) },
    ].filter((condition) => !Object.values(condition).includes(undefined)),
  };

  const countryTerm = normalizeSearch(country);
  if (countryTerm) {
    const countryDoc = await Country.findOne({
      $or: [{ name: exactNameRegex(countryTerm) }, { code: countryTerm.toUpperCase() }],
    });
    if (countryDoc) stateQuery.country = countryDoc._id;
  }

  const stateDoc = await State.findOne(stateQuery);
  if (!stateDoc) return [];

  const query = { state: stateDoc._id };
  const term = normalizeSearch(search);
  if (term) query.name = { $regex: term, $options: "i" };

  return City.find(query).sort({ name: 1 }).populate("state", "name code").populate("country", "name code");
};
