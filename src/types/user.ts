export interface IUser {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    paymentType: string;
    ExperiationPaymentDate?: string;
    profilePic: string;
    coverImg: string;
    isEmailVerified: boolean;
}
