import "reflect-metadata";
import { createConnection, Entity } from "typeorm";
import { User } from "./entity/User";

import * as express from 'express';
import { Request, Response } from 'express';
import { Database } from "./database";
import { RegisterDTO } from "./dto/request/register.dto";
import { PasswordHash } from "./security/passwordHash";
import { AuthenticationDTO } from "./dto/response/authentication.dto";
import { UserDTO } from "./dto/response/user.dto";
import { JWT } from "./security/jwt";
import { LoginDTO } from "./dto/request/login.dto";
import { EntityToDTO } from "./util/entityToDTO";
import { RefreshTokenDTO } from "./dto/request/refreshToken.dto";

const app = express();

app.use(express.json());

Database.initialize();

app.get("/", (req: Request, res: Response) => {
  res.send("Hello there");
});

app.post("/register", async (req: Request, res: Response) => {

  try {

    const body: RegisterDTO = req.body;

    //validate the body
    if (body.password !== body.repeatPassword)
      throw new Error('Repeat password does not match')

    //validate if the email is already being used
    if (await Database.userRepository.findOne({ email: body.email })) {
      throw new Error('E-mail is already being used')
    }

    //store the user
    const user = new User();
    user.username = body.username;
    user.email = body.email;
    user.password = await PasswordHash.hashPassword(body.password)
    user.firstName = body.firstName;
    user.lastName = body.lastName;

    await Database.userRepository.save(user);

    const authenticationDTO: AuthenticationDTO = new AuthenticationDTO();
    const userDTO: UserDTO = EntityToDTO.userToDTO(user);

    //implement token generation and refresh token
    const tokenandRefreshToken = await JWT.generateTokenAndRefreshToken(user);
    authenticationDTO.user = userDTO;
    authenticationDTO.token = tokenandRefreshToken.token;
    authenticationDTO.refreshToken = tokenandRefreshToken.refreshToken;


    res.json(authenticationDTO);

  } catch (error) {
    res.status(500).json({
      messsage: error.message
    });
  }
});


app.post("/login", async (req: Request, res: Response) => {

  try {
    const body: LoginDTO = req.body;

    //check if the email/user exists
    const user = await Database.userRepository.findOne({ email: body.email });
    if (!user)
      throw new Error("Email does not existes")


    //check if the password is valid
    if (! await PasswordHash.isPasswordValid(body.password, user.password))
      throw new Error("Password is invalid")



    //retrieve token
    const { token, refreshToken } = await JWT.generateTokenAndRefreshToken(user)

    //generate an authenticationDTO/response
    const authenticationDTO = new AuthenticationDTO();
    authenticationDTO.user = EntityToDTO.userToDTO(user);
    authenticationDTO.token = token;
    authenticationDTO.refreshToken = refreshToken;

    res.json(authenticationDTO);

  } catch (error) {
    res.status(500).json({
      message: error.message
    })
  }

});

app.post("/refresh", async (req: Request, res: Response) => {

  try {

    const body: RefreshTokenDTO = req.body;

    //chech if the twt token is valid & has not expired
    if (!JWT.isValidToken(body.token)) throw new Error("JWT is not valid")

    const jwtId = JWT.getJwtId(body.token);

    const user = await Database.userRepository.findOne(await JWT.getJwtPayloadValueByKey(body.token, "id"));

    //check if the user exists
    if (!user) throw new Error("User does not exists");

    //fetch refresh token form db
    const refreshToken = await Database.refreshTokenRepository.findOne(body.refreshToken);

    //check if the refresh token exists and is linked to that twt token.
    if (!await JWT.isRefreshTokenLinkedToToken(refreshToken, jwtId))
      throw new Error("Token does not match with Refresh token")

    //check if the refresh token expried
    if (await JWT.isRefreshTokenExpired(refreshToken))
      throw new Error("Refresh token has expird")

    //check if the refresh token was used or invalidated
    if (await JWT.isRefreshTokenUsedOrInvalidated(refreshToken))
      throw new Error("Refresh Token has been used or invalidated")


    refreshToken.used = true;

    await Database.refreshTokenRepository.save(refreshToken);

    //generate a fresh pair of token  and refresh token
    const tokenResults = await JWT.generateTokenAndRefreshToken(user);

    //generate authentication response
    const authenticationDTO: AuthenticationDTO = new AuthenticationDTO();
    authenticationDTO.user = EntityToDTO.userToDTO(user);
    authenticationDTO.token = tokenResults.token;
    authenticationDTO.refreshToken = tokenResults.refreshToken;

    res.json(authenticationDTO);

  } catch (error) {
    res.status(500).json({
      message: error.message
    })
  }


});

app.listen(4000, () => { console.log('Listening on PORT', 4000) });

createConnection().then(async connection => {

  /*  
    console.log("Inserting a new user into the database...");
    const user = new User();
    user.firstName = "Timber";
    user.lastName = "Saw";
    user.age = 25;
    await connection.manager.save(user);
    console.log("Saved a new user with id: " + user.id);

    console.log("Loading users from the database...");
    const users = await connection.manager.find(User);
    console.log("Loaded users: ", users);

    console.log("Here you can setup and run express/koa/any other framework."); 
    
  */

}).catch(error => console.log(error));
