const express = require("express");

const { verifyJwt } = require("../../middleware/auth");
const allowRoles = require("../../middleware/allowRoles");

const userController = require("../../controllers/postgres/userController");

const router = express.Router();


router.get(
  "/profile",
  verifyJwt,
  userController.getMyProfile
);


router.put(
  "/profile",
  verifyJwt,
  allowRoles("participant"),
  userController.updateMyProfile
);


router.get(
  "/",
  verifyJwt,
  allowRoles("admin", "coordinator", "registration_desk"),
  userController.getAllUsers
);

router.post(
  "/",
  verifyJwt,
  allowRoles("admin", "coordinator", "registration_desk"),
  userController.createUserByAdmin
);

router.put("/alumni/:id", verifyJwt, allowRoles("admin"), userController.updateAlumni);
router.delete("/alumni/:id", verifyJwt, allowRoles("admin"), userController.deleteAlumni);


router.put(
  "/:id/details",
  verifyJwt,
  allowRoles("admin"),
  userController.updateUserDetails
);

router.delete(
  "/:id",
  verifyJwt,
  allowRoles("admin"),
  userController.deleteUser
);


router.get(
  "/:id",
  verifyJwt,
  allowRoles("admin"),
  userController.getUserById
);


router.put(
  "/:id/role",
  verifyJwt,
  allowRoles("admin"),
  userController.updateUserRole
);


router.put(
  "/:id/status",
  verifyJwt,
  allowRoles("admin"),
  userController.updateUserStatus
);


module.exports = router;
