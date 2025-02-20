export interface IToken {
    token: string;
    user: string;
    type: string;
    expires: Date;
    blacklisted: boolean;
}
