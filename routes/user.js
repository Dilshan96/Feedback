const { User, validate } = require('../models/user');
const express = require('express');
const bcrypt = require('bcrypt');
const util = require('../common/util');
const auth = require('../middleware/auth');
const isActive = require('../middleware/isActive');
const admin = require('../middleware/admin');
const formidable = require('formidable');
const fs = require('fs');
const path = require('path');
const constants = require('../common/const');
const mv = require('mv');
const request = require('request');
const https = require('https');

const router = express.Router();
const _ = require('lodash');

const asyn = require('async');

const userColumnListToReturn = ['name', 'mobile', 'type'];

router.get('/all', [auth], [admin], async (req, res) => {
  const users = await User.find({ isAdmin: false });
  // res.send(users);
  return util.successResponse(res, users);
});

router.get('/view/:id?', [auth], async (req, res) => {
  let id = req.params.id;
  if (!id) id = req.user._id;

  const { error } = util.validateObjectId(id);
  if (error) return util.errorResponse(res, 400, error.details[0].message);

  const user = await User.findById(id).select('-__v');
  return util.successResponse(res, user);
});

const all_user_fields = [
  'mobile',
  'name',
  'type',
  // 'evidenceImage',
  'longitude',
  'latitude',
  'sellerType',
];

router.post('/edit/:id?', [auth], async (req, res) => {
  let id = req.params.id;
  if (!id) id = req.user._id;

  if (util.authorizeOnlyAdminOrUser(req.user, id))
    return util.notAuthorizedError(res);

  const { error } = util.validateObjectId(req.params.id);
  if (error) return util.errorResponse(res, 400, error.details[0].message);

  const { error1 } = util.validateObjectId(req.params.id);
  if (error1) return util.errorResponse(res, 400, error1.details[0].message);

  let newFields = _.pick(req.body, all_user_fields);
  delete newFields['email'];
  newFields = { $set: newFields };

  const user = await User.updateOne({ _id: id }, newFields);
  if (!user) return util.errorResponse(res, 404);
  return util.successResponse(res, user);
});

// __________________________________ Register user ________________________________________________

// router.post("/register", async(req, res) => {

//     const { error } = validate(req.body);
//     if (error) return util.errorResponse(res, 400, error.details[0].message);

//     let user = await User.findOne({ 'mobile': req.body.mobile });
//     if (user) return util.errorResponse(res, 400, "User already registered");

//     user = new User(_.pick(req.body, all_user_fields));

//     const salt = await bcrypt.genSalt(10);
//     user.password = await bcrypt.hash(user.password, salt);
//     user = await user.save();
//     // user.initializeUser();

//     res.header("x-auth-token", user.generateAuthenticationtoken()).send(_.pick(user, userColumnListToReturn));
// })

// _________________________ Register user (Form-data) ____________________________________________

