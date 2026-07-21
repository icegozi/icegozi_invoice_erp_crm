const express = require('express');

const { catchErrors } = require('@/handlers/errorHandlers');

const router = express.Router();

const adminController = require('@/controllers/coreControllers/adminController');
const settingController = require('@/controllers/coreControllers/settingController');

const { singleStorageUpload } = require('@/middlewares/uploadMiddleware');
const { authorize } = require('@/middlewares/authorize');

// //_______________________________ Admin management_______________________________

router.route('/admin/read/:id').get(authorize('owner', 'admin'), catchErrors(adminController.read));

router.route('/admin/password-update/:id').patch(authorize('owner'), catchErrors(adminController.updatePassword));

//_______________________________ Admin Profile _______________________________

router.route('/admin/profile/password').patch(catchErrors(adminController.updateProfilePassword));
router
  .route('/admin/profile/update')
  .patch(
    singleStorageUpload({ entity: 'admin', fieldName: 'photo', fileType: 'image' }),
    catchErrors(adminController.updateProfile)
  );

// //____________________________________________ API for Global Setting _________________

router.route('/setting/create').post(authorize('owner', 'admin'), catchErrors(settingController.create));
router.route('/setting/read/:id').get(authorize('owner', 'admin'), catchErrors(settingController.read));
router.route('/setting/update/:id').patch(authorize('owner', 'admin'), catchErrors(settingController.update));
//router.route('/setting/delete/:id).delete(catchErrors(settingController.delete));
router.route('/setting/search').get(authorize('owner', 'admin'), catchErrors(settingController.search));
router.route('/setting/list').get(authorize('owner', 'admin'), catchErrors(settingController.list));
router.route('/setting/listAll').get(authorize('owner', 'admin'), catchErrors(settingController.listAll));
router.route('/setting/filter').get(authorize('owner', 'admin'), catchErrors(settingController.filter));
router
  .route('/setting/readBySettingKey/:settingKey')
  .get(authorize('owner', 'admin'), catchErrors(settingController.readBySettingKey));
router.route('/setting/listBySettingKey').get(authorize('owner', 'admin'), catchErrors(settingController.listBySettingKey));
router
  .route('/setting/updateBySettingKey/:settingKey?')
  .patch(authorize('owner', 'admin'), catchErrors(settingController.updateBySettingKey));
router
  .route('/setting/upload/:settingKey?')
  .patch(
    singleStorageUpload({ entity: 'setting', fieldName: 'settingValue', fileType: 'image' }),
    authorize('owner', 'admin'),
    catchErrors(settingController.updateBySettingKey)
  );
router.route('/setting/updateManySetting').patch(authorize('owner', 'admin'), catchErrors(settingController.updateManySetting));
module.exports = router;
