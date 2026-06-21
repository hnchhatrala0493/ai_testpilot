const userService = require("../services/user.service");

exports.getUser = async (req, res) => {
  try {
    const userData = await userService.getUser(req.params.id);
    if (!userData) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json({ result: userData });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

exports.createUser = async (req, res) => {
  try {
    const userData = await userService.createUser(req.body, req.user);
    return res
      .status(201)
      .json({ result: userData, message: "User created successfully" });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const userData = await userService.updateUser(req.params.id, req.body);
    if (!userData) {
      return res.status(404).json({ message: "User not found" });
    }
    return res
      .status(200)
      .json({ result: userData, message: "User updated successfully" });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

exports.assignRole = async (req, res) => {
  try {
    const { roleId } = req.body;
    if (!roleId) {
      return res.status(400).json({ message: "roleId is required" });
    }

    const userData = await userService.assignRole(req.params.id, roleId);
    if (!userData) {
      return res.status(404).json({ message: "User not found" });
    }

    return res
      .status(200)
      .json({ result: userData, message: "User role assigned successfully" });
  } catch (error) {
    const status = error.message === "Role not found" ? 404 : 400;
    return res.status(status).json({ message: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const userData = await userService.deleteUser(req.params.id);
    if (!userData) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await userService.getAllUsers(req.user);
    return res.status(200).json({ result: users });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};
