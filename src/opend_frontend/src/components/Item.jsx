import React, { useEffect, useState } from "react";
import { Actor, HttpAgent } from "@dfinity/agent";
import { idlFactory } from "../../../declarations/nft/service.did.js";
import { idlFactory as tokenIdlFactory } from "../../../declarations/token_backend/token_backend.did.js";
import { Principal } from "@dfinity/principal";
import Button from "./Button.jsx";
import { opend_backend as opend } from "../../../declarations/opend_backend";
import CURRENT_USER_ID from "../index.jsx";
import PriceLabel from "./PriceLabel.jsx";

function Item({id, role}) {

  const [name, setName] = useState('');
  const [owner, setOwner] = useState('');
  const [image, setImage] = useState('');
  const [button, setButton] = useState();
  const [priceInput, setPriceInput] = useState();
  const [loaderHidden, setLoaderHidden] = useState(true);
  const [blur, setBlur] = useState();
  const [sellStatus, setSellStatus] = useState('');
  const [priceLabel, setPriceLabel] = useState();
  const [shouldDisplay, setDisplay] = useState(true);

  const loaclHost = "http://localhost:8080/";
  const agent = new HttpAgent({host: loaclHost});
  // remove in live deployment
  agent.fetchRootKey();
  let NFTActor;

  async function loadNFT() {
    NFTActor = await Actor.createActor(idlFactory, {
      agent,
      canisterId: id
    });

    const name = await NFTActor.getName();
    const owner = await NFTActor.getOwner();
    const imageData = await NFTActor.getAsset();
    const imgContent = new Uint8Array(imageData);
    const image = URL.createObjectURL(new Blob([imgContent.buffer], {type: 'image/png'}));

    setName(name);
    setOwner(owner.toText());
    setImage(image);

    if(role == "collection"){
      const nftIsListed = await opend.isListed(id);
      if(nftIsListed){
        setOwner("OpenD");
        setBlur({ filter: "blur(4px" });
        setSellStatus("Listed");
      } else {
        setButton(<Button handleClick={handleSell} text={"Sell"}/>);
      }
    } else if(role == 'discover'){
      const originalOwner = await opend.getOriginalOwner(id);
      if(originalOwner.toText() != CURRENT_USER_ID.toText()) {
        setButton(<Button handleClick={handleBuy} text={"Buy"}/>);
      }

      const price = await opend.getListedNFTPrice(id);
      setPriceLabel(<PriceLabel sellPrice={price.toString()}/>)

    }
  };

  async function handleBuy(){
    setLoaderHidden(false);
    const tokenActor = await Actor.createActor(tokenIdlFactory, {
      agent,
      canisterId: Principal.fromText("asrmz-lmaaa-aaaaa-qaaeq-cai")
    });

    const sellerId = await opend.getOriginalOwner(id);
    const itemPrice = await opend.getListedNFTPrice(id);

    const result = await tokenActor.transfer(sellerId, itemPrice);
    if(result == "Success"){
      // Transfer ownership
      const transferResult = await opend.completePurchase(id, sellerId, CURRENT_USER_ID);
      console.log("purchase:", transferResult);
      setLoaderHidden(true);
      setDisplay(false);
    }
  }

  let price;
  function handleSell() {
    setPriceInput(<input
      placeholder="Price in DBH"
      type="number"
      className="price-input"
      value={price}
      onChange={e => (price=e.target.value)}
    />);
    setButton(<Button handleClick={sellItem} text={"Confirm"}/>);
  }

  async function sellItem(){
    setBlur({ filter: 'blur(4px)' });
    setLoaderHidden(false);
    const listingResult = await opend.listItem(id, Number(price));
    if(listingResult === "Success"){
      const openDId = await opend.getOpenDCanisterID();
      const trasnferResult = await NFTActor.transferOwnership(openDId);
      console.log(trasnferResult);
      if(trasnferResult == "Success"){
        setLoaderHidden(true);
        setButton();
        setPriceInput();
        setOwner("OpenD");
        setSellStatus("Listed");
      }
    }

  }

  useEffect(() => {
    loadNFT();
  },[]);


  return (
    <div style={{display: shouldDisplay ? 'inline' : 'none'}} className="disGrid-item">
      <div className="disPaper-root disCard-root makeStyles-root-17 disPaper-elevation1 disPaper-rounded">
        <img
          className="disCardMedia-root makeStyles-image-19 disCardMedia-media disCardMedia-img"
          src={image}
          style={blur}
        />
        <div hidden={loaderHidden} className="lds-ellipsis">
          <div></div>
          <div></div>
          <div></div>
          <div></div>
        </div>
        <div className="disCardContent-root">
          {priceLabel}
          <h2 className="disTypography-root makeStyles-bodyText-24 disTypography-h5 disTypography-gutterBottom">
            {name}<span className="purple-text"> {sellStatus}</span>
          </h2>
          <p className="disTypography-root makeStyles-bodyText-24 disTypography-body2 disTypography-colorTextSecondary">
            Owner: {owner}
          </p>
          {priceInput}
          {button}
        </div>
      </div>
    </div>
  );
}

export default Item;