router.post('/register', async (req, res) => {
  console.log('User Registration...');
  const evidenceImage = 'evidenceImage';
  const form = new formidable.IncomingForm();
  let sellerEvidence_path;

  form.parse(req, async (err, fields, files) => {
    let incomingFields;
    if (fields.type === 'seller') {
      incomingFields = _.pick(fields, all_user_fields);
    } else {
      incomingFields = _.pick(fields, ['mobile', 'name', 'type']);
    }

    const { error } = validate(incomingFields);
    if (error) return util.returnValidationError(res, error);

    let user = await User.findOne({
      mobile: incomingFields.mobile,
      type: incomingFields.type,
    });
    if (user)
      return util.errorResponse(res, 400, 'User already registered', 1002);

    if (incomingFields.type === 'seller') {
      if (!files[evidenceImage]) {
        return util.showFailResponse(res, {
          msg: 'Evidence document is required for sellers.',
        });
      }

      if (!fields.sellerType) {
        return util.showFailResponse(res, {
          msg: 'Seller type is required.',
        });
      }

      if (1024 * 1024 * 6 < files[evidenceImage].size) {
        return util.showFailResponse(res, {
          msg: 'Image can not be grater than 6 mb',
        });
      }
      const mime_type = files[evidenceImage].type;

      if (err || !(mime_type == 'image/jpeg' || mime_type == 'image/png')) {
        return util.showFailResponse(res, {
          msg: 'File type error png and jpg only',
        });
      }

      const oldpath = files[evidenceImage].path;
      const extension = path.extname(files[evidenceImage].name);
      if (!fs.existsSync(constants.UPLOAD_SELLER_EVIDENCE)) {
        fs.mkdirSync(constants.UPLOAD_SELLER_EVIDENCE);
      }
      const newpath = path.join(
        constants.UPLOAD_SELLER_EVIDENCE,
        path.basename(oldpath) + extension
      );

      sellerEvidence_path = path.basename(oldpath) + extension;

      mv(oldpath, newpath, async (err) => {
        if (err) {
          return util.errorResponse(res, 400, 'Failed to upload file', 1003);
          // return util.showFailResponse(res, { msg: 'Failed to upload file' });
        }

        util.resizeFile(newpath, newpath, 500, 'auto');

        // sellerEvidence_path = newpath;

        user = new User({
          mobile: incomingFields.mobile,
          // password: incomingFields.password,
          type: incomingFields.type,
          name: incomingFields.name,
          location: {
            coordinates: [incomingFields.longitude, incomingFields.latitude],
          },
          sellerEvidence: sellerEvidence_path,
          sellerType: incomingFields.sellerType,
          // sellerEvidence: sellerEvidence_path,
          // // location: {
          // //     longitude: incomingFields.longitude,
          // //     latitude: incomingFields.latitude
          // // }
          // location: { coordinates: [incomingFields.longitude, incomingFields.latitude] }
        });

        // if (user.type === 'buyer') {
        //   user.isActive = true;
        // }

        // if (user.type === 'seller') {
        //   user.location = {
        //     coordinates: [incomingFields.longitude, incomingFields.latitude]
        //   };
        //   user.sellerEvidence = sellerEvidence_path;
        // }

        // const salt = await bcrypt.genSalt(10);
        // user.password = await bcrypt.hash(user.password, salt);
        user = await user.save();
        // user.initializeUser();

        // res
        //   // .header('x-auth-token', user.generateAuthenticationtoken())
        //   .send(_.pick(user, userColumnListToReturn));
        return util.successResponse(res, _.pick(user, userColumnListToReturn));
      });
    } else {
      user = new User({
        mobile: incomingFields.mobile,
        // password: incomingFields.password,
        type: incomingFields.type,
        name: incomingFields.name,
        isActive: true,
        isApproved: true,
      });

      // const salt = await bcrypt.genSalt(10);
      // user.password = await bcrypt.hash(user.password, salt);
      user = await user.save();

      // res
      //   // .header('x-auth-token', user.generateAuthenticationtoken())
      //   .send(_.pick(user, userColumnListToReturn));

      return util.successResponse(res, _.pick(user, userColumnListToReturn));
    }
  });
});

//_________________________________ Update User ________________________________________________

router.put('/update/:id', [auth], [admin], async (req, res) => {
  const orderId = req.params.id;
  const user = await User.findById(orderId);
  if (!user) return util.errorResponse(res, 404, 'User not found', 1005);
  let updateFields;

  if (req.body.updateFields) {
    updateFields = req.body.updateFields;
  }

  if (updateFields.mobile) {
    const existUser = await User.find({
      mobile: updateFields.mobile,
      type: user.type,
    });
    if (existUser.length > 0) {
      return util.errorResponse(
        res,
        400,
        'Mobile number already registered',
        1002
      );
    }
  }

  if (updateFields.location) {
    updateFields.location.type = 'Point';
  }

  const { error } = util.validateObjectId(req.params.id);
  if (error) return util.returnValidationError(res, error);

  try {
    const user = await User.findByIdAndUpdate(
      orderId,
      {
        $set: updateFields,
      },
      { new: true }
    );
    return util.successResponse(res, user);
  } catch (error) {
    return util.errorResponse(res, 500, error.message);
  }
});

