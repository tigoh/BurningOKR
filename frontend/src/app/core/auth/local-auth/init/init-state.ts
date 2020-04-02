export class InitState {
  initState: INIT_STATE_NAME;
  runtimeId: string;
}

export enum INIT_STATE_NAME {
  INITIALIZED = 'INITIALIZED',
  SET_OAUTH_CLIENT_DETAILS = 'SET_OAUTH_CLIENT_DETAILS',
  CREATE_USER = 'CREATE_USER',
}
