import logo from "./logo.svg";
import "./App.css";
import { useEffect, useState, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import iconService from "icon-sdk-js";
const { IconWallet, IconAmount, IconConverter, IconBuilder } = iconService;

function App() {
  const [hasAccount, setHasAccount] = useState("");
  const [address, setAddress] = useState("");
  const [hasAddress, setHasAddress] = useState("");
  const [radioButtonState, setRadioButtonState] = useState("custom");
  const [paramData, setParamData] = useState("");
  const [requestResponse, setRequestResponse] = useState("");
  const requestHasAddressInputRef = useRef();
  const paramDataTextAreaRef = useRef();
  const txHashInputRef = useRef();
  const [responseSigning, setResponseSigning] = useState("");

  function requestHasAccount() {
    window.dispatchEvent(
      new CustomEvent("ICONEX_RELAY_REQUEST", {
        detail: {
          type: "REQUEST_HAS_ACCOUNT"
        }
      })
    );
  }

  function requestHasAddress() {
    const inputAddress =
      requestHasAddressInputRef.current.value ||
      requestHasAddressInputRef.current.placeholder;

    window.dispatchEvent(
      new CustomEvent("ICONEX_RELAY_REQUEST", {
        detail: {
          type: "REQUEST_HAS_ADDRESS",
          payload: inputAddress
        }
      })
    );
  }

  function requestAddress() {
    window.dispatchEvent(
      new CustomEvent("ICONEX_RELAY_REQUEST", {
        detail: {
          type: "REQUEST_ADDRESS"
        }
      })
    );
  }
  function handleRadioOnChange(evnt) {
    // when selection in set of radio buttons changes
    setRadioButtonState(evnt.target.value);
    const newParamData = getParamData(address, evnt.target.value);
    setParamData(newParamData);

    // reset Result text area
    setRequestResponse("");
  }
  function handleTextAreaOnChange(evnt) {
    setParamData(evnt.target.value);
  }

  useEffect(() => {
    function iconexRelayResponseEventHandler(evnt) {
      const { type, payload } = evnt.detail;
      switch (type) {
        case "RESPONSE_HAS_ACCOUNT":
          setHasAccount(payload.hasAccount);
          break;

        case "RESPONSE_HAS_ADDRESS":
          setHasAddress(payload.hasAddress);
          break;

        case "RESPONSE_ADDRESS":
          setAddress(payload);
          break;

        case "RESPONSE_JSON-RPC":
          setRequestResponse(JSON.stringify(payload));
          break;

        case "CANCEL_JSON-RPC":
          setRequestResponse("Request cancelled by user");
          break;

        case "RESPONSE_SIGNING":
          setResponseSigning(JSON.stringify(payload));
          break;

        case "CANCEL_SIGNING":
          setResponseSigning("REQUEST_SIGNING cancelled by user");
          break;

        default:
          console.log("error on ICONEX_RELAY_RESPONSE");
          console.log("type: " + type);
          console.log("payload: " + JSON.stringify(payload));
      }
    }
    window.addEventListener(
      "ICONEX_RELAY_RESPONSE",
      iconexRelayResponseEventHandler
    );
  }, []);

  function getParamData(address, type) {
    switch (type) {
      case "read-only":
        const callBuilder = new IconBuilder.CallBuilder();
        const readOnlyData = callBuilder
          .from(address)
          .to("cx43f59485bd34d0c7e9312835d65cb399f6d29651")
          .method("hello")
          .build();

        return JSON.stringify({
          jsonrpc: "2.0",
          method: "icx_call",
          params: readOnlyData,
          id: 50889
        });
        break;

      case "send-transaction":
        const callTransactionBuilder = new IconBuilder.CallTransactionBuilder();
        const callTransactionData = callTransactionBuilder
          .from(address)
          .to("cxb20b5ff06ba50aef42c7832958af59f9ae0651e7")
          .nid(IconConverter.toBigNumber(3))
          .timestamp(new Date().getTime() * 1000)
          .stepLimit(IconConverter.toBigNumber(1000000))
          .version(IconConverter.toBigNumber(3))
          .method("createToken")
          .params({
            price: IconConverter.toHex(10000),
            tokenType: IconConverter.toHex(2)
          })
          .build();

        return JSON.stringify({
          jsonrpc: "2.0",
          method: "icx_sendTransaction",
          params: IconConverter.toRawTransaction(callTransactionData),
          id: 50889
        });
        break;

      case "icx-transfer":
        const icxTransactionBuilder = new IconBuilder.IcxTransactionBuilder();
        const icxTransferData = icxTransactionBuilder
          .from(address)
          .to("hx04d669879227bb24fc32312c408b0d5503362ef0")
          .nid(IconConverter.toBigNumber(3))
          .value(IconAmount.of(1, IconAmount.Unit.ICX).toLoop())
          .timestamp(new Date().getTime() * 1000)
          .version(IconConverter.toBigNumber(3))
          .stepLimit(IconConverter.toBigNumber(100000))
          .build();

        return JSON.stringify({
          jsonrpc: "2.0",
          method: "icx_sendTransaction",
          params: IconConverter.toRawTransaction(icxTransferData),
          id: 50889
        });
        break;
      default:
        return "";
    }
  }

  function makeRequestJSONRPC() {
    // make JSON-RPC request after button click
    const paramData = paramDataTextAreaRef.current.value;

    if (!paramData) {
      alert("Check the param data");
      return;
    }

    const parsedParamData = JSON.parse(paramData);
    if (parsedParamData.method === "icx_sendTransaction" && !address) {
      alert("Select the ICX address");
      return;
    }
    window.dispatchEvent(
      new CustomEvent("ICONEX_RELAY_REQUEST", {
        detail: {
          type: "REQUEST_JSON-RPC",
          payload: parsedParamData
        }
      })
    );
  }

  function handleRequestSigning() {
    // make sigining request after button click
    if (!address) {
      alert(
        "first select a wallet to use for signing (clic on 'REQUEST_ADDRESS' button)"
      );
      return;
    }
    const txHash =
      txHashInputRef.current.value || txHashInputRef.current.placeholder;
    window.dispatchEvent(
      new CustomEvent("ICONEX_RELAY_REQUEST", {
        detail: {
          type: "REQUEST_SIGNING",
          payload: {
            from: address,
            hash: txHash
          }
        }
      })
    );
  }
  return (
    <div className="App">
      <div>
        <title>iconex_connect_sample (using React)</title>
      </div>

      <h1>iconex_connect_sample (using React)</h1>

      <p>--------------------</p>
      <p>
        <b>HAS_ACCOUNT</b> - Requests for whether iconex has any icon wallet.
      </p>
      <button onClick={requestHasAccount}>REQUEST_HAS_ACCOUNT</button>
      <p>
        > Result :{" "}
        {hasAccount == ""
          ? ""
          : hasAccount
          ? "true (Boolean)"
          : "false (Boolean)"}
      </p>

      <p>--------------------</p>
      <p>
        <b>HAS_ADDRESS</b> - Requests for whether iconex has the icon wallet
        with specific address.
      </p>
      <p>ICX Address : </p>
      <input
        type="text"
        placeholder="hx23ada4a4b444acf8706a6f50bbc9149be1781e13"
        ref={requestHasAddressInputRef}
      />
      <button onClick={requestHasAddress}>REQUEST_HAS_ADDRESS</button>
      <p>
        > Result :{" "}
        {hasAddress === ""
          ? ""
          : hasAddress
          ? "true (Boolean)"
          : "false (Boolean)"}
      </p>

      <p>--------------------</p>
      <p>
        <b>ADDRESS</b> - Requests for the address to use for service.
      </p>
      <button onClick={requestAddress}>REQUEST_ADDRESS</button>
      <p>> Selected ICX Address : {address}</p>

      <p>--------------------</p>
      <p>
        <b>JSON-RPC</b> - Requests for calling standard ICON JSON-RPC API.
      </p>
      <p>* User confirmation is required.</p>
      <form className="request-form">
        {[
          ["custom", "Custom"],
          ["read-only", "Read Only"],
          ["send-transaction", "Send Transaction *"],
          ["icx-transfer", "ICX Transfer *"]
        ].map(inputData => {
          return (
            <div key={uuidv4()} className="radio-button">
              <input
                type="radio"
                name="json-rpc"
                value={inputData[0]}
                onChange={e => handleRadioOnChange(e)}
                value={inputData[0]}
                checked={inputData[0] === radioButtonState ? true : false}
                disabled={address === "" ? true : false}
              />
              <label>{inputData[1]}</label>
            </div>
          );
        })}
      </form>
      <p>
        Param Data: <br />
        {radioButtonState === "custom" ? (
          <textarea
            ref={paramDataTextAreaRef}
            rows="10"
            value={paramData}
            onChange={handleTextAreaOnChange}
          />
        ) : (
          <textarea
            rows="10"
            ref={paramDataTextAreaRef}
            value={paramData}
            readOnly
          />
        )}
      </p>
      <button onClick={makeRequestJSONRPC}>REQUEST_JSON-RPC</button>
      <p>
        > Result : <br />
        <textarea rows="10" value={requestResponse} readOnly />
      </p>

      <p>--------------------</p>
      <p>
        <b>Signing</b> - Request for only signing tx hash. (User confirmation is
        always required.)
      </p>
      <p>
        Tx Hash :{" "}
        <input
          type="text"
          defaultValue=""
          ref={txHashInputRef}
          placeholder="9babe5d2911e8e42dfad72a589202767f95c6fab49523cdc16279a7b8f82eab2"
        />
      </p>
      <button onClick={handleRequestSigning}>REQUEST_SIGNING</button>
      <p>> Signature : {responseSigning}</p>
    </div>
  );
}

export default App;
