import "reflect-metadata";
import { createConnection } from "typeorm";
import { User } from "./entity/User";

import * as express from 'express';
import { Request, Response } from 'express';
import { Database } from "./database";
import { RegisterDTO } from "./dto/request/register.dto";

const app = express();

app.use(express.json());

Database.initialize();

app.get("/", (req: Request, res: Response) => {
  res.send("Hello there");
});

app.post("/register", (req: Request, res: Response) => {

  try {

    const body: RegisterDTO = req.body;

    //validate the body
    if (body.password !== body.repeatPassword)
      throw new Error('Repeat password does not match')

    //validate if the email is already being used
    if(Database.userRepository.findOne({email:body.email})){
      throw new Error('E-mail is already being used')
    }

    //store the user
    const user = new User();
    user.username = body.username;
    user.email = body.email;


    res.json({
      token: "dummy-token",
      refreshToken: "dummy-refreshToken",
      user: {
        id: 1,
        username: "dummy-username"
      }
    })

  } catch (error) {
    res.status(500).json({
      messsage: error.message
    });
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
