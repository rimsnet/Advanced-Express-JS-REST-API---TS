import * as jwt from 'jsonwebtoken';
import { User } from '../entity/User';
import { v4 as uuidv4 } from 'uuid';
import { RefreshToken } from '../entity/RefreshToken';

import * as moment from 'moment';
import { Database } from '../database';

export class JWT {
    private static JWT_SECRET = "123456";

    public static async generateTokenAndRefreshToken(user: User) {
        //specify a payload thats holds the users id (and) email
        const payload = {
            id: user.id,
            email: user.email
        }

        const jwtId = uuidv4();

        const token = jwt.sign(payload, this.JWT_SECRET, {
            expiresIn: "1h", //specify when does the token expires 1hour
            jwtid: jwtId, //specify jwtid (and id of that token) (needed for the refresh token, as a refresh token only points to one single unique token)
            subject: user.id.toString() //the subject should be the users id (pirmary key)
        })

        //create a refresh token
        const refreshToken = await this.generateRefreshTokenForUserAndToken(user, jwtId);

        //link that token the refresh token
        
        return {token, refreshToken};
    }

    private static async generateRefreshTokenForUserAndToken(user:User, jwtId:string){
        //create a new record of a refresh token
        const refreshToken = new RefreshToken();
        refreshToken.user = user;
        refreshToken.jwtid = jwtId;
        //set the expiry date of the refresh token for example 10 days
        refreshToken.expiryDate = moment().add(10, "d").toDate();
        
        //store this refresh token
        await Database.refreshTokenRepository.save(refreshToken);

        return refreshToken.id;
    }
}