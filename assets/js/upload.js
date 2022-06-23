let http = require("http");
let fs = require("fs");
let formidable = require("formidable");

http
	.createServer(function (req, res) {
		let form = new formidable.IncomingForm();
		form.parse(req, function (err, fields, file) {
			let filepath = file.fileupload.filepath;
			let newpath = "../image/";
			newpath += file.fileupload.originalFilename;
			fs.copyFile(filepath, newpath, function (err) {
				if (err) console.log(err);
				res.end();
			});
		});
	})
	.listen(8080);
