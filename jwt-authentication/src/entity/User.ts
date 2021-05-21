import {Entity, PrimaryGeneratedColumn, Column, OneToMany} from "typeorm";
import { RefreshToken } from "./RefreshToken";

@Entity()
export class User {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    username: string;

    @Column()
    email: string;

    @Column()
    password: string;

    @Column()
    firstName: string;

    @Column()
    lastName: string;

    @OneToMany(type=> RefreshToken, refreshTokens=>refreshTokens.user)
    refreshTokens: RefreshToken;

}
