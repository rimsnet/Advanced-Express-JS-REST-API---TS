import * as jwt from 'jsonwebtoken';
import { User } from '../entity/User';
import { v4 as uuidv4 } from 'uuid';

export class JWT {
    private static JWT_SECRET = "123456";

    public static async generateToken(user: User) {
        //specify a payload thats holds the users id (and) email
        const payload = {
            id: user.id,
            email: user.email
        }

        const token = jwt.sign(payload, this.JWT_SECRET, {
            expiresIn: "1h", //specify when does the token expires 1hour
            jwtid: uuidv4(), //specify jwtid (and id of that token) (needed for the refresh token, as a refresh token only points to one single unique token)
            subject: user.id.toString() //the subject should be the users id (pirmary key)
        })

        //create a refresh token

        //link that token the refresh token
        
        return token;
    }
}