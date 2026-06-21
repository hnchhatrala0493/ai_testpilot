const { TestCase } = require("../models/testCase.model");
const { scopedFilter, withCompany } = require("../utils/companyScope");

exports.getTestCases = async (req, res) => {
  try {
    const filter = {};
    if (req.query.projectId || req.query.project) filter.projectId = req.query.projectId || req.query.project;
    if (req.query.type) filter.type = req.query.type;

    const testCases = await TestCase.find(scopedFilter(req.user, filter))
      .populate("projectId", "projectName")
      .sort({ createdAt: -1 });
    res.status(200).json({ result: testCases });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getTestCaseById = async (req, res) => {
  try {
    const testCase = await TestCase.findOne(scopedFilter(req.user, { _id: req.params.id }))
      .populate("projectId", "projectName");
    if (!testCase) return res.status(404).json({ message: "Test case not found" });
    res.status(200).json({ result: testCase });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateTestCase = async (req, res) => {
  try {
    const testCase = await TestCase.findOneAndUpdate(
      scopedFilter(req.user, { _id: req.params.id }),
      withCompany(req.body, req.user),
      { new: true, runValidators: true },
    );
    if (!testCase) return res.status(404).json({ message: "Test case not found" });
    res.status(200).json({ result: testCase, message: "Test case updated successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteTestCase = async (req, res) => {
  try {
    const testCase = await TestCase.findOneAndDelete(scopedFilter(req.user, { _id: req.params.id }));
    if (!testCase) return res.status(404).json({ message: "Test case not found" });
    res.status(200).json({ message: "Test case deleted successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
