import Dexie from 'dexie';

export const db = new Dexie('FinOneDB');

db.version(1).stores({
  accounts: '++id, name, type, currency, created_at',
  balances: '++id, account_id, date, balance, notes, created_at'
});

export const AccountTypes = {
  BANK: 'bank',
  WALLET: 'wallet',
  CARD: 'card',
  EXCHANGE: 'exchange'
};

export const addAccount = async (account) => {
  return await db.accounts.add({
    ...account,
    created_at: new Date()
  });
};

export const updateAccount = async (id, updates) => {
  return await db.accounts.update(id, {
    ...updates,
    updated_at: new Date()
  });
};

export const deleteAccount = async (id) => {
  await db.balances.where('account_id').equals(id).delete();
  return await db.accounts.delete(id);
};

export const getAllAccounts = async () => {
  return await db.accounts.orderBy('name').toArray();
};

export const addBalance = async (accountId, balance, notes = '') => {
  return await db.balances.add({
    account_id: accountId,
    balance: parseFloat(balance),
    date: new Date().toISOString().split('T')[0],
    notes,
    created_at: new Date()
  });
};

export const getLatestBalances = async () => {
  const accounts = await getAllAccounts();
  const latestBalances = [];

  for (const account of accounts) {
    const balances = await db.balances
      .where('account_id')
      .equals(account.id)
      .toArray();

    // Sort by created_at timestamp (most recent first)
    const sortedBalances = balances.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const latestBalance = sortedBalances[0];

    latestBalances.push({
      ...account,
      latest_balance: latestBalance?.balance || 0,
      last_updated: latestBalance?.date
    });
  }

  return latestBalances;
};

export const getTotalsByCurrency = async () => {
  const balances = await getLatestBalances();
  const totals = {};

  balances.forEach(account => {
    if (!totals[account.currency]) {
      totals[account.currency] = 0;
    }
    totals[account.currency] += account.latest_balance;
  });

  return totals;
};

export const exportData = async () => {
  const accounts = await getAllAccounts();
  const balances = await db.balances.toArray();

  return {
    accounts,
    balances,
    exported_at: new Date().toISOString()
  };
};

export const importData = async (data) => {
  await db.transaction('rw', db.accounts, db.balances, async () => {
    await db.accounts.clear();
    await db.balances.clear();

    if (data.accounts) {
      await db.accounts.bulkAdd(data.accounts);
    }
    if (data.balances) {
      await db.balances.bulkAdd(data.balances);
    }
  });
};