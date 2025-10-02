export type Action = { kind: string; params?: Record<string, any> };

export function compose(actions: Action[]): string {
  return JSON.stringify({ type: 'actions', version: 1, actions });
}

export const actions = {
  salesforce: {
    lookupAccount(input: { accountId: string }): Action {
      return { kind: 'salesforce.lookupAccount', params: input };
    },
    upsertContact(input: { email: string; title?: string; firstName?: string; lastName?: string }): Action {
      return { kind: 'salesforce.upsertContact', params: input };
    },
  },
  drive: {
    findFiles(input: { query: string; limit?: number }): Action {
      return { kind: 'drive.findFiles', params: input };
    },
  },
  generate: {
    brief(input: Record<string, any>): Action {
      return { kind: 'generate.brief', params: input };
    },
    email(input: { purpose: string; tone?: string; maxWords?: number }): Action {
      return { kind: 'generate.email', params: input };
    },
  },
};

