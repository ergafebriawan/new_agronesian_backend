const config = require("../config/database");
const db = require("mysql");
const pool = db.createPool(config);
const md5 = require("md5");
const jwt = require("jsonwebtoken");

pool.on("error", (err) => {
  console.log("error conecting database");
});

module.exports = {
  register(req, res) {
    const query2 =
      "INSERT INTO `users` (`id_user`, `name_user`, `email`, `password`, `active`) VALUES (?, ?, ?, ?, ?)";
    const query = "SELECT id_user FROM users";

    pool.getConnection(function (err, connection) {
      if (err) throw err;
      if (req.body.password != req.body.valid_password) {
        return res.status(401).json({
          success: false,
          message: "password tidak sama",
        });
      } else {
        connection.query(query, function (error, results) {
            let num = results.length + 1;
            let id = "USR-0"+num.toString();
            let data = {
                id_user: id,
                name_user: req.body.username,
                email: req.body.email,
                password: md5(req.body.password),
                active: true,
              };
          connection.query(query2, [data.id_user, data.name_user, data.email, data.password, data.active], function (error2, results2) {
            if (error2) throw error2
            return res.status(200).json({
              success: true,
              message: "register berhasil"
            });
          });
        });
      }
    });
  },
  login(req, res) {
    let data = {
      username: req.body.username,
      password: md5(req.body.password),
    };
    const query = "SELECT * FROM users WHERE name_user = ?;";

    pool.getConnection(function (err, connection) {
      if (err) throw err;
      connection.query(query, [data.username], function (error, results) {
        if (results.length == 0) {
          return res.json({
            success: false,
            message: "username tidak ditemukan",
          });
        } else {
          if (results[0].password == data.password) {
            const idUser = results[0].id_user;
            const username = results[0].username;
            const accessToken = jwt.sign(
              { idUser, username },
              process.env.ACCESS_TOKEN_SECRET,
              {
                expiresIn: "60s",
              }
            );
            const refreshToken = jwt.sign(
              { idUser, username },
              process.env.ACCESS_TOKEN_SECRET,
              {
                expiresIn: "1d",
              }
            );
            connection.query(
              "UPDATE users SET access_token = ? WHERE id_user = ?",
              [refreshToken, idUser],
              function (errr, ress) {
                if (errr) throw errr;
                res.cookie("refreshToken", refreshToken, {
                  httpOnly: true,
                  maxAge: 24 * 60 * 60 * 1000,
                });
                return res.status(200).json({
                  success: true,
                  message: "login berhasil...",
                  accessToken: accessToken,
                });
              }
            );
          } else {
            return res.json({
              success: false,
              message: "password salah...",
            });
          }
        }
      });
      connection.release();
    });
  },
  logout(req, res) {
    const refreshToken = req.cookies.refreshToken;
    pool.getConnection(function (err, connection) {
      if (err) throw err;
      connection.query(
        "SELECT * FROM user WHERE refresh_token = ?",
        [refreshToken],
        function (error, results) {
          if (err) throw err;
          const idUser = results[0].id_user;
          connection.query(
            "UPDATE user SET refresh_token = ? WHERE id_user = ?",
            [null, idUser],
            function (errr, ress) {
              if (errr) throw errr;
              res.clearCookie("refreshToken");
              return res.status(200).json({
                success: true,
                message: "berhasil logout...",
              });
            }
          );
        }
      );
    });
  },
  refreshToken(req, res) {
    const refreshToken = req.cookies.refreshToken;
    pool.getConnection(function (err, connection) {
      if (err) throw err;
      connection.query(
        "SELECT * FROM user WHERE access_token = ?",
        [refreshToken],
        function (error, results) {
          if (error) throw error;
          if (!results[0]) return res.sendStatus(403);
          jwt.verify(
            refreshToken,
            process.env.REFRESH_TOKEN_SECRET,
            (err, decoded) => {
              if (err) return res.sendStatus(403);
              const userId = results[0].id_user;
              const name = results[0].username;
              const accessToken = jwt.sign(
                { userId, name },
                process.env.ACCESS_TOKEN_SECRET,
                {
                  expiresIn: "20s",
                }
              );
              return res.status(200).json({ accessToken });
            }
          );
        }
      );
    });
  },
};
