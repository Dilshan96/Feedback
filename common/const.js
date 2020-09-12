let constants = {
  
  UPLOAD_PROFILE_PIC_FULL: 'upload/profile_pic/full/',
  UPLOAD_PROFILE_PIC_THUMB: 'upload/profile_pic/thumb/',

  ORDER_TYPES: ['hardware', 'groceries', 'pharmaceuticals'],
  SELLER_TYPES: ['hardware', 'groceries', 'pharmaceuticals'],
};

module.exports = Object.freeze(constants); // freeze prevents changes by users
