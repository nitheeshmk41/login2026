require('dotenv').config({ path: '../.env' });
const { createUserByAdmin } = require("./controllers/postgres/userController");

const req = {
  body: {
    name: "Test",
    email: "test@example.com",
    password: "password123",
    role: "coordinator",
    event_id: 1,
  }
};

const res = {
  status: (code) => ({
    json: (data) => console.log(code, data)
  })
};

// mock userModel
require("./models/postgres/userModel").findOne = async () => null;

createUserByAdmin(req, res).catch(console.error);
