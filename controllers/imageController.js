const express = require('express');
const multer = require('multer');
const router = express.Router();
const fs = require('fs');
const Image = require('../models/image');


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'file-storage');
	},
	filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now());
	},
});

const upload = multer({ storage: storage });

router.post('/imageUpload', upload.array('file-image'), (req, res, next) => {
	console.log(req.files);
	fs.rename(req.files.path, 'file-storage/' + req.files.originalname, (err) => {
		if (err) {
			res.send('Unable to Upload Files');
		} else {
			res.send('File Upload Success');
		}
	});
});

module.exports = router;