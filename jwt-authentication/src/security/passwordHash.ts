import * as bcrypt from 'bcrypt';

export class PasswordHash{
    /**
     * Return a hased password
     * @param plainPassword Plain password
     */
    public static async hashPassword(plainPassword:string){
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(plainPassword, salt);
        return hashedPassword;
    }
}