// _________________________________________________________________________________________________

router.post('/pic/view/thumb/all', async (req, res) => {
  if (!req.body.ids) return util.errorResponse(res, 400, 'Ids not found');

  const thumb_ids = req.body.ids;
  const filtered_list = [];
  const imageDir = constants.UPLOAD_PROFILE_PIC_THUMB;

  for (let _id of thumb_ids) {
    const { error } = util.validateObjectId(_id);
    if (!error) filtered_list.push(_id);
  }

  const result = {};
  asyn.eachSeries(
    filtered_list,
    function (_id, cb) {
      let imagePath = path.join(imageDir, _id + '.jpg');
      imagePath = path.resolve(path.join('./', imagePath));
      fs.readFile(imagePath, function (err, content) {
        if (!err) result[_id] = Buffer.from(content).toString('base64');
        else result[_id] = null;

        cb(err);
      });
    },
    function (err) {
      return util.successResponse(res, result);
    }
  );
});

// ___________________________________________________________________________________________________

router.get('/pic/view/:type(thumb|full)/:id?', [auth], async (req, res) => {
  let id = req.params.id;
  if (!id) id = req.user._id;

  const imageType = req.params.type;
  let imageDir = null;
  if (imageType == 'full') imageDir = constants.UPLOAD_PROFILE_PIC_FULL;
  else if (imageType == 'thumb') imageDir = constants.UPLOAD_PROFILE_PIC_THUMB;

  let imagePath = path.join(imageDir, id + '.jpg');
  imagePath = path.resolve(path.join('./', imagePath));

  res.sendFile(imagePath, function (err) {
    if (err) {
      imagePath = path.join(imageDir, 'default.jpg');
      imagePath = path.resolve(path.join('./', imagePath));
      res.sendFile(imagePath, function (err) {
        if (err) return util.errorResponse(res, 404, 'File not found');
      });
    }
  });
});

// ___________________________________________________________________________________________________

router.get('/pic/view/sellerEvidence/:id', [auth], async (req, res) => {
  let id = req.params.id;

  const imageDir = constants.UPLOAD_SELLER_EVIDENCE;

  let imagePath = path.join(imageDir, id);
  imagePath = path.resolve(path.join('./', imagePath));

  res.sendFile(imagePath, function (err) {
    if (err) {
      return util.errorResponse(res, 404, 'File not found');
      // imagePath = path.join(imageDir, 'default.jpg');
      // imagePath = path.resolve(path.join('./', imagePath));
      // res.sendFile(imagePath, function(err) {
      //   if (err) return util.errorResponse(res, 404, 'File not found');
      // });
    }
  });
});

// __________________________________________________________________________________________________

router.post('/pic/delete/:id?', [auth], async (req, res) => {
  let id = req.params.id;
  if (!id) id = req.user._id;

  if (util.authorizeOnlyAdminOrUser(req.user, id))
    return util.notAuthorizedError(res);

  let imageFullPath = constants.UPLOAD_PROFILE_PIC_FULL;
  imageFullPath = path.join(imageFullPath, id + '.jpg');
  imageFullPath = path.resolve(path.join('./', imageFullPath));

  let imageThumbPath = constants.UPLOAD_PROFILE_PIC_THUMB;
  imageThumbPath = path.join(imageThumbPath, id + '.jpg');
  imageThumbPath = path.resolve(path.join('./', imageThumbPath));

  fs.unlink(imageFullPath, function () {
    fs.unlink(imageThumbPath, function () {
      return util.successResponse(res, { msg: 'Profile picture removed' });
    });
  });
});

// ___________________________________________________________________________________________________

