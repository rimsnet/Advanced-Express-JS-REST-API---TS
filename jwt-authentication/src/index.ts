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
