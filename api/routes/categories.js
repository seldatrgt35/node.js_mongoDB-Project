var express = require('express');
var router = express.Router();
const Categories = require('../db/models/Categories');
const Response = require('../lib/Response');
const CustomError = require('../lib/Error')
const Enum = require('../config/Enum')
const mongoose = require('mongoose');
const AuditLogs = require("../lib/AuditLogs");

/* GET users listing. */
router.get('/', async (req, res, next) => {

    try {
        let categories = await Categories.find();
        res.json(Response.successResponse(categories));
    } catch (err) {
        let errorResponse = Response.errorResponse(err);
        res.status(errorResponse.code).json(Response.errorResponse(err));
    }
})

router.post('/add', async (req, res) => {
    let body = req.body;
    try {
        if (!body.name) {
            throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Validation error!", "name field must be filled");
        }

        // Geçici bir ObjectId oluşturuyoruz
        let defaultUserId = new mongoose.Types.ObjectId();

        let category = new Categories({
            name: body.name,
            is_active: true,
            created_by: defaultUserId  // Geçici ObjectId
        });
        await category.save();

        AuditLogs.info(req.user?.email, "Category added", "Add", category);
        res.json(Response.successResponse({ success: true }));


    } catch (err) {
        let errorResponse = Response.errorResponse(err);
        res.status(errorResponse.code).json(errorResponse);
    }
});

router.post('/update', async (req, res) => {
    let body = req.body;
    try {
        if (!body._id) {
            throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Validation error!", "id field must be filled");
        }
        let updates = {};
        if (body.name) { updates.name = body.name; }
        if (typeof body.is_active === "boolean") { updates.is_active = body.is_active; }
        await Categories.updateOne({ _id: body._id }, updates);
        AuditLogs.info(req.user?.email, "Category added", "Updated", { _id: body._id, ...updates });

        res.json(Response.successResponse({ success: true }));

    } catch (err) {
        let errorResponse = Response.errorResponse(err);
        res.status(errorResponse.code).json(errorResponse);
    }
});

router.post('/delete', async (req, res) => {
    let body = req.body;
    try {
        if (!body._id) {
            throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Validation error!", "id field must be filled");
        }
        await Categories.deleteOne({ _id: body._id });
        AuditLogs.info(req.user?.email, "Category added", "deleted", { _id: body._id });

        res.json(Response.successResponse({ success: true }));

    } catch (err) {
        let errorResponse = Response.errorResponse(err);
        res.status(errorResponse.code).json(errorResponse);
    }
});





module.exports = router;
