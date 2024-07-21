import { WsProvider, ApiPromise, Keyring } from "@polkadot/api";
import { web3Accounts, web3Enable, web3FromAddress } from "@polkadot/extension-dapp";
import { InjectedAccountWithMeta } from "@polkadot/extension-inject/types";
import { useEffect, useState } from "react";
import "./styles/main.scss";
import "./styles/dashboard.scss";
import DeformCanvas from "./components/HoverCanvas";
import {
  Bolt,
  ClipboardList,
  Copy,
  Info,
  LayoutGrid,
  Plus,
} from "lucide-react";
import EC from "elliptic";
import { Buffer } from "buffer";
import Identicon from "@polkadot/react-identicon";
import datahive_white from "./assets/datahive_white.png";

const NAME = "pkd_test";

function App() {
  const [api, setApi] = useState<ApiPromise | null>(null);
  const [keyring, setKeyring] = useState<Keyring | null>(null);
  const [accounts, setAccounts] = useState<InjectedAccountWithMeta[]>([]);
  const [selectedAccount, _setSelectedAccount] =
    useState<InjectedAccountWithMeta | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [privateKey, setPrivateKey] = useState<string | null>(null);

  const [keyPairWindowOpen, setKeyPairWindowOpen] = useState<boolean>(false);
  const [tempKeys, setTempKeys] = useState<any | null>(null);
  const [addWebsiteWindowOpen, setAddWebsiteWindowOpen] =
    useState<boolean>(false);

  const [data, setData] = useState<any | null>(null);

  const setSelectedAccount = async (account: InjectedAccountWithMeta) => {
    if (!api) return;
    _setSelectedAccount(account);
    const injector = await web3FromAddress(account.address);
    api.setSigner(injector.signer);
  };

  const setup = async () => {
    const provider = new WsProvider("ws://localhost:9944");
    const api = await ApiPromise.create({ provider });
    setApi(api);
    setKeyring(new Keyring({ type: "sr25519" }));
  };

  const handleConnection = async () => {
    setIsLoggingIn(true);
    const extensions = await web3Enable(NAME);

    if (!extensions.length) {
      setIsLoggingIn(false);
      throw new Error("No extension found");
    }

    const allAccounts = await web3Accounts();
    setAccounts(allAccounts);

    if (allAccounts.length === 1) {
      setSelectedAccount(allAccounts[0]);
    }
    setIsLoggingIn(false);
  };

  const handleAccountSelection = async (e: any) => {
    const address = e.target.value;
    const account = accounts.find((account) => account.address === address);
    if (!account) {
      throw new Error("Account not found");
    }

    setSelectedAccount(account);
  };

  const updateData = async () => {
    if (!api) return;

    // Load data from custom substrate pallet
    const websites = await api.query.dbModule.websiteMap.keys();
    const getter = async (key: any) => {
      const data = await api.query.dbModule.websiteMap(key);
      return data;
    };
    const data = await Promise.all(websites.map(getter));
    setData(data);
  };

  const registerWebsite = async (name: number) => {
    if (!api) return;
    if (!selectedAccount) return;

    await api.tx.dbModule
      .registerWebsite({ websiteid: name })
      .send(({ status }) => {
        if (status.isInBlock) {
          console.log(`included in ${status.asInBlock}`);
        }
      });
  };

  const generateKeyPair = () => {
    const ec = new EC.ec("secp256k1");
    const keyPair = ec.genKeyPair();

    // Get the private and public keys in b64 format
    const privateKey = keyPair.getPrivate("hex");
    const publicKey = keyPair.getPublic("hex");

    // Convert hex to b64
    const privateKeyB64 = Buffer.from(privateKey, "hex").toString("base64");
    const publicKeyB64 = Buffer.from(publicKey, "hex").toString("base64");

    setTempKeys({
      publicKey: publicKeyB64,
      pubCopied: false,
      privateKey: privateKeyB64,
      priCopied: false,
    });
  };

  useEffect(() => {
    setup();
  }, []);

  useEffect(() => {
    if (!api) return;

    (async () => {
      const time = await api.query.timestamp.now();
      console.log(time.toPrimitive());
    })();
  }, [api]);

  return (
    <div className="app">
      <div className="main-section">
        {selectedAccount && privateKey ? (
          <div>
            {addWebsiteWindowOpen ? (
              <div>
                <div className="bg-darken"></div>
                <div className="add-website-popup">
                  <h2>Add Website</h2>
                  <input
                    type="text"
                    placeholder="Website ID"
                    id="website-id-input"
                  ></input>
                  <button
                    onClick={() => {
                      const val = (
                        document.getElementById(
                          "website-id-input"
                        )!! as HTMLInputElement
                      ).value;
                      if (val) {
                        registerWebsite(parseInt(val));
                        updateData();
                        setAddWebsiteWindowOpen(false);
                      }
                    }}
                  >
                    Add
                  </button>
                </div>
              </div>
            ) : (
              <></>
            )}
            <div className="dashboard">
              <div className="sidepane">
                <div className="user-profile">
                  <Identicon
                    className="user-img"
                    value={selectedAccount.address}
                    size={70}
                    theme={"jdenticon"}
                  />
                  <div className="user-info">
                    <h4>{selectedAccount.meta.name}</h4>
                    <p>{selectedAccount.address}</p>
                  </div>
                </div>
                <div className="web-select">
                  <select>
                    <option value="" disabled selected hidden>
                      Select Website
                    </option>
                    {data?.map((website: any, index: number) => (
                      <option key={index} value={index}>
                        {website.id}
                      </option>
                    ))}
                  </select>
                  <a
                    onClick={() => {
                      setAddWebsiteWindowOpen(true);
                    }}
                  >
                    <Plus color="white" size={40} />
                  </a>
                </div>
                <div className="sidepane-divider" />
                <div className="sidepane-links">
                  <a className="selected">
                    <LayoutGrid color="white" size={32} />
                    Dashboard
                  </a>
                  <a>
                    <ClipboardList color="white" size={32} />
                    Reports
                  </a>
                  <a>
                    <Bolt color="white" size={32} />
                    Settings
                  </a>
                  <a>
                    <Info color="white" size={32} />
                    About
                  </a>
                </div>
                <div className="footnote">
                  <img src={datahive_white}></img>
                  DataHive Inc.
                </div>
              </div>
            </div>
          </div>
        ) : (
          <DeformCanvas />
        )}
        {accounts.length == 0 && !isLoggingIn ? (
          <div className="content">
            <div>
              <div className="login-card">
                <h2
                  style={{
                    marginBottom: "50px",
                  }}
                >
                  Connect to <div className="bolded">Polkadot</div>
                </h2>
                <button className="login-button" onClick={handleConnection}>
                  Link my Wallet
                  <span className="plus top-left">
                    <span className="horizontal"></span>
                    <span className="vertical"></span>
                  </span>
                  <span className="plus top-right">
                    <span className="horizontal"></span>
                    <span className="vertical"></span>
                  </span>
                  <span className="plus bottom-left">
                    <span className="horizontal"></span>
                    <span className="vertical"></span>
                  </span>
                  <span className="plus bottom-right">
                    <span className="horizontal"></span>
                    <span className="vertical"></span>
                  </span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <></>
        )}
        {isLoggingIn ? (
          <div className="content">
            <div className="login-card">
              <h2>Connecting...</h2>
            </div>
          </div>
        ) : (
          <></>
        )}
        {accounts.length > 1 && selectedAccount == null ? (
          <div className="content">
            <div className="login-card">
              <h2
                style={{
                  marginBottom: "50px",
                }}
              >
                Select an account
              </h2>
              <select
                className="account-select"
                onChange={handleAccountSelection}
              >
                <option value="" disabled selected hidden>
                  Select Wallet
                </option>
                {accounts.map((account) => (
                  <option key={account.address} value={account.address}>
                    {account.meta.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          <></>
        )}
        {selectedAccount && !privateKey ? (
          <div className="content">
            <div className="login-card">
              <h2>Enter your Key</h2>
              <input
                type="password"
                placeholder="Private Key"
                id="private-key-input"
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    const val = (
                      document.getElementById(
                        "private-key-input"
                      )!! as HTMLInputElement
                    ).value;
                    if (val) {
                      setPrivateKey(val);
                      updateData();
                    }
                  }
                }}
              ></input>
              <button
                className="button"
                onClick={() => {
                  generateKeyPair();
                  setKeyPairWindowOpen(true);
                }}
              >
                Generate Key Pair
              </button>
            </div>
            {keyPairWindowOpen ? (
              <div className="key-pair-window">
                <h2>Generated Keys</h2>
                <p>Public Key</p>
                <div className="key-item">
                  {tempKeys?.publicKey}
                  <a
                    onClick={() => {
                      navigator.clipboard.writeText(tempKeys?.publicKey);
                      setTempKeys({
                        ...tempKeys,
                        pubCopied: true,
                      });
                    }}
                  >
                    <Copy
                      color={tempKeys?.pubCopied ? "#00ff00" : "white"}
                      size={35}
                    />
                  </a>
                </div>
                <p>Private Key</p>
                <div className="key-item">
                  {tempKeys?.privateKey}
                  <a
                    onClick={() => {
                      navigator.clipboard.writeText(tempKeys?.privateKey);
                      setTempKeys({
                        ...tempKeys,
                        priCopied: true,
                      });
                    }}
                  >
                    <Copy
                      color={tempKeys?.priCopied ? "#00ff00" : "white"}
                      size={35}
                    />
                  </a>
                </div>
                <h3>
                  Please keep your keys safe, you won't be able to view them
                  again!
                </h3>
                <button
                  onClick={() => {
                    setKeyPairWindowOpen(false);
                    setTempKeys(null);
                  }}
                >
                  Close
                </button>
              </div>
            ) : (
              <></>
            )}
          </div>
        ) : (
          <></>
        )}
      </div>
    </div>
  );
}

export default App;