router.get('/pic/have', [auth], async (req, res) => {
  let id = req.user._id;
  let imageDir = constants.UPLOAD_PROFILE_PIC_FULL;
  let imagePath = path.join(imageDir, id + '.jpg');
  imagePath = path.resolve(path.join('./', imagePath));

  res.sendFile(imagePath, { have: true }, function (err) {
    if (err) {
      imagePath = path.join(imageDir, 'default.jpg');
      imagePath = path.resolve(path.join('./', imagePath));
      res.send(imagePath, { have: false }, function (err) {
        if (err) return util.showFailResponse(res, 404, 'File not found');
      });
    }
  });
});

// _______________________________________ Update profile picture ___________________________________

router.post('/pic/update/:id?', [auth], async (req, res) => {
  let id = req.params.id;
  if (!id) id = req.user._id;

  if (util.authorizeOnlyAdminOrUser(req.user, id))
    return util.notAuthorizedError(res);

  var form = new formidable.IncomingForm();
  form.maxFields = 1;
  form.multiples = false;
  // form.maxFileSize = 2 * 1024 * 1024;

  form.parse(req, function (err, fields, files) {
    if (1024 * 1024 * 2 < files.profile_pic.size) {
      return util.showFailResponse(res, {
        msg: 'Image can not be grater than 2 mb',
      });
    }

    const mime_type = files.profile_pic.type;

    if (err || !(mime_type == 'image/jpeg' || mime_type == 'image/png'))
      return util.showFailResponse(res, {
        msg: 'File type error png and jpg only',
      });

    var oldpath = files.profile_pic.path;
    const extension = path.extname(files.profile_pic.name);
    if (!fs.existsSync(constants.UPLOAD_PROFILE_PIC_FULL)) {
      fs.mkdirSync(constants.UPLOAD_PROFILE_PIC_FULL);
    }
    if (!fs.existsSync(constants.UPLOAD_PROFILE_PIC_THUMB)) {
      fs.mkdirSync(constants.UPLOAD_PROFILE_PIC_THUMB);
    }
    var newpath = path.join(constants.UPLOAD_PROFILE_PIC_FULL, id + '.jpg');
    var thumbpath = path.join(constants.UPLOAD_PROFILE_PIC_THUMB, id + '.jpg');

    // fs.rename(oldpath, newpath, function(err) {
    //     if (err)
    //         return util.showFailResponse(res, { msg: "Failed to upload file" })

    //     util.resizeFile(newpath, newpath, 500, 500)
    //     util.resizeFile(newpath, thumbpath, 100, 100)
    //     return util.successResponse(res, { msg: "The picture was uploaded" })
    // })

    mv(oldpath, newpath, (err) => {
      if (err)
        return util.showFailResponse(res, { msg: 'Failed to upload file' });

      util.resizeFile(newpath, newpath, 500, 500);
      util.resizeFile(newpath, thumbpath, 100, 100);
      return util.successResponse(res, { msg: 'The picture was uploaded' });
    });
  });
});


// ____________________ User activate __________________________________________

router.put('/activate/:id', [auth], [isActive], [admin], async (req, res) => {
  const id = req.params.id;
  const { error } = util.validateObjectId(id);
  if (error) return util.errorResponse(res, 400, error.details[0].message);

  try {
    const user = await User.findByIdAndUpdate(
      id,
      {
        $set: {
          isActive: true,
          isApproved: true,
        },
      },
      { new: true }
    );

    return util.successResponse(res, user);
  } catch (error) {
    return util.showFailResponse(res, error);
  }
});

// ____________________ User deactivate __________________________________________

router.put('/deactivate/:id', [auth], [isActive], [admin], async (req, res) => {
  const id = req.params.id;
  const { error } = util.validateObjectId(id);
  if (error) return util.errorResponse(res, 400, error.details[0].message);

  try {
    const user = await User.findByIdAndUpdate(
      id,
      {
        $set: {
          isActive: false,
        },
      },
      { new: true }
    );

    return util.successResponse(res, user);
  } catch (error) {
    return util.showFailResponse(res, error);
  }
});

module.exports = router;
