import { WsProvider, ApiPromise, Keyring } from "@polkadot/api";
import {
  web3Accounts,
  web3Enable,
  web3FromAddress,
} from "@polkadot/extension-dapp";
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
import { PieChart } from "@mui/x-charts/PieChart";
import { BarChart } from "@mui/x-charts/BarChart";
import CryptoJS from "crypto-js";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { db } from "./lib/firebase";

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
  const [selection, setSelection] = useState<any | null>(null);
  const [selectedCategoryA, setSelectedCategoryA] = useState<string>("");
  const [processedData, setProcessedData] = useState<any[]>([]);
  const [processedData2, setProcessedData2] = useState<any[]>([]);
  const [processedData3, setProcessedData3] = useState<number>(0);
  const [products, setProducts] = useState<any[]>([]);

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
    const entries = await api.query.dbModule.websiteMap.entries();
    const keys = entries.map(
      ([key, _]) => key.args.map((k) => k.toPrimitive())[0]
    );

    setData({
      websites: keys,
      getter: (key: any) => {
        for (let i = 0; i < entries.length; i++) {
          if (entries[i][0].args.map((k) => k.toPrimitive())[0] === key) {
            const data = entries[i][1].toJSON();
            Object.entries(data as any).map(([k, v]: [string, any]) => {
              v.clicks.map((click: any) => {
                const encryptedWordArray = CryptoJS.lib.WordArray.create(
                  click.domId
                );
                const encryptedBase64 = encryptedWordArray.toString(
                  CryptoJS.enc.Base64
                );
                const decrypted = CryptoJS.AES.decrypt(
                  encryptedBase64,
                  "BuyBuy"
                );
                const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);
                const originalMessage = decryptedString.replace(
                  /[\x00-\x1F\x7F-\x9F]/g,
                  ""
                );
                click.domId = originalMessage.trim();
              });
            });
            return data;
          }
        }
      },
    });
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
    const privateKey = keyPair.getPrivate("hex");
    const publicKey = keyPair.getPublic("hex");
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

  const buttonNameProcess = (name: string): string => {
    const parts = name.split("-");

    if (name.startsWith("add-to-cart")) {
      const docId = parts[parts.length - 1];
      return (
        products.find((data) => data.id === docId)?.nickname + " Cart" ||
        "Unknown"
      );
    }

    return name;
  };

  useEffect(() => {
    if (selection && selection.data) {
      const fetchLabels = () => {
        const entries = Object.entries(
          Object.entries(selection.data)
            .flatMap(([, value]: any) =>
              Object.values(value.clicks).map((click: any) => click.domId)
            )
            .reduce((acc: any, domId: any) => {
              acc[domId] = (acc[domId] || 0) + 1;
              return acc;
            }, {})
        );

        const processed = entries.map(([domId, count]: [any, any]) => {
          const label = buttonNameProcess(domId);
          return { label, value: count };
        });

        const filtered = processed.filter(
          (data) =>
            data.label.toLowerCase().includes("cart") &&
            (selectedCategoryA === "" ||
              products.find(
                (product) =>
                  product.nickname === data.label.replace(" Cart", "")
              )?.category === selectedCategoryA)
        );

        const processed2 = filtered.map((data) => {
          const label = data.label.replace(" Cart", "");
          const value = data.value;
          return { label, value };
        });

        setProcessedData(processed2);
      };

      fetchLabels();
    }
  }, [selection, selectedCategoryA]);

  useEffect(() => {
    if (selection && selection.data) {
      const has = Object.entries(selection.data).map(
        ([key, value]: [string, any]) => {
          return value.clicks.find(
            (click: any) => click.domId === "checkout-button"
          );
        }
      );

      const num_true = has.filter((x: any) => x).length;
      const num_false = has.length - num_true;

      setProcessedData2([num_true, num_false]);
    }
  }, [selection]);

  useEffect(() => {
    if (selection && selection.data) {
      const has = Object.entries(selection.data).map(
        ([key, value]: [string, any]) => {
          return {
            user: key,
            total_clicks: value.clicks.length,
            has_checkout: value.clicks.find(
              (click: any) => click.domId === "checkout-button"
            ),
          };
        }
      );

      //   Average click count for conversion:
      const average = has.reduce(
        (acc: any, data: any) => {
          if (data.has_checkout) {
            acc.total += data.total_clicks;
            acc.count += 1;
          }
          return acc;
        },
        { total: 0, count: 0 }
      );

      const average2 = has.reduce(
        (acc: any, data: any) => {
          if (!data.has_checkout) {
            acc.total += data.total_clicks;
            acc.count += 1;
          }
          return acc;
        },
        { total: 0, count: 0 }
      );

      const processed3 = average.total / average.count;
      const processed4 = average2.total / average2.count;

      setProcessedData3(processed3 / processed4);
    }
  }, [selection]);

  useEffect(() => {
    (async () => {
      const products = await getDocs(collection(db, "products"));
      const productsData = products.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }));
      setProducts(productsData);
    })();
  }, []);

function formatClickToCheckoutRatio(ratio: number) {
    if (ratio === 0 || isNaN(ratio)) {
        return "N/A";
    } else {
        // Round to 2 decimal places
        return (ratio * 100).toFixed(2) + "%";
    }
}

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
                  <select
                    onChange={async (e) => {
                      const selection = parseInt(e.target.value);
                      setSelection({
                        id: selection,
                        data: data?.getter(selection),
                      });
                    }}
                  >
                    <option value="" disabled selected hidden>
                      Select Website
                    </option>
                    {data?.websites.map((website: any) => (
                      <option key={website} value={website}>
                        {website}
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
              <div className="maincontent">
                <div className="chart-card">
                  <div className="chart-header">
                    <h2>Popular Products</h2>
                    <select
                      id="category-select-a"
                      defaultValue=""
                      onChange={() => {
                        const val = (
                          document.getElementById(
                            "category-select-a"
                          )!! as HTMLSelectElement
                        ).value;
                        setSelectedCategoryA(val);
                      }}
                    >
                      <option value="" disabled hidden>
                        Select Category
                      </option>
                      <option value="">All Categories</option>
                      {[
                        "Electronics",
                        "Sports & Leisure",
                        "Clothing",
                        "Home & Furniture",
                        "Health & Beauty",
                        "Garden & DIY",
                      ].map((category) => (
                        <option value={category} key={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="chart-body">
                    {processedData && (
                      <PieChart
                        series={[
                          {
                            data: processedData,
                          },
                        ]}
                        width={600}
                        height={300}
                      />
                    )}
                  </div>
                </div>
                <div className="chart-card">
                  <div className="chart-header">
                    <h2>User Checkout</h2>
                  </div>
                  <div className="chart-body">
                    {processedData && (
                      <BarChart
                        xAxis={[
                          {
                            scaleType: "band",
                            data: ["Checkout", "No Checkout"],
                          },
                        ]}
                        series={[
                          {
                            data: processedData2,
                          },
                        ]}
                        width={600}
                        height={300}
                      />
                    )}
                  </div>
                </div>
                <div className="chart-card">
                  <div className="chart-header">
                    <h2>Click to Checkout Ratio</h2>
                  </div>
                  <div className="chart-body">
                    {/* {processedData3 != 0 && <h1>{processedData3}</h1>} */}

                        <h1>
                                        {
                                            formatClickToCheckoutRatio(processedData3)

                                        }
                                        </h1>
                  </div>
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
