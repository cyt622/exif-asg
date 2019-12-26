var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var ExifImage = require('exif').ExifImage;
var fs = require('fs');
var formidable = require('formidable');

// support parsing of application/json type post data
app.use(bodyParser.json());

//support parsing of application/x-www-form-urlencoded post data
app.use(bodyParser.urlencoded({ extended: true }));

app.set('view engine', 'ejs');

app.get('/', (req,res) => {
	res.status(200).render("upload");
});

// accept POST request on the homepage
app.post('/', function (req, res) {
	let form = new formidable.IncomingForm();
	form.parse(req, (err, fields, files) => {
		if (files.photo.size == 0) {
			res.status(500).render("error", {"msg": "No file"});
		}
		else if (files.photo.size > 0) {
			let filename = files.photo.path;
			if (files.photo.type) {
				var mimetype = files.photo.type;
			}
			
			if (!mimetype.match(/^image/)) {
				res.status(500).render("error", {"msg": "Upload file not image!"});
				return;
			}
			
			fs.readFile(filename, (err,data) => {
				let doc = {
					'title': fields.title,
					'description': fields.description,
					'mimetype': mimetype,
					'photo': new Buffer.from(data).toString('base64')
				};
				
				try {
					new ExifImage({ image : filename }, function (error, exifData) {
						if (error)
							console.log('Error');
						else {
							//doc.exif = exifData;
							doc['make'] = exifData.image.Make;
							doc['model'] = exifData.image.Model;
							doc['date'] = exifData.image.ModifyDate;
							
							if (exifData.gps.GPSLatitudeRef == 'S') {
								doc['lat'] = -(exifData.gps.GPSLatitude[0] + exifData.gps.GPSLatitude[1] / 60 + exifData.gps.GPSLatitude[2] / 3600);
							}
							else {
								doc['lat'] = exifData.gps.GPSLatitude[0] + exifData.gps.GPSLatitude[1] / 60 + exifData.gps.GPSLatitude[2] / 3600;
							}
							
							if (exifData.gps.GPSLongitudeRef == 'E') {
								doc['lon'] = exifData.gps.GPSLongitude[0] + exifData.gps.GPSLongitude[1] / 60 + exifData.gps.GPSLongitude[2] / 3600;
							}
							else {
								doc['lon'] = -(exifData.gps.GPSLongitude[0] + exifData.gps.GPSLongitude[1] / 60 + exifData.gps.GPSLongitude[2] / 3600);
							}
							
							res.status(200).render("photo", {'doc': doc});

						}
					});
				} catch (error) {
					console.log('Error catch');
				}
				
				
			});
			
		}
	});
});

app.get('/map/:lon/:lat/:zoom', (req,res) => {
	let doc = {
		'lat': req.params.lat,
		'lon': req.params.lon,
		'zoom': req.params.zoom ? req.params.zoom : 12
	}
	res.status(200).render("map", {'doc': doc});
});



app.listen(process.env.PORT || 8099);
