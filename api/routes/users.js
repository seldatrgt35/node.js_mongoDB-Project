var express = require('express');
var router = express.Router();
const is = require('is_js');
const bcrypt = require('bcrypt-nodejs');
const Users = require('../db/models/Users');
const Response = require('../lib/Response');
const CustomError = require('../lib/Error')
const Enum = require('../config/Enum')
const mongoose = require('mongoose');
const UserRoles = require('../db/models/UserRoles');
const Roles = require('../db/models/Roles');
const AuditLogs = require("../lib/AuditLogs");

/* GET users listing. */
router.get('/', async (req, res) => {

  try {
    let users = await User.find();
    res.json(Response.successResponse(users));

  } catch (err) {
    let errorResponse = Response.errorResponse(err);
    res.status(errorResponse.code).json(errorResponse);
  }

});

router.post('/add', async (req, res) => {
  let body = req.body;
  try {
    if (!body.email) { throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Validation error!", "email field must be filled"); }

    if (!is.email(body.email)) { throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Validation error!", "email field must be a valid email address"); }

    if (!body.password) { throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Validation error!", "password field must be filled"); }

    if (body.password.length < Enum.PASS_LENGTH) {
      throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Validation error!", "password field must be at least 8 characters");
    }


    if (!body.roles || body.roles.length === 0 || !Array.isArray(body.roles)) {
      throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Validation error!", "roles field must be filled");
    }

    let roles = await Roles.find({ _id: { $in: body.roles } });

    if (roles.length == 0) {
      throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Validation error!", "roles field is invalid");
    }

    let password = bcrypt.hashSync(body.password, bcrypt.genSaltSync(8), null);

    let user = await Users.create({
      email: body.email,
      password,
      is_active: true,
      first_name: body.first_name,
      last_name: body.last_name,
      phone_number: body.phone_number

    });

    for (let i = 0; i < roles.length; i++) {
      await UserRoles.create({
        user_id: user._id,
        role_id: roles[i]._id
      });
    }


    res.status(Enum.HTTP_CODES.CREATED).json(Response.successResponse({ success: true }, Enum.HTTP_CODES.CREATED));

  } catch (err) {
    let errorResponse = Response.errorResponse(err);
    res.status(errorResponse.code).json(errorResponse);
  }
}
);


router.post('/update', async (req, res) => {
  let body = req.body;
  let updates = {};
  try {
    if (!body._id) { throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Validation error!", "id field must be filled"); }
    if (body.password && body.password.length >= Enum.PASS_LENGTH) {
      updates.password = bcrypt.hashSync(body.password, bcrypt.genSaltSync(8), null);
    }
    if (body.first_name) {
      updates.first_name = body.first_name;
    }
    if (body.last_name) {
      updates.last_name = body.last_name;
    }
    if (body.phone_number) {
      updates.phone_number = body.phone_number;
    }
    if (typeof body.is_active === "boolean") {
      updates.is_active = body.is_active;
    }

    if (Array.isArray(body.roles) && body.roles.length > 0) {

      let userRoles = await UserRoles.find({ user_id: body._id });

      let removedRoles = userRoles.filter(x => !body.roles.includes(x.role_id));
      let newRoles = body.roles.filter(x => !userRoles.map(r => r.role_id).includes(x));

      if (removedRoles.length > 0) {
        await UserRoles.deleteMany({ _id: { $in: removedRoles.map(x => x._id.toString()) } });
      }

      if (newRoles.length > 0) {
        for (let i = 0; i < newRoles.length; i++) {
          let userRole = new UserRoles({
            role_id: newRoles[i],
            user_id: body._id
          });

          await userRole.save();
        }
      }

    }

    await Users.updateOne({ _id: body._id }, updates);

    res.json(Response.successResponse({ success: true }));

  } catch (err) {
    let errorResponse = Response.errorResponse(err);
    res.status(errorResponse.code).json(errorResponse
    );
  }
});


router.post('/delete', async (req, res) => {
  let body = req.body;
  try {

    if (!body.id) { throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Validation error!", "id field must be filled"); }

    await Users.deleteOne
      ({ _id: body.id });
    await UserRoles.deleteMany({ user_id: body._id });

    res.json(Response.successResponse({ success: true }));

  } catch (err) {
    let errorResponse = Response.errorResponse(err);
    res.status(errorResponse.code).json(errorResponse);

  }
});

router.post('/register', async (req, res) => {
  let body = req.body;
  try {

    let user = await Users.findOne({});

    if (user) {
      return res.sendStatus(Enum.HTTP_CODES.NOT_FOUND);
    }



    if (!body.email) { throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Validation error!", "email field must be filled"); }

    if (!is.email(body.email)) { throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Validation error!", "email field must be a valid email address"); }

    if (!body.password) { throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Validation error!", "password field must be filled"); }

    if (body.password.length < Enum.PASS_LENGTH) {
      throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Validation error!", "password field must be at least 8 characters");
    }

    let password = bcrypt.hashSync(body.password, bcrypt.genSaltSync(8), null);

    let createdUser = await Users.create({
      email: body.email,
      password,
      is_active: true,
      first_name: body.first_name,
      last_name: body.last_name,
      phone_number: body.phone_number

    });

    let role = await Roles.create({
      role_name: Enum.SUPER_ADMIN,
      is_active: true,
      created_by: createdUser._id
    });


    await UserRoles.create({
      user_id: createdUser._id,
      role_id: role._id
    });

    res.status(Enum.HTTP_CODES.CREATED).json(Response.successResponse({ success: true }, Enum.HTTP_CODES.CREATED));

  } catch (err) {
    let errorResponse = Response.errorResponse(err);
    res.status(errorResponse.code).json(errorResponse);
  }
}
);


module.exports = router;
