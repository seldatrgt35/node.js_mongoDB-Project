var express = require('express');
var router = express.Router();
const is = require('is_js');
const bcrypt = require('bcrypt-nodejs');
const Users = require('../db/models/Users');
const Response = require('../lib/Response');
const CustomError = require('../lib/Error')
const Enum = require('../config/Enum')
const mongoose = require('mongoose');

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

    let password = bcrypt.hashSync(body.password, bcrypt.genSaltSync(8), null);

    await Users.create({
      email: body.email,
      password,
      is_active: true,
      first_name: body.first_name,
      last_name: body.last_name,
      phone_number: body.phone_number

    });


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
    if (!body.id) { throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Validation error!", "id field must be filled"); }
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
    await Users.updateOne({ _id: body._id }, updates);
    res.json(Response.successResponse({ success: true }));

  } catch (error) {
    let errorResponse = Response.errorResponse(err);
    res.status(errorResponse.code).json(errorResponse
    );
  }
});


module.exports = router;
