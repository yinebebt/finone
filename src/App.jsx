import { useState, useEffect } from 'react';
import { Plus, DollarSign, CreditCard, Building, Wallet, Info, Github, Eye, EyeOff, TrendingUp, Clock, Coins, Download, Upload } from 'lucide-react';
import { getAllAccounts, addAccount, deleteAccount, getLatestBalances, getTotalsByCurrency, addBalance } from './db';
import { ExportImport } from './ExportImport';
import './App.css';

const AccountTypeIcons = {
  bank: Building,
  wallet: Wallet,
  card: CreditCard,
  exchange: DollarSign
};

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [accounts, setAccounts] = useState([]);
  const [totals, setTotals] = useState({});
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [showAppInfo, setShowAppInfo] = useState(false);
  const [showBalances, setShowBalances] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const accountsData = await getLatestBalances();
    const totalsData = await getTotalsByCurrency();
    setAccounts(accountsData);
    setTotals(totalsData);
  };

  const handleAddAccount = async (accountData) => {
    await addAccount(accountData);
    setShowAddAccount(false);
    loadData();
  };

  const handleDeleteAccount = async (id) => {
    if (confirm('Delete this account and all its balance history?')) {
      await deleteAccount(id);
      loadData();
    }
  };

  const handleUpdateBalance = async (accountId, balance, notes = '') => {
    try {
      await addBalance(accountId, balance, notes);
      setSelectedAccount(null);
      await loadData();
    } catch (error) {
      console.error('Error updating balance:', error);
    }
  };

  return (
    <div className="app">
      <header className="header">
        <h1>FinOne</h1>
        <nav className="nav">
          <button
            className={activeTab === 'dashboard' ? 'active' : ''}
            onClick={() => setActiveTab('dashboard')}
          >
            Dashboard
          </button>
          <button
            className={activeTab === 'accounts' ? 'active' : ''}
            onClick={() => setActiveTab('accounts')}
          >
            Accounts
          </button>
        </nav>
      </header>

      <main className="main">
        {activeTab === 'dashboard' && (
          <Dashboard
            totals={totals}
            accounts={accounts}
            showBalances={showBalances}
            onToggleBalances={() => setShowBalances(!showBalances)}
          />
        )}

        {activeTab === 'accounts' && (
          <Accounts
            accounts={accounts}
            onAddAccount={() => setShowAddAccount(true)}
            onDeleteAccount={handleDeleteAccount}
            onUpdateBalance={setSelectedAccount}
          />
        )}
      </main>

      {showAddAccount && (
        <AddAccountModal
          onAdd={handleAddAccount}
          onClose={() => setShowAddAccount(false)}
        />
      )}

      {selectedAccount && (
        <UpdateBalanceModal
          account={selectedAccount}
          onUpdate={handleUpdateBalance}
          onClose={() => setSelectedAccount(null)}
        />
      )}

      {showAppInfo && (
        <AppInfoModal onClose={() => setShowAppInfo(false)} />
      )}

      <footer className="footer">
        <button
          className="footer-info-btn"
          onClick={() => setShowAppInfo(true)}
          title="About FinOne"
        >
          <Info size={16} />
          <span>About</span>
        </button>
      </footer>
    </div>
  );
}

function Dashboard({ totals, accounts, showBalances, onToggleBalances }) {
  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="dashboard-title">
          <TrendingUp className="dashboard-icon" size={24} />
          <h2>Dashboard</h2>
        </div>
        <button
          className="visibility-btn"
          onClick={onToggleBalances}
          title={showBalances ? 'Hide balances' : 'Show balances'}
        >
          {showBalances ? <Eye size={16} /> : <EyeOff size={16} />}
        </button>
      </div>

      <div className="totals-grid">
        {Object.entries(totals).map(([currency, amount]) => (
          <div key={currency} className="total-card" title={`Total balance in ${currency}`}>
            <div className="card-header">
              <Coins className="currency-icon" size={16} />
              <h3>{currency}</h3>
            </div>
            <p className="amount">
              {showBalances ? amount.toFixed(2) : '••••'}
            </p>
          </div>
        ))}
      </div>

      <div className="recent-accounts">
        <div className="section-header">
          <Clock className="section-icon" size={20} />
          <h3>Recent Updates</h3>
        </div>
        {accounts.slice(0, 5).map(account => {
          const IconComponent = AccountTypeIcons[account.type] || DollarSign;
          return (
            <div key={account.id} className="account-item" title={`${account.type} account`}>
              <div className="account-info">
                <div className="account-name-row">
                  <IconComponent className="account-type-icon" size={16} />
                  <span className="account-name">{account.name}</span>
                </div>
                <span className="account-balance">
                  {showBalances ? account.latest_balance.toFixed(2) : '••••'} {account.currency}
                </span>
              </div>
              <span className="last-updated">
                {account.last_updated || 'Never updated'}
              </span>
            </div>
          );
        })}
      </div>

      <ExportImport />
    </div>
  );
}

