const jimp = require('jimp');
const Joi = require('joi');
Joi.objectId = require('joi-objectid')(Joi);
const FCM = require('fcm-node');
const constants = require('./const');

function showSuccessResponse(res, data) {
  return res.send({ success: true, data: data });
}

function showFailResponse(res, data) {
  return res.send({ success: false, data: data });
}

// function showFailResponse(res, data){
//     return res.send({"success" : false, "data" : data});
// }

function showErrorResponse(res, statusCode, errorMessage, errorCode) {
  return res
    .status(statusCode)
    .send({ error: errorMessage, errorCode: errorCode });
}

function validateObjectId(val) {
  return Joi.objectId().validate(val);
}

function returnValidationError(res, errorMessage) {
  return res.status(403).send({ error: errorMessage.details[0].message });
}

function authorizeOnlyAdminOrUser(user, id) {
  // console.log(user.isAdmin);
  // console.log(user._id);
  // console.log(id);
  return !(user.isAdmin || user._id == id);
}

function notAuthorizedError(res) {
  return res.status(401).send('Not authorized');
}

function notFoundError(res) {
  return res.status(404).send('Not found');
}

function resizeFile(inputFile, outputFile, fileWidth, fileHeight) {
  if (fileWidth === 'auto') {
    fileWidth = jimp.AUTO;
  }
  if (fileHeight === 'auto') {
    fileHeight = jimp.AUTO;
  }
  jimp.read(inputFile, (err, lenna) => {
    if (err) throw err;
    lenna
      .scaleToFit(fileWidth, fileHeight) // resize
      // .scaleToFit(fileWidth, jipm.AUTO) // resize (Auto height)
      .write(outputFile); // save
  });
}


exports.resizeFile = resizeFile;
exports.errorResponse = showErrorResponse;
exports.showFailResponse = showFailResponse;
exports.successResponse = showSuccessResponse;
exports.validateObjectId = validateObjectId;
exports.returnValidationError = returnValidationError;
exports.authorizeOnlyAdminOrUser = authorizeOnlyAdminOrUser;
exports.notAuthorizedError = notAuthorizedError;
exports.notFoundError = notFoundError;
