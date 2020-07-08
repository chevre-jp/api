/**
 * アプリケーション固有の型
 */
import * as chevre from '@chevre/domain';

declare global {
    namespace Express {
        export type IUser = chevre.factory.clientUser.IClientUser;

        // tslint:disable-next-line:interface-name
        export interface Request {
            user: IUser;
            accessToken: string;
        }
    }
}
