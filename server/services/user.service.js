const { User } = require("../models/user.model");
const { Role } = require("../models/role.model");
const bcrypt = require("bcrypt");
const { scopedFilter, withCompany } = require("../utils/companyScope");

const userSelect = "-password";
const bcryptHashPattern = /^\$2[aby]\$\d{2}\$/;
const populateRole = { path: "roleId", select: "key label permissions" };

exports.getUser = async (id) => {
  try {
    return await User.findById(id).select(userSelect).populate(populateRole);
  } catch (error) {
    throw new Error(error.message);
  }
};

exports.createUser = async (userData, currentUser) => {
  try {
    const payload = withCompany({ ...userData }, currentUser);
    if (payload.fullname && !payload.fullName) {
      payload.fullName = payload.fullname;
    }
    if (!payload.name && payload.fullName) {
      payload.name = payload.fullName;
    }
    if (payload.mobileNo && !payload.mobile) {
      payload.mobile = payload.mobileNo;
    }
    if (payload.photo && !payload.profileImage) {
      payload.profileImage = payload.photo;
    }
    if (payload.profileImage && !payload.photo) {
      payload.photo = payload.profileImage;
    }
    if (payload.password && !bcryptHashPattern.test(payload.password)) {
      payload.password = await bcrypt.hash(payload.password, 10);
    }
    if (payload.roleId) {
      const role = await Role.findById(payload.roleId);
      if (!role) {
        throw new Error("Role not found");
      }
      payload.role = role.key;
    }

    const newUser = await User.create(payload);
    return await User.findById(newUser._id).select(userSelect).populate(populateRole);
  } catch (error) {
    console.log(error);
    throw new Error(error.message || "Error creating user");
  }
};

exports.updateUser = async (id, userData) => {
  try {
    const payload = { ...userData };
    if (payload.fullname && !payload.fullName) {
      payload.fullName = payload.fullname;
    }
    if (!payload.name && payload.fullName) {
      payload.name = payload.fullName;
    }
    if (payload.mobileNo && !payload.mobile) {
      payload.mobile = payload.mobileNo;
    }
    if (payload.photo && !payload.profileImage) {
      payload.profileImage = payload.photo;
    }
    if (payload.profileImage && !payload.photo) {
      payload.photo = payload.profileImage;
    }
    if (payload.password && !bcryptHashPattern.test(payload.password)) {
      payload.password = await bcrypt.hash(payload.password, 10);
    }
    if (payload.roleId) {
      const role = await Role.findById(payload.roleId);
      if (!role) {
        throw new Error("Role not found");
      }
      payload.role = role.key;
    }

    return await User.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    }).select(userSelect).populate(populateRole);
  } catch (error) {
    throw new Error(error.message);
  }
};

exports.assignRole = async (id, roleId) => {
  try {
    const role = await Role.findById(roleId);
    if (!role) {
      throw new Error("Role not found");
    }

    return await User.findByIdAndUpdate(
      id,
      { roleId: role._id, role: role.key },
      { new: true, runValidators: true },
    )
      .select(userSelect)
      .populate(populateRole);
  } catch (error) {
    throw new Error(error.message);
  }
};

exports.deleteUser = async (id) => {
  try {
    return await User.findByIdAndDelete(id).select(userSelect).populate(populateRole);
  } catch (error) {
    throw new Error(error.message);
  }
};

exports.getAllUsers = async (currentUser) => {
  try {
    return await User.find(scopedFilter(currentUser)).select(userSelect).populate(populateRole).sort({ createdAt: -1 });
  } catch (error) {
    throw new Error(error.message);
  }
};

exports.findUserByEmail = async (email) => {
  try {
    const userData = await User.findOne({ email: email });
    return userData;
  } catch (error) {
    console.log(error);
    throw new Error("Error finding user by email");
  }
};