function Accounts({ accounts, onAddAccount, onDeleteAccount, onUpdateBalance }) {
  return (
    <div className="accounts">
      <div className="accounts-header">
        <h2>Accounts</h2>
        <button className="add-btn" onClick={onAddAccount}>
          <Plus size={16} /> Add Account
        </button>
      </div>

      <div className="accounts-list">
        {accounts.map(account => {
          const IconComponent = AccountTypeIcons[account.type] || DollarSign;
          return (
            <div key={account.id} className="account-card">
              <div className="account-header">
                <IconComponent size={20} />
                <h3>{account.name}</h3>
                <span className="account-type">{account.type}</span>
              </div>

              <div className="account-balance">
                <span className="balance">
                  {account.latest_balance.toFixed(2)} {account.currency}
                </span>
                <span className="last-updated">
                  Last: {account.last_updated || 'Never'}
                </span>
              </div>

              <div className="account-actions">
                <button
                  className="update-btn"
                  onClick={() => onUpdateBalance(account)}
                >
                  Update Balance
                </button>
                <button
                  className="delete-btn"
                  onClick={() => onDeleteAccount(account.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AddAccountModal({ onAdd, onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'bank',
    currency: 'ETB'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.name.trim()) {
      onAdd(formData);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>Add Account</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Account Name"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            required
          />

          <select
            value={formData.type}
            onChange={(e) => setFormData({...formData, type: e.target.value})}
          >
            <option value="bank">Bank</option>
            <option value="wallet">Wallet</option>
            <option value="card">Card</option>
            <option value="exchange">Exchange</option>
          </select>

          <input
            type="text"
            placeholder="Currency (ETB, USD, EUR)"
            value={formData.currency}
            onChange={(e) => setFormData({...formData, currency: e.target.value.toUpperCase()})}
            required
          />

          <div className="modal-actions">
            <button type="button" onClick={onClose}>Cancel</button>
            <button type="submit">Add Account</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function UpdateBalanceModal({ account, onUpdate, onClose }) {
  const [balance, setBalance] = useState(account.latest_balance.toString());
  const [notes, setNotes] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const numBalance = parseFloat(balance);
    if (!isNaN(numBalance) && numBalance >= 0) {
      onUpdate(account.id, numBalance, notes);
    }
  };

  const handleBalanceChange = (e) => {
    setBalance(e.target.value);
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>Update Balance - {account.name}</h2>
        <form onSubmit={handleSubmit}>
          <label>Current: {account.latest_balance.toFixed(2)} {account.currency}</label>
          <input
            type="number"
            step="0.01"
            placeholder="New Balance"
            value={balance}
            onChange={handleBalanceChange}
            required
            autoFocus
          />

          <input
            type="text"
            placeholder="Reference/reason (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <div className="modal-actions">
            <button type="button" onClick={onClose}>Cancel</button>
            <button type="submit">Update</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AppInfoModal({ onClose }) {
  return (
    <div className="modal-overlay">
      <div className="modal app-info-modal">
        <h2>About FinOne</h2>
        <div className="app-info-content">
          <div className="app-description">
            <p>
              A minimal, offline-first PWA for managing multiple financial accounts in one place.
            </p>
          </div>

          <div className="developer-info">
            <div className="developer-links">
              <a
                href="https://github.com/yinebebt/finone"
                target="_blank"
                rel="noopener noreferrer"
                className="github-link"
              >
                <Github size={16} />
                View on GitHub
              </a>
            </div>
          </div>

          <div className="app-version">
            <p><small>Version 0.1.0</small></p>
          </div>
        </div>

        <div className="modal-actions">
          <button type="button" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

export default App;