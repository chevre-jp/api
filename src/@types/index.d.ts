/**
 * アプリケーション固有の型
 */
import * as chevre from '@chevre/domain';

declare global {
    namespace Express {
        export interface IRequestProject { typeOf: chevre.factory.organizationType.Project; id: string; }

        export type IUser = chevre.factory.clientUser.IClientUser;

        // tslint:disable-next-line:interface-name
        export interface Request {
            project: IRequestProject;
            user: IUser;
            accessToken: string;
            // isAdmin: boolean;
            isPOS: boolean;
            isProjectMember: boolean;
            /**
             * プロジェクトメンバーの権限
             */
            memberPermissions: string[];
        }
    }
}
